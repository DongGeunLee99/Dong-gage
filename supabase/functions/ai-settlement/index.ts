// Supabase Edge Function: 자연어 정산 설명을 구조화된 폼 값으로 변환.
// 배포: supabase functions deploy ai-settlement
// 필요 secret: supabase secrets set GEMINI_API_KEY=...
// 참고: https://ai.google.dev/api/generate-content (structured output)

// 무료 티어에서 최신 모델이 503(UNAVAILABLE)로 자주 막혀서, 앞에서부터 순서대로 시도한다.
const GEMINI_MODELS = ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];
// Edge Function의 idle timeout(150s)에 걸리지 않도록 모델당 호출 시간을 제한한다.
const MODEL_TIMEOUT_MS = 25_000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RoundInput = { id: string; label: string; total: number };

type RequestBody = {
  text: string;
  participants: string[];
  rounds: RoundInput[];
};

type ParsedExtra = { label: string; amount: number; appliesTo: string[] };
type ParsedRound = { id: string; attendees: string[]; extras: ParsedExtra[] };
type ParsedResult = { participants: string[]; rounds: ParsedRound[] };

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    participants: { type: 'ARRAY', items: { type: 'STRING' } },
    rounds: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          attendees: { type: 'ARRAY', items: { type: 'STRING' } },
          extras: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                label: { type: 'STRING' },
                amount: { type: 'INTEGER' },
                appliesTo: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['label', 'amount', 'appliesTo'],
            },
          },
        },
        required: ['id', 'attendees', 'extras'],
      },
    },
  },
  required: ['participants', 'rounds'],
};

function buildPrompt(body: RequestBody): string {
  const roundsDesc = body.rounds
    .map((r, i) => `${i + 1}차 (id: ${r.id}, 라벨: "${r.label}", 총액: ${r.total}원)`)
    .join('\n');
  const participantsDesc = body.participants.length > 0 ? body.participants.join(', ') : '(아직 없음)';

  return `기존 참가자 목록: ${participantsDesc}

정산 대상 항목(순서대로 1차, 2차, ... 로 대응):
${roundsDesc}

사용자 설명:
"""
${body.text}
"""

위 설명을 읽고 각 항목(id 기준)에 실제로 참석한 사람과, 별도로 특정 인원에게만 부과할 예외 금액(예: 술값, 택시비 등 총액과 분리해서 언급된 금액)을 구조화하라.

규칙:
- "1차", "2차" 같은 순서 표현은 위에 나열된 항목 순서와 그대로 대응한다.
- 최종 participants 배열에는 기존 참가자와 설명에서 새로 언급된 사람을 모두 포함한다.
- 각 항목의 attendees는 반드시 participants의 부분집합이어야 한다.
- 설명에 특정 항목의 참석 여부가 명시되지 않으면 attendees는 participants 전체로 간주한다.
- "~는 빠짐", "~는 안 감", "~빼고" 같은 표현은 해당 인원을 그 항목 attendees에서 제외한다.
- 예외 금액(extras)은 총액에 이미 포함된 금액이므로 attendees 기본 분담 계산과는 별도로 처리되니, 총액에서 빼지 말고 label/amount/appliesTo만 그대로 추출한다.
- 설명에서 언급되지 않은 항목은 attendees를 participants 전체로, extras는 빈 배열로 둔다.
- amount는 원 단위 정수로만 작성한다.
- JSON 스키마 외의 다른 텍스트는 출력하지 않는다.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (!body.text?.trim() || !Array.isArray(body.rounds) || body.rounds.length === 0) {
    return new Response(JSON.stringify({ error: 'text and rounds are required' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const prompt = buildPrompt(body);
  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      response_mime_type: 'application/json',
      response_schema: RESPONSE_SCHEMA,
    },
  });

  let geminiJson: unknown = null;
  let lastError = 'no model attempted';

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: requestBody,
          signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
        },
      );

      if (res.ok) {
        geminiJson = await res.json();
        break;
      }

      lastError = `${model}: ${await res.text()}`;
      // 과부하/쿼터 문제만 다음 모델로 넘어가고, 그 외 에러는 즉시 실패시킨다.
      if (res.status !== 429 && res.status !== 500 && res.status !== 503) break;
    } catch (err) {
      lastError = `${model}: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  if (!geminiJson) {
    return new Response(JSON.stringify({ error: `Gemini API error: ${lastError}` }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const rawText: string | undefined =
    // deno-lint-ignore no-explicit-any
    (geminiJson as any)?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    return new Response(JSON.stringify({ error: 'Gemini returned no content' }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  let parsed: ParsedResult;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return new Response(JSON.stringify({ error: 'Gemini returned invalid JSON' }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const knownIds = new Set(body.rounds.map((r) => r.id));
  parsed.rounds = (parsed.rounds ?? []).filter((r) => knownIds.has(r.id));

  return new Response(JSON.stringify(parsed), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});

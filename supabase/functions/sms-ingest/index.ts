// Supabase Edge Function: iOS 단축어가 보낸 은행 문자를 검토 대기 거래로 저장.
//
// 배포: supabase functions deploy sms-ingest --no-verify-jwt
//   단축어는 로그인 세션이 없어 JWT를 만들 수 없다. 대신 x-ingest-token 헤더의
//   토큰으로 사용자를 식별하므로 JWT 검증을 끄고 배포해야 한다.
//
// 저장은 전부 status='pending_review' — 이체/충전 문자도 거르지 않고 일단 넣고,
// 앱의 검토 화면에서 사람이 승인/삭제한다.

import { parseKakaoBankSms } from './parse.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const REST_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

const FALLBACK_CATEGORY_KEY = 'etc';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function restGet<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: REST_HEADERS });
  if (!res.ok) throw new Error(`REST GET ${path} failed: ${await res.text()}`);
  return await res.json();
}

async function findUserIdByToken(token: string): Promise<string | null> {
  const rows = await restGet<{ user_id: string }>(
    `sms_ingest_tokens?token=eq.${encodeURIComponent(token)}&select=user_id`,
  );
  return rows[0]?.user_id ?? null;
}

/**
 * 같은 가맹점을 전에 어떻게 분류했는지 찾아서 그대로 물려준다.
 * 정확히 일치하는 게 없으면 부분 일치(가맹점명이 지점명까지 붙어 오는 경우)로 한 번 더 본다.
 */
async function inferCategory(userId: string, merchant: string) {
  const select = 'select=category_key,subcategory&order=date.desc,time.desc&limit=1';
  const base = `transactions?user_id=eq.${userId}&status=eq.confirmed&${select}`;

  const exact = await restGet<{ category_key: string; subcategory: string | null }>(
    `${base}&memo=eq.${encodeURIComponent(merchant)}`,
  );
  if (exact[0]) return { ...exact[0], matchedBy: 'exact' as const };

  const like = await restGet<{ category_key: string; subcategory: string | null }>(
    `${base}&memo=ilike.${encodeURIComponent(`%${merchant}%`)}`,
  );
  if (like[0]) return { ...like[0], matchedBy: 'partial' as const };

  return { category_key: FALLBACK_CATEGORY_KEY, subcategory: null, matchedBy: 'none' as const };
}

/**
 * 같은 문자가 두 번 들어와도 거래가 중복 생기지 않게 막는다.
 * type까지 비교해야 한다 — 저금통에 같은 금액을 같은 분에 넣었다 빼면
 * 날짜·시각·금액·가맹점이 전부 같아서, 입금이 출금과 중복으로 오인된다.
 */
async function findDuplicate(
  userId: string,
  date: string,
  time: string,
  amount: number,
  merchant: string,
  type: 'expense' | 'income',
) {
  const rows = await restGet<{ id: string }>(
    `transactions?user_id=eq.${userId}&date=eq.${date}&time=eq.${time}:00&type=eq.${type}` +
      `&amount=eq.${amount}&memo=eq.${encodeURIComponent(merchant)}&select=id&limit=1`,
  );
  return rows[0]?.id ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = req.headers.get('x-ingest-token');
  if (!token) return json({ error: 'Missing x-ingest-token header' }, 401);

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const message = body.message?.trim();
  if (!message) return json({ error: 'message is required' }, 400);

  let userId: string | null;
  try {
    userId = await findUserIdByToken(token);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
  if (!userId) return json({ error: 'Unknown ingest token' }, 401);

  const parsed = parseKakaoBankSms(message);
  if (!parsed) {
    // 알림 문자(자동이체 등록, ATM 한도 변경, 인증서 재발급 등)는 여기로 떨어진다.
    // 단축어가 실패로 보지 않도록 200으로 응답한다.
    // preview는 단축어가 실제로 무엇을 보냈는지 확인하려고 되돌려준다 — 파싱이
    // 안 될 때 줄바꿈/형식이 어떻게 왔는지 이걸로 판별한다.
    return json({
      skipped: true,
      reason: 'not a transaction message',
      preview: message.slice(0, 120).replace(/\n/g, '\\n'),
    });
  }

  try {
    const duplicateId = await findDuplicate(
      userId,
      parsed.date,
      parsed.time,
      parsed.amount,
      parsed.merchant,
      parsed.type,
    );
    if (duplicateId) return json({ skipped: true, reason: 'duplicate', id: duplicateId });

    const category = await inferCategory(userId, parsed.merchant);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: 'POST',
      headers: { ...REST_HEADERS, Prefer: 'return=representation' },
      body: JSON.stringify({
        user_id: userId,
        date: parsed.date,
        time: `${parsed.time}:00`,
        type: parsed.type,
        category_key: category.category_key,
        subcategory: category.subcategory,
        amount: parsed.amount,
        memo: parsed.merchant,
        status: 'pending_review',
        source: 'sms',
        raw_message: message,
      }),
    });

    if (!res.ok) return json({ error: `Insert failed: ${await res.text()}` }, 500);

    const [inserted] = await res.json();

    await fetch(`${SUPABASE_URL}/rest/v1/sms_ingest_tokens?token=eq.${encodeURIComponent(token)}`, {
      method: 'PATCH',
      headers: REST_HEADERS,
      body: JSON.stringify({ last_used_at: new Date().toISOString() }),
    });

    return json({
      saved: true,
      id: inserted?.id,
      amount: parsed.amount,
      merchant: parsed.merchant,
      categoryKey: category.category_key,
      categoryMatchedBy: category.matchedBy,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

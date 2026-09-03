// 카카오뱅크 입출금 문자 파서.
//
// 판정은 "온점 유무/길이" 같은 휴리스틱이 아니라 문자 전체 구조로 한다.
// 가맹점명에 온점이 들어가는 결제가 실제로 존재하기 때문(예: ALIPAY CONNECT PTE. LTD).
// 자동이체 등록/ATM 한도/인증서 재발급 같은 알림 문자는 이 구조를 만족하지 못해
// 자연스럽게 걸러진다.
//
// 대상 형식:
//   [Web발신]
//   [카카오뱅크]
//   이*근(6782)
//   09/01 12:16
//   출금 5,500원
//   (주)씨앤비 광주지점
//   잔액 124,500원

export type ParsedSms = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'expense' | 'income';
  amount: number;
  merchant: string;
  balance: number;
  accountLast4: string;
};

// 줄 구분에 \n을 요구하지 않는다. 단축어가 문자를 넘길 때 줄바꿈이 공백으로
// 눌리는 경우가 있어서, 항목 사이 구분자는 전부 \s+로 받고 가맹점명은 끝의
// "잔액 N원"을 앵커 삼아 잘라낸다(가맹점명 자체에 공백이 있어도 안전).
const KAKAOBANK_RE =
  /\[카카오뱅크\]\s*[^\s(]{1,20}\((?<last4>\d{4})\)\s*(?<month>\d{1,2})\/(?<day>\d{1,2})\s+(?<hour>\d{1,2}):(?<minute>\d{2})\s*(?<dir>출금|입금)\s*(?<amount>[\d,]+)\s*원\s*(?<merchant>[\s\S]{1,60}?)\s*잔액\s*(?<balance>[\d,]+)\s*원/;

function toInt(digits: string) {
  return parseInt(digits.replace(/,/g, ''), 10);
}

/** UTC로 도는 Edge 런타임에서 한국 날짜를 얻는다. */
function nowInSeoul() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return { year: kst.getUTCFullYear(), month: kst.getUTCMonth() + 1 };
}

/**
 * 문자에는 연도가 없어서(`09/01`) 수신 시점 기준으로 채운다.
 * 12월↔1월 경계에서만 연도를 한 칸 옮긴다.
 */
function inferYear(month: number) {
  const now = nowInSeoul();
  if (now.month === 1 && month === 12) return now.year - 1;
  if (now.month === 12 && month === 1) return now.year + 1;
  return now.year;
}

export function parseKakaoBankSms(text: string): ParsedSms | null {
  const match = KAKAOBANK_RE.exec(text.replace(/\r\n/g, '\n'));
  if (!match?.groups) return null;

  const g = match.groups;
  const month = parseInt(g.month, 10);
  const day = parseInt(g.day, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const amount = toInt(g.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    date: `${inferYear(month)}-${pad(month)}-${pad(day)}`,
    time: `${pad(parseInt(g.hour, 10))}:${g.minute}`,
    type: g.dir === '출금' ? 'expense' : 'income',
    amount,
    merchant: g.merchant.trim(),
    balance: toInt(g.balance),
    accountLast4: g.last4,
  };
}

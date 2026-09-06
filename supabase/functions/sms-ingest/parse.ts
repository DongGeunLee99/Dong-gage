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
  // 은행 문자에만 있는 정보. 네이버페이 등 잔액/계좌를 안 보여주는 발신처는 비운다.
  // (참고: 현재 코드베이스 어디에서도 안 쓰이는 필드 — 파싱 결과 보존 목적으로만 유지)
  balance?: number;
  accountLast4?: string;
};

// 줄 구분에 \n을 요구하지 않는다. 단축어가 문자를 넘길 때 줄바꿈이 공백으로
// 눌리는 경우가 있어서, 항목 사이 구분자는 전부 \s+로 받고 가맹점명은 끝의
// "잔액 N원"을 앵커 삼아 잘라낸다(가맹점명 자체에 공백이 있어도 안전).
const KAKAOBANK_RE =
  /\[카카오뱅크\]\s*[^\s(]{1,20}\((?<last4>\d{4})\)\s*(?<month>\d{1,2})\/(?<day>\d{1,2})\s+(?<hour>\d{1,2}):(?<minute>\d{2})\s*(?<dir>출금|입금)\s*(?<amount>[\d,]+)\s*원\s*(?<merchant>[\s\S]{1,60}?)\s*잔액\s*(?<balance>[\d,]+)\s*원/;

function toInt(digits: string) {
  return parseInt(digits.replace(/,/g, ''), 10);
}

/** UTC로 도는 Edge 런타임에서 한국의 현재 날짜/시각을 얻는다. */
function nowInSeoulFull() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
  };
}

function nowInSeoul() {
  const { year, month } = nowInSeoulFull();
  return { year, month };
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

// 네이버페이 결제 문자 파서.
//
// 대상 형식 (날짜/시각이 문자 안에 없다 — 수신 시점을 그대로 쓴다):
//   [Web발신]
//   [네이버페이]결제완료안내 요기요 '[닭발1등]홍대...' 19000원 http://naver.ma/PayO
//
// 인증번호 등 다른 안내 문자도 같은 발신번호로 온다고 확인됐기 때문에, 카카오뱅크와
// 같은 원칙으로 "[네이버페이]결제완료안내"라는 고정 구조 자체를 앵커로 매칭한다 —
// 이 리터럴이 없으면 인증번호/광고/기타 안내 문자는 자연히 걸러진다.
//
// 상품명(작은따옴표로 묶인 부분)은 있을 수도 없을 수도 있어(오프라인 결제는 보통
// 없음) 있으면 건너뛰기만 하고 캡처하지 않는다 — merchant에 상품명까지 섞으면
// 주문마다 문자열이 달라져서 카테고리 자동 매칭(같은 가맹점 최근 카테고리 물려받기)이
// 매번 실패하게 된다. "요기요"처럼 가맹점명만 남겨야 다음 주문에서도 매칭된다.
const NAVERPAY_RE =
  /\[네이버페이\]결제완료안내\s+(?<merchant>[\s\S]+?)(?:\s*'[^']*')?\s+(?<amount>[\d,]+)\s*원/;

export function parseNaverPaySms(text: string): ParsedSms | null {
  const match = NAVERPAY_RE.exec(text.replace(/\r\n/g, '\n'));
  if (!match?.groups) return null;

  const g = match.groups;
  const amount = toInt(g.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const merchant = g.merchant.trim();
  if (!merchant) return null;

  const now = nowInSeoulFull();
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    date: `${now.year}-${pad(now.month)}-${pad(now.day)}`,
    time: `${pad(now.hour)}:${pad(now.minute)}`,
    type: 'expense',
    amount,
    merchant,
  };
}

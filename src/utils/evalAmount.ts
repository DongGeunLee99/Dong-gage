export const MAX_AMOUNT = 9_999_999_999; // 10자리 상한

/**
 * 금액 입력 식(+ − × ÷)을 왼쪽→오른쪽 순차(계산기식)로 평가한다.
 * eval을 쓰지 않고 직접 토크나이즈한다. 빈 식/끝에 걸린 연산자/0 나누기/음수는 안전하게 방어.
 */
export function evalAmount(expr: string): number {
  if (!expr) return 0;
  const trimmed = expr.replace(/[+\-−×÷]+$/u, ''); // 끝에 걸린 연산자 무시
  if (!trimmed) return 0;
  const tokens = trimmed.match(/\d+|[+\-−×÷]/gu);
  if (!tokens) return 0;
  let result = parseInt(tokens[0], 10);
  if (Number.isNaN(result)) return 0;
  for (let i = 1; i + 1 < tokens.length; i += 2) {
    const op = tokens[i];
    const n = parseInt(tokens[i + 1], 10);
    if (Number.isNaN(n)) break;
    if (op === '+') result += n;
    else if (op === '−' || op === '-') result -= n;
    else if (op === '×') result *= n;
    else if (op === '÷') {
      if (n === 0) return 0; // 0 나누기 방어
      result = result / n;
    }
  }
  result = Math.round(result);
  if (result < 0) return 0; // 음수 금액 없음
  return Math.min(result, MAX_AMOUNT);
}

/** 식을 화면 표시용으로 — 숫자에 천단위 콤마, 연산자 양옆 공백. 빈 식은 "0". */
export function formatExpr(expr: string): string {
  if (!expr) return '0';
  return expr
    .replace(/\d+/g, (d) => Number(d).toLocaleString('ko-KR'))
    .replace(/([+\-−×÷])/gu, ' $1 ')
    .trim();
}

/** 식의 끝 숫자런에 한 자리 추가(연산자 뒤면 새 숫자 시작, 선행 0 처리, 자리수 상한). */
export function appendDigit(expr: string, d: string, maxRun: number): string {
  const m = expr.match(/(\d+)$/);
  if (m) {
    if (m[1].length >= maxRun) return expr; // 숫자런 자리수 상한
    if (m[1] === '0') {
      if (d === '0') return expr; // 선행 0 중복 무시
      return expr.slice(0, -1) + d; // 선행 0을 교체
    }
  }
  return expr + d;
}

/** 식 끝에 연산자 추가(식이 비면 불가, 끝이 연산자면 교체). */
export function appendOperator(expr: string, op: string): string {
  if (!expr) return expr;
  if (/[+\-−×÷]$/u.test(expr)) return expr.slice(0, -1) + op;
  return expr + op;
}

/** 식에 연산자가 포함돼 있는지(결과 미리보기 표시 여부 판단용). */
export function hasOperator(expr: string): boolean {
  return /[+\-−×÷]/u.test(expr);
}

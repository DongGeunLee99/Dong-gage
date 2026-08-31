import type { Language } from '@/i18n';

export const LOCALE_TAG: Record<Language, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
};

export function formatYearMonth(year: number, month: number, language: Language) {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(LOCALE_TAG[language], { year: 'numeric', month: 'long' }).format(date);
}

export function formatFullDateWithWeekday(dateStr: string, language: Language) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(LOCALE_TAG[language], { month: 'long', day: 'numeric', weekday: 'long' }).format(date);
}

export function formatFullDateWithYear(dateStr: string, language: Language) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(LOCALE_TAG[language], { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

export function getWeekdayLabels(language: Language): string[] {
  const base = new Date(2023, 0, 1); // 2023-01-01 was a Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return new Intl.DateTimeFormat(LOCALE_TAG[language], { weekday: 'short' }).format(d);
  });
}

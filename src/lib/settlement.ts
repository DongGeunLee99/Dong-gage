export type SettlementExtra = {
  id: string;
  label: string;
  amount: number;
  appliesTo: string[];
};

export type SettlementRound = {
  id: string;
  label: string;
  total: number;
  attendees: string[];
  extras: SettlementExtra[];
};

export type SettlementResult = {
  perPerson: { name: string; amount: number }[];
  total: number;
};

export function calculateSettlement(rounds: SettlementRound[]): SettlementResult {
  const totals = new Map<string, number>();

  for (const round of rounds) {
    const extrasTotal = round.extras.reduce((sum, e) => sum + e.amount, 0);
    const baseTotal = round.total - extrasTotal;
    const baseShare = round.attendees.length > 0 ? baseTotal / round.attendees.length : 0;
    for (const person of round.attendees) {
      totals.set(person, (totals.get(person) ?? 0) + baseShare);
    }
    for (const extra of round.extras) {
      const share = extra.appliesTo.length > 0 ? extra.amount / extra.appliesTo.length : 0;
      for (const person of extra.appliesTo) {
        totals.set(person, (totals.get(person) ?? 0) + share);
      }
    }
  }

  const perPerson = Array.from(totals.entries())
    .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
    .filter((p) => p.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const total = perPerson.reduce((sum, p) => sum + p.amount, 0);

  return { perPerson, total };
}

export function buildSettlementMessage(result: SettlementResult, roundLabels: string[]) {
  const lines = [`${roundLabels.join(', ')} 정산! 🍻`, ''];
  for (const p of result.perPerson) {
    lines.push(`${p.name} ${p.amount.toLocaleString('ko-KR')}원`);
  }
  return lines.join('\n');
}

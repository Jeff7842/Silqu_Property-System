/** Money is always stored/passed as integer cents. Never floats. */

export function toCents(kes: number): number {
  return Math.round(kes * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatKES(cents: number): string {
  const amount = fromCents(cents).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `KES ${amount}`;
}

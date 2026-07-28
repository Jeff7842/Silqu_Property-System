/** "254712345678" -> "+254 712 345 678" */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/^254/, "");
  return `+254 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

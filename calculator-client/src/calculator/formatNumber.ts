const MAX_SIGNIFICANT_DIGITS = 15;

export function formatNumber(value: number): string {
  return String(Number(value.toPrecision(MAX_SIGNIFICANT_DIGITS)));
}

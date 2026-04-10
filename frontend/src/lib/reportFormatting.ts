export const eurFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const compactEurFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 1,
  notation: "compact",
});

export function formatCurrency(value: number) {
  return eurFormatter.format(value);
}

export function formatCompactCurrency(value: number) {
  return compactEurFormatter.format(value);
}

export function formatPercentFromRatio(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatPercentValue(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function formatRatioValue(value: number, digits = 2) {
  return `${value.toFixed(digits)}x`;
}

export function formatTrendDirection(direction: string) {
  return direction.replace(/_/g, " ");
}

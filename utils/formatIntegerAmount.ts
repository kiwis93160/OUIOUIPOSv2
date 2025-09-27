const integerAmountFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

export function formatIntegerAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return integerAmountFormatter.format(Math.round(value));
}

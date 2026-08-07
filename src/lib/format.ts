export function usd(value: number | string | null | undefined, digits = 4): string {
  const n = Number(value ?? 0);
  return `$${n.toFixed(digits)}`;
}

export function shortUsd(value: number | string | null | undefined): string {
  return usd(value, 3);
}

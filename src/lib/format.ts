export function usd(value: number | string | null | undefined, digits = 4): string {
  const n = Number(value ?? 0);
  return `$${n.toFixed(digits)}`;
}

export function shortUsd(value: number | string | null | undefined): string {
  return usd(value, 3);
}

/** Format an $ADR amount — the only currency users earn. */
export function adr(value: number | string | null | undefined, digits = 1): string {
  const n = Number(value ?? 0);
  const s = Number.isInteger(n) ? n.toLocaleString("en-US") : n.toFixed(digits);
  return `${s} ADR`;
}

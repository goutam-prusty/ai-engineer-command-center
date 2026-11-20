export function nowIso(): string {
  return new Date().toISOString();
}

export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`;
}

export function clampStr(val: string, maxLen: number): string {
  return String(val ?? '').slice(0, maxLen);
}

export function clampInt(val: number, min: number, max: number): number {
  const n = Math.round(Number(val));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

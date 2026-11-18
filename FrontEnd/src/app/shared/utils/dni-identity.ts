export function normalizeDniIdentity(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

export function isSameDni(left: unknown, right: unknown): boolean {
  const normalizedLeft = normalizeDniIdentity(left);
  return normalizedLeft.length > 0 && normalizedLeft === normalizeDniIdentity(right);
}

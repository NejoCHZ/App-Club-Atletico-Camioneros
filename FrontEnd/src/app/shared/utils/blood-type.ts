export function normalizeBloodType(value: string | null | undefined): string {
  const normalized = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!normalized) return '';
  return normalized.replace(/^0(?=[+-]$)/, 'O');
}

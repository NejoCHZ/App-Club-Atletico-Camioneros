import { isSameDni, normalizeDniIdentity } from './dni-identity';

describe('DNI identity', () => {
  it('normalizes spaces and common separators', () => {
    expect(normalizeDniIdentity(' 47.265-479 ')).toBe('47265479');
  });

  it('recognizes the same DNI despite formatting differences', () => {
    expect(isSameDni('47.265.479', '47265479')).toBeTrue();
  });

  it('does not consider empty values equal', () => {
    expect(isSameDni('', '  ')).toBeFalse();
  });
});

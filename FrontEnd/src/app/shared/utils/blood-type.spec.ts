import { normalizeBloodType } from './blood-type';

describe('normalizeBloodType', () => {
  it('normalizes legacy zero-based blood groups to the canonical letter O', () => {
    expect(normalizeBloodType('0+')).toBe('O+');
    expect(normalizeBloodType(' 0 - ')).toBe('O-');
  });

  it('preserves canonical blood groups and empty values', () => {
    expect(normalizeBloodType('AB+')).toBe('AB+');
    expect(normalizeBloodType(null)).toBe('');
  });
});

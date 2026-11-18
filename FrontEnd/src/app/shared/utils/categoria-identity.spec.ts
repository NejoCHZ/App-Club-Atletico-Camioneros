import { normalizarNombreCategoria } from './categoria-identity';

describe('normalizarNombreCategoria', () => {
  it('trims and collapses all whitespace', () => {
    expect(normalizarNombreCategoria('  Pt\t AFA   2008  ')).toBe('Pt AFA 2008');
  });
});

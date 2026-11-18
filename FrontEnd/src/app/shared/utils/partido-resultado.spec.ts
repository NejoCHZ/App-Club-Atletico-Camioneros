import { clasificarResultadoPartido, codigoResultadoPartido } from './partido-resultado';

describe('partido resultado classification', () => {
  it('classifies won results in existing formats', () => {
    expect(clasificarResultadoPartido('G 2-0')).toBe('ganado');
    expect(clasificarResultadoPartido('  g 3-1  ')).toBe('ganado');
    expect(codigoResultadoPartido('G2-0')).toBe('G');
  });

  it('classifies drawn results in existing formats', () => {
    expect(clasificarResultadoPartido('E 1-1')).toBe('empatado');
    expect(clasificarResultadoPartido(' e   0-0')).toBe('empatado');
  });

  it('classifies lost results in existing formats', () => {
    expect(clasificarResultadoPartido('P 0-1')).toBe('perdido');
    expect(clasificarResultadoPartido('p2-3')).toBe('perdido');
  });

  it('does not classify unrelated text by its first letter', () => {
    expect(clasificarResultadoPartido('Partido suspendido')).toBe('desconocido');
    expect(clasificarResultadoPartido('')).toBe('desconocido');
  });
});

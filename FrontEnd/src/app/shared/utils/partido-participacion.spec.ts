import { MAX_MINUTOS_PARTIDO, validarParticipacionesPartido } from './partido-participacion';

describe('validarParticipacionesPartido', () => {
  it('accepts the full valid range', () => {
    expect(validarParticipacionesPartido([
      { idJugador: 1, minutosJugados: 0 },
      { idJugador: 2, minutosJugados: MAX_MINUTOS_PARTIDO },
    ])).toBeNull();
  });

  it('rejects duplicate players', () => {
    expect(validarParticipacionesPartido([
      { idJugador: 1, minutosJugados: 90 },
      { idJugador: 1, minutosJugados: 45 },
    ])).toContain('más de una vez');
  });

  for (const minutes of [-1, 121, 1.5, Number.NaN]) {
    it(`rejects invalid minutes: ${minutes}`, () => {
      expect(validarParticipacionesPartido([{ idJugador: 1, minutosJugados: minutes }]))
        .toContain('entre 0 y 120');
    });
  }
});

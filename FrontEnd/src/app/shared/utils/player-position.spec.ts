import { playerPositionLabel } from './player-position';

describe('playerPositionLabel', () => {
  it('normalizes supported position labels and synonyms', () => {
    expect(playerPositionLabel('ARQUERO')).toBe('Arquero');
    expect(playerPositionLabel('defensor')).toBe('Defensor');
    expect(playerPositionLabel('VOLANTE')).toBe('Mediocampista');
    expect(playerPositionLabel('Delantera')).toBe('Delantero');
  });

  it('preserves unknown legacy values for display', () => {
    expect(playerPositionLabel('PRUEBA')).toBe('PRUEBA');
  });

  it('uses a fallback when the position is empty', () => {
    expect(playerPositionLabel(null)).toBe('Sin posición');
    expect(playerPositionLabel('  ')).toBe('Sin posición');
  });
});

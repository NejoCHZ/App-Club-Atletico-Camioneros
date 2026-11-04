import { badgeClassDeEstadoCuota, prioridadDeEstadoCuota } from './estado-cuota';

describe('estado de cuota en los listados', () => {
  it('cada estado tiene su propio color', () => {
    expect(badgeClassDeEstadoCuota('AL DÍA')).toBe('badge-aldia');
    expect(badgeClassDeEstadoCuota('SOLO ENTRENAMIENTOS')).toBe('badge-pendiente');
    expect(badgeClassDeEstadoCuota('INHABILITADO')).toBe('badge-adeuda');
    expect(badgeClassDeEstadoCuota('BAJA')).toBe('badge-baja');
    expect(badgeClassDeEstadoCuota('SIN VERIFICAR')).toBe('badge-sin-verificar');
  });

  it('"SIN VERIFICAR" no se confunde con un jugador que tiene deuda', () => {
    expect(badgeClassDeEstadoCuota('SIN VERIFICAR')).not.toBe(badgeClassDeEstadoCuota('SOLO ENTRENAMIENTOS'));
    expect(badgeClassDeEstadoCuota('SIN VERIFICAR')).not.toBe(badgeClassDeEstadoCuota('INHABILITADO'));
  });

  it('"BAJA" ya no queda sin badge', () => {
    expect(badgeClassDeEstadoCuota('BAJA')).not.toBe('');
  });

  it('los textos de versiones anteriores se siguen reconociendo', () => {
    expect(badgeClassDeEstadoCuota('PENDIENTE')).toBe('badge-pendiente');
    expect(badgeClassDeEstadoCuota('ADEUDA')).toBe('badge-adeuda');
    expect(badgeClassDeEstadoCuota('al dia')).toBe('badge-aldia');
  });

  it('un estado desconocido o vacío no rompe', () => {
    expect(badgeClassDeEstadoCuota('')).toBe('');
    expect(badgeClassDeEstadoCuota(undefined)).toBe('');
    expect(badgeClassDeEstadoCuota(null)).toBe('');
  });

  it('el orden pone primero a quien no puede entrenar', () => {
    const orden = ['AL DÍA', 'SIN VERIFICAR', 'SOLO ENTRENAMIENTOS', 'INHABILITADO', 'BAJA']
      .sort((a, b) => prioridadDeEstadoCuota(a) - prioridadDeEstadoCuota(b));
    expect(orden[0]).toBe('INHABILITADO');
    expect(orden[1]).toBe('SOLO ENTRENAMIENTOS');
    expect(orden[2]).toBe('AL DÍA');
  });
});

export const MAX_MINUTOS_PARTIDO = 120;

export interface ParticipacionPartido {
  idJugador: number;
  minutosJugados: number;
}

export function validarParticipacionesPartido(participaciones: ParticipacionPartido[]): string | null {
  const ids = new Set<number>();

  for (const participacion of participaciones) {
    if (!Number.isInteger(participacion.idJugador) || participacion.idJugador <= 0) {
      return 'Todos los jugadores deben tener un identificador válido.';
    }
    if (ids.has(participacion.idJugador)) {
      return 'Un jugador no puede aparecer más de una vez en el mismo partido.';
    }
    ids.add(participacion.idJugador);

    if (!Number.isInteger(participacion.minutosJugados)
      || participacion.minutosJugados < 0
      || participacion.minutosJugados > MAX_MINUTOS_PARTIDO) {
      return `Los minutos jugados deben ser enteros entre 0 y ${MAX_MINUTOS_PARTIDO}.`;
    }
  }

  return null;
}

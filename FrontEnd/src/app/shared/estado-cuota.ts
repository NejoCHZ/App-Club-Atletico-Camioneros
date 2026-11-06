// Estado de cuota de un jugador tal como lo informa el Portal Administrativo (ver EstadoCuotaTexto en el backend):
//   AL DÍA, SOLO ENTRENAMIENTOS, INHABILITADO, BAJA, o SIN VERIFICAR cuando el Administrativo no respondió.
// Cada uno tiene su propio color: "SIN VERIFICAR" no se confunde con un jugador que debe, ni "BAJA" queda sin color.
// ('PENDIENTE' y 'ADEUDA' son textos de versiones anteriores; se siguen reconociendo.)
export function badgeClassDeEstadoCuota(estado: string | null | undefined): string {
  const e = (estado || '').trim().toUpperCase();
  if (e.includes('AL DÍA') || e.includes('AL DIA')) return 'badge-aldia';
  if (e.includes('SOLO ENTRENAMIENTOS') || e.includes('PENDIENTE')) return 'badge-pendiente';
  if (e.includes('SIN VERIFICAR')) return 'badge-sin-verificar';
  if (e.includes('BAJA')) return 'badge-baja';
  if (e.includes('INHABILITADO') || e.includes('ADEUDA')) return 'badge-adeuda';
  return '';
}

// Para ordenar un listado: primero quien tiene el acceso cortado, después quien puede entrenar con una cuota vencida,
// al final los que están al día y los que no se pudieron verificar.
export function prioridadDeEstadoCuota(estado: string | null | undefined): number {
  const e = (estado || '').trim().toUpperCase();
  if (e.includes('INHABILITADO') || e.includes('ADEUDA')) return 1;
  if (e.includes('SOLO ENTRENAMIENTOS') || e.includes('PENDIENTE')) return 2;
  if (e.includes('AL DÍA') || e.includes('AL DIA')) return 3;
  return 4;
}

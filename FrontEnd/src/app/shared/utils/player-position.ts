const POSITION_LABELS: Record<string, string> = {
  ARQUERO: 'Arquero',
  DEFENSOR: 'Defensor',
  MEDIOCAMPISTA: 'Mediocampista',
  VOLANTE: 'Mediocampista',
  DELANTERO: 'Delantero',
  DELANTERA: 'Delantero',
};

export function playerPositionLabel(position?: string | null): string {
  const value = position?.trim();
  if (!value) return 'Sin posición';
  return POSITION_LABELS[value.toLocaleUpperCase('es-AR')] ?? value;
}

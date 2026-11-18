export type ClasificacionResultadoPartido = 'ganado' | 'empatado' | 'perdido' | 'desconocido';

export function codigoResultadoPartido(resultado: string | null | undefined): 'G' | 'E' | 'P' | '' {
  const normalizado = (resultado ?? '').trim().toUpperCase();
  const coincidencia = normalizado.match(/^(G|E|P)(?:\s+|(?=\d)|$)/);
  return (coincidencia?.[1] as 'G' | 'E' | 'P' | undefined) ?? '';
}

export function clasificarResultadoPartido(resultado: string | null | undefined): ClasificacionResultadoPartido {
  switch (codigoResultadoPartido(resultado)) {
    case 'G': return 'ganado';
    case 'E': return 'empatado';
    case 'P': return 'perdido';
    default: return 'desconocido';
  }
}

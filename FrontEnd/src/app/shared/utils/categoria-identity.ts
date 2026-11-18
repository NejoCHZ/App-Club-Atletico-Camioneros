export function normalizarNombreCategoria(nombre: string | null | undefined): string {
  return (nombre ?? '').trim().replace(/\s+/g, ' ');
}

// El Portal Administrativo abre este portal con la sesión en el fragmento de la dirección (#sso=<token>). Va en el fragmento
// y no en la query para que el token no viaje al servidor ni quede en sus registros.
export const CLAVE_FRAGMENTO = 'sso';

export function tokenDelFragmento(hash: string): string | null {
  const texto = hash.startsWith('#') ? hash.slice(1) : hash;
  const valor = new URLSearchParams(texto).get(CLAVE_FRAGMENTO);
  return valor && valor.split('.').length === 3 ? valor : null;
}

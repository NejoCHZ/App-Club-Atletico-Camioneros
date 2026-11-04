import { tokenDelFragmento } from './sso';

describe('tokenDelFragmento', () => {
  const token = 'aaa.bbb.ccc';

  it('lee el token del fragmento', () => {
    expect(tokenDelFragmento('#sso=' + token)).toBe(token);
  });

  it('acepta el fragmento sin la almohadilla y con otros parámetros', () => {
    expect(tokenDelFragmento('x=1&sso=' + token)).toBe(token);
  });

  it('ignora lo que no parece un token', () => {
    expect(tokenDelFragmento('')).toBeNull();
    expect(tokenDelFragmento('#sso=')).toBeNull();
    expect(tokenDelFragmento('#sso=abc')).toBeNull();
    expect(tokenDelFragmento('#otro=' + token)).toBeNull();
  });
});

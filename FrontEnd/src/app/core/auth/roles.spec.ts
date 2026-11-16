import { categoryNavLabel, homeForRole, normalizeRole } from './roles';

describe('role helpers', () => {
  it('normalizes API role variants', () => {
    expect(normalizeRole('Administrador')).toBe('admin');
    expect(normalizeRole('Administrador (Tesorero)')).toBe('admin');
    expect(normalizeRole('Médico')).toBe('medico');
    expect(normalizeRole('Director Técnico')).toBe('dt');
    expect(normalizeRole('Preparador Físico')).toBe('preparador-fisico');
    expect(normalizeRole('6')).toBe('preparador-fisico');
    expect(normalizeRole('7')).toBe('coordinador');
    expect(normalizeRole('Don QR')).toBe('don-qr');
  });

  it('uses the assigned-category label for DT and Preparador Físico', () => {
    expect(categoryNavLabel('dt')).toBe('Mis categorías');
    expect(categoryNavLabel('preparador-fisico')).toBe('Mis categorías');
    expect(categoryNavLabel('admin')).toBe('Categorías');
  });

  it('rejects unknown roles instead of granting a fallback role', () => {
    expect(normalizeRole('unknown')).toBeNull();
  });

  it('maps every role to its canonical home', () => {
    expect(homeForRole('admin')).toBe('/admin');
    expect(homeForRole('don-qr')).toBe('/semaforo-qr');
    expect(homeForRole('preparador-fisico')).toBe('/preparador-fisico');
  });
});

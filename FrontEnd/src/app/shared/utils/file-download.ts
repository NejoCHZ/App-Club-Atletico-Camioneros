export function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Mobile browsers need the temporary link and URL to remain alive until
  // their download handler has consumed the click.
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }, 1500);
}

export function credentialFileName(type: 'jugador' | 'staff', ...nameParts: string[]): string {
  const personName = nameParts
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return `credencial_${type}_${personName || 'sin_nombre'}.pdf`;
}

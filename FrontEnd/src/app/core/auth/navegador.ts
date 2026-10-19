// Envoltura minima de la navegacion del navegador (otro sitio = navegacion completa, no del router). Permite probarla.
export const navegador = {
  irA: (url: string): void => {
    if (typeof window !== 'undefined') window.location.replace(url);
  }
};

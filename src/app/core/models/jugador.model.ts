export interface Jugador {
  idJugador?: number;
  idPersona?: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string; // Formato YYYY-MM-DD
  genero?: string;
  posicionCancha: string;
  clubOrigen?: string;
  idCategoria?: number;
  nombreCategoria?: string; // Si el backend hace el JOIN
  fichaMedicaLiga?: boolean;
}

export type PosicionJugador = 'ARQUERO' | 'DEFENSOR' | 'VOLANTE' | 'DELANTERO';

export interface TutorModel {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

// --- NUEVAS INTERFACES PARA LA VISTA DE PERFIL ---
export interface PartidoModel {
  fecha: string;
  rival: string;
  resultado: string;
  condicion: string | null; 
  minutos: number;
}

export interface FichaMedicaModel {
  patologias: string;
  historialLesiones: string;
  observaciones: string;
  grupoSanguineo: string | null;
}
// --------------------------------------------------

export interface JugadorModel {
  id: number; // Modificado a number para SQL Server
  dni: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  categoria: string;
  posicion: PosicionJugador;
  clubOrigen: string | null;
  aptoFisico: boolean;
  tutor: TutorModel | null;

  // --- NUEVOS CAMPOS OPCIONALES MAPEADOS DESDE LA BD ---
  peso?: number | null;
  altura?: number | null;
  pieHabil?: string | null;
  fichaMedica?: FichaMedicaModel | null;
  partidos?: PartidoModel[];
}

export type CrearJugadorModel = Omit<JugadorModel, 'id'>;

// Interfaz extendida exclusiva para la vista HTML
export interface JugadorVista extends JugadorModel {
  nombreCompleto: string;
  edad: number;
}

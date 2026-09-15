export type PosicionJugador = 'ARQUERO' | 'DEFENSOR' | 'VOLANTE' | 'DELANTERO';

export interface TutorModel {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

export interface JugadorModel {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  categoria: string;
  posicion: PosicionJugador;
  clubOrigen: string | null;
  aptoFisico: boolean;
  tutor: TutorModel | null;
}

export type CrearJugadorModel = Omit<JugadorModel, 'id'>;

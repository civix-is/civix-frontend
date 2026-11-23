export interface CalificacionRegistro {
  idIncidencia: number;
  puntuacion: number;
  comentario: string | null;
}

export interface Calificacion extends CalificacionRegistro {
  idCalificacion: number;
  fechaCalificacion: string;
}

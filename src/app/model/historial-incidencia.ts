import { Incidencia } from './incidencia';
import { Usuario } from './usuario';

export class HistorialIncidencia {
  idHistorial: number;
  estadoAnterior: string;
  estadoNuevo: string;
  comentario: string;
  areaAsignada: string;
  usuarioAccion: string;
  fechaCambio: Date= new Date();
  idIncidencia: Incidencia;
  idUsuario: Usuario;
}

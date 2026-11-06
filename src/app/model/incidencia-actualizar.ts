import { Categoria } from './categoria';

export class IncidenciaActualizar {
  idIncidencia: number;
  titulo: string;
  descripcion: string;
  estadoAtencion: string;
  prioridad: string;
  comentario: string;
  areaAsignada: string;
  idCategoria: Categoria;
}

import { Categoria } from './categoria';

export class Incidencia {
  idIncidencia: number;
  codigoIncidencia: string;
  titulo: string;
  descripcion: string;
  direccionReferencia: string;
  esSugeridoIA: boolean;
  estadoAtencion: string;
  fechaLimiteEstimada: Date = new Date();
  fechaRegistro: Date = new Date();
  latitud: number;
  longitud: number;
  prioridad: string;
  categoria?: Categoria;
  idCategoria?: Categoria;
}

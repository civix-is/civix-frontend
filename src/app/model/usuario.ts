import { Rol } from './rol';

export class Usuario {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  dni: string;
  telefono: string;
  estado: boolean;
  FechaRegistro: Date = new Date();
  fechaRegistro?: Date | string;
  idRol: Rol;
  rol?: Rol;
}

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  usuario: string;
  email: string;
  idRol: number;
  rol: string;
  estado: boolean;
  fechaCreacion: string;
}

export interface Rol {
  id: number;
  rol: string;
}

export interface CrearUsuarioDto {
  nombres: string;
  apellidos: string;
  usuario: string;
  email: string;
  password: string;
  idRol: number;
}

export interface ActualizarUsuarioDto {
  nombres: string;
  apellidos: string;
  email: string;
  password?: string;
  idRol: number;
  estado: boolean;
}

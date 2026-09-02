export interface LoginRequest {
  usuario: string;
  contrasena: string;
}

export interface UserInfo {
  id: number;
  nombres: string;
  apellidos: string;
  usuario: string;
  email: string;
  idRol: number;
  rolNombre: string;
}

export interface RutaPermiso {
  id: number;
  nombre: string;
  ruta: string;
}

export interface LoginResponse {
  token: string;
  expiracion: string;
  usuario: UserInfo;
  rutas: RutaPermiso[];
}

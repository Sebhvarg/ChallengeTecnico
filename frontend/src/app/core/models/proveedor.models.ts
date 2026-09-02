export interface Proveedor {
  id: number;
  nombre: string;
  email: string;
  celular?: string;
  estado: boolean;
  fechaCreacion: string;
}

export interface CrearProveedorDto {
  nombre: string;
  email: string;
  celular?: string;
}

export interface ActualizarProveedorDto {
  nombre: string;
  email: string;
  celular?: string;
  estado: boolean;
}

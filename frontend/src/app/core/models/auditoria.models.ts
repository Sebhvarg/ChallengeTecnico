export interface AuditoriaItem {
  id: number;
  idUsuario?: number;
  usuario: string;
  rol: string;
  accion: string;
  modulo: string;
  detalle: string;
  ip?: string;
  fecha: string;
}

export interface AuditoriaStats {
  total: number;
  creaciones: number;
  ediciones: number;
  desactivaciones: number;
  iniciosSesion: number;
}

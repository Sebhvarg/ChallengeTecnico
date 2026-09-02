export interface ApiResponse<T> {
  exito: boolean;
  mensaje: string;
  datos: T;
  errores?: string[];
  codigoEstado: number;
}

export interface PagedResult<T> {
  items: T[];
  totalRegistros: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  tienePaginaAnterior: boolean;
  tienePaginaSiguiente: boolean;
}

export interface LogItem {
  id: number;
  fecha: string;
  nivel: string; // INF, WRN, ERR, FTL, DBG
  mensaje: string;
  excepcion?: string;
  origen?: string;
}

export interface LogStats {
  total: number;
  errores: number;
  advertencias: number;
  informacion: number;
}

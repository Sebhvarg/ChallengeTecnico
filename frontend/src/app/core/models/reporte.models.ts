export interface ReportePrecioProducto {
  producto: string;
  preciosPorProveedor: { [proveedor: string]: number };
  total?: number;
}

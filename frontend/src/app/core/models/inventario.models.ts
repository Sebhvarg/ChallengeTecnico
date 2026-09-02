export interface InventarioItem {
  id: number;
  idLote: number;
  numeroLote?: string;
  idProducto: number;
  codigoProducto: string;
  productoNombre: string;
  categoriaNombre: string;
  idProveedor: number;
  proveedorNombre: string;
  costoProducto: number;
  precioProducto: number;
  stockProducto: number;
  estado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface AjustarStockDto {
  idLote: number;
  cantidad: number;
  tipoAjuste: 'Incrementar' | 'Decrementar' | 'Fijar';
  nuevoCosto?: number;
  nuevoPrecio?: number;
}

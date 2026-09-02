export interface LoteProducto {
  idProveedorProducto: number;
  numeroLote?: string;
  idProveedor: number;
  proveedorNombre: string;
  costoProducto: number;
  precioProducto: number;
  stockProducto: number;
  estado: boolean;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  idCategoria?: number;
  categoriaNombre?: string;
  estado: boolean;
  fechaCreacion: string;
  lotes: LoteProducto[];
  stockTotal: number;
}

export interface ProductoListItem {
  idProducto: number;
  codigo: string;
  producto: string;
  categoria: string;
  numeroLote?: string;
  idProveedor: number;
  proveedor: string;
  costoProducto: number;
  precioProducto: number;
  stockProducto: number;
  estado: boolean;
  fechaCreacion: string;
}

export interface CrearProductoDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  idCategoria?: number;
  idProveedor: number;
  numeroLote: string;
  costoProducto: number;
  precioProducto: number;
  stockProducto: number;
}

export interface ActualizarProductoDto {
  nombre: string;
  descripcion?: string;
  idCategoria?: number;
  estado: boolean;
  idProveedorProducto?: number;
  costoProducto?: number;
  precioProducto?: number;
  stockProducto?: number;
}

export interface CrearLoteDto {
  idProducto: number;
  idProveedor: number;
  numeroLote: string;
  costoProducto: number;
  precioProducto: number;
  stockProducto: number;
}

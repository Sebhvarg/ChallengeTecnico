export interface Categoria {
  id: number;
  categoria: string;
  estado: boolean;
}

export interface CrearCategoriaDto {
  categoria: string;
}

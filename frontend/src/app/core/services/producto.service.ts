import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.models';
import { Producto, ProductoListItem, CrearProductoDto, ActualizarProductoDto, LoteProducto, CrearLoteDto } from '../models/producto.models';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  getProductos(filtro?: string, pagina: number = 1, tamanoPagina: number = 10): Observable<ApiResponse<PagedResult<ProductoListItem>>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanoPagina', tamanoPagina.toString());

    if (filtro && filtro.trim()) {
      params = params.set('filtro', filtro.trim());
    }

    return this.http.get<ApiResponse<PagedResult<ProductoListItem>>>(this.apiUrl, { params });
  }

  getProductoById(id: number): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.apiUrl}/${id}`);
  }

  getProductoByCodigo(codigo: string): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.apiUrl}/codigo/${codigo}`);
  }

  crearProducto(dto: CrearProductoDto): Observable<ApiResponse<Producto>> {
    return this.http.post<ApiResponse<Producto>>(this.apiUrl, dto);
  }

  actualizarProducto(id: number, dto: ActualizarProductoDto): Observable<ApiResponse<Producto>> {
    return this.http.put<ApiResponse<Producto>>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarProducto(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  agregarLote(dto: CrearLoteDto): Observable<ApiResponse<LoteProducto>> {
    return this.http.post<ApiResponse<LoteProducto>>(`${this.apiUrl}/lotes`, dto);
  }
}

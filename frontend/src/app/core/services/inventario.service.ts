import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.models';
import { InventarioItem, AjustarStockDto } from '../models/inventario.models';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private readonly apiUrl = `${environment.apiUrl}/inventario`;

  constructor(private http: HttpClient) {}

  getInventario(filtro?: string, pagina: number = 1, tamanoPagina: number = 10): Observable<ApiResponse<PagedResult<InventarioItem>>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanoPagina', tamanoPagina.toString());

    if (filtro && filtro.trim()) {
      params = params.set('filtro', filtro.trim());
    }

    return this.http.get<ApiResponse<PagedResult<InventarioItem>>>(this.apiUrl, { params });
  }

  getLotesPorProducto(idProducto: number): Observable<ApiResponse<InventarioItem[]>> {
    return this.http.get<ApiResponse<InventarioItem[]>>(`${this.apiUrl}/producto/${idProducto}`);
  }

  ajustarStock(dto: AjustarStockDto): Observable<ApiResponse<InventarioItem>> {
    return this.http.put<ApiResponse<InventarioItem>>(`${this.apiUrl}/ajuste-stock`, dto);
  }
}

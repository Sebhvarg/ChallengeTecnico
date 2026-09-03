import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.models';
import { Proveedor, CrearProveedorDto, ActualizarProveedorDto } from '../models/proveedor.models';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private readonly apiUrl = `${environment.apiUrl}/proveedores`;

  constructor(private http: HttpClient) {}

  getProveedores(filtro?: string, pagina: number = 1, tamanoPagina: number = 10): Observable<ApiResponse<PagedResult<Proveedor>>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanoPagina', tamanoPagina.toString());

    if (filtro && filtro.trim()) {
      params = params.set('filtro', filtro.trim());
    }

    return this.http.get<ApiResponse<PagedResult<Proveedor>>>(this.apiUrl, { params });
  }

  getActivos(): Observable<ApiResponse<Proveedor[]>> {
    return this.http.get<ApiResponse<Proveedor[]>>(`${this.apiUrl}/activos`);
  }

  getById(id: number): Observable<ApiResponse<Proveedor>> {
    return this.http.get<ApiResponse<Proveedor>>(`${this.apiUrl}/${id}`);
  }

  crearProveedor(dto: CrearProveedorDto): Observable<ApiResponse<Proveedor>> {
    return this.http.post<ApiResponse<Proveedor>>(this.apiUrl, dto);
  }

  actualizarProveedor(id: number, dto: ActualizarProveedorDto): Observable<ApiResponse<Proveedor>> {
    return this.http.put<ApiResponse<Proveedor>>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarProveedor(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  reactivarProveedor(id: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${id}/reactivar`, {});
  }
}

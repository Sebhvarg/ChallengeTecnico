import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.models';
import { ReportePrecioProducto } from '../models/reporte.models';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  getReportePreciosPorProveedor(filtro?: string): Observable<ApiResponse<ReportePrecioProducto[]>> {
    let params = new HttpParams();
    if (filtro && filtro.trim()) {
      params = params.set('filtro', filtro.trim());
    }
    return this.http.get<ApiResponse<ReportePrecioProducto[]>>(`${this.apiUrl}/precios-proveedores`, { params });
  }
}

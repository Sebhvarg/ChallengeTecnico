import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.models';
import { LogItem, LogStats } from '../models/log.models';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private readonly apiUrl = `${environment.apiUrl}/logs`;

  constructor(private http: HttpClient) {}

  getLogs(filtro?: string, nivel?: string, pagina: number = 1, tamanoPagina: number = 15): Observable<ApiResponse<PagedResult<LogItem>>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanoPagina', tamanoPagina.toString());

    if (filtro && filtro.trim()) {
      params = params.set('filtro', filtro.trim());
    }

    if (nivel && nivel.trim() && nivel.toUpperCase() !== 'TODOS') {
      params = params.set('nivel', nivel.trim());
    }

    return this.http.get<ApiResponse<PagedResult<LogItem>>>(this.apiUrl, { params });
  }

  getEstadisticas(): Observable<ApiResponse<LogStats>> {
    return this.http.get<ApiResponse<LogStats>>(`${this.apiUrl}/estadisticas`);
  }

  limpiarLogs(): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/limpiar`);
  }
}

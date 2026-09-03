import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api-response.models';
import { AuditoriaItem, AuditoriaStats } from '../models/auditoria.models';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private readonly apiUrl = `${environment.apiUrl}/auditoria`;

  constructor(private http: HttpClient) {}

  getAuditoria(filtro?: string, modulo?: string, accion?: string, pagina: number = 1, tamanoPagina: number = 10): Observable<ApiResponse<PagedResult<AuditoriaItem>>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanoPagina', tamanoPagina.toString());

    if (filtro && filtro.trim()) {
      params = params.set('filtro', filtro.trim());
    }

    if (modulo && modulo.trim() && modulo.toUpperCase() !== 'TODOS') {
      params = params.set('modulo', modulo.trim());
    }

    if (accion && accion.trim() && accion.toUpperCase() !== 'TODOS') {
      params = params.set('accion', accion.trim());
    }

    return this.http.get<ApiResponse<PagedResult<AuditoriaItem>>>(this.apiUrl, { params });
  }

  getEstadisticas(): Observable<ApiResponse<AuditoriaStats>> {
    return this.http.get<ApiResponse<AuditoriaStats>>(`${this.apiUrl}/estadisticas`);
  }
}

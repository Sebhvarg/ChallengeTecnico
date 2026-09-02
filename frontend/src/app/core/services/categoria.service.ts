import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.models';
import { Categoria, CrearCategoriaDto } from '../models/categoria.models';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly apiUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  getCategorias(): Observable<ApiResponse<Categoria[]>> {
    return this.http.get<ApiResponse<Categoria[]>>(this.apiUrl);
  }

  crearCategoria(dto: CrearCategoriaDto): Observable<ApiResponse<Categoria>> {
    return this.http.post<ApiResponse<Categoria>>(this.apiUrl, dto);
  }
}

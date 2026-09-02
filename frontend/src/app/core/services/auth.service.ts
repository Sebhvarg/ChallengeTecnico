import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.models';
import { LoginRequest, LoginResponse, UserInfo, RutaPermiso } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly ROUTES_KEY = 'auth_routes';

  currentUser = signal<UserInfo | null>(this.getStoredUser());
  userRoutes = signal<RutaPermiso[]>(this.getStoredRoutes());
  isAuthenticated = computed(() => !!this.currentUser() && !!this.getToken());
  isAdmin = computed(() => this.currentUser()?.rolNombre?.toLowerCase() === 'administrador');

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.exito && res.datos) {
          this.setSession(res.datos);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROUTES_KEY);
    this.currentUser.set(null);
    this.userRoutes.set([]);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasRoutePermission(routeUrl: string): boolean {
    if (this.isAdmin()) return true;
    const cleanUrl = routeUrl.split('?')[0];
    return this.userRoutes().some(r => cleanUrl.startsWith(r.ruta));
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.usuario));
    localStorage.setItem(this.ROUTES_KEY, JSON.stringify(authResult.rutas));
    this.currentUser.set(authResult.usuario);
    this.userRoutes.set(authResult.rutas);
  }

  private getStoredUser(): UserInfo | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private getStoredRoutes(): RutaPermiso[] {
    const routesStr = localStorage.getItem(this.ROUTES_KEY);
    if (!routesStr) return [];
    try {
      return JSON.parse(routesStr);
    } catch {
      return [];
    }
  }
}

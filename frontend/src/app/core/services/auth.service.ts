import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.models';
import { LoginRequest, LoginResponse, UserInfo, RutaPermiso, EncryptedNetworkPayload } from '../models/auth.models';
import { CryptoStorageService, StorageTamperedError } from './crypto-storage.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly ROUTES_KEY = 'auth_routes';

  private cryptoStorage = inject(CryptoStorageService);
  private notify = inject(NotificationService);

  currentUser = signal<UserInfo | null>(null);
  userRoutes = signal<RutaPermiso[]>([]);
  isAuthenticated = computed(() => !!this.currentUser() && !!this.getToken());
  isAdmin = computed(() => this.currentUser()?.rolNombre?.toLowerCase() === 'administrador');

  private integrityIntervalId?: any;

  constructor(private http: HttpClient, private router: Router) {
    // Configurar listener de manipulación no autorizada de sesión
    this.cryptoStorage.setTamperListener(() => {
      this.handleTamperingDetected();
    });

    // Cargar estado inicial desde almacenamiento cifrado
    this.loadInitialSession();

    // Iniciar monitor continuo de integridad en segundo plano (cada 2 segundos)
    this.startIntegrityMonitor();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<EncryptedNetworkPayload>>(`${this.apiUrl}/login`, credentials).pipe(
      map(res => {
        if (!res.exito || !res.datos) {
          throw new Error(res.mensaje || 'Error al procesar la respuesta del servidor.');
        }

        // Descifrado del payload que vino cifrado desde la consola de red
        const decryptedData = this.cryptoStorage.decryptNetworkPayload<LoginResponse>(
          res.datos.payload,
          res.datos.iv
        );

        return decryptedData;
      }),
      tap(decryptedResponse => {
        // Almacenar en sessionStorage de forma cifrada con firma HMAC
        this.setSession(decryptedResponse);
      })
    );
  }

  logout(): void {
    this.clearSessionData();
    this.router.navigate(['/login']);
  }

  /**
   * Cierre de sesión automático de emergencia cuando se detecta manipulación en DevTools/Storage
   */
  handleTamperingDetected(): void {
    if (this.currentUser() || this.getToken()) {
      console.warn('[Seguridad] Manipulación de datos de sesión detectada. Cerrando sesión de inmediato...');
      this.clearSessionData();
      this.notify.error(
        'Se detectó una modificación no autorizada o manipulación en los datos de la sesión. Por motivos de seguridad, la sesión ha sido cerrada.',
        'Alerta de Seguridad'
      );
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    try {
      return this.cryptoStorage.getItem<string>(this.TOKEN_KEY);
    } catch (err) {
      if (err instanceof StorageTamperedError) {
        this.handleTamperingDetected();
      }
      return null;
    }
  }

  hasRoutePermission(routeUrl: string): boolean {
    if (this.isAdmin()) return true;
    const cleanUrl = routeUrl.split('?')[0];
    return this.userRoutes().some(r => cleanUrl.startsWith(r.ruta));
  }

  /**
   * Guarda de forma cifrada el token JWT, usuario y rutas en sessionStorage
   */
  private setSession(authResult: LoginResponse): void {
    this.cryptoStorage.setItem(this.TOKEN_KEY, authResult.token);
    this.cryptoStorage.setItem(this.USER_KEY, authResult.usuario);
    this.cryptoStorage.setItem(this.ROUTES_KEY, authResult.rutas);

    this.currentUser.set(authResult.usuario);
    this.userRoutes.set(authResult.rutas);
  }

  private clearSessionData(): void {
    this.cryptoStorage.removeItem(this.TOKEN_KEY);
    this.cryptoStorage.removeItem(this.USER_KEY);
    this.cryptoStorage.removeItem(this.ROUTES_KEY);
    this.currentUser.set(null);
    this.userRoutes.set([]);
  }

  private loadInitialSession(): void {
    try {
      const user = this.cryptoStorage.getItem<UserInfo>(this.USER_KEY);
      const routes = this.cryptoStorage.getItem<RutaPermiso[]>(this.ROUTES_KEY);
      const token = this.cryptoStorage.getItem<string>(this.TOKEN_KEY);

      if (user && token) {
        this.currentUser.set(user);
        this.userRoutes.set(routes || []);
      }
    } catch (err) {
      if (err instanceof StorageTamperedError) {
        this.handleTamperingDetected();
      }
    }
  }

  /**
   * Vigilante en segundo plano que verifica que las claves en sessionStorage no hayan sido alteradas
   */
  private startIntegrityMonitor(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        this.verifyCurrentSession();
      });

      this.integrityIntervalId = setInterval(() => {
        this.verifyCurrentSession();
      }, 2000);
    }
  }

  private verifyCurrentSession(): void {
    if (this.currentUser()) {
      const isIntegrityOk = this.cryptoStorage.checkIntegrity([this.TOKEN_KEY, this.USER_KEY, this.ROUTES_KEY]);
      if (!isIntegrityOk) {
        this.handleTamperingDetected();
      }
    }
  }
}

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
        const raw = this.cryptoStorage.decryptNetworkPayload<any>(
          res.datos.payload,
          res.datos.iv
        );

        const usuarioRaw = raw.usuario || raw.Usuario || {};
        const usuario: UserInfo = {
          id: usuarioRaw.id ?? usuarioRaw.Id ?? 0,
          nombres: usuarioRaw.nombres || usuarioRaw.Nombres || '',
          apellidos: usuarioRaw.apellidos || usuarioRaw.Apellidos || '',
          usuario: usuarioRaw.usuario || usuarioRaw.Usuario || '',
          email: usuarioRaw.email || usuarioRaw.Email || '',
          idRol: usuarioRaw.idRol ?? usuarioRaw.IdRol ?? 0,
          rolNombre: usuarioRaw.rolNombre || usuarioRaw.RolNombre || ''
        };

        const rutasRaw = raw.rutas || raw.Rutas || [];
        const rutas: RutaPermiso[] = rutasRaw.map((r: any) => ({
          id: r.id ?? r.Id ?? 0,
          nombre: r.nombre || r.Nombre || '',
          ruta: r.ruta || r.Ruta || ''
        }));

        const normalizedResponse: LoginResponse = {
          token: raw.token || raw.Token || '',
          expiracion: raw.expiracion || raw.Expiracion || '',
          usuario: usuario,
          rutas: rutas
        };

        return normalizedResponse;
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

  private isHandlingTamper = false;

  /**
   * Cierre de sesión automático de emergencia cuando se detecta manipulación en DevTools/Storage
   */
  handleTamperingDetected(): void {
    if (this.isHandlingTamper) {
      return;
    }

    if (this.currentUser() || sessionStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.USER_KEY)) {
      this.isHandlingTamper = true;
      console.warn('[Seguridad] Manipulación de datos de sesión detectada. Cerrando sesión de inmediato...');
      
      this.clearSessionData();
      this.router.navigate(['/login']);

      this.notify.modalAlert(
        'Sesión Cerrada por Seguridad',
        'Se detectó una modificación no autorizada o alteración en los datos de la sesión almacenados en el navegador. Por motivos de seguridad, la sesión ha sido cerrada de inmediato.',
        'error'
      ).then(() => {
        this.isHandlingTamper = false;
      });
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
    this.isHandlingTamper = false;
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
    this.cryptoStorage.clear();
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
   * Vigilante continuo en segundo plano (cada 400ms) que verifica la integridad estricta de la sesión
   */
  private startIntegrityMonitor(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        this.verifyCurrentSession();
      });

      this.integrityIntervalId = setInterval(() => {
        this.verifyCurrentSession();
      }, 400);
    }
  }

  private verifyCurrentSession(): void {
    if (this.currentUser()) {
      const tokenRaw = sessionStorage.getItem(this.TOKEN_KEY);
      const userRaw = sessionStorage.getItem(this.USER_KEY);
      const routesRaw = sessionStorage.getItem(this.ROUTES_KEY);

      // Si alguna de las claves fue borrada o alterada manualmente en DevTools
      if (!tokenRaw || !userRaw || !routesRaw) {
        this.handleTamperingDetected();
        return;
      }

      const isIntegrityOk = this.cryptoStorage.checkIntegrity([this.TOKEN_KEY, this.USER_KEY, this.ROUTES_KEY]);
      if (!isIntegrityOk) {
        this.handleTamperingDetected();
      }
    }
  }
}

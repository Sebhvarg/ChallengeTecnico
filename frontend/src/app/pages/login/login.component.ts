import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  private readonly STORAGE_LOCKOUT_KEY = 'auth_login_lockout_until';
  private readonly STORAGE_ATTEMPTS_KEY = 'auth_login_attempts';
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION_MS = 2 * 60 * 1000; // 2 minutos (120,000 ms)

  usuario = '';
  contrasena = '';
  mostrarContrasena = signal(false);
  cargando = signal(false);
  errorMensaje = signal<string | null>(null);

  // Control de Bloqueo y Reintentos
  estaBloqueado = signal(false);
  segundosRestantes = signal(0);
  intentosFallidos = signal(0);
  private timerInterval: any = null;

  tiempoFormateado = computed(() => {
    const totalSec = this.segundosRestantes();
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  intentosRestantes = computed(() => {
    return Math.max(0, this.MAX_ATTEMPTS - this.intentosFallidos());
  });

  ngOnInit(): void {
    this.verificarBloqueoPersistente();
  }

  ngOnDestroy(): void {
    this.detenerTemporizador();
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena.update(v => !v);
  }

  fillCredentials(user: string): void {
    if (this.estaBloqueado()) return;
    this.usuario = user;
    this.contrasena = 'Admin123*';
    this.errorMensaje.set(null);
  }

  verificarBloqueoPersistente(): void {
    if (typeof localStorage === 'undefined') return;

    const storedLockout = localStorage.getItem(this.STORAGE_LOCKOUT_KEY);
    const storedAttempts = parseInt(localStorage.getItem(this.STORAGE_ATTEMPTS_KEY) || '0', 10);
    this.intentosFallidos.set(storedAttempts);

    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10);
      const now = Date.now();

      if (lockoutTime > now) {
        const remainingSec = Math.ceil((lockoutTime - now) / 1000);
        this.iniciarBloqueo(remainingSec);
      } else {
        this.limpiarEstadoBloqueo();
      }
    }
  }

  iniciarBloqueo(segundos: number): void {
    this.estaBloqueado.set(true);
    this.segundosRestantes.set(segundos);
    this.errorMensaje.set(`Acceso bloqueado por límite de ${this.MAX_ATTEMPTS} intentos fallidos.`);

    this.detenerTemporizador();
    this.timerInterval = setInterval(() => {
      const actual = this.segundosRestantes() - 1;
      if (actual <= 0) {
        this.detenerTemporizador();
        this.limpiarEstadoBloqueo();
        this.notify.info('El tiempo de bloqueo ha finalizado. Puede intentar iniciar sesión nuevamente.');
      } else {
        this.segundosRestantes.set(actual);
      }
    }, 1000);
  }

  detenerTemporizador(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  limpiarEstadoBloqueo(): void {
    this.estaBloqueado.set(false);
    this.segundosRestantes.set(0);
    this.intentosFallidos.set(0);
    this.errorMensaje.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_LOCKOUT_KEY);
      localStorage.removeItem(this.STORAGE_ATTEMPTS_KEY);
    }
  }

  registrarIntentoFallido(): void {
    const nuevosIntentos = this.intentosFallidos() + 1;
    this.intentosFallidos.set(nuevosIntentos);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_ATTEMPTS_KEY, nuevosIntentos.toString());
    }

    if (nuevosIntentos >= this.MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + this.LOCKOUT_DURATION_MS;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_LOCKOUT_KEY, lockoutUntil.toString());
      }
      this.iniciarBloqueo(120);
    }
  }

  onSubmit(): void {
    if (this.estaBloqueado()) {
      this.notify.warning(`Acceso temporalmente bloqueado. Espere ${this.tiempoFormateado()} minutos.`);
      return;
    }

    if (!this.usuario.trim() || !this.contrasena) {
      this.errorMensaje.set('Por favor complete todos los campos obligatorios.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.authService.login({
      usuario: this.usuario.trim(),
      contrasena: this.contrasena
    }).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.limpiarEstadoBloqueo();
        const nombre = res.usuario?.nombres || res.usuario?.usuario || 'al Sistema';
        this.notify.success(`Bienvenido ${nombre}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.registrarIntentoFallido();
        if (!this.estaBloqueado()) {
          const msg = err.error?.mensaje || `Credenciales inválidas. Intento ${this.intentosFallidos()} de ${this.MAX_ATTEMPTS}.`;
          this.errorMensaje.set(msg);
        }
      }
    });
  }
}

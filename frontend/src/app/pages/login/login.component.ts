import { Component, inject, signal } from '@angular/core';
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
export class LoginComponent {
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  usuario = '';
  contrasena = '';
  mostrarContrasena = signal(false);
  cargando = signal(false);
  errorMensaje = signal<string | null>(null);

  toggleMostrarContrasena() {
    this.mostrarContrasena.update(v => !v);
  }

  fillCredentials(user: string) {
    this.usuario = user;
    this.contrasena = 'Admin123*';
    this.errorMensaje.set(null);
  }

  onSubmit() {
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
        this.notify.success(`Bienvenido ${res.datos.usuario.nombres}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err.error?.mensaje || 'Credenciales inválidas. Verifique su usuario y contraseña.';
        this.errorMensaje.set(msg);
      }
    });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="h-screen max-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
      
      <!-- Header Superior con Logo -->
      <header class="flex items-center justify-between max-w-6xl w-full mx-auto shrink-0">
        <div class="flex items-center gap-3">
          <img src="/assets/img/logo/logoinventario.svg" alt="Logo" class="h-8 sm:h-9 w-auto object-contain" />
        </div>
        <div *ngIf="authService.isAuthenticated()">
          <span class="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 shadow-xs">
            Sesión: <strong>{{ authService.currentUser()?.usuario }}</strong> ({{ authService.currentUser()?.rolNombre }})
          </span>
        </div>
      </header>

      <!-- Contenido Central 404 Adaptado al Viewport -->
      <main class="flex flex-col items-center justify-center text-center max-w-lg mx-auto my-auto py-2 sm:py-4 shrink min-h-0">
        
        <!-- Imagen Ilustrativa 404 con altura máxima relativa a la pantalla (vh) -->
        <div class="mb-3 sm:mb-5 flex justify-center">
          <img 
            src="/assets/img/404.webp" 
            alt="404 Página no encontrada" 
            class="max-h-[30vh] sm:max-h-[36vh] w-auto object-contain pointer-events-none" />
        </div>

        <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1.5 sm:mb-2">
          404 - Página no encontrada
        </h2>
        
        <p class="text-slate-500 text-xs sm:text-sm mb-5 sm:mb-6 max-w-md leading-relaxed">
          Lo sentimos, la página que buscas no existe, ha sido movida o la ruta especificada es incorrecta.
        </p>

        <!-- Botones de Acción -->
        <div class="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          
          <a 
            *ngIf="authService.isAuthenticated()"
            routerLink="/dashboard"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span>Ir al Dashboard</span>
          </a>

          <a 
            *ngIf="!authService.isAuthenticated()"
            routerLink="/login"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            <span>Iniciar Sesión</span>
          </a>

          <button 
            type="button"
            (click)="goBack()"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span>Regresar</span>
          </button>

        </div>

      </main>

      <!-- Footer -->
      <footer class="text-center text-xs text-slate-400 max-w-6xl w-full mx-auto shrink-0 py-1">
        &copy; {{ currentYear }} Sistema de Inventario Tienda BOX. Todos los derechos reservados.
      </footer>

    </div>
  `
})
export class NotFoundComponent {
  authService = inject(AuthService);
  private location = inject(Location);
  currentYear = new Date().getFullYear();

  goBack(): void {
    this.location.back();
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {
  authService = inject(AuthService);
  sidebarOpen = signal(false);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  logout() {
    this.authService.logout();
  }

  getMenuIcon(ruta: string): string {
    if (ruta.includes('dashboard')) return '📊';
    if (ruta.includes('productos')) return '📦';
    if (ruta.includes('proveedores')) return '🏢';
    if (ruta.includes('inventario')) return '📋';
    if (ruta.includes('reportes')) return '📈';
    return '📁';
  }
}

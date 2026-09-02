import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Si es admin, tiene acceso irrestricto
  if (authService.isAdmin()) {
    return true;
  }

  // Verificar si la ruta actual está en sus rutas asignadas
  if (authService.hasRoutePermission(state.url)) {
    return true;
  }

  notify.warning('No posee permisos para ingresar a este módulo.');
  router.navigate(['/dashboard']);
  return false;
};

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notify = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocurrió un error inesperado al procesar la solicitud.';

      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.mensaje) {
          errorMessage = error.error.mensaje;
          if (error.error.errores && error.error.errores.length > 0) {
            errorMessage += `\n• ${error.error.errores.join('\n• ')}`;
          }
        } else if (error.error.message) {
          errorMessage = error.error.message;
        }
      }

      switch (error.status) {
        case 401:
          notify.error('Su sesión ha expirado o las credenciales no son válidas.', 'No autorizado');
          authService.logout();
          break;

        case 403:
          notify.warning('No tiene los permisos suficientes para realizar esta acción.', 'Acceso denegado');
          break;

        case 404:
          notify.error(errorMessage, 'No encontrado');
          break;

        case 400:
          notify.error(errorMessage, 'Solicitud inválida');
          break;

        case 500:
          notify.error(errorMessage, 'Error interno del servidor');
          break;

        case 0:
          notify.error('No se pudo conectar con el servidor backend. Verifique que la API esté en ejecución.', 'Error de Conexión');
          break;

        default:
          notify.error(errorMessage, `Error (${error.status})`);
          break;
      }

      return throwError(() => error);
    })
  );
};

import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  success(message: string, title: string = '¡Éxito!') {
    this.Toast.fire({
      icon: 'success',
      title: `${title} ${message}`
    });
  }

  error(message: string, title: string = 'Error') {
    this.Toast.fire({
      icon: 'error',
      title: `${title}: ${message}`
    });
  }

  warning(message: string, title: string = 'Advertencia') {
    this.Toast.fire({
      icon: 'warning',
      title: `${title}: ${message}`
    });
  }

  info(message: string, title: string = 'Información') {
    this.Toast.fire({
      icon: 'info',
      title: `${title}: ${message}`
    });
  }

  async confirm(title: string, text: string, confirmButtonText: string = 'Sí, continuar'): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#913065',
      cancelButtonColor: '#64748b',
      confirmButtonText,
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    return result.isConfirmed;
  }
}

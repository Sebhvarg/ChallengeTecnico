import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProveedorService } from '../../core/services/proveedor.service';
import { NotificationService } from '../../core/services/notification.service';
import { Proveedor, CrearProveedorDto, ActualizarProveedorDto } from '../../core/models/proveedor.models';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html'
})
export class ProveedoresComponent implements OnInit {
  authService = inject(AuthService);
  private proveedorService = inject(ProveedorService);
  private notify = inject(NotificationService);

  proveedores = signal<Proveedor[]>([]);
  cargando = signal(false);
  filtro = '';
  paginaActual = 1;
  tamanoPagina = 8;
  totalRegistros = signal(0);
  totalPaginas = signal(1);

  mostrarModalCrear = signal(false);
  mostrarModalEditar = signal(false);
  guardando = signal(false);

  formCrear: CrearProveedorDto = { nombre: '', email: '', celular: '' };
  formEditar: ActualizarProveedorDto & { id: number } = { id: 0, nombre: '', email: '', celular: '', estado: true };

  ngOnInit(): void {
    this.cargarProveedores();
  }

  cargarProveedores(): void {
    this.cargando.set(true);
    this.proveedorService.getProveedores(this.filtro, this.paginaActual, this.tamanoPagina).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.proveedores.set(res.datos.items);
          this.totalRegistros.set(res.datos.totalRegistros);
          this.totalPaginas.set(res.datos.totalPaginas);
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  buscar(): void {
    this.paginaActual = 1;
    this.cargarProveedores();
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) {
      this.paginaActual = p;
      this.cargarProveedores();
    }
  }

  abrirModalCrear(): void {
    this.formCrear = { nombre: '', email: '', celular: '' };
    this.mostrarModalCrear.set(true);
  }

  guardarCrear(): void {
    if (!this.formCrear.nombre || !this.formCrear.email) {
      this.notify.warning('Nombre y correo electrónico son obligatorios.');
      return;
    }

    this.guardando.set(true);
    this.proveedorService.crearProveedor(this.formCrear).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalCrear.set(false);
        this.notify.success('Proveedor registrado exitosamente.');
        this.cargarProveedores();
      },
      error: () => this.guardando.set(false)
    });
  }

  abrirModalEditar(item: Proveedor): void {
    this.formEditar = {
      id: item.id,
      nombre: item.nombre,
      email: item.email,
      celular: item.celular || '',
      estado: item.estado
    };
    this.mostrarModalEditar.set(true);
  }

  guardarEditar(): void {
    if (!this.formEditar.nombre || !this.formEditar.email) {
      this.notify.warning('Nombre y correo electrónico son obligatorios.');
      return;
    }

    this.guardando.set(true);
    this.proveedorService.actualizarProveedor(this.formEditar.id, {
      nombre: this.formEditar.nombre,
      email: this.formEditar.email,
      celular: this.formEditar.celular,
      estado: this.formEditar.estado
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalEditar.set(false);
        this.notify.success('Proveedor actualizado.');
        this.cargarProveedores();
      },
      error: () => this.guardando.set(false)
    });
  }

  async eliminar(item: Proveedor): Promise<void> {
    const ok = await this.notify.confirm(
      '¿Desactivar proveedor?',
      `Se desactivará el proveedor "${item.nombre}" y los lotes asociados.`
    );
    if (ok) {
      this.proveedorService.eliminarProveedor(item.id).subscribe({
        next: () => {
          this.notify.success('Proveedor desactivado.');
          this.cargarProveedores();
        }
      });
    }
  }
}

import { Component, OnInit, ViewChild, TemplateRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProveedorService } from '../../core/services/proveedor.service';
import { NotificationService } from '../../core/services/notification.service';
import { Proveedor, CrearProveedorDto, ActualizarProveedorDto } from '../../core/models/proveedor.models';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TableComponent, TableColumn } from '../../shared/components/table';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TableComponent],
  templateUrl: './proveedores.component.html'
})
export class ProveedoresComponent implements OnInit {
  authService = inject(AuthService);
  private proveedorService = inject(ProveedorService);
  private notify = inject(NotificationService);

  @ViewChild('idTpl', { static: true }) idTpl!: TemplateRef<any>;
  @ViewChild('estadoTpl', { static: true }) estadoTpl!: TemplateRef<any>;
  @ViewChild('accionesTpl', { static: true }) accionesTpl!: TemplateRef<any>;

  columnas: TableColumn<Proveedor>[] = [];
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
    this.configurarColumnas();
    this.cargarProveedores();
  }

  configurarColumnas(): void {
    this.columnas = [
      { key: 'id', header: 'ID', template: this.idTpl, width: '90px' },
      { key: 'nombre', header: 'Nombre de la Empresa', cellClass: 'font-bold text-slate-900' },
      { key: 'email', header: 'Correo Electrónico', cellClass: 'text-slate-600' },
      { key: 'celular', header: 'Celular / Teléfono', cellClass: 'text-slate-600' },
      { key: 'estado', header: 'Estado', align: 'center', template: this.estadoTpl, width: '130px' },
      ...(this.authService.isAdmin() ? [{ key: 'acciones', header: 'Acciones', align: 'center' as const, template: this.accionesTpl, width: '110px' }] : [])
    ];
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

  // Expresiones regulares para validación de Proveedores
  private readonly REGEX_NOMBRE_PROV = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,&'\-_/()]{2,80}$/;
  private readonly REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly REGEX_CELULAR = /^$|^\d{7,10}$/;

  abrirModalCrear(): void {
    this.formCrear = { nombre: '', email: '', celular: '' };
    this.mostrarModalCrear.set(true);
  }

  guardarCrear(): void {
    if (!this.formCrear.nombre || !this.REGEX_NOMBRE_PROV.test(this.formCrear.nombre.trim())) {
      this.notify.warning('El nombre del proveedor debe tener entre 2 y 80 caracteres válidos.');
      return;
    }

    if (!this.formCrear.email || !this.REGEX_EMAIL.test(this.formCrear.email.trim())) {
      this.notify.warning('Ingrese un correo electrónico válido (ej: proveedor@empresa.com).');
      return;
    }

    if (this.formCrear.celular && !this.REGEX_CELULAR.test(this.formCrear.celular.trim())) {
      this.notify.warning('El celular/teléfono debe contener entre 7 y 10 dígitos numéricos.');
      return;
    }

    this.guardando.set(true);
    this.proveedorService.crearProveedor({
      nombre: this.formCrear.nombre.trim(),
      email: this.formCrear.email.trim(),
      celular: this.formCrear.celular?.trim() || ''
    }).subscribe({
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
    if (!this.formEditar.nombre || !this.REGEX_NOMBRE_PROV.test(this.formEditar.nombre.trim())) {
      this.notify.warning('El nombre del proveedor debe tener entre 2 y 80 caracteres válidos.');
      return;
    }

    if (!this.formEditar.email || !this.REGEX_EMAIL.test(this.formEditar.email.trim())) {
      this.notify.warning('Ingrese un correo electrónico válido (ej: proveedor@empresa.com).');
      return;
    }

    if (this.formEditar.celular && !this.REGEX_CELULAR.test(this.formEditar.celular.trim())) {
      this.notify.warning('El celular/teléfono debe contener entre 7 y 10 dígitos numéricos.');
      return;
    }

    this.guardando.set(true);
    this.proveedorService.actualizarProveedor(this.formEditar.id, {
      nombre: this.formEditar.nombre.trim(),
      email: this.formEditar.email.trim(),
      celular: this.formEditar.celular?.trim() || '',
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
          this.notify.success('Proveedor desactivado correctamente.');
          this.cargarProveedores();
        }
      });
    }
  }

  async reactivar(item: Proveedor): Promise<void> {
    const ok = await this.notify.confirm(
      '¿Reactivar proveedor?',
      `Se reactivará el proveedor "${item.nombre}" junto con todos sus productos y lotes asociados.`
    );
    if (ok) {
      this.proveedorService.reactivarProveedor(item.id).subscribe({
        next: () => {
          this.notify.success('Proveedor y productos asociados reactivados exitosamente.');
          this.cargarProveedores();
        }
      });
    }
  }
}

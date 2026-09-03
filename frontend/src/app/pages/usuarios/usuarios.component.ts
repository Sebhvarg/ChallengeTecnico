import { Component, OnInit, ViewChild, TemplateRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Usuario, Rol, CrearUsuarioDto, ActualizarUsuarioDto } from '../../core/models/usuario.models';
import { TableComponent, TableColumn } from '../../shared/components/table';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, ModalComponent],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);

  @ViewChild('idTpl', { static: true }) idTpl!: TemplateRef<any>;
  @ViewChild('nombresTpl', { static: true }) nombresTpl!: TemplateRef<any>;
  @ViewChild('rolTpl', { static: true }) rolTpl!: TemplateRef<any>;
  @ViewChild('estadoTpl', { static: true }) estadoTpl!: TemplateRef<any>;
  @ViewChild('fechaTpl', { static: true }) fechaTpl!: TemplateRef<any>;
  @ViewChild('accionesTpl', { static: true }) accionesTpl!: TemplateRef<any>;

  // Estados reactivos con Signals
  usuarios = signal<Usuario[]>([]);
  roles = signal<Rol[]>([]);
  cargando = signal<boolean>(false);
  guardando = signal<boolean>(false);
  totalRegistros = signal<number>(0);
  totalPaginas = signal<number>(1);

  // Paginación y Filtros
  filtroTexto = '';
  paginaActual = 1;
  tamanoPagina = 8;

  // Modales
  mostrarModalCrear = signal<boolean>(false);
  mostrarModalEditar = signal<boolean>(false);

  // Formularios
  formCrear: CrearUsuarioDto = this.getInitFormCrear();
  formEditar: { id: number; nombres: string; apellidos: string; usuario: string; email: string; password?: string; idRol: number; estado: boolean } = {
    id: 0,
    nombres: '',
    apellidos: '',
    usuario: '',
    email: '',
    password: '',
    idRol: 1,
    estado: true
  };

  // Expresiones regulares para validación de Usuarios
  private readonly REGEX_NOMBRES = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,80}$/;
  private readonly REGEX_USUARIO = /^[a-zA-Z0-9_]{3,10}$/;
  private readonly REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  columnas: TableColumn<Usuario>[] = [];

  ngOnInit(): void {
    this.configurarColumnas();
    this.cargarUsuarios();
    this.cargarRoles();
  }

  configurarColumnas(): void {
    this.columnas = [
      { key: 'id', header: 'ID', template: this.idTpl, width: '80px', align: 'center' },
      { key: 'nombres', header: 'Nombre Completo / Usuario', template: this.nombresTpl },
      { key: 'email', header: 'Correo Electrónico', cellClass: 'text-slate-600' },
      { key: 'rol', header: 'Rol del Sistema', template: this.rolTpl, width: '150px', align: 'center' },
      { key: 'estado', header: 'Estado', template: this.estadoTpl, width: '120px', align: 'center' },
      { key: 'fechaCreacion', header: 'Fecha Registro', template: this.fechaTpl, width: '140px', align: 'center' },
      ...(this.authService.canManageUsers() ? [{ key: 'acciones', header: 'Acciones', align: 'center' as const, template: this.accionesTpl, width: '110px' }] : [])
    ];
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.usuarioService.getUsuarios(this.filtroTexto, this.paginaActual, this.tamanoPagina).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.usuarios.set(res.datos.items);
          this.totalRegistros.set(res.datos.totalRegistros);
          this.totalPaginas.set(res.datos.totalPaginas);
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  cargarRoles(): void {
    this.usuarioService.getRoles().subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.roles.set(res.datos);
        }
      }
    });
  }

  buscar(): void {
    this.paginaActual = 1;
    this.cargarUsuarios();
  }

  limpiarFiltro(): void {
    this.filtroTexto = '';
    this.paginaActual = 1;
    this.cargarUsuarios();
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) {
      this.paginaActual = p;
      this.cargarUsuarios();
    }
  }

  // --- Crear Usuario ---
  abrirModalCrear(): void {
    this.formCrear = this.getInitFormCrear();
    this.mostrarModalCrear.set(true);
  }

  guardarCrear(): void {
    if (!this.formCrear.nombres || !this.REGEX_NOMBRES.test(this.formCrear.nombres.trim())) {
      this.notify.warning('Los nombres deben contener solo letras y tener entre 2 y 80 caracteres.');
      return;
    }

    if (!this.formCrear.apellidos || !this.REGEX_NOMBRES.test(this.formCrear.apellidos.trim())) {
      this.notify.warning('Los apellidos deben contener solo letras y tener entre 2 y 80 caracteres.');
      return;
    }

    if (!this.formCrear.usuario || !this.REGEX_USUARIO.test(this.formCrear.usuario.trim())) {
      this.notify.warning('El usuario debe ser alfanumérico sin espacios (de 3 a 10 caracteres).');
      return;
    }

    if (!this.formCrear.email || !this.REGEX_EMAIL.test(this.formCrear.email.trim())) {
      this.notify.warning('Ingrese un correo electrónico válido (ej: usuario@dominio.com).');
      return;
    }

    if (!this.formCrear.password || this.formCrear.password.length < 6) {
      this.notify.warning('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!this.formCrear.idRol || this.formCrear.idRol <= 0) {
      this.notify.warning('Seleccione un rol para el usuario.');
      return;
    }

    this.guardando.set(true);
    this.usuarioService.crearUsuario({
      nombres: this.formCrear.nombres.trim(),
      apellidos: this.formCrear.apellidos.trim(),
      usuario: this.formCrear.usuario.trim().toLowerCase(),
      email: this.formCrear.email.trim().toLowerCase(),
      password: this.formCrear.password,
      idRol: Number(this.formCrear.idRol)
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalCrear.set(false);
        this.notify.success('Usuario registrado exitosamente.');
        this.cargarUsuarios();
      },
      error: () => this.guardando.set(false)
    });
  }

  // --- Editar Usuario ---
  abrirModalEditar(item: Usuario): void {
    this.formEditar = {
      id: item.id,
      nombres: item.nombres,
      apellidos: item.apellidos,
      usuario: item.usuario,
      email: item.email,
      password: '',
      idRol: item.idRol,
      estado: item.estado
    };
    this.mostrarModalEditar.set(true);
  }

  guardarEditar(): void {
    if (!this.formEditar.nombres || !this.REGEX_NOMBRES.test(this.formEditar.nombres.trim())) {
      this.notify.warning('Los nombres deben contener solo letras y tener entre 2 y 80 caracteres.');
      return;
    }

    if (!this.formEditar.apellidos || !this.REGEX_NOMBRES.test(this.formEditar.apellidos.trim())) {
      this.notify.warning('Los apellidos deben contener solo letras y tener entre 2 y 80 caracteres.');
      return;
    }

    if (!this.formEditar.email || !this.REGEX_EMAIL.test(this.formEditar.email.trim())) {
      this.notify.warning('Ingrese un correo electrónico válido.');
      return;
    }

    if (this.formEditar.password && this.formEditar.password.trim().length > 0 && this.formEditar.password.trim().length < 6) {
      this.notify.warning('La nueva contraseña debe contener al menos 6 caracteres.');
      return;
    }

    this.guardando.set(true);
    this.usuarioService.actualizarUsuario(this.formEditar.id, {
      nombres: this.formEditar.nombres.trim(),
      apellidos: this.formEditar.apellidos.trim(),
      email: this.formEditar.email.trim().toLowerCase(),
      password: this.formEditar.password ? this.formEditar.password.trim() : undefined,
      idRol: Number(this.formEditar.idRol),
      estado: this.formEditar.estado
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalEditar.set(false);
        this.notify.success('Usuario actualizado correctamente.');
        this.cargarUsuarios();
      },
      error: () => this.guardando.set(false)
    });
  }

  // --- Desactivar Usuario ---
  async eliminar(item: Usuario): Promise<void> {
    const ok = await this.notify.confirm(
      '¿Desactivar usuario?',
      `Se desactivará la cuenta del usuario "${item.usuario}" (${item.nombres} ${item.apellidos}). No podrá iniciar sesión hasta que sea reactivado.`
    );

    if (ok) {
      this.usuarioService.eliminarUsuario(item.id).subscribe({
        next: () => {
          this.notify.success('Usuario desactivado correctamente.');
          this.cargarUsuarios();
        }
      });
    }
  }

  // --- Reactivar Usuario ---
  async reactivar(item: Usuario): Promise<void> {
    const ok = await this.notify.confirm(
      '¿Reactivar usuario?',
      `Se reactivará la cuenta del usuario "${item.usuario}" y podrá acceder nuevamente al sistema.`
    );

    if (ok) {
      this.usuarioService.reactivarUsuario(item.id).subscribe({
        next: () => {
          this.notify.success('Usuario reactivado exitosamente.');
          this.cargarUsuarios();
        }
      });
    }
  }

  private getInitFormCrear(): CrearUsuarioDto {
    return {
      nombres: '',
      apellidos: '',
      usuario: '',
      email: '',
      password: '',
      idRol: 2
    };
  }
}

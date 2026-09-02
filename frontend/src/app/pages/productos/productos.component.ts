import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProductoService } from '../../core/services/producto.service';
import { ProveedorService } from '../../core/services/proveedor.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductoListItem, CrearProductoDto, ActualizarProductoDto, CrearLoteDto } from '../../core/models/producto.models';
import { Proveedor } from '../../core/models/proveedor.models';
import { Categoria } from '../../core/models/categoria.models';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html'
})
export class ProductosComponent implements OnInit {
  authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private proveedorService = inject(ProveedorService);
  private categoriaService = inject(CategoriaService);
  private notify = inject(NotificationService);

  // Estados de datos
  productos = signal<ProductoListItem[]>([]);
  proveedores = signal<Proveedor[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal(false);

  // Filtros y paginación
  filtro = '';
  paginaActual = 1;
  tamanoPagina = 8;
  totalRegistros = signal(0);
  totalPaginas = signal(1);

  // Modales
  mostrarModalCrear = signal(false);
  mostrarModalEditar = signal(false);
  mostrarModalLote = signal(false);
  guardando = signal(false);

  // Formularios
  formCrear: CrearProductoDto = this.getInitFormCrear();
  formEditar: ActualizarProductoDto & { id: number; codigo: string } = {
    id: 0,
    codigo: '',
    nombre: '',
    descripcion: '',
    idCategoria: undefined,
    estado: true
  };
  formLote: CrearLoteDto & { productoNombre: string } = {
    idProducto: 0,
    productoNombre: '',
    idProveedor: 0,
    numeroLote: '',
    costoProducto: 0,
    precioProducto: 0,
    stockProducto: 1
  };

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarProductos();
  }

  cargarCatalogos(): void {
    this.proveedorService.getActivos().subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.proveedores.set(res.datos);
          if (res.datos.length > 0) {
            this.formCrear.idProveedor = res.datos[0].id;
          }
        }
      }
    });

    this.categoriaService.getCategorias().subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.categorias.set(res.datos);
        }
      }
    });
  }

  cargarProductos(): void {
    this.cargando.set(true);
    this.productoService.getProductos(this.filtro, this.paginaActual, this.tamanoPagina).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.productos.set(res.datos.items);
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
    this.cargarProductos();
  }

  limpiarFiltro(): void {
    this.filtro = '';
    this.paginaActual = 1;
    this.cargarProductos();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas()) {
      this.paginaActual = nuevaPagina;
      this.cargarProductos();
    }
  }

  // --- Crear Producto ---
  abrirModalCrear(): void {
    this.formCrear = this.getInitFormCrear();
    if (this.proveedores().length > 0) {
      this.formCrear.idProveedor = this.proveedores()[0].id;
    }
    this.mostrarModalCrear.set(true);
  }

  guardarCrear(): void {
    if (!this.formCrear.codigo || !this.formCrear.nombre || !this.formCrear.numeroLote) {
      this.notify.warning('Complete los campos obligatorios (Código, Nombre y Número de Lote).');
      return;
    }

    this.guardando.set(true);
    this.productoService.crearProducto(this.formCrear).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalCrear.set(false);
        this.notify.success('Producto e inventario inicial registrados.');
        this.cargarProductos();
      },
      error: () => this.guardando.set(false)
    });
  }

  // --- Editar Producto ---
  abrirModalEditar(item: ProductoListItem): void {
    this.productoService.getProductoById(item.idProducto).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          const prod = res.datos;
          this.formEditar = {
            id: prod.id,
            codigo: prod.codigo,
            nombre: prod.nombre,
            descripcion: prod.descripcion || '',
            idCategoria: prod.idCategoria,
            estado: prod.estado
          };
          this.mostrarModalEditar.set(true);
        }
      }
    });
  }

  guardarEditar(): void {
    if (!this.formEditar.nombre) {
      this.notify.warning('El nombre del producto es obligatorio.');
      return;
    }

    this.guardando.set(true);
    this.productoService.actualizarProducto(this.formEditar.id, {
      nombre: this.formEditar.nombre,
      descripcion: this.formEditar.descripcion,
      idCategoria: this.formEditar.idCategoria ? Number(this.formEditar.idCategoria) : undefined,
      estado: this.formEditar.estado
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalEditar.set(false);
        this.notify.success('Producto actualizado exitosamente.');
        this.cargarProductos();
      },
      error: () => this.guardando.set(false)
    });
  }

  // --- Agregar Nuevo Lote/Proveedor ---
  abrirModalLote(item: ProductoListItem): void {
    this.formLote = {
      idProducto: item.idProducto,
      productoNombre: item.producto,
      idProveedor: this.proveedores().length > 0 ? this.proveedores()[0].id : 0,
      numeroLote: '',
      costoProducto: item.costoProducto,
      precioProducto: item.precioProducto,
      stockProducto: 1
    };
    this.mostrarModalLote.set(true);
  }

  guardarLote(): void {
    if (!this.formLote.numeroLote || !this.formLote.idProveedor) {
      this.notify.warning('Seleccione el proveedor e ingrese el número de lote.');
      return;
    }

    this.guardando.set(true);
    this.productoService.agregarLote({
      idProducto: this.formLote.idProducto,
      idProveedor: Number(this.formLote.idProveedor),
      numeroLote: this.formLote.numeroLote,
      costoProducto: this.formLote.costoProducto,
      precioProducto: this.formLote.precioProducto,
      stockProducto: this.formLote.stockProducto
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalLote.set(false);
        this.notify.success('Lote y stock agregados al producto.');
        this.cargarProductos();
      },
      error: () => this.guardando.set(false)
    });
  }

  // --- Eliminar Producto ---
  async eliminar(item: ProductoListItem): Promise<void> {
    const confirmado = await this.notify.confirm(
      '¿Desactivar producto?',
      `Se realizará la baja lógica del producto ${item.codigo} - ${item.producto} y sus existencias asociadas.`
    );

    if (confirmado) {
      this.productoService.eliminarProducto(item.idProducto).subscribe({
        next: () => {
          this.notify.success('Producto desactivado correctamente.');
          this.cargarProductos();
        }
      });
    }
  }

  private getInitFormCrear(): CrearProductoDto {
    return {
      codigo: '',
      nombre: '',
      descripcion: '',
      idCategoria: undefined,
      idProveedor: 0,
      numeroLote: '',
      costoProducto: 0,
      precioProducto: 0,
      stockProducto: 1
    };
  }
}

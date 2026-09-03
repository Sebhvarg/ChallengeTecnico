import { Component, OnInit, ViewChild, TemplateRef, inject, signal } from '@angular/core';
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
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TableComponent, TableColumn } from '../../shared/components/table';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TableComponent],
  templateUrl: './productos.component.html'
})
export class ProductosComponent implements OnInit {
  authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private proveedorService = inject(ProveedorService);
  private categoriaService = inject(CategoriaService);
  private notify = inject(NotificationService);

  @ViewChild('codigoTpl', { static: true }) codigoTpl!: TemplateRef<any>;
  @ViewChild('categoriaTpl', { static: true }) categoriaTpl!: TemplateRef<any>;
  @ViewChild('proveedorLoteTpl', { static: true }) proveedorLoteTpl!: TemplateRef<any>;
  @ViewChild('costoTpl', { static: true }) costoTpl!: TemplateRef<any>;
  @ViewChild('precioTpl', { static: true }) precioTpl!: TemplateRef<any>;
  @ViewChild('stockTpl', { static: true }) stockTpl!: TemplateRef<any>;
  @ViewChild('accionesTpl', { static: true }) accionesTpl!: TemplateRef<any>;

  columnas: TableColumn<ProductoListItem>[] = [];

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
    this.configurarColumnas();
    this.cargarCatalogos();
    this.cargarProductos();
  }

  configurarColumnas(): void {
    this.columnas = [
      { key: 'codigo', header: 'Código', template: this.codigoTpl, width: '90px' },
      { key: 'producto', header: 'Producto', cellClass: 'font-semibold text-slate-900' },
      { key: 'categoria', header: 'Categoría', template: this.categoriaTpl, width: '130px' },
      { key: 'proveedor', header: 'Proveedor / Lote', template: this.proveedorLoteTpl },
      { key: 'costoProducto', header: 'Costo', align: 'right', template: this.costoTpl, width: '100px' },
      { key: 'precioProducto', header: 'P. Venta', align: 'right', template: this.precioTpl, width: '100px' },
      { key: 'stockProducto', header: 'Stock', align: 'center', template: this.stockTpl, width: '110px' },
      ...(this.authService.isAdmin() ? [{ key: 'acciones', header: 'Acciones', align: 'center' as const, template: this.accionesTpl, width: '130px' }] : [])
    ];
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

  // Expresiones regulares para validación de campos
  private readonly REGEX_CODIGO = /^[A-Za-z0-9]{1,4}$/;
  private readonly REGEX_NOMBRE = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,\-_#/()]{2,80}$/;
  private readonly REGEX_DESCRIPCION = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,\-_#/()]{0,200}$/;
  private readonly REGEX_LOTE = /^(LOT-\d{4}-\d{2}|[A-Za-z0-9\-_]{3,11})$/;
  private readonly REGEX_PRECIO_COSTO = /^\d+(\.\d{1,2})?$/;
  private readonly REGEX_STOCK = /^[1-9]\d*$/;

  // --- Crear Producto ---
  abrirModalCrear(): void {
    this.formCrear = this.getInitFormCrear();
    if (this.proveedores().length > 0) {
      this.formCrear.idProveedor = this.proveedores()[0].id;
    }
    this.mostrarModalCrear.set(true);
  }

  guardarCrear(): void {
    // 1. Validación de Código con Regex
    if (!this.formCrear.codigo || !this.REGEX_CODIGO.test(this.formCrear.codigo.trim())) {
      this.notify.warning('El código debe ser alfanumérico y tener máximo 4 caracteres (ej: M050, S020, P001).');
      return;
    }

    // 2. Validación de Nombre con Regex
    if (!this.formCrear.nombre || !this.REGEX_NOMBRE.test(this.formCrear.nombre.trim())) {
      this.notify.warning('El nombre del producto debe contener entre 2 y 80 caracteres válidos.');
      return;
    }

    // 3. Validación de Descripción con Regex
    if (this.formCrear.descripcion && !this.REGEX_DESCRIPCION.test(this.formCrear.descripcion.trim())) {
      this.notify.warning('La descripción contiene caracteres no permitidos o excede los 200 caracteres.');
      return;
    }

    // 4. Validación de Proveedor
    if (!this.formCrear.idProveedor || this.formCrear.idProveedor <= 0) {
      this.notify.warning('Debe seleccionar un proveedor válido.');
      return;
    }

    // 5. Validación de Número de Lote con Regex
    if (!this.formCrear.numeroLote || !this.REGEX_LOTE.test(this.formCrear.numeroLote.trim())) {
      this.notify.warning('El número de lote debe tener formato válido (ej: LOT-0001-01 o entre 3 y 11 caracteres alfanuméricos).');
      return;
    }

    // 6. Validación de Costo y Precio con Regex
    if (!this.REGEX_PRECIO_COSTO.test(String(this.formCrear.costoProducto)) || Number(this.formCrear.costoProducto) < 0) {
      this.notify.warning('El costo debe ser un valor numérico positivo con máximo 2 decimales.');
      return;
    }

    if (!this.REGEX_PRECIO_COSTO.test(String(this.formCrear.precioProducto)) || Number(this.formCrear.precioProducto) < 0) {
      this.notify.warning('El precio de venta debe ser un valor numérico positivo con máximo 2 decimales.');
      return;
    }

    // 7. Validación de Stock Inicial con Regex
    if (!this.REGEX_STOCK.test(String(this.formCrear.stockProducto))) {
      this.notify.warning('El stock inicial debe ser un número entero mayor o igual a 1.');
      return;
    }

    this.formCrear.codigo = this.formCrear.codigo.trim().toUpperCase();
    this.formCrear.numeroLote = this.formCrear.numeroLote.trim().toUpperCase();
    this.formCrear.nombre = this.formCrear.nombre.trim();

    this.guardando.set(true);
    this.productoService.crearProducto(this.formCrear).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalCrear.set(false);
        this.notify.success('Producto e inventario inicial registrados exitosamente.');
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
    if (!this.formEditar.nombre || !this.REGEX_NOMBRE.test(this.formEditar.nombre.trim())) {
      this.notify.warning('El nombre del producto debe contener entre 2 y 80 caracteres válidos.');
      return;
    }

    if (this.formEditar.descripcion && !this.REGEX_DESCRIPCION.test(this.formEditar.descripcion.trim())) {
      this.notify.warning('La descripción contiene caracteres no permitidos o excede los 200 caracteres.');
      return;
    }

    this.guardando.set(true);
    this.productoService.actualizarProducto(this.formEditar.id, {
      nombre: this.formEditar.nombre.trim(),
      descripcion: this.formEditar.descripcion?.trim(),
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
    if (!this.formLote.idProveedor || this.formLote.idProveedor <= 0) {
      this.notify.warning('Debe seleccionar un proveedor válido.');
      return;
    }

    if (!this.formLote.numeroLote || !this.REGEX_LOTE.test(this.formLote.numeroLote.trim())) {
      this.notify.warning('El número de lote debe tener formato válido (ej: LOT-0001-01 o entre 3 y 11 caracteres alfanuméricos).');
      return;
    }

    if (!this.REGEX_PRECIO_COSTO.test(String(this.formLote.costoProducto)) || Number(this.formLote.costoProducto) < 0) {
      this.notify.warning('El costo debe ser un valor numérico positivo con máximo 2 decimales.');
      return;
    }

    if (!this.REGEX_PRECIO_COSTO.test(String(this.formLote.precioProducto)) || Number(this.formLote.precioProducto) < 0) {
      this.notify.warning('El precio de venta debe ser un valor numérico positivo con máximo 2 decimales.');
      return;
    }

    if (!this.REGEX_STOCK.test(String(this.formLote.stockProducto))) {
      this.notify.warning('El stock inicial debe ser un número entero mayor o igual a 1.');
      return;
    }

    this.formLote.numeroLote = this.formLote.numeroLote.trim().toUpperCase();

    this.guardando.set(true);
    this.productoService.agregarLote({
      idProducto: this.formLote.idProducto,
      idProveedor: Number(this.formLote.idProveedor),
      numeroLote: this.formLote.numeroLote,
      costoProducto: Number(this.formLote.costoProducto),
      precioProducto: Number(this.formLote.precioProducto),
      stockProducto: Number(this.formLote.stockProducto)
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalLote.set(false);
        this.notify.success('Lote agregado al producto exitosamente.');
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

import { Component, OnInit, ViewChild, TemplateRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { InventarioService } from '../../core/services/inventario.service';
import { NotificationService } from '../../core/services/notification.service';
import { InventarioItem, AjustarStockDto } from '../../core/models/inventario.models';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TableComponent, TableColumn } from '../../shared/components/table';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TableComponent],
  templateUrl: './inventario.component.html'
})
export class InventarioComponent implements OnInit {
  authService = inject(AuthService);
  private inventarioService = inject(InventarioService);
  private notify = inject(NotificationService);

  @ViewChild('loteTpl', { static: true }) loteTpl!: TemplateRef<any>;
  @ViewChild('productoTpl', { static: true }) productoTpl!: TemplateRef<any>;
  @ViewChild('proveedorTpl', { static: true }) proveedorTpl!: TemplateRef<any>;
  @ViewChild('costoTpl', { static: true }) costoTpl!: TemplateRef<any>;
  @ViewChild('precioTpl', { static: true }) precioTpl!: TemplateRef<any>;
  @ViewChild('stockTpl', { static: true }) stockTpl!: TemplateRef<any>;
  @ViewChild('fechaTpl', { static: true }) fechaTpl!: TemplateRef<any>;
  @ViewChild('accionTpl', { static: true }) accionTpl!: TemplateRef<any>;

  columnas: TableColumn<InventarioItem>[] = [];
  inventario = signal<InventarioItem[]>([]);
  cargando = signal(false);
  filtro = '';
  paginaActual = 1;
  tamanoPagina = 8;
  totalRegistros = signal(0);
  totalPaginas = signal(1);

  mostrarModalAjuste = signal(false);
  guardando = signal(false);

  itemSeleccionado: InventarioItem | null = null;
  formAjuste: AjustarStockDto = {
    idLote: 0,
    cantidad: 1,
    tipoAjuste: 'Incrementar',
    nuevoCosto: undefined,
    nuevoPrecio: undefined
  };

  ngOnInit(): void {
    this.configurarColumnas();
    this.cargarInventario();
  }

  configurarColumnas(): void {
    this.columnas = [
      { key: 'numeroLote', header: 'Lote', template: this.loteTpl, width: '130px' },
      { key: 'productoNombre', header: 'Código / Producto', template: this.productoTpl },
      { key: 'proveedorNombre', header: 'Proveedor', template: this.proveedorTpl },
      { key: 'costoProducto', header: 'Costo Unit.', align: 'right', template: this.costoTpl, width: '110px' },
      { key: 'precioProducto', header: 'P. Venta', align: 'right', template: this.precioTpl, width: '110px' },
      { key: 'stockProducto', header: 'Stock Actual', align: 'center', template: this.stockTpl, width: '130px' },
      { key: 'fechaActualizacion', header: 'Última Actualización', template: this.fechaTpl, width: '160px' },
      { key: 'accion', header: 'Acción', align: 'center', template: this.accionTpl, width: '130px' }
    ];
  }

  cargarInventario(): void {
    this.cargando.set(true);
    this.inventarioService.getInventario(this.filtro, this.paginaActual, this.tamanoPagina).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.inventario.set(res.datos.items);
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
    this.cargarInventario();
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) {
      this.paginaActual = p;
      this.cargarInventario();
    }
  }

  abrirModalAjuste(item: InventarioItem): void {
    this.itemSeleccionado = item;
    this.formAjuste = {
      idLote: item.idLote,
      cantidad: item.stockProducto,
      tipoAjuste: 'Fijar',
      nuevoCosto: item.costoProducto,
      nuevoPrecio: item.precioProducto
    };
    this.mostrarModalAjuste.set(true);
  }

  incrementarStock(): void {
    this.formAjuste.cantidad = (Number(this.formAjuste.cantidad) || 0) + 1;
  }

  decrementarStock(): void {
    if ((Number(this.formAjuste.cantidad) || 0) > 0) {
      this.formAjuste.cantidad = (Number(this.formAjuste.cantidad) || 0) - 1;
    }
  }

  incrementarCosto(delta: number = 1): void {
    const actual = Number(this.formAjuste.nuevoCosto) || 0;
    this.formAjuste.nuevoCosto = Math.round((actual + delta) * 100) / 100;
  }

  decrementarCosto(delta: number = 1): void {
    const actual = Number(this.formAjuste.nuevoCosto) || 0;
    if (actual - delta >= 0) {
      this.formAjuste.nuevoCosto = Math.round((actual - delta) * 100) / 100;
    } else {
      this.formAjuste.nuevoCosto = 0;
    }
  }

  incrementarPrecio(delta: number = 1): void {
    const actual = Number(this.formAjuste.nuevoPrecio) || 0;
    this.formAjuste.nuevoPrecio = Math.round((actual + delta) * 100) / 100;
  }

  decrementarPrecio(delta: number = 1): void {
    const actual = Number(this.formAjuste.nuevoPrecio) || 0;
    if (actual - delta >= 0) {
      this.formAjuste.nuevoPrecio = Math.round((actual - delta) * 100) / 100;
    } else {
      this.formAjuste.nuevoPrecio = 0;
    }
  }

  guardarAjuste(): void {
    if (this.formAjuste.cantidad < 0) {
      this.notify.warning('El stock no puede ser negativo.');
      return;
    }

    this.formAjuste.tipoAjuste = 'Fijar';
    this.guardando.set(true);
    this.inventarioService.ajustarStock(this.formAjuste).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalAjuste.set(false);
        this.notify.success('Existencias de inventario actualizadas con éxito.');
        this.cargarInventario();
      },
      error: () => this.guardando.set(false)
    });
  }
}

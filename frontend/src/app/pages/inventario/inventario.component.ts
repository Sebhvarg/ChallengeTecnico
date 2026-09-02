import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { InventarioService } from '../../core/services/inventario.service';
import { NotificationService } from '../../core/services/notification.service';
import { InventarioItem, AjustarStockDto } from '../../core/models/inventario.models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html'
})
export class InventarioComponent implements OnInit {
  authService = inject(AuthService);
  private inventarioService = inject(InventarioService);
  private notify = inject(NotificationService);

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
    this.cargarInventario();
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
      cantidad: 1,
      tipoAjuste: 'Incrementar',
      nuevoCosto: item.costoProducto,
      nuevoPrecio: item.precioProducto
    };
    this.mostrarModalAjuste.set(true);
  }

  guardarAjuste(): void {
    if (this.formAjuste.cantidad < 0) {
      this.notify.warning('La cantidad no puede ser negativa.');
      return;
    }

    this.guardando.set(true);
    this.inventarioService.ajustarStock(this.formAjuste).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalAjuste.set(false);
        this.notify.success('Existencias de inventario actualizadas.');
        this.cargarInventario();
      },
      error: () => this.guardando.set(false)
    });
  }
}

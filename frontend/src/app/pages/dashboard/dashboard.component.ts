import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProductoService } from '../../core/services/producto.service';
import { ProveedorService } from '../../core/services/proveedor.service';
import { InventarioService } from '../../core/services/inventario.service';
import { ProductoListItem } from '../../core/models/producto.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private proveedorService = inject(ProveedorService);
  private inventarioService = inject(InventarioService);

  totalProductos = signal(0);
  totalProveedores = signal(0);
  totalStock = signal(0);
  stockBajo = signal(0);
  cargando = signal(true);
  productosRecientes = signal<ProductoListItem[]>([]);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);

    this.productoService.getProductos('', 1, 5).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.totalProductos.set(res.datos.totalRegistros);
          this.productosRecientes.set(res.datos.items);
        }
      }
    });

    this.proveedorService.getProveedores('', 1, 1).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.totalProveedores.set(res.datos.totalRegistros);
        }
      }
    });

    this.inventarioService.getInventario('', 1, 100).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          const items = res.datos.items;
          const sumStock = items.reduce((acc, curr) => acc + curr.stockProducto, 0);
          const lowStockCount = items.filter(i => i.stockProducto <= 10).length;
          this.totalStock.set(sumStock);
          this.stockBajo.set(lowStockCount);
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }
}

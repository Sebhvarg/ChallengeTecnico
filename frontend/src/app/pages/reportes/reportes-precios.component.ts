import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';
import { ReportePrecioProducto } from '../../core/models/reporte.models';

@Component({
  selector: 'app-reportes-precios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-precios.component.html'
})
export class ReportesPreciosComponent implements OnInit {
  private reporteService = inject(ReporteService);

  reporte = signal<ReportePrecioProducto[]>([]);
  proveedores = signal<string[]>([]);
  cargando = signal(false);
  filtro = '';

  ngOnInit(): void {
    this.cargarReporte();
  }

  cargarReporte(): void {
    this.cargando.set(true);
    this.reporteService.getReportePreciosPorProveedor(this.filtro).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.reporte.set(res.datos);

          // Extraer las columnas de proveedores dinámicamente
          const provSet = new Set<string>();
          res.datos.forEach(item => {
            Object.keys(item.preciosPorProveedor).forEach(prov => provSet.add(prov));
          });
          this.proveedores.set(Array.from(provSet).sort());
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  buscar(): void {
    this.cargarReporte();
  }

  getPrecio(item: ReportePrecioProducto, prov: string): number {
    return item.preciosPorProveedor[prov] || 0;
  }
}

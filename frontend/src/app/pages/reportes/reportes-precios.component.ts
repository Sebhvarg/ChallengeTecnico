import { Component, OnInit, ViewChild, TemplateRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';
import { ReportePrecioProducto } from '../../core/models/reporte.models';
import { TableComponent, TableColumn } from '../../shared/components/table';

@Component({
  selector: 'app-reportes-precios',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent],
  templateUrl: './reportes-precios.component.html'
})
export class ReportesPreciosComponent implements OnInit {
  private reporteService = inject(ReporteService);

  @ViewChild('precioTpl', { static: true }) precioTpl!: TemplateRef<any>;

  columnas: TableColumn<ReportePrecioProducto>[] = [];
  reporte = signal<ReportePrecioProducto[]>([]);
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

          // Extraer nombres únicos de los proveedores
          const provSet = new Set<string>();
          res.datos.forEach(item => {
            Object.keys(item.preciosPorProveedor || {}).forEach(prov => provSet.add(prov));
          });
          const listaProveedores = Array.from(provSet).sort();

          // Configurar columnas dinámicas estandarizadas para app-table
          this.columnas = [
            { key: 'producto', header: 'Producto', cellClass: 'font-bold text-slate-900' },
            ...listaProveedores.map(prov => ({
              key: `preciosPorProveedor.${prov}`,
              header: `Precio ${prov}`,
              align: 'right' as const,
              template: this.precioTpl
            }))
          ];
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  buscar(): void {
    this.cargarReporte();
  }
}

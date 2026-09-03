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
  @ViewChild('totalTpl', { static: true }) totalTpl!: TemplateRef<any>;

  columnas: TableColumn<ReportePrecioProducto>[] = [];
  reporte = signal<ReportePrecioProducto[]>([]);
  listaProveedores = signal<string[]>([]);
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
          // Extraer nombres únicos de los proveedores ordenados y calcular total por cada fila
          const provSet = new Set<string>();
          const datosCalculados = res.datos.map(item => {
            const sumFila = this.calcularTotalProducto(item);
            Object.keys(item.preciosPorProveedor || {}).forEach(prov => provSet.add(prov));
            return {
              ...item,
              total: sumFila
            };
          });

          this.reporte.set(datosCalculados);

          const proveedores = Array.from(provSet).sort();
          this.listaProveedores.set(proveedores);

          // Configurar columnas dinámicas: Producto + Proveedores + Columna Total
          this.columnas = [
            { key: 'producto', header: 'PRODUCTO', cellClass: 'font-bold text-slate-900' },
            ...proveedores.map(prov => ({
              key: `preciosPorProveedor.${prov}`,
              header: `PRECIO ${prov.toUpperCase()}`,
              align: 'right' as const,
              template: this.precioTpl
            })),
            {
              key: 'total',
              header: 'TOTAL PRODUCTO',
              align: 'right' as const,
              template: this.totalTpl,
              width: '160px'
            }
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

  // Calcular la suma de precios de los proveedores para un producto específico
  calcularTotalProducto(item: ReportePrecioProducto): number {
    if (!item.preciosPorProveedor) return 0;
    return Object.values(item.preciosPorProveedor).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }

  // Calcular la suma total de una columna de proveedor
  calcularTotalProveedor(prov: string): number {
    return this.reporte().reduce((acc, item) => {
      return acc + (Number(item.preciosPorProveedor?.[prov]) || 0);
    }, 0);
  }

  // Calcular la sumatoria general de toda la matriz
  calcularGranTotal(): number {
    return this.reporte().reduce((acc, item) => {
      return acc + (Number(item.total) || this.calcularTotalProducto(item));
    }, 0);
  }
}

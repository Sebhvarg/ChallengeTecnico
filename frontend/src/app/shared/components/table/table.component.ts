import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableColumn } from './table.models';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      
      <!-- Contenedor con Scroll Horizontal Responsivo -->
      <div class="overflow-x-auto w-full">
        <table [ngClass]="{ 'table-zebra': zebra, 'w-full text-left text-sm': true }">
          
          <!-- Encabezado de la Tabla -->
          <thead>
            <tr>
              <th 
                *ngFor="let col of columns" 
                [style.width]="col.width || 'auto'"
                [ngClass]="getHeaderAlignmentClass(col.align) + ' ' + (col.headerClass || '')">
                {{ col.header }}
              </th>
            </tr>
          </thead>

          <!-- Cuerpo de la Tabla con Patrón Zebra -->
          <tbody>
            
            <!-- Estado: Cargando -->
            <tr *ngIf="loading">
              <td [attr.colspan]="columns.length" class="py-12 text-center text-slate-500 bg-white">
                <div class="flex flex-col items-center justify-center gap-2">
                  <svg class="animate-spin h-6 w-6 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span class="text-xs font-semibold text-slate-600">Cargando datos...</span>
                </div>
              </td>
            </tr>

            <!-- Estado: Filas de Datos -->
            <ng-container *ngIf="!loading && data && data.length > 0">
              <tr 
                *ngFor="let item of data; let i = index" 
                (click)="onRowClick(item)"
                [class.cursor-pointer]="hasRowClickListeners">
                
                <td 
                  *ngFor="let col of columns" 
                  [ngClass]="getCellAlignmentClass(col.align) + ' ' + getCellCustomClass(col, item)">
                  
                  <!-- Si la columna tiene una plantilla personalizada (TemplateRef) -->
                  <ng-container *ngIf="col.template; else defaultCell">
                    <ng-container *ngTemplateOutlet="col.template; context: { $implicit: item, item: item, value: getCellValue(item, col.key), index: i }"></ng-container>
                  </ng-container>

                  <!-- Renderizado por defecto de texto -->
                  <ng-template #defaultCell>
                    {{ getCellValue(item, col.key) ?? '-' }}
                  </ng-template>

                </td>
              </tr>
            </ng-container>

            <!-- Estado: Vacío / Sin Resultados -->
            <tr *ngIf="!loading && (!data || data.length === 0)">
              <td [attr.colspan]="columns.length" class="py-12 text-center text-slate-400 text-sm bg-white">
                <div class="flex flex-col items-center justify-center gap-2">
                  <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                  </svg>
                  <span>{{ emptyMessage }}</span>
                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      <!-- Barra de Paginación Integrada -->
      <div *ngIf="showPagination" class="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
        <div>
          Total: <strong class="text-slate-800">{{ totalRecords }}</strong> registros | Página {{ currentPage }} de {{ totalPages || 1 }}
        </div>
        <div class="flex items-center gap-2">
          <button 
            type="button"
            (click)="onPageChange(currentPage - 1)" 
            [disabled]="currentPage <= 1 || loading"
            class="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 font-medium transition-colors">
            Anterior
          </button>
          <button 
            type="button"
            (click)="onPageChange(currentPage + 1)" 
            [disabled]="currentPage >= totalPages || loading"
            class="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 font-medium transition-colors">
            Siguiente
          </button>
        </div>
      </div>

    </div>
  `
})
export class TableComponent<T = any> {
  @Input() columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No se encontraron registros disponibles.';
  @Input() zebra = true;
  
  // Paginación
  @Input() showPagination = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalRecords = 0;

  @Output() pageChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<T>();

  get hasRowClickListeners(): boolean {
    return this.rowClick.observed;
  }

  getCellValue(item: any, key: string): any {
    if (!item || !key) return '';
    if (!key.includes('.')) {
      return item[key];
    }
    return key.split('.').reduce((obj, prop) => (obj ? obj[prop] : null), item);
  }

  getHeaderAlignmentClass(align?: 'left' | 'center' | 'right'): string {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  }

  getCellAlignmentClass(align?: 'left' | 'center' | 'right'): string {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  }

  getCellCustomClass(col: TableColumn<T>, item: T): string {
    if (!col.cellClass) return '';
    if (typeof col.cellClass === 'function') {
      return col.cellClass(item);
    }
    return col.cellClass;
  }

  onRowClick(item: T): void {
    if (this.hasRowClickListeners) {
      this.rowClick.emit(item);
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }
}

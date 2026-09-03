import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterField, FilterState } from './filters.models';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
      
      <!-- Barra Principal: Búsqueda Rápida + Toggle de Filtros Avanzados + Botones -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        <!-- Input de Búsqueda Rápida -->
        <div class="relative w-full sm:w-80">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input 
            type="text" 
            [(ngModel)]="state.search" 
            (keyup.enter)="aplicar()"
            [placeholder]="searchPlaceholder"
            class="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-slate-700 placeholder-slate-400" />
        </div>

        <!-- Botones de Acción y Toggle -->
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          
          <!-- Botón Toggle Filtros Avanzados (si existen campos) -->
          <button 
            *ngIf="fields.length > 0"
            type="button"
            (click)="mostrarAvanzados.set(!mostrarAvanzados())"
            [ngClass]="mostrarAvanzados() || totalFiltrosActivos() > 0 ? 'bg-brand-primary-light text-brand-primary border-brand-primary-muted/40' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'"
            class="px-3.5 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            <span>Filtros</span>
            <span *ngIf="totalFiltrosActivos() > 0" class="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-black flex items-center justify-center">
              {{ totalFiltrosActivos() }}
            </span>
          </button>

          <!-- Botón Buscar / Aplicar -->
          <button 
            type="button"
            (click)="aplicar()"
            class="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors">
            Buscar
          </button>

          <!-- Botón Limpiar -->
          <button 
            *ngIf="tieneFiltros()"
            type="button"
            (click)="limpiar()"
            class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors">
            Limpiar
          </button>
        </div>

      </div>

      <!-- Panel Desplegable: Filtros Avanzados -->
      <div 
        *ngIf="mostrarAvanzados() && fields.length > 0"
        class="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        
        <ng-container *ngFor="let f of fields">
          
          <!-- Tipo Select -->
          <div *ngIf="f.type === 'select'" class="space-y-1">
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">{{ f.label }}</label>
            <select 
              [(ngModel)]="state[f.key]" 
              (change)="aplicar()"
              class="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-slate-50 text-slate-700">
              <option *ngFor="let opt of f.options" [ngValue]="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <!-- Tipo Rango Numérico (ej: Precio Mínimo / Máximo) -->
          <div *ngIf="f.type === 'number-range'" class="space-y-1 sm:col-span-2">
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {{ f.label }} <span *ngIf="f.unit" class="text-slate-400">({{ f.unit }})</span>
            </label>
            <div class="flex items-center gap-2">
              <input 
                type="number" 
                [(ngModel)]="state[f.key + 'Min']" 
                (keyup.enter)="aplicar()"
                [placeholder]="f.minPlaceholder || 'Mínimo'"
                class="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-slate-50 text-slate-700" />
              <span class="text-slate-400 text-xs font-bold">-</span>
              <input 
                type="number" 
                [(ngModel)]="state[f.key + 'Max']" 
                (keyup.enter)="aplicar()"
                [placeholder]="f.maxPlaceholder || 'Máximo'"
                class="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-slate-50 text-slate-700" />
            </div>
          </div>

          <!-- Tipo Rango de Fechas (ej: Fecha Inicio / Fin) -->
          <div *ngIf="f.type === 'date-range'" class="space-y-1 sm:col-span-2">
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">{{ f.label }}</label>
            <div class="flex items-center gap-2">
              <input 
                type="date" 
                [(ngModel)]="state[f.key + 'Inicio']" 
                (change)="aplicar()"
                class="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-slate-50 text-slate-700" />
              <span class="text-slate-400 text-xs font-bold">a</span>
              <input 
                type="date" 
                [(ngModel)]="state[f.key + 'Fin']" 
                (change)="aplicar()"
                class="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-slate-50 text-slate-700" />
            </div>
          </div>

        </ng-container>

      </div>

    </div>
  `
})
export class FiltersComponent {
  @Input() searchPlaceholder = 'Buscar registros...';
  @Input() fields: FilterField[] = [];
  @Input() state: FilterState = { search: '' };

  @Output() filtersApply = new EventEmitter<FilterState>();
  @Output() filtersReset = new EventEmitter<void>();

  mostrarAvanzados = signal<boolean>(false);

  totalFiltrosActivos = computed(() => {
    let count = 0;
    for (const key of Object.keys(this.state)) {
      if (key !== 'search') {
        const val = this.state[key];
        if (val !== undefined && val !== null && val !== '' && val !== 'TODOS' && val !== 0) {
          count++;
        }
      }
    }
    return count;
  });

  tieneFiltros(): boolean {
    if (this.state.search && this.state.search.trim() !== '') return true;
    return this.totalFiltrosActivos() > 0;
  }

  aplicar(): void {
    this.filtersApply.emit({ ...this.state });
  }

  limpiar(): void {
    for (const key of Object.keys(this.state)) {
      if (typeof this.state[key] === 'number') {
        this.state[key] = null;
      } else {
        this.state[key] = '';
      }
    }
    this.state.search = '';
    this.filtersReset.emit();
  }
}

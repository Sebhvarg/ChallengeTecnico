import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-app-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      (click)="onBackdropClick($event)">
      
      <div 
        class="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col border border-slate-200/80 overflow-hidden transform transition-all animate-scale-in"
        [ngClass]="sizeClasses"
        (click)="$event.stopPropagation()">
        
        <!-- Header del Modal -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 class="text-lg font-extrabold text-slate-800 tracking-tight">{{ title }}</h3>
            <p *ngIf="subtitle" class="text-xs text-slate-500 mt-0.5">{{ subtitle }}</p>
          </div>
          <button 
            type="button"
            *ngIf="showCloseButton"
            (click)="onClose()" 
            class="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            title="Cerrar modal">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Cuerpo del Modal (Scrolleable) -->
        <div class="p-6 overflow-y-auto flex-1">
          <ng-content></ng-content>
        </div>

        <!-- Footer Opcional del Modal -->
        <div *ngIf="hasFooter" class="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
          <ng-content select="[modal-footer]"></ng-content>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.15s ease-out forwards;
    }
    .animate-scale-in {
      animation: scaleIn 0.18s ease-out forwards;
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'lg';
  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;
  @Input() hasFooter = false;

  @Output() close = new EventEmitter<void>();

  get sizeClasses(): string {
    switch (this.size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      default: return 'max-w-lg';
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop) {
      this.onClose();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.onClose();
    }
  }
}

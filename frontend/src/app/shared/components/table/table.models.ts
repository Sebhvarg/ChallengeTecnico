import { TemplateRef } from '@angular/core';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  cellClass?: string | ((item: T) => string);
  headerClass?: string;
  template?: TemplateRef<{ $implicit: T, item: T, value: any, index: number }>;
}

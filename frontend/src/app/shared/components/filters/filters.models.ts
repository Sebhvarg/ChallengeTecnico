export interface FilterOption {
  label: string;
  value: any;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'number-range' | 'date-range';
  options?: FilterOption[];
  minPlaceholder?: string;
  maxPlaceholder?: string;
  unit?: string;
}

export interface FilterState {
  search?: string;
  [key: string]: any;
}

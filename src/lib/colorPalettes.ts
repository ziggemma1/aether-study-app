export interface ColorPalette {
  primary: string;
  secondary: string;
  tertiary: string;
}

export type SubjectType = 'math' | 'science' | 'history' | 'literature' | 'default';

export const colorPalettes: Record<SubjectType, ColorPalette> = {
  math: { primary: '#6C5CE7', secondary: '#00D2FF', tertiary: '#4A3BB5' },
  science: { primary: '#00D2FF', secondary: '#00E5A0', tertiary: '#0B8E5E' },
  history: { primary: '#F5B042', secondary: '#E67E22', tertiary: '#D35400' },
  literature: { primary: '#9B59B6', secondary: '#E91E63', tertiary: '#8E44AD' },
  default: { primary: '#6C5CE7', secondary: '#141A24', tertiary: '#00D2FF' }
};

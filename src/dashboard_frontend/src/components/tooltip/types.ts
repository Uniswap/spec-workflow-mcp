// TypeScript interfaces and types for the tooltip component

export interface TooltipPosition {
  x: number;
  y: number;
  strategy: 'absolute' | 'fixed';
}

export interface TooltipState {
  isVisible: boolean;
  position: TooltipPosition | null;
  selectedText: string;
  selectionRange: Range | null;
  timestamp: number;
}

export interface SelectionTooltipProps {
  isVisible: boolean;
  position: TooltipPosition;
  selectedText: string;
  onAddComment: () => void;
  onDismiss: () => void;
  className?: string;
}
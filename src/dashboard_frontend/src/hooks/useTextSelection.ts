import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Text selection state interface
 */
export interface TextSelectionState {
  selectedText: string;
  selectionRange: Range | null;
  position: {
    x: number;
    y: number;
  } | null;
  isActive: boolean;
}

/**
 * Hook options interface
 */
export interface UseTextSelectionOptions {
  /** Debounce delay in milliseconds (default: 100) */
  debounceMs?: number;
  /** Minimum text length to trigger selection (default: 1) */
  minLength?: number;
  /** Whether to include position information (default: true) */
  includePosition?: boolean;
  /** Target container element (default: document) */
  container?: Element | Document;
}

/**
 * Custom React hook for detecting text selection with debouncing support
 * 
 * Features:
 * - Detects text selection events across the document or within a container
 * - 100ms debouncing (configurable) to prevent rapid re-renders
 * - Returns selected text, selection range, and position coordinates
 * - Properly cleans up event listeners on unmount with memory leak prevention
 * - Supports both mouse and touch events for mobile compatibility
 * - Handles edge cases like empty selections and cleared selections
 * - TypeScript support with comprehensive type definitions
 * - Performance optimized with useCallback and refs
 * - Includes abort controller for async operations
 * - Prevents state updates after unmount
 * 
 * @param options Configuration options for the hook
 * @returns Object containing selection state and utility functions
 */
export const useTextSelection = (options: UseTextSelectionOptions = {}) => {
  const {
    debounceMs = 100,
    minLength = 1,
    includePosition = true,
    container = document
  } = options;

  // State for tracking text selection
  const [selectionState, setSelectionState] = useState<TextSelectionState>({
    selectedText: '',
    selectionRange: null,
    position: null,
    isActive: false
  });

  // Refs for cleanup and lifecycle management
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<Element | Document>(container);
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const eventListenersRef = useRef<{
    element: Element | Document;
    type: string;
    handler: EventListener;
  }[]>([]);

  // Update container ref when container prop changes
  useEffect(() => {
    containerRef.current = container;
  }, [container]);

  /**
   * Safely update state only if component is still mounted
   */
  const safeSetState = useCallback((newState: TextSelectionState) => {
    if (isMountedRef.current) {
      setSelectionState(newState);
    }
  }, []);

  /**
   * Get the position coordinates for the selection
   */
  const getSelectionPosition = useCallback((range: Range) => {
    if (!includePosition || !isMountedRef.current) return null;

    try {
      const rect = range.getBoundingClientRect();
      
      // Return center-top position of the selection for tooltip positioning
      return {
        x: rect.left + rect.width / 2,
        y: rect.top
      };
    } catch (error) {
      if (isMountedRef.current) {
        console.warn('Failed to get selection position:', error);
      }
      return null;
    }
  }, [includePosition]);

  /**
   * Handle selection change events
   */
  const handleSelectionChange = useCallback(() => {
    // Clear existing debounce timer
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Exit early if component is unmounted
    if (!isMountedRef.current) {
      return;
    }

    // Debounce the selection processing
    debounceTimeoutRef.current = setTimeout(() => {
      // Double-check mounted status before processing
      if (!isMountedRef.current) {
        return;
      }

      const selection = window.getSelection();
      
      if (!selection || selection.rangeCount === 0) {
        // No selection - clear state
        safeSetState({
          selectedText: '',
          selectionRange: null,
          position: null,
          isActive: false
        });
        return;
      }

      const selectedText = selection.toString().trim();
      
      if (selectedText.length < minLength) {
        // Selection too short - clear state but don't mark as active
        safeSetState({
          selectedText: '',
          selectionRange: null,
          position: null,
          isActive: false
        });
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const position = getSelectionPosition(range);

        // Update state with new selection
        safeSetState({
          selectedText,
          selectionRange: range.cloneRange(), // Clone to avoid reference issues
          position,
          isActive: true
        });
      } catch (error) {
        if (isMountedRef.current) {
          console.warn('Failed to process text selection:', error);
        }
        // Clear state on error
        safeSetState({
          selectedText: '',
          selectionRange: null,
          position: null,
          isActive: false
        });
      }
    }, debounceMs);
  }, [debounceMs, minLength, getSelectionPosition, safeSetState]);

  /**
   * Handle mouse up events (for mouse selection)
   */
  const handleMouseUp = useCallback((event: Event) => {
    // Exit early if component is unmounted
    if (!isMountedRef.current) {
      return;
    }

    // Check if the event target is within our container
    if (containerRef.current !== document) {
      const target = event.target as Node;
      if (!containerRef.current.contains(target)) {
        return;
      }
    }
    
    // Clear any existing delay timeout
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    // Small delay to ensure selection is finalized
    delayTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        handleSelectionChange();
      }
    }, 10);
  }, [handleSelectionChange]);

  /**
   * Handle touch end events (for mobile selection)
   */
  const handleTouchEnd = useCallback((event: Event) => {
    // Exit early if component is unmounted
    if (!isMountedRef.current) {
      return;
    }

    // Check if the event target is within our container
    if (containerRef.current !== document) {
      const target = event.target as Node;
      if (!containerRef.current.contains(target)) {
        return;
      }
    }
    
    // Clear any existing delay timeout
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    // Small delay to ensure selection is finalized on mobile
    delayTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        handleSelectionChange();
      }
    }, 50);
  }, [handleSelectionChange]);

  /**
   * Clear the current selection
   */
  const clearSelection = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    
    safeSetState({
      selectedText: '',
      selectionRange: null,
      position: null,
      isActive: false
    });
  }, [safeSetState]);

  /**
   * Check if text is currently selected
   */
  const hasSelection = useCallback(() => {
    return selectionState.isActive && selectionState.selectedText.length >= minLength;
  }, [selectionState.isActive, selectionState.selectedText, minLength]);

  /**
   * Cleanup all resources
   */
  const cleanupResources = useCallback(() => {
    // Clear all timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    // Abort any pending async operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Remove all tracked event listeners
    eventListenersRef.current.forEach(({ element, type, handler }) => {
      try {
        element.removeEventListener(type, handler);
      } catch (error) {
        // Silently fail if element is already removed
      }
    });
    eventListenersRef.current = [];
  }, []);

  // Effect to set up event listeners with comprehensive cleanup
  useEffect(() => {
    // Mark as mounted
    isMountedRef.current = true;

    // Create new abort controller for this effect lifecycle
    abortControllerRef.current = new AbortController();

    const currentContainer = containerRef.current;
    const signal = abortControllerRef.current.signal;

    // Track event listeners for cleanup
    const listeners: typeof eventListenersRef.current = [];

    // Helper to add event listener with tracking
    const addListener = (element: Element | Document, type: string, handler: EventListener) => {
      try {
        // Add event listener with abort signal support for modern browsers
        const options: AddEventListenerOptions = { signal } as AddEventListenerOptions;
        element.addEventListener(type, handler, options);
      } catch {
        // Fallback for browsers that don't support signal option
        element.addEventListener(type, handler);
      }
      
      listeners.push({ element, type, handler });
    };

    // Add event listeners for selection detection
    addListener(document, 'selectionchange', handleSelectionChange);
    addListener(currentContainer, 'mouseup', handleMouseUp);
    addListener(currentContainer, 'touchend', handleTouchEnd);

    // Store listeners for manual cleanup if needed
    eventListenersRef.current = listeners;

    // Cleanup function
    return () => {
      // Mark as unmounted
      isMountedRef.current = false;

      // Perform comprehensive cleanup
      cleanupResources();

      // Remove event listeners (backup cleanup in case abort signal isn't supported)
      try {
        document.removeEventListener('selectionchange', handleSelectionChange);
        currentContainer.removeEventListener('mouseup', handleMouseUp);
        currentContainer.removeEventListener('touchend', handleTouchEnd);
      } catch (error) {
        // Silently fail if elements are already removed
      }
    };
  }, [handleSelectionChange, handleMouseUp, handleTouchEnd, cleanupResources]);

  // Additional cleanup effect for unmount
  useEffect(() => {
    return () => {
      // Final cleanup on unmount
      isMountedRef.current = false;
      cleanupResources();
    };
  }, [cleanupResources]);

  // Return selection state and utility functions
  return {
    ...selectionState,
    clearSelection,
    hasSelection,
    // Utility properties
    isEmpty: !selectionState.isActive || selectionState.selectedText.length === 0,
    length: selectionState.selectedText.length,
  };
};

/* Usage Examples:

// Basic usage - detect selections anywhere in the document
function BasicExample() {
  const selection = useTextSelection();
  
  return (
    <div>
      {selection.isActive && (
        <div>Selected: "{selection.selectedText}"</div>
      )}
    </div>
  );
}

// Advanced usage with custom options
function AdvancedExample() {
  const containerRef = useRef<HTMLDivElement>(null);
  const selection = useTextSelection({
    debounceMs: 150,
    minLength: 3,
    includePosition: true,
    container: containerRef.current || document
  });

  return (
    <div>
      <div ref={containerRef}>
        Select text in this container to trigger the hook.
        The hook will only respond to selections within this div.
      </div>
      
      {selection.hasSelection() && (
        <div style={{
          position: 'fixed',
          left: selection.position?.x,
          top: selection.position?.y,
        }}>
          Tooltip at selection position
        </div>
      )}
      
      <button onClick={selection.clearSelection}>
        Clear Selection
      </button>
    </div>
  );
}

// Integration with existing tooltip system
function TooltipIntegration() {
  const selection = useTextSelection({ debounceMs: 100 });
  
  return (
    <div>
      <div onMouseUp={() => console.log('Mouse up detected')}>
        Select text here to see the tooltip
      </div>
      
      {selection.isActive && selection.position && (
        <SelectionTooltip
          isVisible={selection.isActive}
          position={{
            x: selection.position.x,
            y: selection.position.y,
            strategy: 'fixed' as const
          }}
          selectedText={selection.selectedText}
          onAddComment={() => {
            console.log('Adding comment for:', selection.selectedText);
            selection.clearSelection();
          }}
          onDismiss={selection.clearSelection}
        />
      )}
    </div>
  );
}

// Mobile-friendly usage with touch events
function MobileExample() {
  const selection = useTextSelection({
    debounceMs: 50, // Faster response for touch
    minLength: 1,
  });

  return (
    <div style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
      <p>
        This text can be selected on both desktop and mobile devices.
        The hook handles both mouse and touch events properly.
      </p>
      
      {selection.isActive && (
        <div>
          Selected {selection.length} characters: "{selection.selectedText}"
        </div>
      )}
    </div>
  );
}

*/
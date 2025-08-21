/**
 * Comprehensive tests for useTextSelection hook
 * 
 * Tests all major functionality including debouncing, event handling,
 * memory leak prevention, and AbortController usage.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useTextSelection } from './useTextSelection';

// Mock AbortController for older environments
class MockAbortController {
  signal = { aborted: false };
  abort() {
    this.signal.aborted = true;
  }
}

// Mock DOM elements and events
const mockElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  contains: jest.fn().mockReturnValue(true),
} as any;

const mockDocument = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  contains: jest.fn().mockReturnValue(true),
} as any;

// Mock Selection API
interface MockSelection {
  toString: jest.Mock;
  rangeCount: number;
  getRangeAt: jest.Mock;
  removeAllRanges: jest.Mock;
}

interface MockRange {
  getBoundingClientRect: jest.Mock;
  cloneRange: jest.Mock;
}

const createMockSelection = (text: string = '', rangeCount: number = 1): MockSelection => ({
  toString: jest.fn().mockReturnValue(text),
  rangeCount,
  getRangeAt: jest.fn().mockReturnValue(createMockRange()),
  removeAllRanges: jest.fn()
});

const createMockRange = (bounds = { left: 100, top: 50, width: 80, height: 20 }): MockRange => ({
  getBoundingClientRect: jest.fn().mockReturnValue(bounds),
  cloneRange: jest.fn().mockReturnValue({
    getBoundingClientRect: jest.fn().mockReturnValue(bounds)
  })
});

// Mock event
const createMockEvent = (target: any = mockElement) => ({
  target,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn()
});

describe('useTextSelection', () => {
  let mockSelection: MockSelection;
  let originalGetSelection: any;
  let originalAbortController: any;
  let originalDocument: any;

  beforeEach(() => {
    // Enable fake timers for debouncing tests
    jest.useFakeTimers();

    // Store originals
    originalGetSelection = global.window?.getSelection;
    originalAbortController = global.AbortController;
    originalDocument = global.document;

    // Setup mocks
    mockSelection = createMockSelection();
    (global as any).window = {
      ...global.window,
      getSelection: jest.fn().mockReturnValue(mockSelection)
    };
    (global as any).AbortController = MockAbortController;
    (global as any).document = mockDocument;

    // Reset all mocks
    jest.clearAllMocks();
    mockDocument.addEventListener.mockClear();
    mockDocument.removeEventListener.mockClear();
    mockElement.addEventListener.mockClear();
    mockElement.removeEventListener.mockClear();
  });

  afterEach(() => {
    // Restore timers and mocks
    jest.useRealTimers();
    jest.clearAllTimers();
    
    // Restore originals
    if (originalGetSelection) {
      (global as any).window.getSelection = originalGetSelection;
    }
    if (originalAbortController) {
      (global as any).AbortController = originalAbortController;
    }
    if (originalDocument) {
      (global as any).document = originalDocument;
    }
  });

  describe('Initial State', () => {
    it('should return initial empty state', () => {
      (window.getSelection as jest.Mock).mockReturnValue(null);
      
      const { result } = renderHook(() => useTextSelection());
      
      expect(result.current.selectedText).toBe('');
      expect(result.current.selectionRange).toBeNull();
      expect(result.current.position).toBeNull();
      expect(result.current.isActive).toBe(false);
      expect(result.current.isEmpty).toBe(true);
      expect(result.current.length).toBe(0);
    });

    it('should provide utility functions', () => {
      const { result } = renderHook(() => useTextSelection());
      
      expect(typeof result.current.clearSelection).toBe('function');
      expect(typeof result.current.hasSelection).toBe('function');
    });

    it('should respect custom options', () => {
      const options = {
        debounceMs: 200,
        minLength: 5,
        includePosition: false
      };

      const { result } = renderHook(() => useTextSelection(options));
      
      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Selection Detection Logic', () => {
    it('should detect text selection after debounce delay', () => {
      const selectedText = 'test selection';
      mockSelection.toString.mockReturnValue(selectedText);
      mockSelection.rangeCount = 1;

      const { result } = renderHook(() => useTextSelection({ debounceMs: 100 }));

      // Trigger selectionchange event
      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];
      
      expect(selectionChangeHandler).toBeDefined();

      act(() => {
        selectionChangeHandler();
      });

      // Before debounce - should still be empty
      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);

      // After debounce - should update
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.selectedText).toBe(selectedText);
      expect(result.current.isActive).toBe(true);
      expect(result.current.isEmpty).toBe(false);
      expect(result.current.length).toBe(selectedText.length);
    });

    it('should handle empty selection', () => {
      mockSelection.toString.mockReturnValue('');
      mockSelection.rangeCount = 0;

      const { result } = renderHook(() => useTextSelection());

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);
      expect(result.current.isEmpty).toBe(true);
    });

    it('should respect minimum length requirement', () => {
      const shortText = 'hi';
      mockSelection.toString.mockReturnValue(shortText);
      mockSelection.rangeCount = 1;

      const { result } = renderHook(() => useTextSelection({ minLength: 5 }));

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);
    });

    it('should handle selection range errors gracefully', () => {
      mockSelection.toString.mockReturnValue('test text');
      mockSelection.rangeCount = 1;
      mockSelection.getRangeAt.mockImplementation(() => {
        throw new Error('Range error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { result } = renderHook(() => useTextSelection());

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to process text selection:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Debouncing Behavior', () => {
    it('should debounce rapid selection changes', () => {
      const texts = ['first', 'second', 'final'];
      let callCount = 0;
      
      mockSelection.toString.mockImplementation(() => texts[callCount++] || '');
      mockSelection.rangeCount = 1;

      const { result } = renderHook(() => useTextSelection({ debounceMs: 150 }));

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      // Rapid fire multiple selections
      act(() => {
        selectionChangeHandler(); // first
        jest.advanceTimersByTime(50);
        selectionChangeHandler(); // second  
        jest.advanceTimersByTime(50);
        selectionChangeHandler(); // final
      });

      // Should still be empty before debounce completes
      expect(result.current.selectedText).toBe('');

      // Complete the debounce
      act(() => {
        jest.advanceTimersByTime(150);
      });

      // Should only process the final selection
      expect(result.current.selectedText).toBe('final');
      expect(result.current.isActive).toBe(true);
    });

    it('should use custom debounce timing', () => {
      mockSelection.toString.mockReturnValue('test');
      mockSelection.rangeCount = 1;

      const { result } = renderHook(() => useTextSelection({ debounceMs: 300 }));

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
      });

      // Should not update before custom debounce time
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.selectedText).toBe('');

      // Should update after custom debounce time
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current.selectedText).toBe('test');
    });
  });

  describe('Position Calculation', () => {
    it('should calculate position correctly', () => {
      const mockBounds = { left: 150, top: 75, width: 100, height: 25 };
      mockSelection.toString.mockReturnValue('positioned text');
      mockSelection.rangeCount = 1;
      mockSelection.getRangeAt.mockReturnValue(createMockRange(mockBounds));

      const { result } = renderHook(() => useTextSelection({ includePosition: true }));

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      expect(result.current.position).toEqual({
        x: mockBounds.left + mockBounds.width / 2, // center-x
        y: mockBounds.top // top-y
      });
    });

    it('should skip position calculation when disabled', () => {
      mockSelection.toString.mockReturnValue('no position text');
      mockSelection.rangeCount = 1;

      const { result } = renderHook(() => useTextSelection({ includePosition: false }));

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      expect(result.current.position).toBeNull();
      expect(result.current.selectedText).toBe('no position text');
    });

    it('should handle position calculation errors', () => {
      mockSelection.toString.mockReturnValue('error text');
      mockSelection.rangeCount = 1;
      const mockRange = createMockRange();
      mockRange.getBoundingClientRect.mockImplementation(() => {
        throw new Error('Position error');
      });
      mockSelection.getRangeAt.mockReturnValue(mockRange);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { result } = renderHook(() => useTextSelection());

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      expect(result.current.position).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get selection position:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Touch Event Handling', () => {
    it('should handle touchend events', () => {
      mockSelection.toString.mockReturnValue('touch text');
      mockSelection.rangeCount = 1;

      const { result } = renderHook(() => useTextSelection());

      const touchEndHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];

      expect(touchEndHandler).toBeDefined();

      act(() => {
        touchEndHandler(createMockEvent());
        jest.advanceTimersByTime(50); // Touch delay
        jest.advanceTimersByTime(100); // Debounce
      });

      expect(result.current.selectedText).toBe('touch text');
      expect(result.current.isActive).toBe(true);
    });

    it('should respect container boundaries on touch events', () => {
      const containerElement = { ...mockElement };
      containerElement.contains.mockReturnValue(false);
      
      mockSelection.toString.mockReturnValue('outside text');
      mockSelection.rangeCount = 1;

      const { result } = renderHook(() => useTextSelection({ 
        container: containerElement 
      }));

      const touchEndHandler = containerElement.addEventListener.mock.calls
        .find(call => call[0] === 'touchend')?.[1];

      act(() => {
        touchEndHandler(createMockEvent());
        jest.advanceTimersByTime(50);
        jest.advanceTimersByTime(100);
      });

      // Should not process selection outside container
      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Mouse Event Handling', () => {
    it('should handle mouseup events', () => {
      mockSelection.toString.mockReturnValue('mouse text');
      mockSelection.rangeCount = 1;

      const { result } = renderHook(() => useTextSelection());

      const mouseUpHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'mouseup')?.[1];

      expect(mouseUpHandler).toBeDefined();

      act(() => {
        mouseUpHandler(createMockEvent());
        jest.advanceTimersByTime(10); // Mouse delay
        jest.advanceTimersByTime(100); // Debounce
      });

      expect(result.current.selectedText).toBe('mouse text');
      expect(result.current.isActive).toBe(true);
    });

    it('should respect container boundaries on mouse events', () => {
      const containerElement = { ...mockElement };
      containerElement.contains.mockReturnValue(false);
      
      mockSelection.toString.mockReturnValue('outside text');
      mockSelection.rangeCount = 1;

      const { result } = renderHook(() => useTextSelection({ 
        container: containerElement 
      }));

      const mouseUpHandler = containerElement.addEventListener.mock.calls
        .find(call => call[0] === 'mouseup')?.[1];

      act(() => {
        mouseUpHandler(createMockEvent());
        jest.advanceTimersByTime(10);
        jest.advanceTimersByTime(100);
      });

      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Container-Scoped Selections', () => {
    it('should work with custom container', () => {
      const containerElement = { ...mockElement };
      containerElement.contains.mockReturnValue(true);

      const { result } = renderHook(() => useTextSelection({ 
        container: containerElement 
      }));

      // Should add listeners to custom container
      expect(containerElement.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function), expect.any(Object));
      expect(containerElement.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), expect.any(Object));
    });

    it('should update container when prop changes', () => {
      const container1 = { ...mockElement };
      const container2 = { ...mockElement };

      const { result, rerender } = renderHook(
        ({ container }) => useTextSelection({ container }),
        { initialProps: { container: container1 } }
      );

      // Should initially use container1
      expect(container1.addEventListener).toHaveBeenCalled();

      // Change container
      act(() => {
        rerender({ container: container2 });
      });

      // Should cleanup old listeners and add new ones
      expect(container1.removeEventListener).toHaveBeenCalled();
      expect(container2.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useTextSelection());

      // Verify listeners were added
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('selectionchange', expect.any(Function), expect.any(Object));
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function), expect.any(Object));
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), expect.any(Object));

      act(() => {
        unmount();
      });

      // Verify listeners were removed
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith('selectionchange', expect.any(Function));
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
    });

    it('should handle cleanup errors gracefully', () => {
      mockDocument.removeEventListener.mockImplementation(() => {
        throw new Error('Cleanup error');
      });

      const { unmount } = renderHook(() => useTextSelection());

      // Should not throw on unmount even if cleanup fails
      expect(() => {
        act(() => {
          unmount();
        });
      }).not.toThrow();
    });
  });

  describe('AbortController Functionality', () => {
    it('should create and use AbortController', () => {
      const { result } = renderHook(() => useTextSelection());

      // AbortController should be created during effect setup
      expect(MockAbortController).toHaveBeenCalled();
    });

    it('should abort controller on cleanup', () => {
      const abortSpy = jest.fn();
      (MockAbortController as any).prototype.abort = abortSpy;

      const { unmount } = renderHook(() => useTextSelection());

      act(() => {
        unmount();
      });

      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('State Updates Prevention After Unmount', () => {
    it('should not update state after unmount', () => {
      mockSelection.toString.mockReturnValue('test after unmount');
      mockSelection.rangeCount = 1;

      const { result, unmount } = renderHook(() => useTextSelection());

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      // Unmount the component
      act(() => {
        unmount();
      });

      // Try to trigger selection change after unmount
      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      // State should remain empty (not crash)
      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);
    });

    it('should clear timeouts on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { result, unmount } = renderHook(() => useTextSelection());

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      // Start a debounced operation
      act(() => {
        selectionChangeHandler();
      });

      // Unmount before debounce completes
      act(() => {
        unmount();
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Utility Functions', () => {
    it('should clear selection correctly', () => {
      const removeAllRangesSpy = jest.fn();
      (window.getSelection as jest.Mock).mockReturnValue({
        removeAllRanges: removeAllRangesSpy
      });

      const { result } = renderHook(() => useTextSelection());

      act(() => {
        result.current.clearSelection();
      });

      expect(removeAllRangesSpy).toHaveBeenCalled();
      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);
      expect(result.current.isEmpty).toBe(true);
    });

    it('should return correct hasSelection value', () => {
      const { result } = renderHook(() => useTextSelection({ minLength: 3 }));

      // Initially should not have selection
      expect(result.current.hasSelection()).toBe(false);

      // Simulate having selection
      mockSelection.toString.mockReturnValue('long text');
      mockSelection.rangeCount = 1;

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      expect(result.current.hasSelection()).toBe(true);
    });

    it('should return correct isEmpty and length values', () => {
      const { result } = renderHook(() => useTextSelection());

      expect(result.current.isEmpty).toBe(true);
      expect(result.current.length).toBe(0);

      // Simulate selection
      mockSelection.toString.mockReturnValue('test text');
      mockSelection.rangeCount = 1;

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      expect(result.current.isEmpty).toBe(false);
      expect(result.current.length).toBe(9);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null selection gracefully', () => {
      (window.getSelection as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useTextSelection());

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);
    });

    it('should handle whitespace-only selection', () => {
      mockSelection.toString.mockReturnValue('   ');
      mockSelection.rangeCount = 1;

      const { result } = renderHook(() => useTextSelection());

      const selectionChangeHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'selectionchange')?.[1];

      act(() => {
        selectionChangeHandler();
        jest.advanceTimersByTime(100);
      });

      // Should trim whitespace and treat as empty
      expect(result.current.selectedText).toBe('');
      expect(result.current.isActive).toBe(false);
    });

    it('should not crash on clearSelection when no selection exists', () => {
      (window.getSelection as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useTextSelection());

      expect(() => {
        act(() => {
          result.current.clearSelection();
        });
      }).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should accept valid options without errors', () => {
      // These should compile and render without TypeScript errors
      const validOptions = [
        {},
        { debounceMs: 100 },
        { minLength: 1 },
        { includePosition: true },
        { container: mockElement },
        {
          debounceMs: 150,
          minLength: 3,
          includePosition: false,
          container: mockDocument
        }
      ];

      validOptions.forEach(options => {
        expect(() => {
          renderHook(() => useTextSelection(options));
        }).not.toThrow();
      });
    });
  });
});
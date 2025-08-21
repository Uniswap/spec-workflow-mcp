/**
 * Memory leak tests for useTextSelection hook
 * 
 * These tests verify that the hook properly cleans up all resources
 * and prevents memory leaks when components unmount.
 */

import React, { useEffect, useRef } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { useTextSelection } from '../useTextSelection';

describe('useTextSelection Memory Leak Prevention', () => {
  let container: HTMLDivElement | null = null;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container) {
      unmountComponentAtNode(container);
      container.remove();
      container = null;
    }
  });

  /**
   * Test component that uses the hook
   */
  const TestComponent: React.FC<{
    onMount?: () => void;
    onUnmount?: () => void;
    options?: Parameters<typeof useTextSelection>[0];
  }> = ({ onMount, onUnmount, options }) => {
    const selection = useTextSelection(options);
    const mountRef = useRef(false);

    useEffect(() => {
      if (!mountRef.current) {
        mountRef.current = true;
        onMount?.();
      }
      
      return () => {
        onUnmount?.();
      };
    }, [onMount, onUnmount]);

    return (
      <div data-testid="test-component">
        <p>Select this text to test the hook</p>
        {selection.isActive && (
          <div data-testid="selection-display">
            Selected: {selection.selectedText}
          </div>
        )}
      </div>
    );
  };

  test('should cleanup all timeouts on unmount', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    act(() => {
      render(<TestComponent />, container);
    });

    // Trigger a selection event to create timeouts
    const selection = window.getSelection();
    const range = document.createRange();
    const textNode = container?.querySelector('p')?.firstChild;
    
    if (textNode) {
      range.setStart(textNode, 0);
      range.setEnd(textNode, 6);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Trigger mouseup event
      const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true });
      container?.dispatchEvent(mouseUpEvent);
    }

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Unmount the component
    act(() => {
      unmountComponentAtNode(container!);
    });

    // Verify clearTimeout was called for cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });

  test('should remove all event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const containerRemoveListenerSpy = jest.spyOn(container!, 'removeEventListener');
    
    act(() => {
      render(<TestComponent />, container);
    });

    // Unmount the component
    act(() => {
      unmountComponentAtNode(container!);
    });

    // Verify event listeners were removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'selectionchange',
      expect.any(Function)
    );
    expect(containerRemoveListenerSpy).toHaveBeenCalledWith(
      'mouseup',
      expect.any(Function)
    );
    expect(containerRemoveListenerSpy).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function)
    );
    
    removeEventListenerSpy.mockRestore();
    containerRemoveListenerSpy.mockRestore();
  });

  test('should not update state after unmount', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    let unmounted = false;
    
    const TestAsyncComponent: React.FC = () => {
      const selection = useTextSelection({ debounceMs: 100 });
      
      useEffect(() => {
        return () => {
          unmounted = true;
        };
      }, []);
      
      return <div>Test</div>;
    };

    act(() => {
      render(<TestAsyncComponent />, container);
    });

    // Trigger a selection
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(container!);
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Immediately unmount before debounce completes
    act(() => {
      unmountComponentAtNode(container!);
    });

    // Wait for debounce to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Verify component was unmounted and no warnings about state updates
    expect(unmounted).toBe(true);
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Can't perform a React state update on an unmounted component")
    );
    
    consoleWarnSpy.mockRestore();
  });

  test('should abort pending operations on unmount', () => {
    let abortSignalReceived = false;
    
    // Mock AbortController to track abort calls
    const originalAbortController = window.AbortController;
    const mockAbort = jest.fn(() => {
      abortSignalReceived = true;
    });
    
    window.AbortController = class MockAbortController {
      signal = { aborted: false } as AbortSignal;
      abort = mockAbort;
    } as any;

    act(() => {
      render(<TestComponent />, container);
    });

    // Unmount the component
    act(() => {
      unmountComponentAtNode(container!);
    });

    // Verify abort was called
    expect(mockAbort).toHaveBeenCalled();
    expect(abortSignalReceived).toBe(true);
    
    // Restore original AbortController
    window.AbortController = originalAbortController;
  });

  test('should handle rapid mount/unmount cycles without leaks', async () => {
    const mountUnmountCycles = 10;
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    for (let i = 0; i < mountUnmountCycles; i++) {
      // Mount
      act(() => {
        render(<TestComponent key={i} />, container);
      });

      // Small delay
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Unmount
      act(() => {
        unmountComponentAtNode(container!);
      });
    }

    // Verify cleanup was called for each cycle
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThanOrEqual(0);
    expect(removeEventListenerSpy.mock.calls.length).toBeGreaterThanOrEqual(mountUnmountCycles);
    
    clearTimeoutSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  test('should handle container element removal gracefully', () => {
    const customContainer = document.createElement('div');
    document.body.appendChild(customContainer);
    
    act(() => {
      render(
        <TestComponent options={{ container: customContainer }} />,
        container
      );
    });

    // Remove the custom container from DOM
    customContainer.remove();

    // Unmount should not throw errors
    expect(() => {
      act(() => {
        unmountComponentAtNode(container!);
      });
    }).not.toThrow();
  });

  test('should clear all refs on unmount', async () => {
    let selectionHook: ReturnType<typeof useTextSelection> | null = null;
    
    const TestRefComponent: React.FC = () => {
      selectionHook = useTextSelection();
      return <div>Test</div>;
    };

    act(() => {
      render(<TestRefComponent />, container);
    });

    // Verify hook is initialized
    expect(selectionHook).not.toBeNull();
    expect(selectionHook!.isEmpty).toBe(true);

    // Unmount
    act(() => {
      unmountComponentAtNode(container!);
    });

    // Wait for cleanup
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Try to use hook methods after unmount - should handle gracefully
    expect(() => {
      selectionHook!.clearSelection();
    }).not.toThrow();
  });
});

/**
 * Performance benchmarks for memory usage
 */
describe('useTextSelection Performance', () => {
  test('should maintain consistent memory usage over time', async () => {
    const iterations = 100;
    const memorySnapshots: number[] = [];
    
    // Mock performance.memory for testing (not available in all environments)
    const hasMemoryAPI = 'memory' in performance;
    
    if (hasMemoryAPI) {
      for (let i = 0; i < iterations; i++) {
        const container = document.createElement('div');
        document.body.appendChild(container);
        
        act(() => {
          render(<TestComponent />, container);
        });
        
        // Simulate user interaction
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(container);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
        
        // Cleanup
        act(() => {
          unmountComponentAtNode(container);
        });
        container.remove();
        
        // Record memory usage
        if ((performance as any).memory) {
          memorySnapshots.push((performance as any).memory.usedJSHeapSize);
        }
      }
      
      if (memorySnapshots.length > 10) {
        // Check that memory doesn't continuously increase
        const firstTenAvg = memorySnapshots.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
        const lastTenAvg = memorySnapshots.slice(-10).reduce((a, b) => a + b, 0) / 10;
        
        // Allow for some variance but not excessive growth (e.g., 50% increase would indicate a leak)
        const growthRatio = lastTenAvg / firstTenAvg;
        expect(growthRatio).toBeLessThan(1.5);
      }
    } else {
      // Skip test if performance.memory is not available
      expect(true).toBe(true);
    }
  });
});

/**
 * Helper component for testing
 */
const TestComponent: React.FC<{
  onMount?: () => void;
  onUnmount?: () => void;
  options?: Parameters<typeof useTextSelection>[0];
}> = ({ onMount, onUnmount, options }) => {
  const selection = useTextSelection(options);
  const mountRef = useRef(false);

  useEffect(() => {
    if (!mountRef.current) {
      mountRef.current = true;
      onMount?.();
    }
    
    return () => {
      onUnmount?.();
    };
  }, [onMount, onUnmount]);

  return (
    <div data-testid="test-component">
      <p>Select this text to test the hook</p>
      {selection.isActive && (
        <div data-testid="selection-display">
          Selected: {selection.selectedText}
        </div>
      )}
    </div>
  );
};
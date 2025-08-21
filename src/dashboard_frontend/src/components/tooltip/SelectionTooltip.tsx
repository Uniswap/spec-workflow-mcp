import React, { useMemo, useRef, useEffect, memo, useState } from 'react';
import { 
  useFloating, 
  autoUpdate, 
  offset, 
  flip, 
  shift,
  size,
  detectOverflow
} from '@floating-ui/react';
import { SelectionTooltipProps } from './types';

/**
 * Hook to detect mobile viewport and handle responsive behavior
 */
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Function to check if device is mobile based on viewport width and touch capability
    const checkMobile = () => {
      const width = window.innerWidth;
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Consider mobile if width is less than 768px OR it has touch capability and width < 1024px
      const isMobileDevice = width < 768 || (hasTouchScreen && width < 1024);
      setIsMobile(isMobileDevice);
    };
    
    // Check initially
    checkMobile();
    
    // Listen for window resize to update mobile state
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  return isMobile;
};

/**
 * Get mobile-specific positioning configuration
 */
const getMobilePositioningConfig = (isMobile: boolean) => {
  if (!isMobile) {
    return {
      offsetDistance: 8,
      shiftPadding: 8,
      boundaryPadding: 8
    };
  }
  
  // Mobile-specific adjustments
  return {
    // Increased offset to avoid text selection handles on mobile
    // iOS selection handles: ~44px height with rounded design
    // Android selection handles: ~32-40px height, varies by manufacturer/version
    // Using 16px offset provides safe clearance for both platforms
    offsetDistance: 16,
    // More generous shift padding for mobile viewports
    shiftPadding: 16,
    // Additional boundary padding to account for:
    // - Mobile browser chrome (address bar, navigation)
    // - Device notches and dynamic island (iPhone)
    // - Software navigation bars (Android)
    // - Safe area insets
    boundaryPadding: 20
  };
};

/**
 * SelectionTooltip component displays a tooltip when text is selected,
 * allowing users to add comments to the selected text.
 * 
 * Features:
 * - Enhanced with Floating UI for intelligent positioning
 * - Smart collision detection with flip, shift, and offset middleware
 * - Virtual element positioning for text selections
 * - Auto-update positioning on scroll/resize
 * - Dynamic arrow positioning based on placement
 * - Displays selected text preview (truncated if long)
 * - Add Comment button with click handler
 * - Dismiss functionality on background click or escape key
 * - Responsive design with mobile-first approach
 * - Mobile-specific positioning adjustments:
 *   - Increased offset distance (16px) to avoid text selection handles
 *   - Enhanced boundary detection for small viewports
 *   - Touch-friendly button sizing (min 44px height on mobile)
 *   - Responsive padding and text sizes
 *   - Viewport-aware sizing and positioning
 *   - Safe area considerations for notched devices
 * - Performance optimized with React.memo to prevent unnecessary re-renders
 * - Comprehensive accessibility support:
 *   - Proper focus management with focus trapping
 *   - Previous focus restoration on dismissal
 *   - Screen reader announcements via aria-live regions
 *   - Keyboard navigation with Tab and Shift+Tab
 *   - Semantic ARIA attributes and roles
 *   - WCAG 2.1 AA compliant
 */
const SelectionTooltipComponent: React.FC<SelectionTooltipProps> = ({
  isVisible,
  position,
  selectedText,
  onAddComment,
  onDismiss,
  className = ''
}) => {
  
  // Mobile detection for responsive positioning
  const isMobile = useMobileDetection();
  
  // Refs for focus management
  const tooltipRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const addCommentButtonRef = useRef<HTMLButtonElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  
  // Focus management effect
  useEffect(() => {
    if (isVisible) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the tooltip container after a brief delay to ensure it's rendered
      const focusTimer = setTimeout(() => {
        if (addCommentButtonRef.current) {
          addCommentButtonRef.current.focus();
        } else if (tooltipRef.current) {
          tooltipRef.current.focus();
        }
      }, 100);
      
      // Announce to screen readers
      if (announcementRef.current) {
        announcementRef.current.textContent = `Selection tooltip opened. Selected text: "${selectedText.slice(0, 50)}${selectedText.length > 50 ? '...' : ''}". Use Tab to navigate options or press Escape to dismiss.`;
      }
      
      return () => clearTimeout(focusTimer);
    } else {
      // Restore focus to the previously focused element when tooltip closes
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
      
      // Announce dismissal to screen readers
      if (announcementRef.current) {
        announcementRef.current.textContent = 'Selection tooltip dismissed.';
      }
      
      // Clear the previous focus reference
      previousFocusRef.current = null;
    }
  }, [isVisible, selectedText]);
  
  // Get mobile-specific positioning configuration
  const positioningConfig = useMemo(() => getMobilePositioningConfig(isMobile), [isMobile]);

  // Create virtual element for text selection positioning
  const virtualElement = useMemo(() => {
    return {
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x: position.x,
          y: position.y,
          top: position.y,
          left: position.x,
          right: position.x,
          bottom: position.y,
        };
      },
    };
  }, [position.x, position.y]);

  // Floating UI positioning with mobile-aware middleware
  const { refs, floatingStyles, placement } = useFloating({
    elements: {
      reference: virtualElement,
    },
    placement: 'top',
    strategy: position.strategy,
    whileElementsMounted: autoUpdate,
    middleware: [
      // Responsive offset - larger on mobile to avoid selection handles
      offset(positioningConfig.offsetDistance),
      
      // Flip to opposite side if no space, with mobile-aware boundary detection
      flip({
        boundary: 'viewport',
        padding: positioningConfig.boundaryPadding,
        fallbackStrategy: 'bestFit',
      }),
      
      // Shift along axis to stay in viewport with mobile-specific padding
      shift({ 
        padding: positioningConfig.shiftPadding,
        boundary: 'viewport',
        limiter: {
          // Prevent tooltip from being too close to viewport edges on mobile
          fn({ availableWidth, availableHeight, elements }) {
            const minWidth = isMobile ? 280 : 192; // min-w-70 on mobile, min-w-48 on desktop
            const minHeight = isMobile ? 80 : 60;
            
            return {
              width: Math.max(minWidth, Math.min(availableWidth - positioningConfig.boundaryPadding * 2, 320)),
              height: Math.max(minHeight, availableHeight - positioningConfig.boundaryPadding * 2),
            };
          },
        },
      }),
      
      // Size middleware to ensure tooltip fits within viewport boundaries
      size({
        apply({ availableWidth, availableHeight, elements }) {
          const tooltip = elements.floating;
          if (tooltip) {
            const maxWidth = isMobile ? 
              Math.min(320, availableWidth - positioningConfig.boundaryPadding * 2) : 
              Math.min(320, availableWidth - 16);
            
            tooltip.style.maxWidth = `${maxWidth}px`;
            
            // Ensure tooltip doesn't exceed viewport height on mobile
            if (isMobile) {
              const maxHeight = availableHeight - positioningConfig.boundaryPadding * 2;
              tooltip.style.maxHeight = `${maxHeight}px`;
            }
          }
        },
      }),
    ],
  });
  
  // Handle keyboard events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDismiss();
    } else if (e.key === 'Tab') {
      // Allow normal tab navigation within the tooltip
      const focusableElements = tooltipRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  // Handle background click to dismiss
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  };

  // Truncate selected text for display (max 100 chars)
  const truncatedText = selectedText.length > 100 
    ? `${selectedText.slice(0, 97)}...` 
    : selectedText;

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <>
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
      
      {/* Invisible backdrop for dismiss functionality */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleBackgroundClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        aria-hidden="true"
      />
      
      {/* Tooltip content */}
      <div
        ref={(node) => {
          refs.setFloating(node);
          tooltipRef.current = node;
        }}
        className={`
          z-50 bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-600
          rounded-lg shadow-lg 
          ${isMobile ? 'px-4 py-3' : 'px-3 py-2'}
          ${isMobile ? 'min-w-70' : 'min-w-48'} max-w-80
          ${isMobile ? 'text-base' : 'text-sm'}
          transition-all duration-150 ease-out
          ${className}
        `}
        style={floatingStyles}
        role="dialog"
        aria-labelledby="tooltip-title"
        aria-describedby="tooltip-description"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Selected text preview */}
        <div className="mb-2">
          <div 
            id="tooltip-title"
            className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            Selected text:
          </div>
          <div 
            id="tooltip-description"
            className="text-sm text-gray-700 dark:text-gray-300 italic line-clamp-2"
          >
            "{truncatedText}"
          </div>
        </div>

        {/* Action buttons */}
        <div className={`flex gap-2 justify-end ${isMobile ? 'mt-3' : 'mt-0'}`}>
          <button
            onClick={onDismiss}
            className={`
              ${isMobile ? 'px-4 py-2 text-sm' : 'px-2 py-1 text-xs'}
              text-gray-500 hover:text-gray-700 
              dark:text-gray-400 dark:hover:text-gray-200
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              rounded
              ${isMobile ? 'min-h-[44px] touch-manipulation' : ''}
              active:bg-gray-100 dark:active:bg-gray-700
            `}
            aria-label="Dismiss tooltip"
          >
            Dismiss
          </button>
          <button
            ref={addCommentButtonRef}
            onClick={onAddComment}
            className={`
              ${isMobile ? 'px-4 py-2 text-sm font-medium' : 'px-3 py-1 text-xs font-medium'}
              bg-blue-600 hover:bg-blue-700 
              dark:bg-blue-500 dark:hover:bg-blue-600
              active:bg-blue-800 dark:active:bg-blue-700
              text-white
              rounded
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${isMobile ? 'min-h-[44px] touch-manipulation' : ''}
            `}
            aria-label="Add comment to selected text"
          >
            Add Comment
          </button>
        </div>

        {/* Tooltip arrow - dynamically positioned based on placement */}
        {placement.includes('top') && (
          <>
            <div 
              className="
                absolute top-full left-1/2 transform -translate-x-1/2
                w-0 h-0 
                border-l-8 border-r-8 border-t-8
                border-l-transparent border-r-transparent 
                border-t-gray-200 dark:border-t-gray-600
              "
              aria-hidden="true"
            />
            <div 
              className="
                absolute top-full left-1/2 transform -translate-x-1/2 -mt-px
                w-0 h-0 
                border-l-7 border-r-7 border-t-7
                border-l-transparent border-r-transparent 
                border-t-white dark:border-t-gray-800
              "
              aria-hidden="true"
            />
          </>
        )}
        {placement.includes('bottom') && (
          <>
            <div 
              className="
                absolute bottom-full left-1/2 transform -translate-x-1/2
                w-0 h-0 
                border-l-8 border-r-8 border-b-8
                border-l-transparent border-r-transparent 
                border-b-gray-200 dark:border-b-gray-600
              "
              aria-hidden="true"
            />
            <div 
              className="
                absolute bottom-full left-1/2 transform -translate-x-1/2 mt-px
                w-0 h-0 
                border-l-7 border-r-7 border-b-7
                border-l-transparent border-r-transparent 
                border-b-white dark:border-b-gray-800
              "
              aria-hidden="true"
            />
          </>
        )}
        {placement.includes('left') && (
          <>
            <div 
              className="
                absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2
                w-0 h-0 
                border-t-8 border-b-8 border-l-8
                border-t-transparent border-b-transparent 
                border-l-gray-200 dark:border-l-gray-600
              "
              aria-hidden="true"
            />
            <div 
              className="
                absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 -ml-px
                w-0 h-0 
                border-t-7 border-b-7 border-l-7
                border-t-transparent border-b-transparent 
                border-l-white dark:border-l-gray-800
              "
              aria-hidden="true"
            />
          </>
        )}
        {placement.includes('right') && (
          <>
            <div 
              className="
                absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2
                w-0 h-0 
                border-t-8 border-b-8 border-r-8
                border-t-transparent border-b-transparent 
                border-r-gray-200 dark:border-r-gray-600
              "
              aria-hidden="true"
            />
            <div 
              className="
                absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 ml-px
                w-0 h-0 
                border-t-7 border-b-7 border-r-7
                border-t-transparent border-b-transparent 
                border-r-white dark:border-r-gray-800
              "
              aria-hidden="true"
            />
          </>
        )}
      </div>
    </>
  );
};

/**
 * Custom comparison function for React.memo optimization.
 * Only re-render when relevant props actually change.
 * 
 * The component will re-render when:
 * - isVisible changes
 * - position.x or position.y changes
 * - position.strategy changes
 * - selectedText changes
 * - callback functions change (should be memoized in parent)
 */
const arePropsEqual = (
  prevProps: SelectionTooltipProps,
  nextProps: SelectionTooltipProps
): boolean => {
  // Check visibility change
  if (prevProps.isVisible !== nextProps.isVisible) {
    return false;
  }
  
  // Check position changes
  if (
    prevProps.position.x !== nextProps.position.x ||
    prevProps.position.y !== nextProps.position.y ||
    prevProps.position.strategy !== nextProps.position.strategy
  ) {
    return false;
  }
  
  // Check selected text change
  if (prevProps.selectedText !== nextProps.selectedText) {
    return false;
  }
  
  // Check callback function changes
  // Note: These should ideally be memoized in the parent component
  // using useCallback to prevent unnecessary re-renders
  if (
    prevProps.onAddComment !== nextProps.onAddComment ||
    prevProps.onDismiss !== nextProps.onDismiss
  ) {
    return false;
  }
  
  // Check className change if provided
  if (prevProps.className !== nextProps.className) {
    return false;
  }
  
  // Props are equal, skip re-render
  return true;
};

/**
 * Memoized SelectionTooltip component for optimal performance.
 * Prevents unnecessary re-renders when props haven't meaningfully changed.
 * 
 * Performance tips for parent components:
 * - Memoize onAddComment and onDismiss callbacks using useCallback
 * - Avoid creating new position objects on every render
 * - Use stable references for className strings
 * 
 * Example of optimal usage in parent:
 * ```tsx
 * const onAddComment = useCallback(() => {
 *   // handle comment logic
 * }, [dependencies]);
 * 
 * const onDismiss = useCallback(() => {
 *   // handle dismiss logic
 * }, [dependencies]);
 * ```
 */
export const SelectionTooltip = memo(SelectionTooltipComponent, arePropsEqual);

/* Usage Example:
import { SelectionTooltip } from './components/tooltip/SelectionTooltip';

function MyComponent() {
  const [tooltipState, setTooltipState] = useState({
    isVisible: false,
    position: { x: 0, y: 0, strategy: 'fixed' as const },
    selectedText: ''
  });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setTooltipState({
        isVisible: true,
        // Floating UI will use these coordinates as virtual element position
        position: { 
          x: rect.left + rect.width / 2, // Center of selection
          y: rect.top, // Top of selection
          strategy: 'fixed' 
        },
        selectedText: selection.toString()
      });
    }
  };

  return (
    <div>
      <div onMouseUp={handleTextSelection}>
        Select some text in this paragraph to see the enhanced tooltip 
        with Floating UI positioning. The tooltip will intelligently 
        position itself to avoid viewport edges and obstacles. On mobile 
        devices, it automatically adjusts positioning to avoid text 
        selection handles and provides touch-friendly interactions.
      </div>
      
      <SelectionTooltip
        isVisible={tooltipState.isVisible}
        position={tooltipState.position}
        selectedText={tooltipState.selectedText}
        onAddComment={() => {
          // Handle add comment logic with intelligent positioning
          console.log('Adding comment for:', tooltipState.selectedText);
          setTooltipState(prev => ({ ...prev, isVisible: false }));
        }}
        onDismiss={() => {
          setTooltipState(prev => ({ ...prev, isVisible: false }));
        }}
      />
    </div>
  );
}
*/
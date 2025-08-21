import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectionTooltip } from './SelectionTooltip';
import { SelectionTooltipProps } from './types';

// Mock props for testing
const defaultProps: SelectionTooltipProps = {
  isVisible: true,
  position: { x: 100, y: 200, strategy: 'absolute' },
  selectedText: 'This is sample selected text',
  onAddComment: jest.fn(),
  onDismiss: jest.fn(),
};

describe('SelectionTooltip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when visible', () => {
      render(<SelectionTooltip {...defaultProps} />);
      
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('"This is sample selected text"')).toBeInTheDocument();
      expect(screen.getByText('Add Comment')).toBeInTheDocument();
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      render(<SelectionTooltip {...defaultProps} isVisible={false} />);
      
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated when it exceeds the maximum length limit of 100 characters and should show ellipsis';
      render(<SelectionTooltip {...defaultProps} selectedText={longText} />);
      
      expect(screen.getByText(/"This is a very long text that should be truncated when it exceeds the maximum length limit o..."/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onAddComment when Add Comment button is clicked', () => {
      render(<SelectionTooltip {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Add Comment'));
      expect(defaultProps.onAddComment).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when Dismiss button is clicked', () => {
      render(<SelectionTooltip {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Dismiss'));
      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when Escape key is pressed', () => {
      render(<SelectionTooltip {...defaultProps} />);
      
      const tooltip = screen.getByRole('tooltip');
      fireEvent.keyDown(tooltip, { key: 'Escape' });
      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Positioning', () => {
    it('should apply correct position styles for absolute positioning', () => {
      const position = { x: 150, y: 300, strategy: 'absolute' as const };
      render(<SelectionTooltip {...defaultProps} position={position} />);
      
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveStyle({
        position: 'absolute',
        left: '150px',
        top: '300px',
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      });
    });

    it('should apply correct position styles for fixed positioning', () => {
      const position = { x: 75, y: 150, strategy: 'fixed' as const };
      render(<SelectionTooltip {...defaultProps} position={position} />);
      
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveStyle({
        position: 'fixed',
        left: '75px',
        top: '150px'
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SelectionTooltip {...defaultProps} />);
      
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('aria-label', 'Selection tooltip');
      expect(tooltip).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper button labels', () => {
      render(<SelectionTooltip {...defaultProps} />);
      
      expect(screen.getByLabelText('Add comment to selected text')).toBeInTheDocument();
      expect(screen.getByLabelText('Dismiss tooltip')).toBeInTheDocument();
    });

    it('should auto-focus the Add Comment button', () => {
      render(<SelectionTooltip {...defaultProps} />);
      
      const addCommentButton = screen.getByText('Add Comment');
      expect(addCommentButton).toHaveAttribute('autoFocus');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<SelectionTooltip {...defaultProps} className="custom-tooltip-class" />);
      
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('custom-tooltip-class');
    });
  });
});

/* Performance Test Considerations:
 * - Test with very long selected text (1000+ characters)
 * - Test rapid show/hide cycles
 * - Test positioning edge cases (near viewport boundaries)
 * - Test memory leaks with repeated mounting/unmounting
 */

/* Accessibility Test Checklist:
 * ✓ Proper ARIA roles and labels
 * ✓ Keyboard navigation support
 * ✓ Focus management
 * ✓ Screen reader compatibility
 * - Color contrast compliance (manual test)
 * - High contrast mode support (manual test)
 */
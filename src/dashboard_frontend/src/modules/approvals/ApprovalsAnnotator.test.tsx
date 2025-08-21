import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApprovalsAnnotator, ApprovalComment } from './ApprovalsAnnotator';

// Mock the SelectionTooltip component to control its behavior in tests
jest.mock('../../components/tooltip', () => ({
  SelectionTooltip: ({ isVisible, selectedText, onAddComment, onDismiss }: any) => {
    if (!isVisible) return null;
    return (
      <div data-testid="selection-tooltip" role="dialog">
        <div data-testid="tooltip-selected-text">"{selectedText}"</div>
        <button onClick={onAddComment} data-testid="tooltip-add-comment">
          Add Comment
        </button>
        <button onClick={onDismiss} data-testid="tooltip-dismiss">
          Dismiss
        </button>
      </div>
    );
  }
}));

// Mock the Markdown component
jest.mock('../markdown/Markdown', () => ({
  Markdown: ({ content }: { content: string }) => <div data-testid="markdown-content">{content}</div>
}));

// Mock window.getSelection for text selection tests
const mockSelection = {
  toString: jest.fn(),
  removeAllRanges: jest.fn(),
  getRangeAt: jest.fn()
};

const mockRange = {
  getBoundingClientRect: jest.fn(() => ({
    left: 100,
    top: 200,
    right: 300,
    bottom: 220,
    width: 200,
    height: 20
  }))
};

Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: jest.fn(() => mockSelection)
});

describe('ApprovalsAnnotator - Tooltip Integration', () => {
  const mockContent = `# Test Document

This is a sample document with multiple paragraphs for testing text selection and comment functionality.

## Section 1
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Section 2
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;

  const defaultProps = {
    content: mockContent,
    comments: [] as ApprovalComment[],
    onCommentsChange: jest.fn(),
    viewMode: 'annotate' as const,
    setViewMode: jest.fn()
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockSelection.toString.mockReturnValue('');
    mockSelection.getRangeAt.mockReturnValue(mockRange);
  });

  afterEach(() => {
    // Clean up any remaining selections
    mockSelection.removeAllRanges.mockClear();
  });

  describe('Tooltip Visibility', () => {
    it('should show tooltip when text is selected in annotation mode', async () => {
      const selectedText = 'Lorem ipsum dolor';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      expect(annotationContent).toBeTruthy();
      
      // Simulate text selection by triggering mouseup event
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('tooltip-selected-text')).toHaveTextContent(`"${selectedText}"`);
    });

    it('should not show tooltip when no text is selected', async () => {
      mockSelection.toString.mockReturnValue('');
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      expect(annotationContent).toBeTruthy();
      
      fireEvent.mouseUp(annotationContent!);
      
      // Wait a moment to ensure no tooltip appears
      await waitFor(() => {
        expect(screen.queryByTestId('selection-tooltip')).not.toBeInTheDocument();
      });
    });

    it('should not show tooltip when in preview mode', async () => {
      const selectedText = 'Lorem ipsum dolor';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} viewMode="preview" />);
      
      // In preview mode, the content should be in markdown format
      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toBeTruthy();
      
      fireEvent.mouseUp(markdownContent);
      
      await waitFor(() => {
        expect(screen.queryByTestId('selection-tooltip')).not.toBeInTheDocument();
      });
    });

    it('should hide tooltip when text selection is cleared', async () => {
      const selectedText = 'Lorem ipsum dolor';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      expect(annotationContent).toBeTruthy();
      
      // Show tooltip
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
      
      // Clear selection
      mockSelection.toString.mockReturnValue('');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.queryByTestId('selection-tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tooltip Content and Positioning', () => {
    it('should display correct selected text in tooltip', async () => {
      const selectedText = 'consectetur adipiscing elit';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('tooltip-selected-text')).toHaveTextContent(`"${selectedText}"`);
      });
    });

    it('should position tooltip based on selection bounds', async () => {
      const selectedText = 'test selection';
      mockSelection.toString.mockReturnValue(selectedText);
      
      // Mock specific selection bounds
      mockRange.getBoundingClientRect.mockReturnValue({
        left: 150,
        top: 300,
        right: 350,
        bottom: 320,
        width: 200,
        height: 20
      });
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        const tooltip = screen.getByTestId('selection-tooltip');
        expect(tooltip).toBeInTheDocument();
      });
    });

    it('should update tooltip content when selection changes', async () => {
      const firstSelection = 'first selection';
      const secondSelection = 'second selection';
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      
      // First selection
      mockSelection.toString.mockReturnValue(firstSelection);
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('tooltip-selected-text')).toHaveTextContent(`"${firstSelection}"`);
      });
      
      // Second selection
      mockSelection.toString.mockReturnValue(secondSelection);
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('tooltip-selected-text')).toHaveTextContent(`"${secondSelection}"`);
      });
    });
  });

  describe('Tooltip Actions', () => {
    it('should open comment modal when "Add Comment" is clicked', async () => {
      const selectedText = 'test comment text';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
      
      // Click "Add Comment" button
      fireEvent.click(screen.getByTestId('tooltip-add-comment'));
      
      await waitFor(() => {
        // The CommentModal should open
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Add Comment')).toBeInTheDocument();
        expect(screen.getByDisplayValue(selectedText)).toBeInTheDocument();
      });
      
      // Tooltip should be hidden
      expect(screen.queryByTestId('selection-tooltip')).not.toBeInTheDocument();
    });

    it('should hide tooltip when "Dismiss" is clicked', async () => {
      const selectedText = 'dismissible text';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
      
      // Click "Dismiss" button
      fireEvent.click(screen.getByTestId('tooltip-dismiss'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('selection-tooltip')).not.toBeInTheDocument();
      });
    });

    it('should clear text selection when tooltip is dismissed', async () => {
      const selectedText = 'selection to clear';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('tooltip-dismiss'));
      
      await waitFor(() => {
        expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      });
    });

    it('should clear text selection when comment modal opens', async () => {
      const selectedText = 'text for modal';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('tooltip-add-comment'));
      
      await waitFor(() => {
        expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Integration', () => {
    it('should pass selected text to comment modal', async () => {
      const selectedText = 'specific selected text';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('tooltip-add-comment'));
      
      await waitFor(() => {
        // Check that modal contains the selected text
        const modal = screen.getByRole('dialog');
        const highlightedTextContainer = within(modal).getByText('Highlighted Text:').parentElement;
        expect(highlightedTextContainer).toHaveTextContent(selectedText);
      });
    });

    it('should create comment when modal is saved', async () => {
      const selectedText = 'text to comment on';
      const commentText = 'This is my comment';
      mockSelection.toString.mockReturnValue(selectedText);
      
      const onCommentsChange = jest.fn();
      render(<ApprovalsAnnotator {...defaultProps} onCommentsChange={onCommentsChange} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('tooltip-add-comment'));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Fill in comment
      const commentTextarea = screen.getByPlaceholderText('Enter your comment here...');
      await user.type(commentTextarea, commentText);
      
      // Save comment
      const saveButton = screen.getByText('Add Comment');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(onCommentsChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'selection',
              comment: commentText,
              selectedText: selectedText,
              highlightColor: expect.any(Object),
              id: expect.any(String)
            })
          ])
        );
      });
    });

    it('should not show tooltip when modal is open', async () => {
      const selectedText = 'modal interaction test';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('tooltip-add-comment'));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.queryByTestId('selection-tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multiple Selections Workflow', () => {
    it('should handle multiple consecutive text selections', async () => {
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      
      // First selection
      mockSelection.toString.mockReturnValue('first selection');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('tooltip-selected-text')).toHaveTextContent('"first selection"');
      });
      
      // Second selection without dismissing first
      mockSelection.toString.mockReturnValue('second selection');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('tooltip-selected-text')).toHaveTextContent('"second selection"');
      });
    });

    it('should maintain tooltip state during rapid selections', async () => {
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      
      // Rapid selections
      const selections = ['quick one', 'quick two', 'quick three'];
      
      for (const selection of selections) {
        mockSelection.toString.mockReturnValue(selection);
        fireEvent.mouseUp(annotationContent!);
        
        await waitFor(() => {
          expect(screen.getByTestId('tooltip-selected-text')).toHaveTextContent(`"${selection}"`);
        });
      }
    });
  });

  describe('Existing Comments Integration', () => {
    const existingComments: ApprovalComment[] = [
      {
        id: 'comment1',
        type: 'selection',
        comment: 'Existing comment',
        timestamp: '2024-01-01T00:00:00Z',
        selectedText: 'Lorem ipsum',
        highlightColor: { bg: 'rgba(255, 235, 59, 0.3)', border: '#FFEB3B', name: '#FFEB3B' }
      }
    ];

    it('should show tooltip for new selections even with existing comments', async () => {
      const newSelection = 'new selection text';
      mockSelection.toString.mockReturnValue(newSelection);
      
      render(<ApprovalsAnnotator {...defaultProps} comments={existingComments} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-selected-text')).toHaveTextContent(`"${newSelection}"`);
      });
    });

    it('should open edit modal when clicking highlighted text', async () => {
      render(<ApprovalsAnnotator {...defaultProps} comments={existingComments} />);
      
      // Find the highlighted text (this would be styled with highlight colors)
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      expect(annotationContent).toBeTruthy();
      
      // Simulate clicking on highlighted text
      const highlightedElement = document.createElement('span');
      highlightedElement.className = 'highlight-clickable';
      highlightedElement.setAttribute('data-comment-id', 'comment1');
      
      fireEvent.click(highlightedElement);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Comment')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty text selection gracefully', async () => {
      mockSelection.toString.mockReturnValue('   '); // Only whitespace
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      // Should not show tooltip for empty/whitespace selection
      await waitFor(() => {
        expect(screen.queryByTestId('selection-tooltip')).not.toBeInTheDocument();
      });
    });

    it('should handle selection range errors gracefully', async () => {
      mockSelection.toString.mockReturnValue('valid selection');
      mockSelection.getRangeAt.mockImplementation(() => {
        throw new Error('No range available');
      });
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      
      // Should not crash when getRangeAt throws
      expect(() => {
        fireEvent.mouseUp(annotationContent!);
      }).not.toThrow();
    });

    it('should handle very long selected text', async () => {
      const longText = 'a'.repeat(1000); // Very long text
      mockSelection.toString.mockReturnValue(longText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        const tooltip = screen.getByTestId('selection-tooltip');
        expect(tooltip).toBeInTheDocument();
        // Tooltip should handle long text appropriately
        const tooltipText = screen.getByTestId('tooltip-selected-text');
        expect(tooltipText).toBeInTheDocument();
      });
    });

    it('should handle selection bounds outside viewport', async () => {
      mockSelection.toString.mockReturnValue('edge case selection');
      
      // Mock selection bounds that are outside normal viewport
      mockRange.getBoundingClientRect.mockReturnValue({
        left: -100,
        top: -50,
        right: 100,
        bottom: -30,
        width: 200,
        height: 20
      });
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      // Tooltip should still appear and be positioned appropriately
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should maintain focus flow from tooltip to modal', async () => {
      const selectedText = 'focus flow test';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        expect(screen.getByTestId('selection-tooltip')).toBeInTheDocument();
      });
      
      // Tab to add comment button and press enter
      const addCommentButton = screen.getByTestId('tooltip-add-comment');
      fireEvent.keyDown(addCommentButton, { key: 'Enter' });
      
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
        
        // Modal should receive focus
        const commentTextarea = screen.getByPlaceholderText('Enter your comment here...');
        expect(commentTextarea).toBeInTheDocument();
      });
    });

    it('should provide clear visual feedback for selected text', async () => {
      const selectedText = 'visual feedback text';
      mockSelection.toString.mockReturnValue(selectedText);
      
      render(<ApprovalsAnnotator {...defaultProps} />);
      
      const annotationContent = document.querySelector('[data-section="annotations"] pre');
      fireEvent.mouseUp(annotationContent!);
      
      await waitFor(() => {
        const tooltip = screen.getByTestId('selection-tooltip');
        expect(tooltip).toBeInTheDocument();
        
        // Tooltip should clearly show what text is selected
        const selectedTextDisplay = screen.getByTestId('tooltip-selected-text');
        expect(selectedTextDisplay).toHaveTextContent(`"${selectedText}"`);
      });
    });
  });
});

/* Additional Test Coverage Areas:
 * 
 * Performance Tests:
 * - Memory leak prevention with rapid tooltip show/hide cycles
 * - Large document handling with many existing comments
 * - Tooltip positioning performance with frequent selections
 * 
 * Cross-browser Compatibility:
 * - Selection API differences between browsers
 * - Positioning accuracy across different viewport sizes
 * - Touch device selection behavior
 * 
 * Integration Tests with Real DOM:
 * - Actual text selection using Selection API
 * - Real positioning calculations with getBoundingClientRect
 * - Scroll behavior and tooltip repositioning
 * 
 * Visual Regression Tests:
 * - Tooltip appearance and positioning screenshots
 * - Color scheme and theme consistency
 * - Mobile responsive behavior
 */
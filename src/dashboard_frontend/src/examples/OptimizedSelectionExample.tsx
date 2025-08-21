/**
 * Example component demonstrating the optimized useTextSelection hook
 * with memory leak prevention for the comment tooltip feature.
 */

import React, { useState, useCallback } from 'react';
import { useTextSelection } from '../hooks/useTextSelection';
import { usePerformanceMonitor } from '../utils/performanceMonitor';

interface Comment {
  id: string;
  text: string;
  selectedText: string;
  timestamp: Date;
  position: { x: number; y: number };
}

export const OptimizedSelectionExample: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showMetrics, setShowMetrics] = useState(false);
  
  // Use the optimized text selection hook
  const selection = useTextSelection({
    debounceMs: 100,
    minLength: 3,
    includePosition: true,
  });

  // Performance monitoring (development only)
  const perfMonitor = usePerformanceMonitor(process.env.NODE_ENV === 'development');

  // Handle adding a comment
  const handleAddComment = useCallback(() => {
    if (!selection.isActive || !selection.position) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      text: '',
      selectedText: selection.selectedText,
      timestamp: new Date(),
      position: { ...selection.position },
    };

    setComments(prev => [...prev, newComment]);
    selection.clearSelection();
  }, [selection]);

  // Handle dismissing the tooltip
  const handleDismiss = useCallback(() => {
    selection.clearSelection();
  }, [selection]);

  // Toggle performance metrics display
  const toggleMetrics = useCallback(() => {
    setShowMetrics(prev => !prev);
    if (!showMetrics) {
      perfMonitor.logMetrics();
    }
  }, [showMetrics, perfMonitor]);

  return (
    <div className="optimized-selection-example" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Optimized Text Selection with Memory Leak Prevention</h1>
        <p>Select any text to see the comment tooltip. All resources are properly cleaned up on unmount.</p>
        
        {process.env.NODE_ENV === 'development' && (
          <button 
            onClick={toggleMetrics}
            style={{
              padding: '0.5rem 1rem',
              marginTop: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showMetrics ? 'Hide' : 'Show'} Performance Metrics
          </button>
        )}
      </header>

      {/* Performance Metrics Display */}
      {showMetrics && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
        }}>
          <h3>Performance Metrics</h3>
          <div>
            <strong>Memory Trend:</strong> {
              perfMonitor.analyzeMemoryTrend().recommendation
            }
          </div>
          <div>
            <strong>Active Timeouts:</strong> {
              perfMonitor.metrics.timeoutCount
            }
          </div>
          <div>
            <strong>Active Intervals:</strong> {
              perfMonitor.metrics.intervalCount
            }
          </div>
          <div>
            <strong>Event Listeners:</strong> {
              Array.from(perfMonitor.metrics.eventListenerCount.entries())
                .filter(([, count]) => count > 0)
                .map(([type, count]) => `${type}: ${count}`)
                .join(', ') || 'None'
            }
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ 
        minHeight: '400px',
        padding: '2rem',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        userSelect: 'text',
      }}>
        <article>
          <h2>Sample Article for Testing</h2>
          
          <p>
            This is a sample paragraph with text that you can select to test the optimized
            text selection hook. The hook now includes comprehensive memory leak prevention
            through proper cleanup of event listeners, timeouts, and async operations.
          </p>

          <p>
            When you select text, a tooltip will appear at the selection position. The hook
            uses an AbortController to cancel pending operations if the component unmounts,
            and includes a mounted reference to prevent state updates after unmount.
          </p>

          <h3>Key Optimizations</h3>
          
          <ul>
            <li>
              <strong>Mounted State Tracking:</strong> The hook tracks whether the component
              is still mounted and prevents any state updates after unmount.
            </li>
            <li>
              <strong>Comprehensive Cleanup:</strong> All timeouts, event listeners, and
              async operations are properly cleaned up when the component unmounts.
            </li>
            <li>
              <strong>AbortController Integration:</strong> Modern browsers use abort signals
              for automatic event listener cleanup.
            </li>
            <li>
              <strong>Defensive Programming:</strong> Multiple safety checks ensure no
              operations occur after unmount.
            </li>
          </ul>

          <p>
            Try selecting different parts of this text and observe how the tooltip appears.
            The performance metrics (in development mode) will show you real-time information
            about memory usage and active resources.
          </p>
        </article>
      </main>

      {/* Selection Tooltip */}
      {selection.isActive && selection.position && (
        <div
          className="selection-tooltip"
          style={{
            position: 'fixed',
            left: `${selection.position.x}px`,
            top: `${selection.position.y - 50}px`,
            transform: 'translateX(-50%)',
            backgroundColor: '#333',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <button
            onClick={handleAddComment}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Add Comment
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Dismiss
          </button>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            {selection.length} chars
          </span>
        </div>
      )}

      {/* Comments Display */}
      {comments.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h3>Comments ({comments.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {comments.map(comment => (
              <div
                key={comment.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  borderLeft: '3px solid #007bff',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  "{comment.selectedText}"
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {comment.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Export for use in other components
export default OptimizedSelectionExample;
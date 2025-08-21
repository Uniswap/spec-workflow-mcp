/**
 * Performance monitoring utility for tracking memory usage and detecting leaks
 * 
 * This utility provides tools to monitor memory usage, detect potential leaks,
 * and track performance metrics in production environments.
 */

import * as React from 'react';

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceMetrics {
  memorySnapshots: MemorySnapshot[];
  eventListenerCount: Map<string, number>;
  timeoutCount: number;
  intervalCount: number;
  observerCount: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    memorySnapshots: [],
    eventListenerCount: new Map(),
    timeoutCount: 0,
    intervalCount: 0,
    observerCount: 0,
  };

  private originalSetTimeout: typeof setTimeout;
  private originalClearTimeout: typeof clearTimeout;
  private originalSetInterval: typeof setInterval;
  private originalClearInterval: typeof clearInterval;
  private originalAddEventListener: typeof EventTarget.prototype.addEventListener;
  private originalRemoveEventListener: typeof EventTarget.prototype.removeEventListener;

  private isMonitoring = false;
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Store original functions
    this.originalSetTimeout = window.setTimeout.bind(window);
    this.originalClearTimeout = window.clearTimeout.bind(window);
    this.originalSetInterval = window.setInterval.bind(window);
    this.originalClearInterval = window.clearInterval.bind(window);
    this.originalAddEventListener = EventTarget.prototype.addEventListener;
    this.originalRemoveEventListener = EventTarget.prototype.removeEventListener;
  }

  /**
   * Start monitoring performance metrics
   */
  startMonitoring(memoryCheckIntervalMs = 5000) {
    if (this.isMonitoring) {
      console.warn('Performance monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    this.installHooks();
    
    // Start memory monitoring if available
    if (this.isMemoryAPIAvailable()) {
      this.memoryCheckInterval = this.originalSetInterval(() => {
        this.captureMemorySnapshot();
      }, memoryCheckIntervalMs);
    }

    console.log('Performance monitoring started');
  }

  /**
   * Stop monitoring and restore original functions
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.restoreHooks();

    if (this.memoryCheckInterval) {
      this.originalClearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    console.log('Performance monitoring stopped');
  }

  /**
   * Install monitoring hooks
   */
  private installHooks() {
    const self = this;

    // Monitor setTimeout/clearTimeout
    window.setTimeout = function(...args: Parameters<typeof setTimeout>) {
      self.metrics.timeoutCount++;
      return self.originalSetTimeout(...args);
    } as typeof setTimeout;

    window.clearTimeout = function(id: NodeJS.Timeout) {
      self.metrics.timeoutCount = Math.max(0, self.metrics.timeoutCount - 1);
      return self.originalClearTimeout(id);
    };

    // Monitor setInterval/clearInterval
    window.setInterval = function(...args: Parameters<typeof setInterval>) {
      self.metrics.intervalCount++;
      return self.originalSetInterval(...args);
    } as typeof setInterval;

    window.clearInterval = function(id: NodeJS.Timeout) {
      self.metrics.intervalCount = Math.max(0, self.metrics.intervalCount - 1);
      return self.originalClearInterval(id);
    };

    // Monitor event listeners
    EventTarget.prototype.addEventListener = function(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ) {
      const count = self.metrics.eventListenerCount.get(type) || 0;
      self.metrics.eventListenerCount.set(type, count + 1);
      return self.originalAddEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions
    ) {
      const count = self.metrics.eventListenerCount.get(type) || 0;
      self.metrics.eventListenerCount.set(type, Math.max(0, count - 1));
      return self.originalRemoveEventListener.call(this, type, listener, options);
    };
  }

  /**
   * Restore original functions
   */
  private restoreHooks() {
    window.setTimeout = this.originalSetTimeout;
    window.clearTimeout = this.originalClearTimeout;
    window.setInterval = this.originalSetInterval;
    window.clearInterval = this.originalClearInterval;
    EventTarget.prototype.addEventListener = this.originalAddEventListener;
    EventTarget.prototype.removeEventListener = this.originalRemoveEventListener;
  }

  /**
   * Check if memory API is available
   */
  private isMemoryAPIAvailable(): boolean {
    return 'memory' in performance;
  }

  /**
   * Capture current memory snapshot
   */
  private captureMemorySnapshot() {
    if (!this.isMemoryAPIAvailable()) {
      return;
    }

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };

    this.metrics.memorySnapshots.push(snapshot);

    // Keep only last 100 snapshots to avoid memory buildup
    if (this.metrics.memorySnapshots.length > 100) {
      this.metrics.memorySnapshots.shift();
    }

    // Check for potential memory leak
    this.checkForMemoryLeak();
  }

  /**
   * Check for potential memory leaks based on memory growth patterns
   */
  private checkForMemoryLeak() {
    const snapshots = this.metrics.memorySnapshots;
    if (snapshots.length < 10) {
      return;
    }

    // Compare average of first 5 snapshots with last 5
    const firstFive = snapshots.slice(0, 5);
    const lastFive = snapshots.slice(-5);

    const firstAvg = firstFive.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / 5;
    const lastAvg = lastFive.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / 5;

    const growthRate = (lastAvg - firstAvg) / firstAvg;

    // Warn if memory has grown by more than 50%
    if (growthRate > 0.5) {
      console.warn(`Potential memory leak detected! Memory usage increased by ${(growthRate * 100).toFixed(1)}%`);
      this.logMetrics();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Log current metrics to console
   */
  logMetrics() {
    console.group('Performance Metrics');
    
    if (this.isMemoryAPIAvailable() && this.metrics.memorySnapshots.length > 0) {
      const latest = this.metrics.memorySnapshots[this.metrics.memorySnapshots.length - 1];
      console.log('Memory Usage:', {
        used: `${(latest.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(latest.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(latest.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        usage: `${((latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100).toFixed(1)}%`,
      });
    }

    console.log('Active Timers:', {
      timeouts: this.metrics.timeoutCount,
      intervals: this.metrics.intervalCount,
    });

    console.log('Event Listeners:', Object.fromEntries(
      Array.from(this.metrics.eventListenerCount.entries())
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10) // Top 10 event types
    ));

    console.groupEnd();
  }

  /**
   * Get memory leak analysis
   */
  analyzeMemoryTrend(): {
    isLeaking: boolean;
    growthRate: number;
    recommendation: string;
  } {
    const snapshots = this.metrics.memorySnapshots;
    
    if (snapshots.length < 20) {
      return {
        isLeaking: false,
        growthRate: 0,
        recommendation: 'Insufficient data for analysis. Keep monitoring.',
      };
    }

    // Linear regression to detect trend
    const n = snapshots.length;
    const times = snapshots.map((s, i) => i);
    const memories = snapshots.map(s => s.usedJSHeapSize);

    const sumX = times.reduce((a, b) => a + b, 0);
    const sumY = memories.reduce((a, b) => a + b, 0);
    const sumXY = times.reduce((sum, x, i) => sum + x * memories[i], 0);
    const sumX2 = times.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgMemory = sumY / n;
    const growthRate = (slope * n) / avgMemory;

    let isLeaking = false;
    let recommendation = '';

    if (growthRate > 0.3) {
      isLeaking = true;
      recommendation = 'Significant memory growth detected. Review component lifecycle and cleanup.';
    } else if (growthRate > 0.1) {
      recommendation = 'Moderate memory growth detected. Monitor closely.';
    } else {
      recommendation = 'Memory usage is stable.';
    }

    return { isLeaking, growthRate, recommendation };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      memorySnapshots: [],
      eventListenerCount: new Map(),
      timeoutCount: 0,
      intervalCount: 0,
      observerCount: 0,
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(autoStart = false) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(() => 
    performanceMonitor.getMetrics()
  );

  React.useEffect(() => {
    if (autoStart) {
      performanceMonitor.startMonitoring();
    }

    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 5000);

    return () => {
      clearInterval(interval);
      if (autoStart) {
        performanceMonitor.stopMonitoring();
      }
    };
  }, [autoStart]);

  return {
    metrics,
    startMonitoring: () => performanceMonitor.startMonitoring(),
    stopMonitoring: () => performanceMonitor.stopMonitoring(),
    logMetrics: () => performanceMonitor.logMetrics(),
    analyzeMemoryTrend: () => performanceMonitor.analyzeMemoryTrend(),
    reset: () => performanceMonitor.reset(),
  };
}

// Export for development/debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__performanceMonitor = performanceMonitor;
}
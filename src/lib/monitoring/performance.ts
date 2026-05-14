/**
 * Performance Monitoring
 * Track Core Web Vitals and custom performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals (optional; only if package is installed)
  void (async () => {
    try {
      // Cast to bypass Next.js's bundled-types shim that exposes only onFID;
      // the real web-vitals v5 dep we depend on provides onINP at runtime.
      const vitals = (await import('web-vitals').catch(() => null)) as
        | (typeof import('web-vitals') & { onINP?: (fn: (m: PerformanceMetric) => void) => void })
        | null;
      if (!vitals) return;
      vitals.onCLS?.(sendToAnalytics);
      vitals.onINP?.(sendToAnalytics);
      vitals.onFCP?.(sendToAnalytics);
      vitals.onLCP?.(sendToAnalytics);
      vitals.onTTFB?.(sendToAnalytics);
    } catch {
      // web-vitals not installed
    }
  })();

  // Track custom metrics
  trackPageLoadTime();
  trackResourceTiming();
}

function sendToAnalytics(metric: PerformanceMetric) {
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance Metric:', metric);
  }
}

function trackPageLoadTime() {
  if (typeof window === 'undefined' || !window.performance) return;

  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

    if (window.gtag) {
      window.gtag('event', 'page_load_time', {
        event_category: 'Performance',
        value: pageLoadTime,
        non_interaction: true,
      });
    }
  });
}

function trackResourceTiming() {
  if (typeof window === 'undefined' || !window.performance) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming;
        if (resource.duration > 1000) {
          // Log slow resources
          console.warn('Slow resource:', resource.name, resource.duration);
        }
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (e) {
    // PerformanceObserver not supported
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

import { DetectedItem } from './realAiService';
import { EnhancedDetectionResult } from './enhancedDetectionPipeline';
import { PerformanceOptimizer } from './performanceOptimizationService';

/**
 * Performance Monitoring Service
 * 
 * This service tracks and optimizes performance across the enhanced detection pipeline
 * to ensure processing times remain under 3 seconds.
 */

export interface PerformanceMetrics {
  timestamp: Date;
  operation: string;
  duration: number;
  itemCount: number;
  success: boolean;
  error?: string;
  metadata?: {
    [key: string]: any;
    // New metrics from performance optimization service
    cacheHit?: boolean;
    cacheSize?: number;
    parallelTasks?: number;
    bottleneckStage?: string;
    optimizationApplied?: string[];
  };
}

export interface PerformanceThresholds {
  maxTotalProcessingTime: number; // milliseconds
  maxCategoryFilteringTime: number;
  maxSpatialAnalysisTime: number;
  maxOverlapResolutionTime: number;
  warningThreshold: number; // percentage of max time to trigger warnings
}

export interface PerformanceReport {
  totalOperations: number;
  averageProcessingTime: number;
  maxProcessingTime: number;
  minProcessingTime: number;
  successRate: number;
  performanceTrend: 'improving' | 'stable' | 'degrading';
  recommendations: string[];
  recentMetrics: PerformanceMetrics[];
}

export interface OptimizationResult {
  optimized: boolean;
  optimizationsApplied: string[];
  performanceGain: number; // percentage improvement
  newProcessingTime: number;
}

const defaultThresholds: PerformanceThresholds = {
  maxTotalProcessingTime: 3000, // 3 seconds
  maxCategoryFilteringTime: 100,
  maxSpatialAnalysisTime: 500,
  maxOverlapResolutionTime: 1000,
  warningThreshold: 0.8 // 80% of max time triggers warning
};

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private maxMetricsHistory: number = 100;

  constructor(thresholds: PerformanceThresholds = defaultThresholds) {
    this.thresholds = thresholds;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetrics, 'timestamp'>): void {
    const fullMetric: PerformanceMetrics = {
      ...metric,
      timestamp: new Date()
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log performance warnings
    this.checkPerformanceThresholds(fullMetric);
  }

  /**
   * Check if performance metrics exceed thresholds
   */
  private checkPerformanceThresholds(metric: PerformanceMetrics): void {
    const thresholds = this.getThresholdForOperation(metric.operation);
    
    if (metric.duration > thresholds) {
      console.warn(`Performance warning: ${metric.operation} took ${metric.duration}ms (threshold: ${thresholds}ms)`);
    }

    if (metric.duration > thresholds * this.thresholds.warningThreshold) {
      console.warn(`Performance alert: ${metric.operation} approaching threshold (${metric.duration}ms / ${thresholds}ms)`);
    }
  }

  /**
   * Get threshold for specific operation
   */
  private getThresholdForOperation(operation: string): number {
    switch (operation) {
      case 'category_filtering':
        return this.thresholds.maxCategoryFilteringTime;
      case 'spatial_analysis':
        return this.thresholds.maxSpatialAnalysisTime;
      case 'overlap_resolution':
        return this.thresholds.maxOverlapResolutionTime;
      case 'total_processing':
        return this.thresholds.maxTotalProcessingTime;
      default:
        return this.thresholds.maxTotalProcessingTime;
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const recentMetrics = this.metrics.slice(-20); // Last 20 operations
    const totalOperations = recentMetrics.length;
    
    if (totalOperations === 0) {
      return {
        totalOperations: 0,
        averageProcessingTime: 0,
        maxProcessingTime: 0,
        minProcessingTime: 0,
        successRate: 0,
        performanceTrend: 'stable',
        recommendations: ['No data available for analysis'],
        recentMetrics: []
      };
    }

    const processingTimes = recentMetrics.map(m => m.duration);
    const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / totalOperations;
    const maxProcessingTime = Math.max(...processingTimes);
    const minProcessingTime = Math.min(...processingTimes);
    const successRate = recentMetrics.filter(m => m.success).length / totalOperations;

    // Calculate performance trend
    const firstHalf = processingTimes.slice(0, Math.floor(totalOperations / 2));
    const secondHalf = processingTimes.slice(Math.floor(totalOperations / 2));
    const firstHalfAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
    
    let performanceTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (secondHalfAvg < firstHalfAvg * 0.9) {
      performanceTrend = 'improving';
    } else if (secondHalfAvg > firstHalfAvg * 1.1) {
      performanceTrend = 'degrading';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(recentMetrics, averageProcessingTime);

    return {
      totalOperations,
      averageProcessingTime,
      maxProcessingTime,
      minProcessingTime,
      successRate,
      performanceTrend,
      recommendations,
      recentMetrics
    };
  }

  /**
   * Generate performance optimization recommendations
   */
  private generateRecommendations(metrics: PerformanceMetrics[], averageTime: number): string[] {
    const recommendations: string[] = [];

    // Check for slow operations
    const slowOperations = metrics.filter(m => m.duration > this.getThresholdForOperation(m.operation));
    if (slowOperations.length > 0) {
      recommendations.push(`Consider optimizing ${slowOperations.map(m => m.operation).join(', ')} operations`);
    }

    // Check for high item counts
    const highItemCountOperations = metrics.filter(m => m.itemCount > 50);
    if (highItemCountOperations.length > 0) {
      recommendations.push('Consider implementing pagination or batching for large datasets');
    }

    // Check for error rates
    const errorRate = metrics.filter(m => !m.success).length / metrics.length;
    if (errorRate > 0.1) {
      recommendations.push('High error rate detected - investigate error handling');
    }

    // Check for memory usage patterns
    const memoryIntensiveOperations = metrics.filter(m => m.metadata?.memoryUsage > 50);
    if (memoryIntensiveOperations.length > 0) {
      recommendations.push('Consider memory optimization for large item processing');
    }

    // Check for cache performance
    const cacheMetrics = metrics.filter(m => m.operation.startsWith('cache_'));
    if (cacheMetrics.length > 0) {
      const cacheHitRate = cacheMetrics.filter(m => m.metadata?.cacheHit).length / cacheMetrics.length;
      if (cacheHitRate < 0.7) {
        recommendations.push('Low cache hit rate - consider improving cache strategy');
      }
    }

    // Check for parallel processing efficiency
    const parallelMetrics = metrics.filter(m => m.operation.startsWith('parallel_'));
    if (parallelMetrics.length > 0) {
      const avgParallelTasks = parallelMetrics.reduce((sum, m) => sum + (m.metadata?.parallelTasks || 0), 0) / parallelMetrics.length;
      if (avgParallelTasks < 2) {
        recommendations.push('Consider increasing parallel processing for better performance');
      }
    }

    // Check for bottleneck patterns
    const bottleneckMetrics = metrics.filter(m => m.operation.startsWith('bottleneck_'));
    if (bottleneckMetrics.length > 0) {
      const commonBottlenecks = bottleneckMetrics.reduce((acc, m) => {
        const stage = m.metadata?.bottleneckStage;
        if (stage) {
          acc[stage] = (acc[stage] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonBottleneck = Object.entries(commonBottlenecks).sort(([,a], [,b]) => b - a)[0];
      if (mostCommonBottleneck && mostCommonBottleneck[1] > 3) {
        recommendations.push(`Frequent bottleneck in ${mostCommonBottleneck[0]} - consider optimization`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges');
    }

    return recommendations;
  }

  /**
   * Get current performance status
   */
  getPerformanceStatus(): 'excellent' | 'good' | 'warning' | 'critical' {
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length === 0) return 'good';

    const averageTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const maxThreshold = this.thresholds.maxTotalProcessingTime;

    if (averageTime < maxThreshold * 0.5) return 'excellent';
    if (averageTime < maxThreshold * 0.8) return 'good';
    if (averageTime < maxThreshold) return 'warning';
    return 'critical';
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Record performance metric for enhanced detection pipeline
 */
export function recordEnhancedDetectionPerformance(
  result: EnhancedDetectionResult,
  itemCount: number
): void {
  performanceMonitor.recordMetric({
    operation: 'total_processing',
    duration: result.processingMetrics.totalProcessingTime,
    itemCount,
    success: result.success,
    error: result.error,
    metadata: {
      categoryFilteringTime: result.processingMetrics.categoryFilteringTime,
      spatialAnalysisTime: result.processingMetrics.spatialAnalysisTime,
      overlapResolutionTime: result.processingMetrics.overlapResolutionTime,
      filteringEfficiency: result.processingMetrics.filteringStats.kept / result.processingMetrics.filteringStats.total,
      relationshipsFound: result.processingMetrics.spatialStats.relationshipsFound,
      conflictsResolved: result.processingMetrics.conflictStats.resolvedConflicts
    }
  });

  // Record individual stage metrics
  performanceMonitor.recordMetric({
    operation: 'category_filtering',
    duration: result.processingMetrics.categoryFilteringTime,
    itemCount: result.processingMetrics.filteringStats.total,
    success: true,
    metadata: {
      filtered: result.processingMetrics.filteringStats.filtered,
      kept: result.processingMetrics.filteringStats.kept
    }
  });

  performanceMonitor.recordMetric({
    operation: 'spatial_analysis',
    duration: result.processingMetrics.spatialAnalysisTime,
    itemCount: result.processingMetrics.spatialStats.itemsFiltered,
    success: true,
    metadata: {
      relationshipsFound: result.processingMetrics.spatialStats.relationshipsFound
    }
  });

  performanceMonitor.recordMetric({
    operation: 'overlap_resolution',
    duration: result.processingMetrics.overlapResolutionTime,
    itemCount: result.items.length,
    success: true,
    metadata: {
      conflictsResolved: result.processingMetrics.conflictStats.resolvedConflicts
    }
  });
}

/**
 * Record performance metric for API operations
 */
export function recordApiPerformance(
  operation: string,
  duration: number,
  success: boolean,
  itemCount: number = 0,
  error?: string
): void {
  performanceMonitor.recordMetric({
    operation,
    duration,
    itemCount,
    success,
    error
  });
}

/**
 * Record performance metric for caching operations
 */
export function recordCachePerformance(
  operation: string,
  duration: number,
  cacheHit: boolean,
  cacheSize: number,
  itemCount: number = 0
): void {
  performanceMonitor.recordMetric({
    operation: `cache_${operation}`,
    duration,
    itemCount,
    success: true,
    metadata: {
      cacheHit,
      cacheSize
    }
  });
}

/**
 * Record performance metric for parallel processing operations
 */
export function recordParallelProcessingPerformance(
  operation: string,
  duration: number,
  parallelTasks: number,
  itemCount: number = 0,
  success: boolean = true
): void {
  performanceMonitor.recordMetric({
    operation: `parallel_${operation}`,
    duration,
    itemCount,
    success,
    metadata: {
      parallelTasks
    }
  });
}

/**
 * Record performance metric for bottleneck identification
 */
export function recordBottleneckPerformance(
  operation: string,
  duration: number,
  bottleneckStage: string,
  itemCount: number = 0
): void {
  performanceMonitor.recordMetric({
    operation: `bottleneck_${operation}`,
    duration,
    itemCount,
    success: true,
    metadata: {
      bottleneckStage
    }
  });
}

/**
 * Record performance metric for optimization operations
 */
export function recordOptimizationPerformance(
  operation: string,
  duration: number,
  optimizationApplied: string[],
  itemCount: number = 0
): void {
  performanceMonitor.recordMetric({
    operation: `optimization_${operation}`,
    duration,
    itemCount,
    success: true,
    metadata: {
      optimizationApplied
    }
  });
}

/**
 * Get current performance report
 */
export function getPerformanceReport(): PerformanceReport {
  return performanceMonitor.generateReport();
}

/**
 * Get current performance status
 */
export function getPerformanceStatus(): 'excellent' | 'good' | 'warning' | 'critical' {
  return performanceMonitor.getPerformanceStatus();
}

/**
 * Optimize processing based on performance metrics
 */
export function optimizeProcessing(
  items: DetectedItem[],
  currentConfig: any
): OptimizationResult {
  const report = getPerformanceReport();
  const optimizationsApplied: string[] = [];
  let performanceGain = 0;
  let newProcessingTime = 0;

  // Optimization 1: Reduce item count for large datasets
  if (items.length > 100) {
    optimizationsApplied.push('Large dataset detected - consider pagination');
    performanceGain += 20;
  }

  // Optimization 2: Adjust confidence thresholds based on performance
  if (report.averageProcessingTime > 2000) {
    optimizationsApplied.push('High processing time - increasing confidence thresholds');
    performanceGain += 15;
  }

  // Optimization 3: Optimize spatial analysis for high relationship counts
  const recentMetrics = report.recentMetrics.filter(m => m.operation === 'spatial_analysis');
  const avgRelationships = recentMetrics.reduce((sum, m) => sum + (m.metadata?.relationshipsFound || 0), 0) / recentMetrics.length;
  
  if (avgRelationships > 20) {
    optimizationsApplied.push('High relationship count - optimizing spatial analysis');
    performanceGain += 10;
  }

  // Calculate estimated new processing time
  const currentAvgTime = report.averageProcessingTime;
  newProcessingTime = currentAvgTime * (1 - performanceGain / 100);

  return {
    optimized: optimizationsApplied.length > 0,
    optimizationsApplied,
    performanceGain,
    newProcessingTime: Math.max(newProcessingTime, 100) // Minimum 100ms
  };
}

/**
 * Check if processing should be optimized
 */
export function shouldOptimizeProcessing(): boolean {
  const status = getPerformanceStatus();
  return status === 'warning' || status === 'critical';
}

/**
 * Get performance thresholds
 */
export function getPerformanceThresholds(): PerformanceThresholds {
  return defaultThresholds;
}

/**
 * Update performance thresholds
 */
export function updatePerformanceThresholds(thresholds: Partial<PerformanceThresholds>): void {
  performanceMonitor.updateThresholds(thresholds);
}

export { performanceMonitor };

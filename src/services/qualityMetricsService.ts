import { DetectedItem } from './realAiService';

/**
 * Detection Quality Metrics Service
 * 
 * This service provides comprehensive quality monitoring for object detection,
 * including precision, recall, F1-score calculations, confidence analysis,
 * trend tracking, and quality recommendations.
 */

export interface QualityMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  confidenceStats: ConfidenceStatistics;
  processingTime: number;
  timestamp: Date;
}

export interface ConfidenceStatistics {
  mean: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  outlierCount: number;
}

export interface QualityTrend {
  precisionTrend: 'improving' | 'declining' | 'stable';
  recallTrend: 'improving' | 'declining' | 'stable';
  f1ScoreTrend: 'improving' | 'declining' | 'stable';
  trendStrength: number; // -1 to 1, where 1 is strong improvement
}

export interface QualityAlert {
  type: 'low_confidence' | 'slow_processing' | 'low_precision' | 'low_recall' | 'high_variance';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
  timestamp: Date;
}

export interface DetectionResult {
  items: DetectedItem[];
  processingTime: number;
  success: boolean;
  timestamp?: Date;
}

/**
 * Calculate precision: True Positives / (True Positives + False Positives)
 */
export function calculatePrecision(truePositives: number, falsePositives: number): number {
  if (truePositives + falsePositives === 0) {
    return 0;
  }
  return truePositives / (truePositives + falsePositives);
}

/**
 * Calculate recall: True Positives / (True Positives + False Negatives)
 */
export function calculateRecall(truePositives: number, falseNegatives: number): number {
  if (truePositives + falseNegatives === 0) {
    return 0;
  }
  return truePositives / (truePositives + falseNegatives);
}

/**
 * Calculate F1-score: 2 * (Precision * Recall) / (Precision + Recall)
 */
export function calculateF1Score(precision: number, recall: number): number {
  if (precision + recall === 0) {
    return 0;
  }
  return 2 * (precision * recall) / (precision + recall);
}

/**
 * Calculate comprehensive confidence statistics for detected items
 */
export function calculateConfidenceStatistics(items: DetectedItem[]): ConfidenceStatistics {
  if (items.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      standardDeviation: 0,
      outlierCount: 0
    };
  }

  const confidences = items.map(item => item.confidence).sort((a, b) => a - b);
  
  // Calculate mean
  const mean = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  
  // Calculate median
  const median = confidences.length % 2 === 0
    ? (confidences[confidences.length / 2 - 1] + confidences[confidences.length / 2]) / 2
    : confidences[Math.floor(confidences.length / 2)];
  
  // Calculate min and max
  const min = Math.min(...confidences);
  const max = Math.max(...confidences);
  
  // Calculate standard deviation
  const variance = confidences.reduce((sum, conf) => sum + Math.pow(conf - mean, 2), 0) / confidences.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Detect outliers (using 2 standard deviations from mean)
  const outlierThreshold = 2 * standardDeviation;
  const outlierCount = confidences.filter(conf => Math.abs(conf - mean) > outlierThreshold).length;
  
  return {
    mean,
    median,
    min,
    max,
    standardDeviation,
    outlierCount
  };
}

/**
 * Detect items with outlier confidence scores
 */
export function detectConfidenceOutliers(items: DetectedItem[]): DetectedItem[] {
  if (items.length < 3) {
    return []; // Need at least 3 items to detect outliers
  }
  
  const stats = calculateConfidenceStatistics(items);
  const outlierThreshold = 2 * stats.standardDeviation;
  
  return items.filter(item => 
    Math.abs(item.confidence - stats.mean) > outlierThreshold
  );
}

/**
 * Calculate quality trend from historical data
 */
export function calculateQualityTrend(qualityHistory: QualityMetrics[]): QualityTrend {
  if (qualityHistory.length < 2) {
    return {
      precisionTrend: 'stable',
      recallTrend: 'stable',
      f1ScoreTrend: 'stable',
      trendStrength: 0
    };
  }
  
  // Calculate trend for each metric
  const precisionTrend = calculateMetricTrend(qualityHistory.map(h => h.precision));
  const recallTrend = calculateMetricTrend(qualityHistory.map(h => h.recall));
  const f1ScoreTrend = calculateMetricTrend(qualityHistory.map(h => h.f1Score));
  
  // Calculate overall trend strength
  const trendStrength = (precisionTrend.strength + recallTrend.strength + f1ScoreTrend.strength) / 3;
  
  return {
    precisionTrend: precisionTrend.direction,
    recallTrend: recallTrend.direction,
    f1ScoreTrend: f1ScoreTrend.direction,
    trendStrength
  };
}

/**
 * Helper function to calculate trend for a single metric
 */
function calculateMetricTrend(values: number[]): { direction: 'improving' | 'declining' | 'stable', strength: number } {
  if (values.length < 2) {
    return { direction: 'stable', strength: 0 };
  }
  
  // Calculate linear regression slope
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Determine direction and strength
  const threshold = 0.01; // Minimum change to be considered significant
  if (Math.abs(slope) < threshold) {
    return { direction: 'stable', strength: 0 };
  }
  
  const strength = Math.min(Math.abs(slope) * 10, 1); // Normalize to 0-1
  
  return {
    direction: slope > 0 ? 'improving' : 'declining',
    strength
  };
}

/**
 * Generate quality recommendations based on current metrics
 */
export function generateQualityRecommendations(qualityMetrics: QualityMetrics): string[] {
  const recommendations: string[] = [];
  
  // Precision recommendations
  if (qualityMetrics.precision < 0.7) {
    recommendations.push('Consider increasing confidence thresholds to reduce false positives');
    recommendations.push('Review category filtering rules for better precision');
  }
  
  // Recall recommendations
  if (qualityMetrics.recall < 0.7) {
    recommendations.push('Consider lowering confidence thresholds to catch more true positives');
    recommendations.push('Review filtering rules that might be too restrictive');
  }
  
  // Confidence variance recommendations
  if (qualityMetrics.confidenceStats.standardDeviation > 0.2) {
    recommendations.push('High confidence variance detected - consider reviewing detection consistency');
  }
  
  // Processing time recommendations
  if (qualityMetrics.processingTime > 3000) {
    recommendations.push('Processing time exceeds target - consider optimizing detection pipeline');
  }
  
  // Outlier recommendations
  if (qualityMetrics.confidenceStats.outlierCount > qualityMetrics.confidenceStats.mean * 0.3) {
    recommendations.push('High number of confidence outliers detected - review detection quality');
  }
  
  return recommendations;
}

/**
 * Real-time Quality Metrics Tracker
 * 
 * This class tracks quality metrics over time and provides real-time monitoring
 */
export class QualityMetricsTracker {
  private qualityHistory: QualityMetrics[] = [];
  private maxHistorySize = 100; // Keep last 100 measurements
  
  /**
   * Record a detection result and calculate quality metrics
   */
  recordDetectionResult(result: DetectionResult): void {
    const timestamp = result.timestamp || new Date();
    const confidenceStats = calculateConfidenceStatistics(result.items);
    
    // For now, we'll use mock precision/recall values
    // In a real implementation, these would be calculated based on ground truth
    const mockPrecision = this.calculateMockPrecision(result.items);
    const mockRecall = this.calculateMockRecall(result.items);
    const f1Score = calculateF1Score(mockPrecision, mockRecall);
    
    const qualityMetrics: QualityMetrics = {
      precision: mockPrecision,
      recall: mockRecall,
      f1Score,
      confidenceStats,
      processingTime: result.processingTime,
      timestamp
    };
    
    this.qualityHistory.push(qualityMetrics);
    
    // Keep only the most recent measurements
    if (this.qualityHistory.length > this.maxHistorySize) {
      this.qualityHistory = this.qualityHistory.slice(-this.maxHistorySize);
    }
  }
  
  /**
   * Get current quality metrics summary
   */
  getCurrentMetrics(): {
    totalDetections: number;
    averagePrecision: number;
    averageRecall: number;
    averageF1Score: number;
    averageConfidence: number;
    averageProcessingTime: number;
    lastUpdate: Date | null;
  } {
    if (this.qualityHistory.length === 0) {
      return {
        totalDetections: 0,
        averagePrecision: 0,
        averageRecall: 0,
        averageF1Score: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        lastUpdate: null
      };
    }
    
    const latest = this.qualityHistory[this.qualityHistory.length - 1];
    
    return {
      totalDetections: this.qualityHistory.length,
      averagePrecision: latest.precision,
      averageRecall: latest.recall,
      averageF1Score: latest.f1Score,
      averageConfidence: latest.confidenceStats.mean,
      averageProcessingTime: latest.processingTime,
      lastUpdate: latest.timestamp
    };
  }
  
  /**
   * Get quality alerts based on current metrics
   */
  getQualityAlerts(): QualityAlert[] {
    const alerts: QualityAlert[] = [];
    
    if (this.qualityHistory.length === 0) {
      return alerts;
    }
    
    const latest = this.qualityHistory[this.qualityHistory.length - 1];
    
    // Low confidence alert
    if (latest.confidenceStats.mean < 0.6) {
      alerts.push({
        type: 'low_confidence',
        severity: 'medium',
        message: `Average confidence is low: ${(latest.confidenceStats.mean * 100).toFixed(1)}%`,
        recommendation: 'Consider improving image quality or adjusting detection parameters',
        timestamp: latest.timestamp
      });
    }
    
    // Slow processing alert
    if (latest.processingTime > 3000) {
      alerts.push({
        type: 'slow_processing',
        severity: 'high',
        message: `Processing time is slow: ${latest.processingTime}ms`,
        recommendation: 'Consider optimizing detection pipeline or reducing image complexity',
        timestamp: latest.timestamp
      });
    }
    
    // Low precision alert
    if (latest.precision < 0.7) {
      alerts.push({
        type: 'low_precision',
        severity: 'medium',
        message: `Precision is low: ${(latest.precision * 100).toFixed(1)}%`,
        recommendation: 'Review filtering rules and confidence thresholds',
        timestamp: latest.timestamp
      });
    }
    
    // Low recall alert
    if (latest.recall < 0.7) {
      alerts.push({
        type: 'low_recall',
        severity: 'medium',
        message: `Recall is low: ${(latest.recall * 100).toFixed(1)}%`,
        recommendation: 'Consider lowering confidence thresholds or relaxing filtering rules',
        timestamp: latest.timestamp
      });
    }
    
    // High variance alert
    if (latest.confidenceStats.standardDeviation > 0.2) {
      alerts.push({
        type: 'high_variance',
        severity: 'low',
        message: `High confidence variance detected: ${(latest.confidenceStats.standardDeviation * 100).toFixed(1)}%`,
        recommendation: 'Review detection consistency and image quality',
        timestamp: latest.timestamp
      });
    }
    
    return alerts;
  }
  
  /**
   * Get quality trend analysis
   */
  getQualityTrend(): QualityTrend {
    return calculateQualityTrend(this.qualityHistory);
  }
  
  /**
   * Get quality recommendations
   */
  getQualityRecommendations(): string[] {
    if (this.qualityHistory.length === 0) {
      return [];
    }
    
    const latest = this.qualityHistory[this.qualityHistory.length - 1];
    return generateQualityRecommendations(latest);
  }
  
  /**
   * Mock precision calculation based on confidence and category filtering
   * In a real implementation, this would compare against ground truth
   */
  private calculateMockPrecision(items: DetectedItem[]): number {
    if (items.length === 0) return 0;
    
    // Higher confidence items are more likely to be true positives
    const avgConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
    
    // Items with higher confidence and better categories get higher precision
    const categoryBonus = items.filter(item => 
      ['Electronics', 'Accessories', 'Clothing'].includes(item.category)
    ).length / items.length;
    
    return Math.min(0.95, avgConfidence + categoryBonus * 0.1);
  }
  
  /**
   * Mock recall calculation based on item count and processing time
   * In a real implementation, this would compare against ground truth
   */
  private calculateMockRecall(items: DetectedItem[]): number {
    if (items.length === 0) return 0;
    
    // More items detected suggests better recall
    const itemCountBonus = Math.min(0.2, items.length * 0.05);
    
    // Higher confidence items suggest better recall
    const avgConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
    
    return Math.min(0.95, avgConfidence + itemCountBonus);
  }
}

// Export singleton instance
export const qualityMetricsTracker = new QualityMetricsTracker();
export default qualityMetricsTracker;

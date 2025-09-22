import { DetectedItem } from './realAiService';
import { QualityMetrics } from './qualityMetricsService';

// Interfaces for dynamic threshold adjustment
export interface DetectionContext {
  imageQuality: 'high' | 'medium' | 'low';
  lighting: 'excellent' | 'good' | 'poor';
  itemCount: number;
  averageConfidence: number;
  categoryDistribution: Record<string, number>;
}

export interface CategoryPerformance {
  precision: number;
  recall: number;
  f1Score: number;
  sampleCount: number;
}

export interface UserFeedback {
  itemId: string;
  userAction: 'accepted' | 'rejected' | 'modified';
  confidence: number;
  category: string;
  timestamp: Date;
}

export interface ThresholdHistoryEntry {
  timestamp: Date;
  thresholds: Record<string, number>;
  reason: string;
  performanceMetrics?: QualityMetrics;
}

export interface ThresholdTrend {
  overallTrend: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number; // 0-1, where 1 is strong trend
  [category: string]: 'increasing' | 'decreasing' | 'stable' | number;
}

export interface ThresholdAdjustmentResult {
  updatedThresholds: Record<string, number>;
  adjustments: Array<{
    category: string;
    oldThreshold: number;
    newThreshold: number;
    reason: string;
  }>;
  confidence: number; // Confidence in the adjustments (0-1)
}

// Default thresholds for different categories
const DEFAULT_THRESHOLDS: Record<string, number> = {
  'Accessories': 0.7,
  'Electronics': 0.75,
  'Clothing': 0.65,
  'Furniture': 0.8,
  'Books': 0.6,
  'Sports': 0.65,
  'Home': 0.7,
  'Body Part': 0.9, // High threshold to filter out body parts
  'default': 0.65,
};

// Category priority weights for threshold adjustment
const CATEGORY_PRIORITY_WEIGHTS: Record<string, number> = {
  'Accessories': 1.2, // Higher priority, can have slightly lower thresholds
  'Electronics': 1.1,
  'Clothing': 1.0,
  'Books': 0.9,
  'Sports': 0.9,
  'Home': 0.8,
  'Furniture': 0.7, // Lower priority, higher thresholds
  'Body Part': 0.5, // Lowest priority, highest thresholds
  'default': 1.0,
};

/**
 * Calculates adaptive threshold based on detection context
 */
export function calculateAdaptiveThreshold(context: DetectionContext): number {
  let baseThreshold = DEFAULT_THRESHOLDS.default;

  // Adjust based on image quality
  const qualityMultiplier = {
    'high': 0.9,    // Lower threshold for high-quality images
    'medium': 1.0,  // No adjustment
    'low': 1.1,     // Higher threshold for low-quality images
  }[context.imageQuality];

  // Adjust based on lighting
  const lightingMultiplier = {
    'excellent': 0.9,  // Lower threshold for excellent lighting
    'good': 1.0,       // No adjustment
    'poor': 1.15,      // Higher threshold for poor lighting
  }[context.lighting];

  // Adjust based on item count (more items = lower threshold to catch more)
  const itemCountMultiplier = Math.max(0.8, Math.min(1.2, 1.0 - (context.itemCount - 3) * 0.05));

  // Adjust based on average confidence
  const confidenceMultiplier = Math.max(0.7, Math.min(1.3, 1.0 - (context.averageConfidence - 0.7) * 0.5));

  const adaptiveThreshold = baseThreshold * qualityMultiplier * lightingMultiplier * itemCountMultiplier * confidenceMultiplier;

  // Ensure threshold is within reasonable bounds
  return Math.max(0.3, Math.min(0.95, adaptiveThreshold));
}

/**
 * Adjusts threshold for a specific category based on historical performance
 */
export function adjustThresholdForCategory(
  baseThreshold: number,
  category: string,
  historicalPerformance: CategoryPerformance
): number {
  const categoryWeight = CATEGORY_PRIORITY_WEIGHTS[category] || CATEGORY_PRIORITY_WEIGHTS.default;
  let adjustedThreshold = baseThreshold * categoryWeight;

  // Adjust based on precision (if precision is low, raise threshold)
  if (historicalPerformance.precision < 0.7) {
    adjustedThreshold *= 1.1; // Raise threshold by 10%
  } else if (historicalPerformance.precision > 0.9) {
    adjustedThreshold *= 0.95; // Lower threshold by 5%
  }

  // Adjust based on recall (if recall is low, lower threshold)
  if (historicalPerformance.recall < 0.7) {
    adjustedThreshold *= 0.9; // Lower threshold by 10%
  } else if (historicalPerformance.recall > 0.9) {
    adjustedThreshold *= 1.05; // Raise threshold by 5%
  }

  // Adjust based on sample count (more samples = more confidence in adjustment)
  const sampleConfidence = Math.min(1.0, historicalPerformance.sampleCount / 100);
  const adjustmentStrength = 0.1 * sampleConfidence;

  // Apply final adjustment based on F1 score
  if (historicalPerformance.f1Score < 0.7) {
    adjustedThreshold *= (1 - adjustmentStrength);
  } else if (historicalPerformance.f1Score > 0.9) {
    adjustedThreshold *= (1 + adjustmentStrength);
  }

  // Ensure threshold is within reasonable bounds
  return Math.max(0.3, Math.min(0.95, adjustedThreshold));
}

/**
 * Learns from user feedback to adjust thresholds
 */
export function learnFromUserFeedback(
  feedback: UserFeedback,
  currentThresholds: Record<string, number>
): Record<string, number> {
  const updatedThresholds = { ...currentThresholds };
  const category = feedback.category;
  const categoryThreshold = updatedThresholds[category] || updatedThresholds.default;

  // Learning rate based on confidence and recency
  const learningRate = 0.05; // 5% adjustment per feedback
  const confidenceFactor = Math.abs(feedback.confidence - categoryThreshold) / categoryThreshold;
  const adjustedLearningRate = learningRate * Math.min(1.0, confidenceFactor * 2);

  if (feedback.userAction === 'accepted') {
    // If user accepted an item with confidence below threshold, lower the threshold
    if (feedback.confidence < categoryThreshold) {
      updatedThresholds[category] = Math.max(0.3, categoryThreshold - adjustedLearningRate);
    }
    // If user accepted an item with high confidence, slightly raise threshold
    else if (feedback.confidence > categoryThreshold + 0.1) {
      updatedThresholds[category] = Math.min(0.95, categoryThreshold + adjustedLearningRate * 0.5);
    }
  } else if (feedback.userAction === 'rejected') {
    // If user rejected an item above threshold, raise the threshold
    if (feedback.confidence >= categoryThreshold) {
      updatedThresholds[category] = Math.min(0.95, categoryThreshold + adjustedLearningRate);
    }
    // If user rejected an item below threshold, slightly lower threshold
    else if (feedback.confidence < categoryThreshold - 0.1) {
      updatedThresholds[category] = Math.max(0.3, categoryThreshold - adjustedLearningRate * 0.5);
    }
  }

  return updatedThresholds;
}

/**
 * Gets optimal thresholds based on quality metrics
 */
export function getOptimalThresholds(qualityMetrics: QualityMetrics): Record<string, number> {
  const optimalThresholds: Record<string, number> = {};

  // Base threshold calculation from overall metrics
  let baseThreshold = DEFAULT_THRESHOLDS.default;

  // Adjust based on precision (low precision = higher threshold)
  if (qualityMetrics.precision < 0.7) {
    baseThreshold *= 1.15;
  } else if (qualityMetrics.precision > 0.9) {
    baseThreshold *= 0.9;
  }

  // Adjust based on recall (low recall = lower threshold)
  if (qualityMetrics.recall < 0.7) {
    baseThreshold *= 0.85;
  } else if (qualityMetrics.recall > 0.9) {
    baseThreshold *= 1.05;
  }

  // Adjust based on confidence statistics
  const confidenceMean = qualityMetrics.confidenceStats.mean;
  if (confidenceMean < 0.6) {
    baseThreshold *= 0.8; // Lower threshold for low confidence
  } else if (confidenceMean > 0.9) {
    baseThreshold *= 1.1; // Higher threshold for high confidence
  }

  // Adjust based on confidence variance (high variance = more conservative threshold)
  const confidenceVariance = qualityMetrics.confidenceStats.standardDeviation;
  if (confidenceVariance > 0.2) {
    baseThreshold *= 1.1;
  }

  // Calculate category-specific thresholds
  Object.keys(DEFAULT_THRESHOLDS).forEach(category => {
    if (category === 'default') return;

    const categoryWeight = CATEGORY_PRIORITY_WEIGHTS[category] || 1.0;
    optimalThresholds[category] = Math.max(0.3, Math.min(0.95, baseThreshold * categoryWeight));
  });

  optimalThresholds.default = Math.max(0.3, Math.min(0.95, baseThreshold));

  return optimalThresholds;
}

/**
 * Updates thresholds based on recent quality metrics
 */
export function updateThresholdBasedOnMetrics(
  recentMetrics: QualityMetrics[],
  currentThresholds: Record<string, number>
): Record<string, number> {
  if (recentMetrics.length < 2) {
    return currentThresholds; // Need at least 2 data points for trend analysis
  }

  const updatedThresholds = { ...currentThresholds };

  // Calculate trend in quality metrics
  const latestMetrics = recentMetrics[recentMetrics.length - 1];
  const previousMetrics = recentMetrics[recentMetrics.length - 2];

  const precisionTrend = latestMetrics.precision - previousMetrics.precision;
  const recallTrend = latestMetrics.recall - previousMetrics.recall;
  const f1Trend = latestMetrics.f1Score - previousMetrics.f1Score;

  // Adjust thresholds based on trends
  const adjustmentFactor = 0.05; // 5% adjustment per update

  Object.keys(updatedThresholds).forEach(category => {
    let adjustment = 0;

    // If precision is declining, raise threshold
    if (precisionTrend < -0.05) {
      adjustment += adjustmentFactor;
    }
    // If precision is improving, lower threshold slightly
    else if (precisionTrend > 0.05) {
      adjustment -= adjustmentFactor * 0.5;
    }

    // If recall is declining, lower threshold
    if (recallTrend < -0.05) {
      adjustment -= adjustmentFactor;
    }
    // If recall is improving, raise threshold slightly
    else if (recallTrend > 0.05) {
      adjustment += adjustmentFactor * 0.5;
    }

    // Apply adjustment
    const newThreshold = updatedThresholds[category] * (1 + adjustment);
    updatedThresholds[category] = Math.max(0.3, Math.min(0.95, newThreshold));
  });

  return updatedThresholds;
}

/**
 * Calculates threshold trend over time
 */
export function calculateThresholdTrend(thresholdHistory: ThresholdHistoryEntry[]): ThresholdTrend {
  if (thresholdHistory.length < 2) {
    return {
      overallTrend: 'stable',
      trendStrength: 0,
    };
  }

  const trend: ThresholdTrend = {
    overallTrend: 'stable',
    trendStrength: 0,
  };

  // Get all categories that have been tracked
  const allCategories = new Set<string>();
  thresholdHistory.forEach(entry => {
    Object.keys(entry.thresholds).forEach(category => {
      allCategories.add(category);
    });
  });

  let totalTrendStrength = 0;
  let categoryCount = 0;

  allCategories.forEach(category => {
    const categoryTrends: number[] = [];
    
    for (let i = 1; i < thresholdHistory.length; i++) {
      const current = thresholdHistory[i].thresholds[category];
      const previous = thresholdHistory[i - 1].thresholds[category];
      
      if (current !== undefined && previous !== undefined) {
        categoryTrends.push(current - previous);
      }
    }

    if (categoryTrends.length > 0) {
      const averageTrend = categoryTrends.reduce((sum, t) => sum + t, 0) / categoryTrends.length;
      const trendStrength = Math.abs(averageTrend) / 0.1; // Normalize by 0.1 threshold change
      
      if (averageTrend > 0.01) {
        trend[category] = 'increasing';
      } else if (averageTrend < -0.01) {
        trend[category] = 'decreasing';
      } else {
        trend[category] = 'stable';
      }

      totalTrendStrength += Math.min(1.0, trendStrength);
      categoryCount++;
    } else {
      trend[category] = 'stable';
    }
  });

  // Calculate overall trend
  const increasingCategories = Object.values(trend).filter(t => t === 'increasing').length;
  const decreasingCategories = Object.values(trend).filter(t => t === 'decreasing').length;

  if (increasingCategories > decreasingCategories) {
    trend.overallTrend = 'increasing';
  } else if (decreasingCategories > increasingCategories) {
    trend.overallTrend = 'decreasing';
  } else {
    trend.overallTrend = 'stable';
  }

  trend.trendStrength = categoryCount > 0 ? totalTrendStrength / categoryCount : 0;

  return trend;
}

/**
 * Dynamic Threshold Manager class for managing threshold adjustments
 */
export class DynamicThresholdManager {
  private thresholds: Record<string, number>;
  private thresholdHistory: ThresholdHistoryEntry[];
  private userFeedbackHistory: UserFeedback[];
  private categoryPerformance: Map<string, CategoryPerformance>;
  private maxHistoryLength: number = 100;

  constructor(initialThresholds?: Record<string, number>) {
    this.thresholds = initialThresholds || { ...DEFAULT_THRESHOLDS };
    this.thresholdHistory = [];
    this.userFeedbackHistory = [];
    this.categoryPerformance = new Map();

    // Initialize history with current thresholds
    this.recordThresholdUpdate('initialization', 'Initial threshold setup');
  }

  /**
   * Gets current thresholds
   */
  getCurrentThresholds(): Record<string, number> {
    return { ...this.thresholds };
  }

  /**
   * Updates thresholds with a reason
   */
  updateThresholds(newThresholds: Record<string, number>, reason: string, performanceMetrics?: QualityMetrics): void {
    this.thresholds = { ...newThresholds };
    this.recordThresholdUpdate(reason, `Threshold update: ${reason}`, performanceMetrics);
  }

  /**
   * Records a detection result for learning
   */
  recordDetectionResult(result: { items: DetectedItem[]; processingTime: number; success: boolean; timestamp: Date }): void {
    // Update category performance based on detection results
    result.items.forEach(item => {
      const category = item.category;
      const currentPerf = this.categoryPerformance.get(category) || {
        precision: 0.8,
        recall: 0.8,
        f1Score: 0.8,
        sampleCount: 0,
      };

      // Simple performance update (in a real implementation, this would be more sophisticated)
      currentPerf.sampleCount++;
      this.categoryPerformance.set(category, currentPerf);
    });
  }

  /**
   * Records user feedback for learning
   */
  recordUserFeedback(feedback: UserFeedback): void {
    this.userFeedbackHistory.push(feedback);
    
    // Keep only recent feedback
    if (this.userFeedbackHistory.length > this.maxHistoryLength) {
      this.userFeedbackHistory.shift();
    }

    // Learn from feedback
    this.thresholds = learnFromUserFeedback(feedback, this.thresholds);
    this.recordThresholdUpdate('user_feedback', `User feedback: ${feedback.userAction} for ${feedback.category}`);
  }

  /**
   * Gets threshold history
   */
  getThresholdHistory(): ThresholdHistoryEntry[] {
    return [...this.thresholdHistory];
  }

  /**
   * Gets performance metrics for threshold management
   */
  getPerformanceMetrics(): {
    totalUpdates: number;
    recentUpdates: number;
    categoryPerformance: Map<string, CategoryPerformance>;
    userFeedbackCount: number;
    averageThreshold: number;
  } {
    const recentTime = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    const recentUpdates = this.thresholdHistory.filter(entry => 
      entry.timestamp.getTime() > recentTime
    ).length;

    const thresholdValues = Object.values(this.thresholds);
    const averageThreshold = thresholdValues.reduce((sum, t) => sum + t, 0) / thresholdValues.length;

    return {
      totalUpdates: this.thresholdHistory.length,
      recentUpdates,
      categoryPerformance: new Map(this.categoryPerformance),
      userFeedbackCount: this.userFeedbackHistory.length,
      averageThreshold,
    };
  }

  /**
   * Records a threshold update in history
   */
  private recordThresholdUpdate(reason: string, description: string, performanceMetrics?: QualityMetrics): void {
    this.thresholdHistory.push({
      timestamp: new Date(),
      thresholds: { ...this.thresholds },
      reason: description,
      performanceMetrics,
    });

    // Keep only recent history
    if (this.thresholdHistory.length > this.maxHistoryLength) {
      this.thresholdHistory.shift();
    }
  }
}

// Export a default instance
export const dynamicThresholdManager = new DynamicThresholdManager();

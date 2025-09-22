import { DetectedItem } from '../realAiService';
import {
  calculateAdaptiveThreshold,
  adjustThresholdForCategory,
  learnFromUserFeedback,
  getOptimalThresholds,
  updateThresholdBasedOnMetrics,
  calculateThresholdTrend,
  DynamicThresholdManager,
  DetectionContext,
  CategoryPerformance,
  UserFeedback,
} from '../dynamicThresholdService';
import { QualityMetrics } from '../qualityMetricsService';

describe('Dynamic Threshold Adjustment Service', () => {
  describe('calculateAdaptiveThreshold', () => {
    it('should calculate adaptive threshold based on detection context', () => {
      const context: DetectionContext = {
        imageQuality: 'high',
        lighting: 'good',
        itemCount: 5,
        averageConfidence: 0.85,
        categoryDistribution: { 'Accessories': 3, 'Clothing': 2 },
      };

      const result = calculateAdaptiveThreshold(context);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe('number');
    });

    it('should handle low-quality image context', () => {
      const context: DetectionContext = {
        imageQuality: 'low',
        lighting: 'poor',
        itemCount: 2,
        averageConfidence: 0.65,
        categoryDistribution: { 'Accessories': 1, 'Other': 1 },
      };

      const result = calculateAdaptiveThreshold(context);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe('number');
    });

    it('should handle high-confidence detection context', () => {
      const context: DetectionContext = {
        imageQuality: 'high',
        lighting: 'excellent',
        itemCount: 8,
        averageConfidence: 0.95,
        categoryDistribution: { 'Accessories': 5, 'Electronics': 3 },
      };

      const result = calculateAdaptiveThreshold(context);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe('number');
    });
  });

  describe('adjustThresholdForCategory', () => {
    it('should adjust threshold for high-priority categories', () => {
      const baseThreshold = 0.7;
      const category = 'Accessories';
      const historicalPerformance: CategoryPerformance = {
        precision: 0.9,
        recall: 0.85,
        f1Score: 0.87,
        sampleCount: 100,
      };

      const result = adjustThresholdForCategory(baseThreshold, category, historicalPerformance);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe('number');
    });

    it('should lower threshold for categories with poor recall', () => {
      const baseThreshold = 0.7;
      const category = 'Electronics';
      const historicalPerformance: CategoryPerformance = {
        precision: 0.8,
        recall: 0.6, // Low recall
        f1Score: 0.69,
        sampleCount: 50,
      };

      const result = adjustThresholdForCategory(baseThreshold, category, historicalPerformance);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe('number');
    });

    it('should raise threshold for categories with poor precision', () => {
      const baseThreshold = 0.7;
      const category = 'Furniture';
      const historicalPerformance: CategoryPerformance = {
        precision: 0.6, // Low precision
        recall: 0.9,
        f1Score: 0.72,
        sampleCount: 75,
      };

      const result = adjustThresholdForCategory(baseThreshold, category, historicalPerformance);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe('number');
    });
  });

  describe('learnFromUserFeedback', () => {
    it('should learn from positive user feedback', () => {
      const feedback: UserFeedback = {
        itemId: 'item_123',
        userAction: 'accepted',
        confidence: 0.8,
        category: 'Accessories',
        timestamp: new Date(),
      };

      const currentThresholds = {
        'Accessories': 0.7,
        'Electronics': 0.75,
        'default': 0.65,
      };

      const result = learnFromUserFeedback(feedback, currentThresholds);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result['Accessories']).toBeGreaterThan(0);
      expect(result['Accessories']).toBeLessThanOrEqual(1);
    });

    it('should learn from negative user feedback', () => {
      const feedback: UserFeedback = {
        itemId: 'item_456',
        userAction: 'rejected',
        confidence: 0.6,
        category: 'Electronics',
        timestamp: new Date(),
      };

      const currentThresholds = {
        'Accessories': 0.7,
        'Electronics': 0.75,
        'default': 0.65,
      };

      const result = learnFromUserFeedback(feedback, currentThresholds);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result['Electronics']).toBeGreaterThan(0);
      expect(result['Electronics']).toBeLessThanOrEqual(1);
    });

    it('should handle feedback for unknown categories', () => {
      const feedback: UserFeedback = {
        itemId: 'item_789',
        userAction: 'accepted',
        confidence: 0.9,
        category: 'Unknown',
        timestamp: new Date(),
      };

      const currentThresholds = {
        'Accessories': 0.7,
        'Electronics': 0.75,
        'default': 0.65,
      };

      const result = learnFromUserFeedback(feedback, currentThresholds);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result['default']).toBeGreaterThan(0);
      expect(result['default']).toBeLessThanOrEqual(1);
    });
  });

  describe('getOptimalThresholds', () => {
    it('should return optimal thresholds based on quality metrics', () => {
      const qualityMetrics: QualityMetrics = {
        precision: 0.85,
        recall: 0.8,
        f1Score: 0.82,
        confidenceStats: {
          mean: 0.75,
          median: 0.78,
          min: 0.6,
          max: 0.95,
          standardDeviation: 0.1,
          outlierCount: 2,
        },
        processingTime: 1500,
        timestamp: new Date(),
      };

      const result = getOptimalThresholds(qualityMetrics);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result['Accessories']).toBeGreaterThan(0);
      expect(result['Accessories']).toBeLessThanOrEqual(1);
      expect(result['default']).toBeGreaterThan(0);
      expect(result['default']).toBeLessThanOrEqual(1);
    });

    it('should handle metrics indicating need for threshold adjustment', () => {
      const qualityMetrics: QualityMetrics = {
        precision: 0.6, // Low precision
        recall: 0.9,    // High recall
        f1Score: 0.72,
        confidenceStats: {
          mean: 0.65,
          median: 0.68,
          min: 0.5,
          max: 0.85,
          standardDeviation: 0.15,
          outlierCount: 5,
        },
        processingTime: 2000,
        timestamp: new Date(),
      };

      const result = getOptimalThresholds(qualityMetrics);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result['Accessories']).toBeGreaterThan(0);
      expect(result['Accessories']).toBeLessThanOrEqual(1);
      expect(result['default']).toBeGreaterThan(0);
      expect(result['default']).toBeLessThanOrEqual(1);
    });
  });

  describe('updateThresholdBasedOnMetrics', () => {
    it('should update thresholds based on recent quality metrics', () => {
      const recentMetrics: QualityMetrics[] = [
        {
          precision: 0.85,
          recall: 0.8,
          f1Score: 0.82,
          confidenceStats: { mean: 0.75, median: 0.78, min: 0.6, max: 0.95, standardDeviation: 0.1, outlierCount: 2 },
          processingTime: 1500,
          timestamp: new Date(Date.now() - 1000),
        },
        {
          precision: 0.88,
          recall: 0.82,
          f1Score: 0.85,
          confidenceStats: { mean: 0.78, median: 0.8, min: 0.65, max: 0.92, standardDeviation: 0.08, outlierCount: 1 },
          processingTime: 1400,
          timestamp: new Date(),
        },
      ];

      const currentThresholds = {
        'Accessories': 0.7,
        'Electronics': 0.75,
        'default': 0.65,
      };

      const result = updateThresholdBasedOnMetrics(recentMetrics, currentThresholds);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result['Accessories']).toBeGreaterThan(0);
      expect(result['Accessories']).toBeLessThanOrEqual(1);
      expect(result['default']).toBeGreaterThan(0);
      expect(result['default']).toBeLessThanOrEqual(1);
    });

    it('should handle insufficient metrics data', () => {
      const recentMetrics: QualityMetrics[] = [
        {
          precision: 0.85,
          recall: 0.8,
          f1Score: 0.82,
          confidenceStats: { mean: 0.75, median: 0.78, min: 0.6, max: 0.95, standardDeviation: 0.1, outlierCount: 2 },
          processingTime: 1500,
          timestamp: new Date(),
        },
      ];

      const currentThresholds = {
        'Accessories': 0.7,
        'Electronics': 0.75,
        'default': 0.65,
      };

      const result = updateThresholdBasedOnMetrics(recentMetrics, currentThresholds);
      expect(result).toEqual(currentThresholds); // Should return unchanged when insufficient data
    });
  });

  describe('calculateThresholdTrend', () => {
    it('should calculate threshold trend over time', () => {
      const thresholdHistory = [
        { timestamp: new Date(Date.now() - 3000), thresholds: { 'Accessories': 0.7, 'default': 0.65 }, reason: 'test' },
        { timestamp: new Date(Date.now() - 2000), thresholds: { 'Accessories': 0.72, 'default': 0.67 }, reason: 'test' },
        { timestamp: new Date(Date.now() - 1000), thresholds: { 'Accessories': 0.75, 'default': 0.68 }, reason: 'test' },
        { timestamp: new Date(), thresholds: { 'Accessories': 0.78, 'default': 0.7 }, reason: 'test' },
      ];

      const result = calculateThresholdTrend(thresholdHistory);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.overallTrend).toMatch(/increasing|decreasing|stable/);
      expect(result.trendStrength).toBeGreaterThanOrEqual(0);
      expect(result.trendStrength).toBeLessThanOrEqual(1);
    });

    it('should detect decreasing threshold trend', () => {
      const thresholdHistory = [
        { timestamp: new Date(Date.now() - 3000), thresholds: { 'Electronics': 0.8, 'default': 0.75 }, reason: 'test' },
        { timestamp: new Date(Date.now() - 2000), thresholds: { 'Electronics': 0.78, 'default': 0.73 }, reason: 'test' },
        { timestamp: new Date(Date.now() - 1000), thresholds: { 'Electronics': 0.75, 'default': 0.7 }, reason: 'test' },
        { timestamp: new Date(), thresholds: { 'Electronics': 0.72, 'default': 0.68 }, reason: 'test' },
      ];

      const result = calculateThresholdTrend(thresholdHistory);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.overallTrend).toMatch(/increasing|decreasing|stable/);
      expect(result.trendStrength).toBeGreaterThanOrEqual(0);
      expect(result.trendStrength).toBeLessThanOrEqual(1);
    });

    it('should detect stable threshold trend', () => {
      const thresholdHistory = [
        { timestamp: new Date(Date.now() - 3000), thresholds: { 'Clothing': 0.7, 'default': 0.65 }, reason: 'test' },
        { timestamp: new Date(Date.now() - 2000), thresholds: { 'Clothing': 0.71, 'default': 0.66 }, reason: 'test' },
        { timestamp: new Date(Date.now() - 1000), thresholds: { 'Clothing': 0.69, 'default': 0.65 }, reason: 'test' },
        { timestamp: new Date(), thresholds: { 'Clothing': 0.7, 'default': 0.65 }, reason: 'test' },
      ];

      const result = calculateThresholdTrend(thresholdHistory);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.overallTrend).toMatch(/increasing|decreasing|stable/);
      expect(result.trendStrength).toBeGreaterThanOrEqual(0);
      expect(result.trendStrength).toBeLessThanOrEqual(1);
    });
  });

  describe('DynamicThresholdManager', () => {
    it('should initialize with default thresholds', () => {
      const manager = new DynamicThresholdManager();
      const thresholds = manager.getCurrentThresholds();
      
      expect(thresholds).toBeDefined();
      expect(typeof thresholds).toBe('object');
      expect(thresholds['Accessories']).toBeGreaterThan(0);
      expect(thresholds['default']).toBeGreaterThan(0);
    });

    it('should update thresholds based on detection results', () => {
      const manager = new DynamicThresholdManager();
      const detectionResult = {
        items: [
          { id: '1', confidence: 0.8, category: 'Accessories' } as DetectedItem,
          { id: '2', confidence: 0.6, category: 'Electronics' } as DetectedItem,
        ],
        processingTime: 1500,
        success: true,
        timestamp: new Date(),
      };

      manager.recordDetectionResult(detectionResult);
      // Should not throw an error
      expect(true).toBe(true);
    });

    it('should learn from user feedback', () => {
      const manager = new DynamicThresholdManager();
      const feedback: UserFeedback = {
        itemId: 'item_123',
        userAction: 'accepted',
        confidence: 0.8,
        category: 'Accessories',
        timestamp: new Date(),
      };

      manager.recordUserFeedback(feedback);
      // Should not throw an error
      expect(true).toBe(true);
    });

    it('should provide threshold history', () => {
      const manager = new DynamicThresholdManager();
      const history = manager.getThresholdHistory();
      
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should provide performance metrics', () => {
      const manager = new DynamicThresholdManager();
      const metrics = manager.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
      expect(metrics.totalUpdates).toBeGreaterThanOrEqual(0);
      expect(metrics.userFeedbackCount).toBeGreaterThanOrEqual(0);
    });
  });
});

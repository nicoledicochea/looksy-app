import { DetectedItem } from '../realAiService';
import {
  createDetectionCache,
  getCachedDetection,
  cacheDetectionResult,
  clearCache,
  getCacheStats,
  profileDetectionPipeline,
  identifyBottlenecks,
  optimizePipeline,
  executeParallelDetection,
  getParallelStats,
  PerformanceOptimizer,
  CacheConfig,
  ProfileResults,
  BottleneckAnalysis,
  OptimizationResult,
  ParallelDetectionConfig,
  ParallelDetectionResult,
} from '../performanceOptimizationService';

describe('Performance Optimization Service', () => {
  describe('Detection Caching', () => {
    it('should create a detection cache with configurable settings', () => {
      const cacheConfig: Partial<CacheConfig> = {
        maxSize: 1000,
        ttl: 300000, // 5 minutes
        enableCompression: true,
        enableEncryption: false,
      };

      const result = createDetectionCache(cacheConfig);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.config.maxSize).toBe(1000);
      expect(result.config.ttl).toBe(300000);
      expect(result.stats).toBeDefined();
    });

    it('should retrieve cached detection results', () => {
      const imageHash = 'abc123def456';
      const cachedResult = {
        items: [
          { id: '1', confidence: 0.9, category: 'Accessories' } as DetectedItem,
          { id: '2', confidence: 0.8, category: 'Electronics' } as DetectedItem,
        ],
        processingTime: 1500,
        timestamp: new Date(),
      };

      // First cache the result
      cacheDetectionResult(imageHash, cachedResult, {
        itemCount: 2,
        averageConfidence: 0.85,
        categoryDistribution: { 'Accessories': 1, 'Electronics': 1 },
      });

      const result = getCachedDetection(imageHash);
      expect(result).toBeDefined();
      expect(result?.result.items).toHaveLength(2);
      expect(result?.result.processingTime).toBe(1500);
    });

    it('should return null for cache miss', () => {
      const imageHash = 'nonexistent123';

      const result = getCachedDetection(imageHash);
      expect(result).toBeNull();
    });

    it('should cache detection results with metadata', () => {
      const imageHash = 'abc123def456';
      const detectionResult = {
        items: [
          { id: '1', confidence: 0.9, category: 'Accessories' } as DetectedItem,
        ],
        processingTime: 2000,
        timestamp: new Date(),
      };
      const metadata = {
        imageSize: { width: 1920, height: 1080 },
        itemCount: 1,
        averageConfidence: 0.9,
        categoryDistribution: { 'Accessories': 1 },
      };

      const result = cacheDetectionResult(imageHash, detectionResult, metadata);
      expect(result).toBe(true);
    });

    it('should clear cache with optional filters', () => {
      const clearOptions = {
        olderThan: new Date(Date.now() - 3600000), // 1 hour ago
        category: 'Accessories',
        minConfidence: 0.8,
      };

      const result = clearCache(clearOptions);
      expect(result).toBeDefined();
      expect(result.cleared).toBeGreaterThanOrEqual(0);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should provide cache statistics', () => {
      const result = getCacheStats();
      expect(result).toBeDefined();
      expect(result.totalEntries).toBeGreaterThanOrEqual(0);
      expect(result.hitRate).toBeGreaterThanOrEqual(0);
      expect(result.hitRate).toBeLessThanOrEqual(1);
      expect(result.missRate).toBeGreaterThanOrEqual(0);
      expect(result.missRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Profiling', () => {
    it('should profile detection pipeline performance', () => {
      const pipelineConfig = {
        enableCategoryFiltering: true,
        enableSpatialAnalysis: true,
        enableOverlapResolution: true,
        enableContextualFiltering: true,
        enableDynamicThresholds: true,
      };

      const result = profileDetectionPipeline(pipelineConfig);
      expect(result).toBeDefined();
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.stageTimes).toBeDefined();
      expect(result.memoryUsage).toBeDefined();
      expect(result.cpuUsage).toBeDefined();
    });

    it('should identify performance bottlenecks', () => {
      const profileData: ProfileResults = {
        totalTime: 2500,
        stageTimes: {
          categoryFiltering: 200,
          spatialAnalysis: 800, // Bottleneck
          overlapResolution: 300,
          contextualFiltering: 400,
          dynamicThresholds: 100,
        },
        memoryUsage: { peak: 100000000, average: 50000000, final: 30000000 },
        cpuUsage: { average: 0.9, peak: 0.95 },
      };

      const result = identifyBottlenecks(profileData);
      expect(result).toBeDefined();
      expect(result.bottlenecks).toBeDefined();
      expect(result.overallSeverity).toMatch(/low|medium|high/);
      expect(result.estimatedImprovement).toBeGreaterThanOrEqual(0);
      expect(result.estimatedImprovement).toBeLessThanOrEqual(1);
    });

    it('should optimize pipeline based on bottlenecks', () => {
      const bottlenecks: BottleneckAnalysis = {
        bottlenecks: [
          {
            stage: 'spatialAnalysis',
            severity: 'high',
            impact: 0.32,
            recommendation: 'Optimize spatial analysis algorithms',
          },
        ],
        overallSeverity: 'high',
        estimatedImprovement: 0.25,
      };

      const result = optimizePipeline(bottlenecks);
      expect(result).toBeDefined();
      expect(result.optimizationsApplied).toBeDefined();
      expect(result.totalExpectedImprovement).toBeGreaterThanOrEqual(0);
      expect(result.optimized).toBeDefined();
    });
  });

  describe('Parallel Processing', () => {
    it('should execute parallel detection for multiple APIs', async () => {
      const detectionConfig: ParallelDetectionConfig = {
        apis: ['google_vision', 'amazon_rekognition'],
        items: [
          { id: '1', confidence: 0.9, category: 'Accessories' } as DetectedItem,
          { id: '2', confidence: 0.8, category: 'Electronics' } as DetectedItem,
        ],
        parallelConfig: {
          maxConcurrency: 4,
          timeout: 5000,
          retryAttempts: 2,
        },
      };

      const result = await executeParallelDetection(detectionConfig);
      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(1);
      expect(result.combinedItems).toBeDefined();
    });

    it('should handle parallel processing failures gracefully', async () => {
      const detectionConfig: ParallelDetectionConfig = {
        apis: ['google_vision', 'amazon_rekognition'],
        items: [
          { id: '1', confidence: 0.9, category: 'Accessories' } as DetectedItem,
        ],
        parallelConfig: {
          maxConcurrency: 2,
          timeout: 1000,
          retryAttempts: 1,
        },
      };

      const result = await executeParallelDetection(detectionConfig);
      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(1);
    });

    it('should provide parallel processing statistics', () => {
      const result = getParallelStats();
      expect(result).toBeDefined();
      expect(result.totalExecutions).toBeGreaterThanOrEqual(0);
      expect(result.averageExecutionTime).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(1);
      expect(result.apiPerformance).toBeDefined();
    });
  });

  describe('Performance Optimizer', () => {
    it('should initialize performance optimizer', () => {
      const optimizer = new PerformanceOptimizer();
      expect(optimizer).toBeDefined();
    });

    it('should start profiling session', () => {
      const optimizer = new PerformanceOptimizer();
      optimizer.startProfiling('test_session');
      // Should not throw an error
      expect(true).toBe(true);
    });

    it('should stop profiling and return results', () => {
      const optimizer = new PerformanceOptimizer();
      optimizer.startProfiling('test_session');
      
      const result = optimizer.stopProfiling('test_session');
      expect(result).toBeDefined();
      expect(result?.totalTime).toBeGreaterThanOrEqual(0);
      expect(result?.stageTimes).toBeDefined();
      expect(result?.memoryUsage).toBeDefined();
      expect(result?.cpuUsage).toBeDefined();
    });

    it('should optimize performance based on profiling data', () => {
      const optimizer = new PerformanceOptimizer();
      const profileData: ProfileResults = {
        totalTime: 2500,
        stageTimes: {
          categoryFiltering: 200,
          spatialAnalysis: 800, // Bottleneck
          overlapResolution: 300,
          contextualFiltering: 400,
          dynamicThresholds: 100,
        },
        memoryUsage: { peak: 100000000, average: 50000000, final: 30000000 },
        cpuUsage: { average: 0.9, peak: 0.95 },
      };

      const result = optimizer.optimizePerformance(profileData);
      expect(result).toBeDefined();
      expect(result.optimizationsApplied).toBeDefined();
      expect(result.totalExpectedImprovement).toBeGreaterThanOrEqual(0);
      expect(result.optimized).toBeDefined();
    });

    it('should provide optimization recommendations', () => {
      const optimizer = new PerformanceOptimizer();
      const recommendations = optimizer.getOptimizationRecommendations();
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec.priority).toMatch(/low|medium|high/);
        expect(rec.category).toBeDefined();
        expect(rec.recommendation).toBeDefined();
        expect(rec.expectedImprovement).toBeGreaterThanOrEqual(0);
        expect(rec.effort).toMatch(/low|medium|high/);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should integrate caching with detection pipeline', () => {
      const imageHash = 'test_image_123';
      const detectionResult = {
        items: [
          { id: '1', confidence: 0.9, category: 'Accessories' } as DetectedItem,
        ],
        processingTime: 2000,
        timestamp: new Date(),
      };

      // First call - cache miss
      const firstResult = getCachedDetection(imageHash);
      expect(firstResult).toBeNull();

      // Cache the result
      cacheDetectionResult(imageHash, detectionResult, {
        itemCount: 1,
        averageConfidence: 0.9,
        categoryDistribution: { 'Accessories': 1 },
      });

      // Second call - cache hit
      const secondResult = getCachedDetection(imageHash);
      expect(secondResult).toBeDefined();
      expect(secondResult?.result.items).toHaveLength(1);
    });

    it('should integrate profiling with optimization', () => {
      const profileResults = profileDetectionPipeline({
        enableCategoryFiltering: true,
        enableSpatialAnalysis: true,
        enableOverlapResolution: true,
        enableContextualFiltering: true,
        enableDynamicThresholds: true,
      });

      const bottlenecks = identifyBottlenecks(profileResults);
      const optimization = optimizePipeline(bottlenecks);

      expect(optimization.optimized).toBeDefined();
      expect(optimization.totalExpectedImprovement).toBeGreaterThanOrEqual(0);
    });

    it('should handle performance optimization errors gracefully', () => {
      // Test with invalid profile data
      const invalidProfileData = {
        totalTime: 0,
        stageTimes: {
          categoryFiltering: 0,
          spatialAnalysis: 0,
          overlapResolution: 0,
          contextualFiltering: 0,
          dynamicThresholds: 0,
        },
        memoryUsage: { peak: 0, average: 0, final: 0 },
        cpuUsage: { average: 0, peak: 0 },
      };

      const bottlenecks = identifyBottlenecks(invalidProfileData);
      expect(bottlenecks).toBeDefined();
      expect(bottlenecks.overallSeverity).toBeDefined();
    });
  });
});

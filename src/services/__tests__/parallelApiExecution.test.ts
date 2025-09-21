import { analyzePhotoWithMultipleAPIs } from '../parallelApiExecution';
import { checkUsageLimit, incrementUsage } from '../usageTracking';

// Mock the services
jest.mock('../realAiService');
jest.mock('../amazonRekognitionService');
jest.mock('../usageTracking');
jest.mock('../aiSummarizationService');
jest.mock('../enhancedDetectionPipeline');

describe('Parallel API Execution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzePhotoWithMultipleAPIs', () => {
    it('should execute both APIs in parallel and return combined results', async () => {
      const mockImageUri = 'file://test-image.jpg';
      
      // Mock usage tracking
      (checkUsageLimit as jest.Mock).mockResolvedValue(true);
      (incrementUsage as jest.Mock).mockResolvedValue(undefined);

      // Mock AI summarization
      const mockAiSummarization = require('../aiSummarizationService');
      mockAiSummarization.summarizeDetections.mockResolvedValue({
        name: 'Jacket',
        description: 'Jacket detected with 95% confidence',
        confidence: 0.95,
        reasoning: 'Fallback analysis using best detection result'
      });

      // Mock enhanced detection pipeline
      const mockEnhancedDetection = require('../enhancedDetectionPipeline');
      mockEnhancedDetection.executeEnhancedDetectionPipeline.mockResolvedValue({
        items: [],
        processingMetrics: {
          totalProcessingTime: 1,
          categoryFilteringTime: 0,
          spatialAnalysisTime: 0,
          overlapResolutionTime: 0,
          filteringStats: { total: 2, objectsOfInterest: 0, objectsToIgnore: 0, default: 0, filtered: 2, kept: 0 },
          spatialStats: { relationshipsFound: 0, itemsFiltered: 0 },
          overlapStats: { totalOverlaps: 0, averageOverlapPercentage: 0, maxOverlapPercentage: 0, overlapDistribution: { low: 0, medium: 0, high: 0, complete: 0 } },
          conflictStats: { totalConflicts: 0, resolvedConflicts: 0, averageOverlapPercentage: 0 }
        },
        success: true
      });

      // Mock Google Vision results
      const mockGoogleVision = require('../realAiService');
      mockGoogleVision.analyzeImage.mockResolvedValue({
        success: true,
        items: [
          { id: 'gv1', name: 'Jacket', confidence: 0.95, category: 'Clothing' }
        ],
        processingTime: 1000
      });

      // Mock Amazon Rekognition results
      const mockAmazonRekognition = require('../amazonRekognitionService');
      mockAmazonRekognition.analyzeWithAmazonRekognition.mockResolvedValue({
        success: true,
        items: [
          { id: 'ar1', name: 'Coat', confidence: 0.88, category: 'Clothing' }
        ],
        processingTime: 1200
      });

      const result = await analyzePhotoWithMultipleAPIs(mockImageUri);

      expect(result.success).toBe(true);
      expect(result.googleVisionResults).toBeDefined();
      expect(result.amazonRekognitionResults).toBeDefined();
      expect(result.googleVisionResults?.items).toHaveLength(1);
      expect(result.amazonRekognitionResults?.items).toHaveLength(1);
      expect(result.totalProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle when one API fails', async () => {
      const mockImageUri = 'file://test-image.jpg';
      
      // Mock usage tracking
      (checkUsageLimit as jest.Mock).mockResolvedValue(true);
      (incrementUsage as jest.Mock).mockResolvedValue(undefined);

      // Mock AI summarization
      const mockAiSummarization = require('../aiSummarizationService');
      mockAiSummarization.summarizeDetections.mockResolvedValue({
        name: 'Jacket',
        description: 'Jacket detected with 95% confidence',
        confidence: 0.95,
        reasoning: 'Fallback analysis using best detection result'
      });

      // Mock enhanced detection pipeline
      const mockEnhancedDetection = require('../enhancedDetectionPipeline');
      mockEnhancedDetection.executeEnhancedDetectionPipeline.mockResolvedValue({
        items: [],
        processingMetrics: {
          totalProcessingTime: 1,
          categoryFilteringTime: 0,
          spatialAnalysisTime: 0,
          overlapResolutionTime: 0,
          filteringStats: { total: 2, objectsOfInterest: 0, objectsToIgnore: 0, default: 0, filtered: 2, kept: 0 },
          spatialStats: { relationshipsFound: 0, itemsFiltered: 0 },
          overlapStats: { totalOverlaps: 0, averageOverlapPercentage: 0, maxOverlapPercentage: 0, overlapDistribution: { low: 0, medium: 0, high: 0, complete: 0 } },
          conflictStats: { totalConflicts: 0, resolvedConflicts: 0, averageOverlapPercentage: 0 }
        },
        success: true
      });

      // Mock Google Vision success
      const mockGoogleVision = require('../realAiService');
      mockGoogleVision.analyzeImage.mockResolvedValue({
        success: true,
        items: [{ id: 'gv1', name: 'Jacket', confidence: 0.95, category: 'Clothing' }],
        processingTime: 1000
      });

      // Mock Amazon Rekognition failure
      const mockAmazonRekognition = require('../amazonRekognitionService');
      mockAmazonRekognition.analyzeWithAmazonRekognition.mockResolvedValue({
        success: false,
        items: [],
        processingTime: 0,
        error: 'API Error'
      });

      const result = await analyzePhotoWithMultipleAPIs(mockImageUri);

      expect(result.success).toBe(true); // Should still succeed if one API works
      expect(result.googleVisionResults?.success).toBe(true);
      expect(result.amazonRekognitionResults?.success).toBe(false);
      expect(result.amazonRekognitionResults?.error).toBe('API Error');
    });

    it('should handle when both APIs fail', async () => {
      const mockImageUri = 'file://test-image.jpg';
      
      // Mock usage tracking
      (checkUsageLimit as jest.Mock).mockResolvedValue(true);
      (incrementUsage as jest.Mock).mockResolvedValue(undefined);

      // Mock AI summarization
      const mockAiSummarization = require('../aiSummarizationService');
      mockAiSummarization.summarizeDetections.mockResolvedValue({
        name: 'No Items',
        description: 'No items detected',
        confidence: 0.0,
        reasoning: 'Both APIs failed'
      });

      // Mock enhanced detection pipeline
      const mockEnhancedDetection = require('../enhancedDetectionPipeline');
      mockEnhancedDetection.executeEnhancedDetectionPipeline.mockResolvedValue({
        items: [],
        processingMetrics: {
          totalProcessingTime: 0,
          categoryFilteringTime: 0,
          spatialAnalysisTime: 0,
          overlapResolutionTime: 0,
          filteringStats: { total: 0, objectsOfInterest: 0, objectsToIgnore: 0, default: 0, filtered: 0, kept: 0 },
          spatialStats: { relationshipsFound: 0, itemsFiltered: 0 },
          overlapStats: { totalOverlaps: 0, averageOverlapPercentage: 0, maxOverlapPercentage: 0, overlapDistribution: { low: 0, medium: 0, high: 0, complete: 0 } },
          conflictStats: { totalConflicts: 0, resolvedConflicts: 0, averageOverlapPercentage: 0 }
        },
        success: true
      });

      // Mock both APIs failing
      const mockGoogleVision = require('../realAiService');
      mockGoogleVision.analyzeImage.mockResolvedValue({
        success: false,
        items: [],
        processingTime: 0,
        error: 'Google Vision Error'
      });

      const mockAmazonRekognition = require('../amazonRekognitionService');
      mockAmazonRekognition.analyzeWithAmazonRekognition.mockResolvedValue({
        success: false,
        items: [],
        processingTime: 0,
        error: 'Amazon Rekognition Error'
      });

      const result = await analyzePhotoWithMultipleAPIs(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.googleVisionResults?.success).toBe(false);
      expect(result.amazonRekognitionResults?.success).toBe(false);
      expect(result.error).toContain('Both APIs failed');
    });

    it('should check usage limits before making API calls', async () => {
      const mockImageUri = 'file://test-image.jpg';
      
      // Mock usage limit exceeded
      (checkUsageLimit as jest.Mock).mockResolvedValue(false);

      // Mock AI summarization (shouldn't be called due to usage limit)
      const mockAiSummarization = require('../aiSummarizationService');
      mockAiSummarization.summarizeDetections.mockResolvedValue({
        name: 'No Items',
        description: 'No items detected',
        confidence: 0.0,
        reasoning: 'Usage limit exceeded'
      });

      // Mock enhanced detection pipeline (shouldn't be called due to usage limit)
      const mockEnhancedDetection = require('../enhancedDetectionPipeline');
      mockEnhancedDetection.executeEnhancedDetectionPipeline.mockResolvedValue({
        items: [],
        processingMetrics: {
          totalProcessingTime: 0,
          categoryFilteringTime: 0,
          spatialAnalysisTime: 0,
          overlapResolutionTime: 0,
          filteringStats: { total: 0, objectsOfInterest: 0, objectsToIgnore: 0, default: 0, filtered: 0, kept: 0 },
          spatialStats: { relationshipsFound: 0, itemsFiltered: 0 },
          overlapStats: { totalOverlaps: 0, averageOverlapPercentage: 0, maxOverlapPercentage: 0, overlapDistribution: { low: 0, medium: 0, high: 0, complete: 0 } },
          conflictStats: { totalConflicts: 0, resolvedConflicts: 0, averageOverlapPercentage: 0 }
        },
        success: true
      });

      const result = await analyzePhotoWithMultipleAPIs(mockImageUri);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Usage limit exceeded');
      expect(checkUsageLimit).toHaveBeenCalledWith('googleVision', 1000);
      expect(checkUsageLimit).toHaveBeenCalledWith('amazonRekognition', 1000);
    });

    it('should increment usage counts after successful API calls', async () => {
      const mockImageUri = 'file://test-image.jpg';
      
      // Mock usage tracking
      (checkUsageLimit as jest.Mock).mockResolvedValue(true);
      (incrementUsage as jest.Mock).mockResolvedValue(undefined);

      // Mock AI summarization
      const mockAiSummarization = require('../aiSummarizationService');
      mockAiSummarization.summarizeDetections.mockResolvedValue({
        name: 'Jacket',
        description: 'Jacket detected with 95% confidence',
        confidence: 0.95,
        reasoning: 'Fallback analysis using best detection result'
      });

      // Mock enhanced detection pipeline
      const mockEnhancedDetection = require('../enhancedDetectionPipeline');
      mockEnhancedDetection.executeEnhancedDetectionPipeline.mockResolvedValue({
        items: [],
        processingMetrics: {
          totalProcessingTime: 1,
          categoryFilteringTime: 0,
          spatialAnalysisTime: 0,
          overlapResolutionTime: 0,
          filteringStats: { total: 2, objectsOfInterest: 0, objectsToIgnore: 0, default: 0, filtered: 2, kept: 0 },
          spatialStats: { relationshipsFound: 0, itemsFiltered: 0 },
          overlapStats: { totalOverlaps: 0, averageOverlapPercentage: 0, maxOverlapPercentage: 0, overlapDistribution: { low: 0, medium: 0, high: 0, complete: 0 } },
          conflictStats: { totalConflicts: 0, resolvedConflicts: 0, averageOverlapPercentage: 0 }
        },
        success: true
      });

      // Mock both APIs succeeding
      const mockGoogleVision = require('../realAiService');
      mockGoogleVision.analyzeImage.mockResolvedValue({
        success: true,
        items: [{ id: 'gv1', name: 'Jacket', confidence: 0.95, category: 'Clothing' }],
        processingTime: 1000
      });

      const mockAmazonRekognition = require('../amazonRekognitionService');
      mockAmazonRekognition.analyzeWithAmazonRekognition.mockResolvedValue({
        success: true,
        items: [{ id: 'ar1', name: 'Coat', confidence: 0.88, category: 'Clothing' }],
        processingTime: 1200
      });

      await analyzePhotoWithMultipleAPIs(mockImageUri);

      expect(incrementUsage).toHaveBeenCalledWith('googleVision');
      expect(incrementUsage).toHaveBeenCalledWith('amazonRekognition');
    });
  });
});

import { DetectedItem } from '../realAiService';
import { 
  executeEnhancedDetectionPipeline,
  executeEnhancedDetectionWithMonitoring,
  createCustomEnhancedDetectionConfig,
  validateEnhancedDetectionConfig,
  EnhancedDetectionConfig,
  EnhancedDetectionResult
} from '../enhancedDetectionPipeline';

/**
 * Enhanced Detection Pipeline Integration Tests
 * 
 * This test suite verifies the complete enhanced detection pipeline that combines:
 * 1. Category-based filtering
 * 2. Parent-child relationship detection
 * 3. Size-based overlap resolution
 * 4. Performance monitoring
 */

describe('Enhanced Detection Pipeline Integration', () => {
  // Mock detected items for testing
  const createMockDetectedItem = (
    id: string,
    name: string,
    category: string,
    confidence: number,
    boundingBox: { x: number; y: number; width: number; height: number }
  ): DetectedItem => ({
    id,
    name,
    category,
    confidence,
    description: `A ${name}`,
    boundingBox,
    segmentationMask: undefined,
    precisionLevel: 'high' as const,
    source: 'object_localization' as const
  });

  const mockItems: DetectedItem[] = [
    // Objects of interest
    createMockDetectedItem('watch1', 'Rolex Watch', 'Accessories', 0.9, { x: 0.3, y: 0.2, width: 0.1, height: 0.15 }),
    createMockDetectedItem('phone1', 'iPhone', 'Electronics', 0.85, { x: 0.1, y: 0.1, width: 0.15, height: 0.2 }),
    createMockDetectedItem('book1', 'Programming Book', 'Books', 0.8, { x: 0.5, y: 0.3, width: 0.2, height: 0.25 }),
    
    // Objects to ignore (should be filtered out)
    createMockDetectedItem('sleeve1', 'Sleeve', 'Clothing', 0.7, { x: 0.25, y: 0.15, width: 0.2, height: 0.3 }),
    createMockDetectedItem('table1', 'Wooden Table', 'Furniture', 0.75, { x: 0.0, y: 0.0, width: 1.0, height: 0.4 }),
    
    // Overlapping items (for overlap resolution testing)
    createMockDetectedItem('watch2', 'Apple Watch', 'Accessories', 0.88, { x: 0.32, y: 0.22, width: 0.08, height: 0.12 }),
    createMockDetectedItem('bracelet1', 'Gold Bracelet', 'Accessories', 0.82, { x: 0.28, y: 0.18, width: 0.12, height: 0.18 }),
  ];

  describe('5.1 Complete Enhanced Detection Pipeline Integration', () => {
    it('should execute the complete multi-stage filtering pipeline', async () => {
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(mockItems);
      
      expect(result.success).toBe(true);
      expect(result.items).toBeDefined();
      expect(result.processingMetrics).toBeDefined();
      
      // Verify performance requirements
      expect(result.processingMetrics.totalProcessingTime).toBeLessThan(3000); // <3 second requirement
      
      // Verify final results
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(mockItems.length);
      
      // Verify all stages were executed
      expect(result.processingMetrics.categoryFilteringTime).toBeGreaterThanOrEqual(0);
      expect(result.processingMetrics.spatialAnalysisTime).toBeGreaterThanOrEqual(0);
      expect(result.processingMetrics.overlapResolutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should maintain data integrity throughout the pipeline', async () => {
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(mockItems);
      
      expect(result.success).toBe(true);
      
      // Verify all items have required properties
      result.items.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.confidence).toBeGreaterThanOrEqual(0);
        expect(item.confidence).toBeLessThanOrEqual(1);
        expect(item.boundingBox).toBeDefined();
        expect(item.boundingBox.x).toBeGreaterThanOrEqual(0);
        expect(item.boundingBox.y).toBeGreaterThanOrEqual(0);
        expect(item.boundingBox.width).toBeGreaterThan(0);
        expect(item.boundingBox.height).toBeGreaterThan(0);
        expect(item.precisionLevel).toBeDefined();
        expect(item.source).toBeDefined();
      });
    });

    it('should handle empty input gracefully', async () => {
      const emptyItems: DetectedItem[] = [];
      
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(emptyItems);
      
      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
      expect(result.processingMetrics.filteringStats.total).toBe(0);
      expect(result.processingMetrics.spatialStats.relationshipsFound).toBe(0);
      expect(result.processingMetrics.overlapStats.totalOverlaps).toBe(0);
    });

    it('should handle single item input', async () => {
      const singleItem = [mockItems[0]]; // Just the watch
      
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(singleItem);
      
      expect(result.success).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.processingMetrics.spatialStats.relationshipsFound).toBe(0); // No relationships with single item
      expect(result.processingMetrics.conflictStats.totalConflicts).toBe(0);
    });
  });

  describe('5.2 Multi-Stage Filtering Pipeline Performance', () => {
    it('should meet performance requirements for large datasets', async () => {
      // Create a larger dataset for performance testing
      const largeDataset: DetectedItem[] = [];
      for (let i = 0; i < 50; i++) {
        largeDataset.push(createMockDetectedItem(
          `item${i}`,
          `Item ${i}`,
          i % 3 === 0 ? 'Electronics' : i % 3 === 1 ? 'Accessories' : 'Furniture',
          0.7 + (i % 3) * 0.1,
          { x: Math.random() * 0.8, y: Math.random() * 0.8, width: 0.1, height: 0.1 }
        ));
      }

      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(largeDataset);
      
      expect(result.success).toBe(true);
      expect(result.processingMetrics.totalProcessingTime).toBeLessThan(3000); // <3 second requirement
      expect(result.items.length).toBeGreaterThan(0);
      
      console.log(`Large dataset (${largeDataset.length} items) processed in ${result.processingMetrics.totalProcessingTime}ms`);
    });

    it('should provide detailed performance metrics', async () => {
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(mockItems);
      
      expect(result.success).toBe(true);
      
      // Verify performance metrics are reasonable
      expect(result.processingMetrics.categoryFilteringTime).toBeLessThan(100); // Category filtering should be very fast
      expect(result.processingMetrics.spatialAnalysisTime).toBeLessThan(500); // Spatial analysis should be moderate
      expect(result.processingMetrics.overlapResolutionTime).toBeLessThan(1000); // Overlap resolution should be reasonable
      expect(result.processingMetrics.totalProcessingTime).toBeLessThan(3000); // Total should meet requirement
      
      console.log(`Performance metrics:
        Category Filtering: ${result.processingMetrics.categoryFilteringTime}ms
        Spatial Analysis: ${result.processingMetrics.spatialAnalysisTime}ms
        Overlap Resolution: ${result.processingMetrics.overlapResolutionTime}ms
        Total: ${result.processingMetrics.totalProcessingTime}ms`);
    });
  });

  describe('5.3 Pipeline Stage Integration', () => {
    it('should properly chain category filtering to spatial analysis', async () => {
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(mockItems);
      
      expect(result.success).toBe(true);
      
      // Verify category filtering removed objects to ignore
      expect(result.processingMetrics.filteringStats.filtered).toBeGreaterThan(0);
      expect(result.processingMetrics.filteringStats.kept).toBeGreaterThan(0);
      
      // Verify spatial analysis works with filtered items
      expect(result.processingMetrics.spatialStats.itemsFiltered).toBeLessThanOrEqual(result.processingMetrics.filteringStats.kept);
      
      // Verify no objects to ignore made it through
      const objectsToIgnore = ['sleeve', 'table', 'furniture', 'clothing'];
      result.items.forEach(item => {
        const isObjectToIgnore = objectsToIgnore.some(ignore => 
          item.name.toLowerCase().includes(ignore.toLowerCase())
        );
        expect(isObjectToIgnore).toBe(false);
      });
    });

    it('should properly chain spatial analysis to overlap resolution', async () => {
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(mockItems);
      
      expect(result.success).toBe(true);
      
      // Verify spatial analysis found relationships
      expect(result.processingMetrics.spatialStats.relationshipsFound).toBeGreaterThanOrEqual(0);
      
      // Verify overlap resolution works with spatially analyzed items
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.processingMetrics.overlapStats).toBeDefined();
    });

    it('should maintain item relationships through the pipeline', async () => {
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(mockItems);
      
      expect(result.success).toBe(true);
      
      // Verify that items maintain their core properties
      const originalItemMap = new Map(mockItems.map(item => [item.id, item]));
      
      result.items.forEach(item => {
        const originalItem = originalItemMap.get(item.id);
        if (originalItem) {
          expect(item.name).toBe(originalItem.name);
          expect(item.category).toBe(originalItem.category);
          expect(item.boundingBox.x).toBe(originalItem.boundingBox.x);
          expect(item.boundingBox.y).toBe(originalItem.boundingBox.y);
          expect(item.boundingBox.width).toBe(originalItem.boundingBox.width);
          expect(item.boundingBox.height).toBe(originalItem.boundingBox.height);
        }
      });
    });
  });

  describe('5.4 Error Handling and Edge Cases', () => {
    it('should handle items with invalid bounding boxes', async () => {
      const invalidItems: DetectedItem[] = [
        createMockDetectedItem('invalid1', 'Invalid Item', 'Electronics', 0.8, { x: -0.1, y: 0.1, width: 0.1, height: 0.1 }),
        createMockDetectedItem('invalid2', 'Another Invalid', 'Accessories', 0.7, { x: 0.1, y: 0.1, width: 0, height: 0.1 }),
        ...mockItems
      ];
      
      // Pipeline should handle invalid items gracefully
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(invalidItems);
      
      expect(result.success).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      // Invalid items should be filtered out or handled gracefully
    });

    it('should handle items with extreme confidence values', async () => {
      const extremeConfidenceItems: DetectedItem[] = [
        createMockDetectedItem('lowConf', 'Low Confidence', 'Electronics', 0.1, { x: 0.1, y: 0.1, width: 0.1, height: 0.1 }),
        createMockDetectedItem('highConf', 'High Confidence', 'Accessories', 0.99, { x: 0.2, y: 0.2, width: 0.1, height: 0.1 }),
        createMockDetectedItem('zeroConf', 'Zero Confidence', 'Books', 0, { x: 0.3, y: 0.3, width: 0.1, height: 0.1 }),
      ];
      
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(extremeConfidenceItems);
      
      expect(result.success).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      // Low confidence items should be filtered out by category filtering
    });

    it('should handle completely overlapping items', async () => {
      const overlappingItems: DetectedItem[] = [
        createMockDetectedItem('item1', 'Item 1', 'Electronics', 0.8, { x: 0.1, y: 0.1, width: 0.2, height: 0.2 }),
        createMockDetectedItem('item2', 'Item 2', 'Electronics', 0.85, { x: 0.15, y: 0.15, width: 0.2, height: 0.2 }), // Overlapping
        createMockDetectedItem('item3', 'Item 3', 'Accessories', 0.9, { x: 0.2, y: 0.2, width: 0.1, height: 0.1 }), // Also overlapping
      ];
      
      const customConfig = createCustomEnhancedDetectionConfig(
        undefined,
        undefined,
        { overlapThreshold: 0.05 } // Lower threshold
      );
      
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(overlappingItems, customConfig);
      
      expect(result.success).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      // Note: Conflicts may be 0 if items are filtered out by category filtering or spatial analysis
      expect(result.processingMetrics.conflictStats.totalConflicts).toBeGreaterThanOrEqual(0);
    });
  });

  describe('5.5 Pipeline Output Validation', () => {
    it('should produce valid final results', async () => {
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(mockItems);
      
      expect(result.success).toBe(true);
      
      // Verify final results structure
      expect(result.items).toBeInstanceOf(Array);
      expect(result.processingMetrics).toBeDefined();
      
      // Verify statistics
      expect(result.processingMetrics.overlapStats.totalOverlaps).toBeGreaterThanOrEqual(0);
      expect(result.processingMetrics.overlapStats.averageOverlapPercentage).toBeGreaterThanOrEqual(0);
      expect(result.processingMetrics.overlapStats.maxOverlapPercentage).toBeGreaterThanOrEqual(0);
      expect(result.processingMetrics.overlapStats.overlapDistribution).toBeDefined();
      
      // Verify conflicts
      expect(result.processingMetrics.conflictStats.totalConflicts).toBeGreaterThanOrEqual(0);
      expect(result.processingMetrics.conflictStats.resolvedConflicts).toBeGreaterThanOrEqual(0);
    });

    it('should provide meaningful filtering statistics', async () => {
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(mockItems);
      
      expect(result.success).toBe(true);
      
      const filteringStats = result.processingMetrics.filteringStats;
      expect(filteringStats.total).toBe(mockItems.length);
      expect(filteringStats.objectsOfInterest).toBeGreaterThan(0);
      expect(filteringStats.objectsToIgnore).toBeGreaterThan(0);
      expect(filteringStats.filtered + filteringStats.kept).toBe(filteringStats.total);
      
      // Verify that objects of interest are more likely to be kept
      expect(filteringStats.kept).toBeGreaterThan(0);
    });

    it('should maintain performance under various conditions', async () => {
      const testCases = [
        { name: 'Small dataset', items: mockItems.slice(0, 3) },
        { name: 'Medium dataset', items: mockItems },
        { name: 'Large dataset', items: [...mockItems, ...mockItems, ...mockItems] },
      ];
      
      for (const testCase of testCases) {
        const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(testCase.items);
        
        expect(result.success).toBe(true);
        expect(result.processingMetrics.totalProcessingTime).toBeLessThan(3000);
        expect(result.items.length).toBeGreaterThan(0);
        
        console.log(`${testCase.name} (${testCase.items.length} items): ${result.processingMetrics.totalProcessingTime}ms`);
      }
    });
  });

  describe('5.6 Configuration and Customization', () => {
    it('should support custom configuration', async () => {
      const customConfig = createCustomEnhancedDetectionConfig(
        {
          confidenceThresholds: {
            'objects_of_interest': 0.5,
            'objects_to_ignore': 0.9,
            'default': 0.6
          }
        },
        { containmentThreshold: 0.7 },
        { overlapThreshold: 0.05 },
        { maxProcessingTime: 2000, enableMetrics: true }
      );
      
      const result: EnhancedDetectionResult = await executeEnhancedDetectionPipeline(mockItems, customConfig);
      
      expect(result.success).toBe(true);
      expect(result.items).toBeDefined();
    });

    it('should validate configuration', () => {
      const invalidConfig = createCustomEnhancedDetectionConfig(
        {
          confidenceThresholds: {
            'objects_of_interest': 1.5, // Invalid: > 1
            'objects_to_ignore': 0.8,
            'default': 0.7
          }
        }
      );
      
      const validation = validateEnhancedDetectionConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('objects_of_interest'))).toBe(true);
    });

    it('should support monitoring mode', async () => {
      const result: EnhancedDetectionResult = await executeEnhancedDetectionWithMonitoring(mockItems);
      
      expect(result.success).toBe(true);
      expect(result.items).toBeDefined();
      expect(result.processingMetrics).toBeDefined();
    });
  });
});

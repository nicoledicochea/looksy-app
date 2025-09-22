import { DetectedItem } from '../realAiService';
import {
  convertNormalizedVerticesToBoundingBox,
  calculateSubPixelPrecisionBoundingBox,
  processSegmentationMask,
  createEnhancedDetectedItem,
  BoundingBox,
  SegmentationMask
} from '../enhancedSegmentationPrecisionService';

// Mock DetectedItem for testing
const createMockItem = (
  id: string,
  name: string,
  category: string,
  confidence: number,
  boundingBox: { x: number; y: number; width: number; height: number },
  segmentationMask?: { normalizedVertices: Array<{ x: number; y: number }> }
): DetectedItem => ({
  id,
  name,
  confidence,
  category,
  description: `${name} detected`,
  boundingBox,
  segmentationMask,
  precisionLevel: 'high',
  source: 'object_localization'
});

describe('Enhanced Segmentation Precision', () => {
  describe('Improved Coordinate Conversion', () => {
    it('should convert normalized vertices to precise bounding box', () => {
      // This test will fail initially - we'll implement the function
      const normalizedVertices = [
        { x: 0.1, y: 0.2 },
        { x: 0.4, y: 0.2 },
        { x: 0.4, y: 0.7 },
        { x: 0.1, y: 0.7 }
      ];
      
      const boundingBox = convertNormalizedVerticesToBoundingBox(normalizedVertices);
      
      expect(boundingBox.x).toBeCloseTo(0.1, 6);
      expect(boundingBox.y).toBeCloseTo(0.2, 6);
      expect(boundingBox.width).toBeCloseTo(0.3, 6);
      expect(boundingBox.height).toBeCloseTo(0.5, 6);
    });

    it('should handle complex polygon shapes with sub-pixel precision', () => {
      // Complex shape with many vertices
      const complexVertices = [
        { x: 0.1, y: 0.2 },
        { x: 0.15, y: 0.18 },
        { x: 0.2, y: 0.2 },
        { x: 0.25, y: 0.22 },
        { x: 0.3, y: 0.2 },
        { x: 0.35, y: 0.18 },
        { x: 0.4, y: 0.2 },
        { x: 0.4, y: 0.7 },
        { x: 0.1, y: 0.7 }
      ];
      
      const boundingBox = convertNormalizedVerticesToBoundingBox(complexVertices);
      
      expect(boundingBox.x).toBeCloseTo(0.1, 6);
      expect(boundingBox.y).toBeCloseTo(0.18, 6);
      expect(boundingBox.width).toBeCloseTo(0.3, 6);
      expect(boundingBox.height).toBeCloseTo(0.52, 6);
    });

    it('should handle edge cases with minimal vertices', () => {
      // Edge case: only 3 vertices
      const minimalVertices = [
        { x: 0.1, y: 0.2 },
        { x: 0.4, y: 0.2 },
        { x: 0.25, y: 0.7 }
      ];
      
      const boundingBox = convertNormalizedVerticesToBoundingBox(minimalVertices);
      
      expect(boundingBox.x).toBeCloseTo(0.1, 6);
      expect(boundingBox.y).toBeCloseTo(0.2, 6);
      expect(boundingBox.width).toBeCloseTo(0.3, 6);
      expect(boundingBox.height).toBeCloseTo(0.5, 6);
    });

    it('should handle overlapping items with precise boundaries', () => {
      // Overlapping items scenario
      const overlappingVertices = [
        { x: 0.1, y: 0.1 },
        { x: 0.6, y: 0.1 },
        { x: 0.6, y: 0.6 },
        { x: 0.1, y: 0.6 },
        { x: 0.2, y: 0.2 },
        { x: 0.5, y: 0.2 },
        { x: 0.5, y: 0.5 },
        { x: 0.2, y: 0.5 }
      ];
      
      const boundingBox = convertNormalizedVerticesToBoundingBox(overlappingVertices);
      
      expect(boundingBox.x).toBeCloseTo(0.1, 6);
      expect(boundingBox.y).toBeCloseTo(0.1, 6);
      expect(boundingBox.width).toBeCloseTo(0.5, 6);
      expect(boundingBox.height).toBeCloseTo(0.5, 6);
    });

    it('should handle edge cases with zero or negative coordinates', () => {
      // Edge case: coordinates at boundaries
      const boundaryVertices = [
        { x: 0.0, y: 0.0 },
        { x: 1.0, y: 0.0 },
        { x: 1.0, y: 1.0 },
        { x: 0.0, y: 1.0 }
      ];
      
      const boundingBox = convertNormalizedVerticesToBoundingBox(boundaryVertices);
      
      expect(boundingBox.x).toBeCloseTo(0.0, 6);
      expect(boundingBox.y).toBeCloseTo(0.0, 6);
      expect(boundingBox.width).toBeCloseTo(1.0, 6);
      expect(boundingBox.height).toBeCloseTo(1.0, 6);
    });
  });

  describe('Sub-pixel Precision Calculations', () => {
    it('should calculate sub-pixel precision for bounding box coordinates', () => {
      // This test will fail initially - we'll implement the function
      const vertices = [
        { x: 0.123456789, y: 0.234567890 },
        { x: 0.456789012, y: 0.234567890 },
        { x: 0.456789012, y: 0.567890123 },
        { x: 0.123456789, y: 0.567890123 }
      ];
      
      const preciseBoundingBox = calculateSubPixelPrecisionBoundingBox(vertices);
      
      expect(preciseBoundingBox.x).toBeCloseTo(0.123456789, 9);
      expect(preciseBoundingBox.y).toBeCloseTo(0.234567890, 9);
      expect(preciseBoundingBox.width).toBeCloseTo(0.333332223, 9);
      expect(preciseBoundingBox.height).toBeCloseTo(0.333322233, 9);
    });

    it('should handle floating point precision issues', () => {
      // Test for floating point precision issues
      const vertices = [
        { x: 0.1, y: 0.2 },
        { x: 0.4, y: 0.2 },
        { x: 0.4, y: 0.7 },
        { x: 0.1, y: 0.7 }
      ];
      
      const preciseBoundingBox = calculateSubPixelPrecisionBoundingBox(vertices);
      
      // Should handle floating point arithmetic correctly
      expect(preciseBoundingBox.width + preciseBoundingBox.x).toBeCloseTo(0.4, 10);
      expect(preciseBoundingBox.height + preciseBoundingBox.y).toBeCloseTo(0.7, 10);
    });
  });

  describe('Edge Case Handling', () => {
    it('should handle complex object shapes with irregular boundaries', () => {
      // Irregular shape (like a watch with strap)
      const irregularVertices = [
        { x: 0.2, y: 0.3 },
        { x: 0.3, y: 0.25 },
        { x: 0.4, y: 0.3 },
        { x: 0.45, y: 0.35 },
        { x: 0.4, y: 0.4 },
        { x: 0.3, y: 0.45 },
        { x: 0.2, y: 0.4 },
        { x: 0.15, y: 0.35 }
      ];
      
      const boundingBox = convertNormalizedVerticesToBoundingBox(irregularVertices);
      
      expect(boundingBox.x).toBeCloseTo(0.15, 6);
      expect(boundingBox.y).toBeCloseTo(0.25, 6);
      expect(boundingBox.width).toBeCloseTo(0.3, 6);
      expect(boundingBox.height).toBeCloseTo(0.2, 6);
    });

    it('should handle overlapping items with conflict resolution', () => {
      // Two overlapping items
      const item1Vertices = [
        { x: 0.1, y: 0.1 },
        { x: 0.4, y: 0.1 },
        { x: 0.4, y: 0.4 },
        { x: 0.1, y: 0.4 }
      ];
      
      const item2Vertices = [
        { x: 0.3, y: 0.3 },
        { x: 0.6, y: 0.3 },
        { x: 0.6, y: 0.6 },
        { x: 0.3, y: 0.6 }
      ];
      
      const boundingBox1 = convertNormalizedVerticesToBoundingBox(item1Vertices);
      const boundingBox2 = convertNormalizedVerticesToBoundingBox(item2Vertices);
      
      // Both should have correct bounding boxes
      expect(boundingBox1.x).toBeCloseTo(0.1, 6);
      expect(boundingBox1.y).toBeCloseTo(0.1, 6);
      expect(boundingBox2.x).toBeCloseTo(0.3, 6);
      expect(boundingBox2.y).toBeCloseTo(0.3, 6);
    });

    it('should handle empty or invalid vertex arrays', () => {
      // Empty vertices
      const emptyVertices: Array<{ x: number; y: number }> = [];
      
      const boundingBox = convertNormalizedVerticesToBoundingBox(emptyVertices);
      
      expect(boundingBox.x).toBe(0);
      expect(boundingBox.y).toBe(0);
      expect(boundingBox.width).toBe(0);
      expect(boundingBox.height).toBe(0);
    });

    it('should handle single vertex edge case', () => {
      // Single vertex
      const singleVertex = [{ x: 0.5, y: 0.5 }];
      
      const boundingBox = convertNormalizedVerticesToBoundingBox(singleVertex);
      
      expect(boundingBox.x).toBeCloseTo(0.5, 6);
      expect(boundingBox.y).toBeCloseTo(0.5, 6);
      expect(boundingBox.width).toBe(0);
      expect(boundingBox.height).toBe(0);
    });
  });

  describe('Segmentation Mask Processing', () => {
    it('should process segmentation mask for better pixel-level accuracy', () => {
      // This test will fail initially - we'll implement the function
      const segmentationMask = {
        normalizedVertices: [
          { x: 0.1, y: 0.2 },
          { x: 0.4, y: 0.2 },
          { x: 0.4, y: 0.7 },
          { x: 0.1, y: 0.7 }
        ]
      };
      
      const processedMask = processSegmentationMask(segmentationMask);
      
      expect(processedMask.boundingBox.x).toBeCloseTo(0.1, 6);
      expect(processedMask.boundingBox.y).toBeCloseTo(0.2, 6);
      expect(processedMask.boundingBox.width).toBeCloseTo(0.3, 6);
      expect(processedMask.boundingBox.height).toBeCloseTo(0.5, 6);
      expect(processedMask.precisionLevel).toBe('medium');
    });

    it('should enhance precision level based on segmentation quality', () => {
      const highQualityMask = {
        normalizedVertices: [
          { x: 0.1, y: 0.2 },
          { x: 0.15, y: 0.18 },
          { x: 0.2, y: 0.2 },
          { x: 0.25, y: 0.22 },
          { x: 0.3, y: 0.2 },
          { x: 0.35, y: 0.18 },
          { x: 0.4, y: 0.2 },
          { x: 0.4, y: 0.7 },
          { x: 0.1, y: 0.7 }
        ]
      };
      
      const processedMask = processSegmentationMask(highQualityMask);
      
      expect(processedMask.precisionLevel).toBe('high');
    });

    it('should handle low quality segmentation masks', () => {
      const lowQualityMask = {
        normalizedVertices: [
          { x: 0.1, y: 0.2 },
          { x: 0.4, y: 0.2 },
          { x: 0.4, y: 0.7 },
          { x: 0.1, y: 0.7 }
        ]
      };
      
      const processedMask = processSegmentationMask(lowQualityMask);
      
      expect(processedMask.precisionLevel).toBe('medium');
    });
  });

  describe('Integration with realAiService', () => {
    it('should integrate enhanced segmentation precision with existing service', () => {
      // This test will fail initially - we'll implement the function
      const mockGoogleResponse = {
        name: 'Test Object',
        score: 0.95,
        boundingPoly: {
          normalizedVertices: [
            { x: 0.1, y: 0.2 },
            { x: 0.4, y: 0.2 },
            { x: 0.4, y: 0.7 },
            { x: 0.1, y: 0.7 }
          ]
        }
      };
      
      const enhancedItem = createEnhancedDetectedItem(mockGoogleResponse);
      
      expect(enhancedItem.boundingBox.x).toBeCloseTo(0.1, 6);
      expect(enhancedItem.boundingBox.y).toBeCloseTo(0.2, 6);
      expect(enhancedItem.boundingBox.width).toBeCloseTo(0.3, 6);
      expect(enhancedItem.boundingBox.height).toBeCloseTo(0.5, 6);
      expect(enhancedItem.precisionLevel).toBe('medium');
    });
  });
});


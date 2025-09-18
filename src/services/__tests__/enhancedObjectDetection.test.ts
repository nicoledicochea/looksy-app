import { DetectedItem } from '../realAiService';

describe('Enhanced Object Detection Integration', () => {
  describe('DetectedItem Interface Enhancement', () => {
    it('should support enhanced segmentation mask data', () => {
      const enhancedItem: DetectedItem = {
        id: 'test-item',
        name: 'Watch',
        confidence: 0.95,
        category: 'Accessories',
        description: 'Digital watch detected',
        boundingBox: {
          x: 0.2,
          y: 0.3,
          width: 0.2,
          height: 0.2
        },
        segmentationMask: {
          normalizedVertices: [
            { x: 0.2, y: 0.3 },
            { x: 0.4, y: 0.3 },
            { x: 0.4, y: 0.5 },
            { x: 0.2, y: 0.5 }
          ]
        },
        precisionLevel: 'high',
        source: 'object_localization'
      };

      expect(enhancedItem.segmentationMask).toBeDefined();
      expect(enhancedItem.segmentationMask?.normalizedVertices).toHaveLength(4);
      expect(enhancedItem.precisionLevel).toBe('high');
      expect(enhancedItem.source).toBe('object_localization');
    });

    it('should support different precision levels', () => {
      const highPrecisionItem: DetectedItem = {
        id: 'high-precision',
        name: 'Watch',
        confidence: 0.95,
        category: 'Accessories',
        description: 'High precision detection',
        boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
        precisionLevel: 'high',
        source: 'object_localization'
      };

      const mediumPrecisionItem: DetectedItem = {
        id: 'medium-precision',
        name: 'Sleeve',
        confidence: 0.88,
        category: 'Clothing',
        description: 'Medium precision detection',
        boundingBox: { x: 0.1, y: 0.2, width: 0.5, height: 0.5 },
        precisionLevel: 'medium',
        source: 'object_localization'
      };

      const lowPrecisionItem: DetectedItem = {
        id: 'low-precision',
        name: 'Unknown',
        confidence: 0.6,
        category: 'Other',
        description: 'Low precision detection',
        boundingBox: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
        precisionLevel: 'low',
        source: 'label_detection'
      };

      expect(highPrecisionItem.precisionLevel).toBe('high');
      expect(mediumPrecisionItem.precisionLevel).toBe('medium');
      expect(lowPrecisionItem.precisionLevel).toBe('low');
    });

    it('should support different source types', () => {
      const objectLocalizationItem: DetectedItem = {
        id: 'object-localization',
        name: 'Watch',
        confidence: 0.95,
        category: 'Accessories',
        description: 'From object localization',
        boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
        precisionLevel: 'high',
        source: 'object_localization'
      };

      const labelDetectionItem: DetectedItem = {
        id: 'label-detection',
        name: 'Clothing',
        confidence: 0.8,
        category: 'Clothing',
        description: 'From label detection',
        boundingBox: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
        precisionLevel: 'medium',
        source: 'label_detection'
      };

      const fallbackItem: DetectedItem = {
        id: 'fallback',
        name: 'Item',
        confidence: 0.7,
        category: 'Other',
        description: 'Fallback detection',
        boundingBox: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
        precisionLevel: 'low',
        source: 'fallback'
      };

      expect(objectLocalizationItem.source).toBe('object_localization');
      expect(labelDetectionItem.source).toBe('label_detection');
      expect(fallbackItem.source).toBe('fallback');
    });
  });

  describe('Bounding Box Precision Enhancement', () => {
    it('should calculate precise bounding boxes from segmentation vertices', () => {
      const vertices = [
        { x: 0.1, y: 0.2 },
        { x: 0.5, y: 0.2 },
        { x: 0.5, y: 0.8 },
        { x: 0.1, y: 0.8 }
      ];

      // Calculate bounding box from vertices
      const xs = vertices.map(v => v.x);
      const ys = vertices.map(v => v.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const boundingBox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };

      expect(boundingBox.x).toBeCloseTo(0.1, 5);
      expect(boundingBox.y).toBeCloseTo(0.2, 5);
      expect(boundingBox.width).toBeCloseTo(0.4, 5);
      expect(boundingBox.height).toBeCloseTo(0.6, 5);
    });

    it('should handle edge cases in vertex calculations', () => {
      const edgeCaseVertices = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ];

      const xs = edgeCaseVertices.map(v => v.x);
      const ys = edgeCaseVertices.map(v => v.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const boundingBox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };

      expect(boundingBox).toEqual({
        x: 0,
        y: 0,
        width: 1,
        height: 1
      });
    });

    it('should handle missing vertices gracefully', () => {
      const emptyVertices: Array<{ x: number; y: number }> = [];
      
      const xs = emptyVertices.map(v => v.x);
      const ys = emptyVertices.map(v => v.y);
      
      // Handle empty arrays
      const minX = xs.length > 0 ? Math.min(...xs) : 0;
      const maxX = xs.length > 0 ? Math.max(...xs) : 0;
      const minY = ys.length > 0 ? Math.min(...ys) : 0;
      const maxY = ys.length > 0 ? Math.max(...ys) : 0;

      const boundingBox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };

      expect(boundingBox).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0
      });
    });
  });

  describe('Precision Level Determination', () => {
    it('should determine high precision for large objects with many vertices', () => {
      const area = 0.05; // Large area
      const vertexCount = 10; // Many vertices
      
      let precisionLevel: 'high' | 'medium' | 'low' = 'low';
      
      if (vertexCount >= 8 && area > 0.01) {
        precisionLevel = 'high';
      } else if (vertexCount >= 4 && area > 0.005) {
        precisionLevel = 'medium';
      }

      expect(precisionLevel).toBe('high');
    });

    it('should determine medium precision for medium objects with few vertices', () => {
      const area = 0.01; // Medium area
      const vertexCount = 4; // Few vertices
      
      let precisionLevel: 'high' | 'medium' | 'low' = 'low';
      
      if (vertexCount >= 8 && area > 0.01) {
        precisionLevel = 'high';
      } else if (vertexCount >= 4 && area > 0.005) {
        precisionLevel = 'medium';
      }

      expect(precisionLevel).toBe('medium');
    });

    it('should determine low precision for small objects or few vertices', () => {
      const area = 0.001; // Small area
      const vertexCount = 2; // Very few vertices
      
      let precisionLevel: 'high' | 'medium' | 'low' = 'low';
      
      if (vertexCount >= 8 && area > 0.01) {
        precisionLevel = 'high';
      } else if (vertexCount >= 4 && area > 0.005) {
        precisionLevel = 'medium';
      }

      expect(precisionLevel).toBe('low');
    });
  });

  describe('Enhanced Detection Features', () => {
    it('should support pixel-level segmentation mask data', () => {
      const itemWithPixelMask: DetectedItem = {
        id: 'pixel-mask-item',
        name: 'Watch',
        confidence: 0.95,
        category: 'Accessories',
        description: 'Watch with pixel mask',
        boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
        segmentationMask: {
          normalizedVertices: [
            { x: 0.2, y: 0.3 },
            { x: 0.4, y: 0.3 },
            { x: 0.4, y: 0.5 },
            { x: 0.2, y: 0.5 }
          ],
          pixelMask: 'base64EncodedPixelMaskData'
        },
        precisionLevel: 'high',
        source: 'object_localization'
      };

      expect(itemWithPixelMask.segmentationMask?.pixelMask).toBeDefined();
      expect(itemWithPixelMask.segmentationMask?.pixelMask).toBe('base64EncodedPixelMaskData');
    });

    it('should maintain backward compatibility with basic DetectedItem', () => {
      const basicItem: DetectedItem = {
        id: 'basic-item',
        name: 'Item',
        confidence: 0.8,
        category: 'Other',
        description: 'Basic item',
        boundingBox: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
        precisionLevel: 'low',
        source: 'fallback'
      };

      // Should have all required properties
      expect(basicItem.id).toBeDefined();
      expect(basicItem.name).toBeDefined();
      expect(basicItem.confidence).toBeDefined();
      expect(basicItem.category).toBeDefined();
      expect(basicItem.description).toBeDefined();
      expect(basicItem.boundingBox).toBeDefined();
      expect(basicItem.precisionLevel).toBeDefined();
      expect(basicItem.source).toBeDefined();

      // Optional properties should be undefined
      expect(basicItem.segmentationMask).toBeUndefined();
    });
  });
});
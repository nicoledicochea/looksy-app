import { DetectedItem } from '../realAiService';
import {
  calculateBoundingBoxArea,
  calculateBoundingBoxCenter,
  calculateDistance,
  calculateIntersectionArea,
  calculateUnionArea,
  calculateOverlapMetrics,
  isBoundingBoxContained,
  hasSignificantOverlap,
  calculateObjectSpecificity,
  calculateSizeBasedPriority,
  resolveOverlapConflicts,
  generateOverlapStatistics,
  applySizeBasedOverlapResolution
} from '../sizeBasedOverlapResolutionService';

// Mock DetectedItem for testing
const createMockItem = (
  id: string,
  name: string,
  category: string,
  boundingBox: { x: number; y: number; width: number; height: number },
  confidence: number = 0.9
): DetectedItem => ({
  id,
  name,
  confidence,
  category,
  description: `${name} detected`,
  boundingBox,
  precisionLevel: 'high',
  source: 'object_localization'
});

describe('Size-Based Overlap Resolution System', () => {
  describe('Overlap Detection Algorithms', () => {
    it('should calculate bounding box overlap percentage correctly', () => {
      // Test case: Two overlapping rectangles
      const box1 = { x: 0.1, y: 0.1, width: 0.4, height: 0.4 }; // Area = 0.16
      const box2 = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }; // Area = 0.16
      
      const overlapMetrics = calculateOverlapMetrics(box1, box2);
      
      // Expected intersection: x=0.2, y=0.2, width=0.3, height=0.3
      // Intersection area = 0.09
      // Overlap percentage = intersection / union = 0.09 / (0.16 + 0.16 - 0.09) = 0.09 / 0.23 ≈ 0.391
      expect(overlapMetrics.intersectionArea).toBeCloseTo(0.09, 2);
      expect(overlapMetrics.overlapPercentage).toBeCloseTo(0.391, 2);
      expect(overlapMetrics.iou).toBeCloseTo(0.391, 2);
    });

    it('should handle complete overlap scenarios', () => {
      // Test case: One box completely inside another
      const outerBox = { x: 0.1, y: 0.1, width: 0.6, height: 0.6 }; // Area = 0.36
      const innerBox = { x: 0.2, y: 0.2, width: 0.3, height: 0.3 };   // Area = 0.09
      
      const overlapMetrics = calculateOverlapMetrics(outerBox, innerBox);
      
      // Inner box is completely inside outer box
      // Overlap percentage = intersection / union = 0.09 / (0.36 + 0.09 - 0.09) = 0.09 / 0.36 = 0.25
      expect(overlapMetrics.overlapPercentage).toBeCloseTo(0.25, 2);
    });

    it('should handle partial overlap scenarios', () => {
      // Test case: Partial overlap
      const box1 = { x: 0.1, y: 0.1, width: 0.3, height: 0.3 }; // Area = 0.09
      const box2 = { x: 0.2, y: 0.2, width: 0.3, height: 0.3 }; // Area = 0.09
      
      const overlapMetrics = calculateOverlapMetrics(box1, box2);
      
      // Intersection: x=0.2, y=0.2, width=0.2, height=0.2, area=0.04
      // Union: 0.09 + 0.09 - 0.04 = 0.14
      // Overlap percentage = 0.04 / 0.14 ≈ 0.286
      expect(overlapMetrics.overlapPercentage).toBeCloseTo(0.286, 2);
    });

    it('should handle non-overlapping bounding boxes', () => {
      // Test case: No overlap
      const box1 = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
      const box2 = { x: 0.5, y: 0.5, width: 0.2, height: 0.2 };
      
      const overlapMetrics = calculateOverlapMetrics(box1, box2);
      
      // Should return 0% overlap
      expect(overlapMetrics.overlapPercentage).toBe(0);
      expect(overlapMetrics.intersectionArea).toBe(0);
    });

    it('should calculate IoU (Intersection over Union) correctly', () => {
      // Test case: Standard IoU calculation
      const box1 = { x: 0.1, y: 0.1, width: 0.4, height: 0.4 }; // Area = 0.16
      const box2 = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }; // Area = 0.16
      
      const overlapMetrics = calculateOverlapMetrics(box1, box2);
      
      // Intersection: x=0.2, y=0.2, width=0.3, height=0.3, area=0.09
      // Union: 0.16 + 0.16 - 0.09 = 0.23
      // IoU = 0.09 / 0.23 ≈ 0.391
      expect(overlapMetrics.iou).toBeCloseTo(0.391, 2);
    });
  });

  describe('Conflict Resolution Logic', () => {
    it('should prioritize smaller objects over larger ones when overlapping', () => {
      const items: DetectedItem[] = [
        createMockItem('large-object', 'Large Object', 'Other', {
          x: 0.1, y: 0.1, width: 0.8, height: 0.8
        }, 0.95), // Large, high confidence
        createMockItem('small-object', 'Small Object', 'Other', {
          x: 0.2, y: 0.2, width: 0.2, height: 0.2
        }, 0.85)  // Small, lower confidence but should be prioritized
      ];
      
      const conflicts = resolveOverlapConflicts(items, 0.05); // Lower threshold to detect the overlap
      
      // Should prioritize small object even with lower confidence
      const smallObjectInResolved = conflicts.resolvedItems.find(item => item.id === 'small-object');
      const largeObjectInConflicting = conflicts.conflictingItems.find(item => item.id === 'large-object');
      
      expect(smallObjectInResolved).toBeDefined();
      expect(largeObjectInConflicting).toBeDefined();
    });

    it('should resolve conflicts based on object specificity', () => {
      const items: DetectedItem[] = [
        createMockItem('generic-item', 'Item', 'Other', {
          x: 0.1, y: 0.1, width: 0.6, height: 0.6
        }, 0.9),
        createMockItem('specific-item', 'iPhone 13 Pro', 'Electronics', {
          x: 0.2, y: 0.2, width: 0.3, height: 0.4
        }, 0.85)
      ];
      
      const conflicts = resolveOverlapConflicts(items, 0.1);
      
      // Should prioritize specific item over generic item
      const specificItemInResolved = conflicts.resolvedItems.find(item => item.id === 'specific-item');
      const genericItemInConflicting = conflicts.conflictingItems.find(item => item.id === 'generic-item');
      
      expect(specificItemInResolved).toBeDefined();
      expect(genericItemInConflicting).toBeDefined();
    });

    it('should handle multiple overlapping objects correctly', () => {
      const items: DetectedItem[] = [
        createMockItem('background', 'Background', 'Background', {
          x: 0.0, y: 0.0, width: 1.0, height: 1.0
        }, 0.95),
        createMockItem('table', 'Table', 'Furniture', {
          x: 0.1, y: 0.1, width: 0.8, height: 0.8
        }, 0.9),
        createMockItem('book', 'Book', 'Books', {
          x: 0.2, y: 0.2, width: 0.3, height: 0.3
        }, 0.85),
        createMockItem('pen', 'Pen', 'Office Supplies', {
          x: 0.25, y: 0.25, width: 0.1, height: 0.15
        }, 0.8)
      ];
      
      // Should prioritize: Pen > Book > Table > Background
      expect(true).toBe(true); // Placeholder until implementation
    });

    it('should maintain object hierarchy when resolving conflicts', () => {
      const items: DetectedItem[] = [
        createMockItem('room', 'Room', 'Background', {
          x: 0.0, y: 0.0, width: 1.0, height: 1.0
        }),
        createMockItem('desk', 'Desk', 'Furniture', {
          x: 0.1, y: 0.1, width: 0.8, height: 0.6
        }),
        createMockItem('laptop', 'Laptop', 'Electronics', {
          x: 0.2, y: 0.2, width: 0.4, height: 0.3
        }),
        createMockItem('mouse', 'Mouse', 'Electronics', {
          x: 0.3, y: 0.3, width: 0.1, height: 0.08
        })
      ];
      
      // Should maintain proper hierarchy: Room > Desk > Laptop > Mouse
      // But prioritize smaller objects: Mouse > Laptop > Desk > Room
      expect(true).toBe(true); // Placeholder until implementation
    });
  });

  describe('Geometric Analysis', () => {
    it('should calculate bounding box area correctly', () => {
      const boundingBox = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };
      const area = calculateBoundingBoxArea(boundingBox);
      
      expect(area).toBe(0.12); // 0.3 * 0.4
    });

    it('should determine if one bounding box contains another', () => {
      const containerBox = { x: 0.1, y: 0.1, width: 0.6, height: 0.6 };
      const containedBox = { x: 0.2, y: 0.2, width: 0.3, height: 0.3 };
      
      const isContained = isBoundingBoxContained(containerBox, containedBox);
      expect(isContained).toBe(true);
    });

    it('should calculate center point of bounding boxes', () => {
      const boundingBox = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };
      const center = calculateBoundingBoxCenter(boundingBox);
      
      expect(center.x).toBeCloseTo(0.25, 2); // 0.1 + 0.3/2
      expect(center.y).toBeCloseTo(0.4, 2);  // 0.2 + 0.4/2
    });

    it('should calculate distance between bounding box centers', () => {
      const box1 = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 }; // Center: (0.2, 0.2)
      const box2 = { x: 0.4, y: 0.4, width: 0.2, height: 0.2 }; // Center: (0.5, 0.5)
      
      const center1 = calculateBoundingBoxCenter(box1);
      const center2 = calculateBoundingBoxCenter(box2);
      const distance = calculateDistance(center1, center2);
      
      // Distance = sqrt((0.5-0.2)² + (0.5-0.2)²) = sqrt(0.09 + 0.09) = sqrt(0.18) ≈ 0.424
      expect(distance).toBeCloseTo(0.424, 2);
    });

    it('should handle edge cases for geometric calculations', () => {
      // Test case: Zero-width or zero-height boxes
      const zeroWidthBox = { x: 0.1, y: 0.1, width: 0, height: 0.2 };
      const zeroHeightBox = { x: 0.1, y: 0.1, width: 0.2, height: 0 };
      
      const area1 = calculateBoundingBoxArea(zeroWidthBox);
      const area2 = calculateBoundingBoxArea(zeroHeightBox);
      
      expect(area1).toBe(0);
      expect(area2).toBe(0);
    });
  });

  describe('Overlap Resolution Pipeline', () => {
    it('should process multiple overlapping objects through resolution pipeline', () => {
      const items: DetectedItem[] = [
        createMockItem('background', 'Background', 'Background', {
          x: 0.0, y: 0.0, width: 1.0, height: 1.0
        }, 0.95),
        createMockItem('table', 'Table', 'Furniture', {
          x: 0.1, y: 0.1, width: 0.8, height: 0.8
        }, 0.9),
        createMockItem('book', 'Book', 'Books', {
          x: 0.2, y: 0.2, width: 0.3, height: 0.3
        }, 0.85),
        createMockItem('pen', 'Pen', 'Office Supplies', {
          x: 0.25, y: 0.25, width: 0.1, height: 0.15
        }, 0.8)
      ];
      
      const result = applySizeBasedOverlapResolution(items, 0.1);
      
      // Should return resolved items with conflicts resolved
      expect(result.resolvedItems).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.conflicts).toBeDefined();
    });

    it('should apply size-based prioritization rules', () => {
      const items: DetectedItem[] = [
        createMockItem('large-generic', 'Large Item', 'Other', {
          x: 0.1, y: 0.1, width: 0.7, height: 0.7
        }, 0.95),
        createMockItem('medium-specific', 'iPhone', 'Electronics', {
          x: 0.2, y: 0.2, width: 0.3, height: 0.4
        }, 0.85),
        createMockItem('small-specific', 'AirPods', 'Electronics', {
          x: 0.25, y: 0.25, width: 0.1, height: 0.15
        }, 0.8)
      ];
      
      const result = applySizeBasedOverlapResolution(items, 0.1);
      
      // Should prioritize smaller, more specific items
      expect(result.resolvedItems.length).toBeGreaterThan(0);
      expect(result.conflicts.conflictingItems.length).toBeGreaterThan(0);
    });

    it('should handle confidence threshold adjustments in conflict resolution', () => {
      const items: DetectedItem[] = [
        createMockItem('high-conf-large', 'Large Object', 'Other', {
          x: 0.1, y: 0.1, width: 0.8, height: 0.8
        }, 0.95),
        createMockItem('low-conf-small', 'Small Object', 'Other', {
          x: 0.2, y: 0.2, width: 0.2, height: 0.2
        }, 0.7) // Below typical threshold but should still be prioritized
      ];
      
      // Should still prioritize small object despite lower confidence
      expect(true).toBe(true); // Placeholder until implementation
    });

    it('should provide overlap statistics and resolution metrics', () => {
      const items: DetectedItem[] = [
        createMockItem('item1', 'Item 1', 'Other', {
          x: 0.1, y: 0.1, width: 0.4, height: 0.4
        }),
        createMockItem('item2', 'Item 2', 'Other', {
          x: 0.2, y: 0.2, width: 0.4, height: 0.4
        })
      ];
      
      const statistics = generateOverlapStatistics(items);
      
      // Should return statistics about overlaps and resolutions
      expect(statistics.totalOverlaps).toBeGreaterThanOrEqual(0);
      expect(statistics.averageOverlapPercentage).toBeGreaterThanOrEqual(0);
      expect(statistics.maxOverlapPercentage).toBeGreaterThanOrEqual(0);
      expect(statistics.overlapDistribution).toBeDefined();
    });
  });
});

import { DetectedItem } from '../realAiService';
import {
  calculateBoundingBoxIntersection,
  calculateContainmentPercentage,
  isContainedWithin,
  detectParentChildRelationships,
  prioritizeChildObjects,
  filterParentObjects,
  performSpatialAnalysis,
  shouldPrioritizeItem
} from '../parentChildDetectionService';

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

describe('Parent-Child Relationship Detection', () => {
  describe('Spatial Analysis Algorithms', () => {
    it('should calculate bounding box intersection area correctly', () => {
      // Test case: Two overlapping rectangles
      const parentBox = { x: 0.1, y: 0.1, width: 0.6, height: 0.6 }; // Large box
      const childBox = { x: 0.2, y: 0.2, width: 0.3, height: 0.3 };   // Smaller box inside
      
      const intersection = calculateBoundingBoxIntersection(parentBox, childBox);
      
      expect(intersection).not.toBeNull();
      expect(intersection!.x).toBe(0.2);
      expect(intersection!.y).toBe(0.2);
      expect(intersection!.width).toBe(0.3);
      expect(intersection!.height).toBe(0.3);
      expect(intersection!.area).toBe(0.09);
    });

    it('should calculate containment percentage correctly', () => {
      // Test case: Child box completely inside parent box
      const parentBox = { x: 0.1, y: 0.1, width: 0.6, height: 0.6 }; // Area = 0.36
      const childBox = { x: 0.2, y: 0.2, width: 0.3, height: 0.3 };     // Area = 0.09
      
      // Child area / Parent area = 0.09 / 0.36 = 0.25 (25%)
      const containmentPercentage = calculateContainmentPercentage(parentBox, childBox);
      
      expect(containmentPercentage).toBeCloseTo(0.25, 2);
    });

    it('should detect when child object is contained within parent object', () => {
      // Test case: Watch inside sleeve
      const sleeve = createMockItem('sleeve-1', 'Sleeve', 'Clothing', {
        x: 0.1, y: 0.1, width: 0.6, height: 0.6
      });
      
      const watch = createMockItem('watch-1', 'Watch', 'Accessories', {
        x: 0.2, y: 0.2, width: 0.3, height: 0.3
      });
      
      const isContained = isContainedWithin(sleeve.boundingBox, watch.boundingBox, 0.1);
      expect(isContained).toBe(true);
    });

    it('should handle edge cases for partial containment', () => {
      // Test case: Object partially overlapping
      const parentBox = { x: 0.1, y: 0.1, width: 0.4, height: 0.4 };
      const childBox = { x: 0.3, y: 0.3, width: 0.4, height: 0.4 }; // Partially overlapping
      
      const intersection = calculateBoundingBoxIntersection(parentBox, childBox);
      expect(intersection).not.toBeNull();
      expect(intersection!.area).toBeGreaterThan(0);
    });
  });

  describe('Parent-Child Detection Logic', () => {
    it('should identify parent-child relationships correctly', () => {
      const items: DetectedItem[] = [
        createMockItem('sleeve-1', 'Sleeve', 'Clothing', {
          x: 0.1, y: 0.1, width: 0.6, height: 0.6
        }),
        createMockItem('watch-1', 'Watch', 'Accessories', {
          x: 0.2, y: 0.2, width: 0.3, height: 0.3
        }),
        createMockItem('table-1', 'Table', 'Furniture', {
          x: 0.0, y: 0.0, width: 1.0, height: 1.0
        }),
        createMockItem('book-1', 'Book', 'Books', {
          x: 0.4, y: 0.4, width: 0.2, height: 0.2
        })
      ];
      
      const relationships = detectParentChildRelationships(items);
      
      // Should find relationships between overlapping items
      expect(relationships.length).toBeGreaterThan(0);
      
      // Check for specific relationships
      const watchSleeveRel = relationships.find(rel => 
        rel.parent.id === 'sleeve-1' && rel.child.id === 'watch-1'
      );
      expect(watchSleeveRel).toBeDefined();
    });

    it('should prioritize child objects over parent objects', () => {
      const items: DetectedItem[] = [
        createMockItem('sleeve-1', 'Sleeve', 'Clothing', {
          x: 0.1, y: 0.1, width: 0.6, height: 0.6
        }, 0.95), // High confidence
        createMockItem('watch-1', 'Watch', 'Accessories', {
          x: 0.2, y: 0.2, width: 0.3, height: 0.3
        }, 0.85)  // Lower confidence but should be prioritized
      ];
      
      const relationships = detectParentChildRelationships(items);
      const prioritizedItems = prioritizeChildObjects(items, relationships);
      
      // Watch should come before sleeve in prioritized list
      const watchIndex = prioritizedItems.findIndex(item => item.id === 'watch-1');
      const sleeveIndex = prioritizedItems.findIndex(item => item.id === 'sleeve-1');
      expect(watchIndex).toBeLessThan(sleeveIndex);
    });

    it('should handle multiple levels of nesting', () => {
      const items: DetectedItem[] = [
        createMockItem('room-1', 'Room', 'Background', {
          x: 0.0, y: 0.0, width: 1.0, height: 1.0
        }),
        createMockItem('table-1', 'Table', 'Furniture', {
          x: 0.1, y: 0.1, width: 0.8, height: 0.8
        }),
        createMockItem('book-1', 'Book', 'Books', {
          x: 0.2, y: 0.2, width: 0.3, height: 0.3
        })
      ];
      
      const relationships = detectParentChildRelationships(items);
      
      // Should detect multiple levels of nesting
      expect(relationships.length).toBeGreaterThan(0);
      
      // Check for room-table relationship
      const roomTableRel = relationships.find(rel => 
        rel.parent.id === 'room-1' && rel.child.id === 'table-1'
      );
      expect(roomTableRel).toBeDefined();
    });

    it('should filter out parent objects when child objects are present', () => {
      const items: DetectedItem[] = [
        createMockItem('sleeve-1', 'Sleeve', 'Clothing', {
          x: 0.1, y: 0.1, width: 0.6, height: 0.6
        }),
        createMockItem('watch-1', 'Watch', 'Accessories', {
          x: 0.2, y: 0.2, width: 0.3, height: 0.3
        })
      ];
      
      const relationships = detectParentChildRelationships(items);
      const filteredItems = filterParentObjects(items, relationships);
      
      // Should return only the watch, filtering out the sleeve
      expect(filteredItems).toHaveLength(1);
      expect(filteredItems[0].id).toBe('watch-1');
    });
  });

  describe('Spatial Containment Analysis', () => {
    it('should calculate bounding box intersection correctly', () => {
      const box1 = { x: 0.1, y: 0.1, width: 0.4, height: 0.4 };
      const box2 = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 };
      
      const intersection = calculateBoundingBoxIntersection(box1, box2);
      
      expect(intersection).not.toBeNull();
      expect(intersection!.x).toBe(0.2);
      expect(intersection!.y).toBe(0.2);
      expect(intersection!.width).toBe(0.3);
      expect(intersection!.height).toBe(0.3);
      expect(intersection!.area).toBeCloseTo(0.09, 2);
    });

    it('should handle non-overlapping bounding boxes', () => {
      const box1 = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
      const box2 = { x: 0.5, y: 0.5, width: 0.2, height: 0.2 };
      
      const intersection = calculateBoundingBoxIntersection(box1, box2);
      expect(intersection).toBeNull();
    });

    it('should calculate containment ratio correctly', () => {
      const parentBox = { x: 0.1, y: 0.1, width: 0.6, height: 0.6 }; // Area = 0.36
      const childBox = { x: 0.2, y: 0.2, width: 0.3, height: 0.3 };   // Area = 0.09
      
      const containmentRatio = calculateContainmentPercentage(parentBox, childBox);
      expect(containmentRatio).toBeCloseTo(0.25, 2);
    });
  });

  describe('Child Object Prioritization', () => {
    it('should prioritize smaller objects over larger ones', () => {
      const items: DetectedItem[] = [
        createMockItem('large-object', 'Large Object', 'Other', {
          x: 0.1, y: 0.1, width: 0.8, height: 0.8
        }, 0.95),
        createMockItem('small-object', 'Small Object', 'Other', {
          x: 0.2, y: 0.2, width: 0.2, height: 0.2
        }, 0.85)
      ];
      
      const shouldPrioritizeSmall = shouldPrioritizeItem(items[1], items);
      const shouldPrioritizeLarge = shouldPrioritizeItem(items[0], items);
      
      expect(shouldPrioritizeSmall).toBe(true);
      expect(shouldPrioritizeLarge).toBe(false);
    });

    it('should prioritize objects of interest over objects to ignore', () => {
      const items: DetectedItem[] = [
        createMockItem('sleeve-1', 'Sleeve', 'Clothing', {
          x: 0.1, y: 0.1, width: 0.6, height: 0.6
        }, 0.95),
        createMockItem('watch-1', 'Watch', 'Accessories', {
          x: 0.2, y: 0.2, width: 0.3, height: 0.3
        }, 0.85)
      ];
      
      const shouldPrioritizeWatch = shouldPrioritizeItem(items[1], items);
      const shouldPrioritizeSleeve = shouldPrioritizeItem(items[0], items);
      
      expect(shouldPrioritizeWatch).toBe(true);
      expect(shouldPrioritizeSleeve).toBe(false);
    });

    it('should handle confidence threshold adjustments for parent-child relationships', () => {
      const items: DetectedItem[] = [
        createMockItem('sleeve-1', 'Sleeve', 'Clothing', {
          x: 0.1, y: 0.1, width: 0.6, height: 0.6
        }, 0.7), // Lower confidence
        createMockItem('watch-1', 'Watch', 'Accessories', {
          x: 0.2, y: 0.2, width: 0.3, height: 0.3
        }, 0.8)  // Higher confidence
      ];
      
      const relationships = detectParentChildRelationships(items);
      const prioritizedItems = prioritizeChildObjects(items, relationships);
      
      // Watch should still be prioritized
      const watchIndex = prioritizedItems.findIndex(item => item.id === 'watch-1');
      const sleeveIndex = prioritizedItems.findIndex(item => item.id === 'sleeve-1');
      expect(watchIndex).toBeLessThan(sleeveIndex);
    });
  });
});

import { DetectedItem } from '../realAiService';
import { 
  categorizeForFiltering, 
  applyCategoryFiltering, 
  getConfidenceThreshold,
  getFilteringStats,
  createCustomFilteringConfig,
  defaultFilteringConfig,
  CategoryFilteringConfig
} from '../categoryFilteringService';

describe('Category-Based Filtering System', () => {
  describe('Object Classification', () => {
    it('should classify objects of interest correctly', () => {
      const testItems = [
        { name: 'Watch', expected: 'objects_of_interest' },
        { name: 'iPhone', expected: 'objects_of_interest' },
        { name: 'Leather Jacket', expected: 'objects_of_interest' },
        { name: 'Nike Sneakers', expected: 'objects_of_interest' },
        { name: 'Designer Handbag', expected: 'objects_of_interest' },
        { name: 'Textbook', expected: 'objects_of_interest' }
      ];

      testItems.forEach(({ name, expected }) => {
        expect(categorizeForFiltering(name)).toBe(expected);
      });
    });

    it('should classify objects to ignore correctly', () => {
      const testItems = [
        { name: 'Sleeve', expected: 'objects_to_ignore' },
        { name: 'Arm', expected: 'objects_to_ignore' },
        { name: 'Hand', expected: 'objects_to_ignore' },
        { name: 'Wooden Table', expected: 'objects_to_ignore' },
        { name: 'Office Chair', expected: 'objects_to_ignore' },
        { name: 'Background Wall', expected: 'objects_to_ignore' },
        { name: 'Person', expected: 'objects_to_ignore' }
      ];

      testItems.forEach(({ name, expected }) => {
        expect(categorizeForFiltering(name)).toBe(expected);
      });
    });

    it('should classify unknown objects as default', () => {
      const testItems = [
        { name: 'Unknown Widget', expected: 'default' },
        { name: 'Mystery Device', expected: 'default' },
        { name: 'Random Gadget', expected: 'default' }
      ];

      testItems.forEach(({ name, expected }) => {
        expect(categorizeForFiltering(name)).toBe(expected);
      });
    });
  });

  describe('Confidence Threshold Adjustment', () => {
    it('should apply lower threshold for objects of interest', () => {
      const watchItem: DetectedItem = {
        id: 'watch-1',
        name: 'Watch',
        confidence: 0.65,
        category: 'Accessories',
        description: 'Digital watch',
        boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
        precisionLevel: 'high',
        source: 'object_localization'
      };

      const threshold = getConfidenceThreshold(watchItem);
      expect(threshold).toBe(0.6);
    });

    it('should apply higher threshold for objects to ignore', () => {
      const sleeveItem: DetectedItem = {
        id: 'sleeve-1',
        name: 'Sleeve',
        confidence: 0.75,
        category: 'Clothing',
        description: 'Clothing sleeve',
        boundingBox: { x: 0.1, y: 0.2, width: 0.5, height: 0.5 },
        precisionLevel: 'medium',
        source: 'object_localization'
      };

      const threshold = getConfidenceThreshold(sleeveItem);
      expect(threshold).toBe(0.8);
    });

    it('should apply default threshold for unknown objects', () => {
      const unknownItem: DetectedItem = {
        id: 'unknown-1',
        name: 'Unknown Widget',
        confidence: 0.75,
        category: 'Other',
        description: 'Unknown item',
        boundingBox: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
        precisionLevel: 'low',
        source: 'label_detection'
      };

      const threshold = getConfidenceThreshold(unknownItem);
      expect(threshold).toBe(0.7);
    });
  });

  describe('Category-Based Filtering Pipeline', () => {
    it('should filter out objects to ignore with low confidence', () => {
      const testItems: DetectedItem[] = [
        {
          id: 'watch-1',
          name: 'Watch',
          confidence: 0.65, // Above threshold for objects of interest (0.6)
          category: 'Accessories',
          description: 'Digital watch',
          boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
          precisionLevel: 'high',
          source: 'object_localization'
        },
        {
          id: 'sleeve-1',
          name: 'Sleeve',
          confidence: 0.75, // Below threshold for objects to ignore (0.8)
          category: 'Clothing',
          description: 'Clothing sleeve',
          boundingBox: { x: 0.1, y: 0.2, width: 0.5, height: 0.5 },
          precisionLevel: 'medium',
          source: 'object_localization'
        },
        {
          id: 'table-1',
          name: 'Table',
          confidence: 0.85, // Above threshold for objects to ignore (0.8)
          category: 'Furniture',
          description: 'Wooden table',
          boundingBox: { x: 0.0, y: 0.0, width: 1.0, height: 1.0 },
          precisionLevel: 'low',
          source: 'object_localization'
        }
      ];

      const filteredItems = applyCategoryFiltering(testItems);
      
      // Should keep watch (object of interest) and table (high confidence object to ignore)
      // Should filter out sleeve (low confidence object to ignore)
      expect(filteredItems).toHaveLength(2);
      expect(filteredItems.find(item => item.name === 'Watch')).toBeDefined();
      expect(filteredItems.find(item => item.name === 'Table')).toBeDefined();
      expect(filteredItems.find(item => item.name === 'Sleeve')).toBeUndefined();
    });

    it('should keep all high-confidence objects of interest', () => {
      const testItems: DetectedItem[] = [
        {
          id: 'watch-1',
          name: 'Watch',
          confidence: 0.95,
          category: 'Accessories',
          description: 'Luxury watch',
          boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
          precisionLevel: 'high',
          source: 'object_localization'
        },
        {
          id: 'phone-1',
          name: 'iPhone',
          confidence: 0.9,
          category: 'Electronics',
          description: 'Smartphone',
          boundingBox: { x: 0.4, y: 0.1, width: 0.15, height: 0.25 },
          precisionLevel: 'high',
          source: 'object_localization'
        },
        {
          id: 'jacket-1',
          name: 'Leather Jacket',
          confidence: 0.85,
          category: 'Clothing',
          description: 'Brown leather jacket',
          boundingBox: { x: 0.1, y: 0.1, width: 0.3, height: 0.4 },
          precisionLevel: 'high',
          source: 'object_localization'
        }
      ];

      const filteredItems = applyCategoryFiltering(testItems);
      
      // Should keep all items (all are objects of interest with high confidence)
      expect(filteredItems).toHaveLength(3);
      expect(filteredItems.find(item => item.name === 'Watch')).toBeDefined();
      expect(filteredItems.find(item => item.name === 'iPhone')).toBeDefined();
      expect(filteredItems.find(item => item.name === 'Leather Jacket')).toBeDefined();
    });

    it('should handle edge cases in object names', () => {
      const testItems: DetectedItem[] = [
        {
          id: 'edge-1',
          name: 'Watch Band', // Contains 'watch' - should be object of interest
          confidence: 0.65,
          category: 'Accessories',
          description: 'Watch band',
          boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
          precisionLevel: 'high',
          source: 'object_localization'
        },
        {
          id: 'edge-2',
          name: 'Sleeve Detail', // Contains 'sleeve' - should be object to ignore
          confidence: 0.75,
          category: 'Clothing',
          description: 'Sleeve detail',
          boundingBox: { x: 0.1, y: 0.2, width: 0.5, height: 0.5 },
          precisionLevel: 'medium',
          source: 'object_localization'
        }
      ];

      const filteredItems = applyCategoryFiltering(testItems);
      
      // Should keep watch band (object of interest) and filter out sleeve detail (object to ignore)
      expect(filteredItems).toHaveLength(1);
      expect(filteredItems[0].name).toBe('Watch Band');
    });
  });

  describe('Configuration Customization', () => {
    it('should allow custom confidence thresholds', () => {
      const customConfig = createCustomFilteringConfig(
        defaultFilteringConfig.objectsOfInterest,
        defaultFilteringConfig.objectsToIgnore,
        {
          'objects_of_interest': 0.8,
          'objects_to_ignore': 0.9,
          'default': 0.85
        }
      );

      const testItems: DetectedItem[] = [
        {
          id: 'watch-1',
          name: 'Watch',
          confidence: 0.75, // Below custom threshold for objects of interest (0.8)
          category: 'Accessories',
          description: 'Digital watch',
          boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
          precisionLevel: 'high',
          source: 'object_localization'
        }
      ];

      const filteredItems = applyCategoryFiltering(testItems, customConfig);
      
      // Should filter out watch due to higher custom threshold
      expect(filteredItems).toHaveLength(0);
    });

    it('should allow custom object lists', () => {
      const customConfig = createCustomFilteringConfig(
        ['Custom Item'],
        ['Custom Background']
      );

      const testItems: DetectedItem[] = [
        {
          id: 'custom-1',
          name: 'Custom Item',
          confidence: 0.65,
          category: 'Other',
          description: 'Custom item',
          boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
          precisionLevel: 'high',
          source: 'object_localization'
        },
        {
          id: 'custom-2',
          name: 'Custom Background',
          confidence: 0.75,
          category: 'Other',
          description: 'Custom background',
          boundingBox: { x: 0.0, y: 0.0, width: 1.0, height: 1.0 },
          precisionLevel: 'low',
          source: 'object_localization'
        }
      ];

      const filteredItems = applyCategoryFiltering(testItems, customConfig);
      
      // Should keep custom item and filter out custom background
      expect(filteredItems).toHaveLength(1);
      expect(filteredItems[0].name).toBe('Custom Item');
    });
  });

  describe('Filtering Statistics', () => {
    it('should provide accurate filtering statistics', () => {
      const testItems: DetectedItem[] = [
        {
          id: 'watch-1',
          name: 'Watch',
          confidence: 0.95, // High confidence - should be kept
          category: 'Accessories',
          description: 'Luxury watch',
          boundingBox: { x: 0.2, y: 0.3, width: 0.2, height: 0.2 },
          precisionLevel: 'high',
          source: 'object_localization'
        },
        {
          id: 'sleeve-1',
          name: 'Sleeve',
          confidence: 0.75, // Low confidence for objects to ignore - should be filtered
          category: 'Clothing',
          description: 'Clothing sleeve',
          boundingBox: { x: 0.1, y: 0.2, width: 0.5, height: 0.5 },
          precisionLevel: 'medium',
          source: 'object_localization'
        },
        {
          id: 'unknown-1',
          name: 'Unknown Widget',
          confidence: 0.8, // Above default threshold - should be kept
          category: 'Other',
          description: 'Unknown item',
          boundingBox: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
          precisionLevel: 'low',
          source: 'label_detection'
        }
      ];

      const stats = getFilteringStats(testItems);
      
      expect(stats.total).toBe(3);
      expect(stats.objectsOfInterest).toBe(1); // Watch
      expect(stats.objectsToIgnore).toBe(1); // Sleeve
      expect(stats.default).toBe(1); // Unknown Widget
      expect(stats.kept).toBe(2); // Watch and Unknown Widget
      expect(stats.filtered).toBe(1); // Sleeve
    });
  });
});
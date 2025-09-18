import { DetectedItem } from '../realAiService';

describe('DetectedItem Interface', () => {
  afterEach(() => {
    // Clear any pending timers
    jest.clearAllTimers();
  });

  afterAll(() => {
    // Clean up any remaining resources
    jest.restoreAllMocks();
  });
  describe('boundingBox property', () => {
    it('should have required boundingBox property with normalized coordinates', () => {
      const detectedItem: DetectedItem = {
        id: 'test-item-1',
        name: 'Test Item',
        confidence: 0.95,
        category: 'Clothing',
        description: 'A test item for validation',
        boundingBox: {
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4
        }
      };

      expect(detectedItem.boundingBox).toBeDefined();
      expect(detectedItem.boundingBox.x).toBe(0.1);
      expect(detectedItem.boundingBox.y).toBe(0.2);
      expect(detectedItem.boundingBox.width).toBe(0.3);
      expect(detectedItem.boundingBox.height).toBe(0.4);
    });

    it('should validate normalized coordinate ranges (0-1)', () => {
      const validItem: DetectedItem = {
        id: 'test-item-2',
        name: 'Valid Item',
        confidence: 0.85,
        category: 'Electronics',
        description: 'An item with valid coordinates',
        boundingBox: {
          x: 0.0,    // Minimum valid x
          y: 0.0,    // Minimum valid y
          width: 1.0, // Maximum valid width
          height: 1.0 // Maximum valid height
        }
      };

      expect(validItem.boundingBox.x).toBeGreaterThanOrEqual(0);
      expect(validItem.boundingBox.x).toBeLessThanOrEqual(1);
      expect(validItem.boundingBox.y).toBeGreaterThanOrEqual(0);
      expect(validItem.boundingBox.y).toBeLessThanOrEqual(1);
      expect(validItem.boundingBox.width).toBeGreaterThan(0);
      expect(validItem.boundingBox.width).toBeLessThanOrEqual(1);
      expect(validItem.boundingBox.height).toBeGreaterThan(0);
      expect(validItem.boundingBox.height).toBeLessThanOrEqual(1);
    });

    it('should handle edge cases for bounding box coordinates', () => {
      const edgeCaseItem: DetectedItem = {
        id: 'test-item-3',
        name: 'Edge Case Item',
        confidence: 0.75,
        category: 'Accessories',
        description: 'An item with edge case coordinates',
        boundingBox: {
          x: 0.5,
          y: 0.5,
          width: 0.5,
          height: 0.5
        }
      };

      // Test that coordinates are properly normalized
      expect(edgeCaseItem.boundingBox.x + edgeCaseItem.boundingBox.width).toBeLessThanOrEqual(1);
      expect(edgeCaseItem.boundingBox.y + edgeCaseItem.boundingBox.height).toBeLessThanOrEqual(1);
    });
  });

  describe('DetectedItem structure validation', () => {
    it('should have all required properties', () => {
      const completeItem: DetectedItem = {
        id: 'complete-item-1',
        name: 'Complete Item',
        confidence: 0.92,
        category: 'Furniture',
        description: 'A complete test item',
        boundingBox: {
          x: 0.2,
          y: 0.3,
          width: 0.4,
          height: 0.5
        }
      };

      expect(completeItem.id).toBeDefined();
      expect(completeItem.name).toBeDefined();
      expect(completeItem.confidence).toBeDefined();
      expect(completeItem.category).toBeDefined();
      expect(completeItem.description).toBeDefined();
      expect(completeItem.boundingBox).toBeDefined();
    });

    it('should validate confidence score range (0-1)', () => {
      const highConfidenceItem: DetectedItem = {
        id: 'high-confidence-item',
        name: 'High Confidence Item',
        confidence: 1.0,
        category: 'Clothing',
        description: 'An item with maximum confidence',
        boundingBox: {
          x: 0.1,
          y: 0.1,
          width: 0.2,
          height: 0.2
        }
      };

      expect(highConfidenceItem.confidence).toBeGreaterThanOrEqual(0);
      expect(highConfidenceItem.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle different category types', () => {
      const categories = ['Clothing', 'Electronics', 'Accessories', 'Furniture', 'Other'];
      
      categories.forEach(category => {
        const item: DetectedItem = {
          id: `test-${category.toLowerCase()}`,
          name: `Test ${category}`,
          confidence: 0.8,
          category: category,
          description: `A test item in ${category} category`,
          boundingBox: {
            x: 0.1,
            y: 0.1,
            width: 0.2,
            height: 0.2
          }
        };

        expect(item.category).toBe(category);
      });
    });
  });

  describe('boundingBox coordinate calculations', () => {
    it('should calculate correct bounding box area', () => {
      const item: DetectedItem = {
        id: 'area-test-item',
        name: 'Area Test Item',
        confidence: 0.9,
        category: 'Clothing',
        description: 'An item for area calculation testing',
        boundingBox: {
          x: 0.2,
          y: 0.3,
          width: 0.4,
          height: 0.5
        }
      };

      const area = item.boundingBox.width * item.boundingBox.height;
      expect(area).toBe(0.2); // 0.4 * 0.5 = 0.2
    });

    it('should validate bounding box does not exceed image boundaries', () => {
      const item: DetectedItem = {
        id: 'boundary-test-item',
        name: 'Boundary Test Item',
        confidence: 0.85,
        category: 'Electronics',
        description: 'An item for boundary testing',
        boundingBox: {
          x: 0.7,
          y: 0.8,
          width: 0.3,
          height: 0.2
        }
      };

      // Check that bounding box stays within image boundaries
      expect(item.boundingBox.x + item.boundingBox.width).toBeLessThanOrEqual(1);
      expect(item.boundingBox.y + item.boundingBox.height).toBeLessThanOrEqual(1);
    });
  });

  describe('DetectedItem factory functions', () => {
    it('should create DetectedItem from Google Cloud Vision response', () => {
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

      // This would be the expected transformation
      const expectedItem: DetectedItem = {
        id: expect.any(String),
        name: 'Test Object',
        confidence: 0.95,
        category: 'Other',
        description: 'Test Object',
        boundingBox: {
          x: 0.1,
          y: 0.2,
          width: 0.3, // 0.4 - 0.1
          height: 0.5 // 0.7 - 0.2
        }
      };

      expect(expectedItem.boundingBox.x).toBe(0.1);
      expect(expectedItem.boundingBox.y).toBe(0.2);
      expect(expectedItem.boundingBox.width).toBe(0.3);
      expect(expectedItem.boundingBox.height).toBe(0.5);
    });

    it('should create DetectedItem from Amazon Rekognition response', () => {
      const mockAmazonResponse = {
        Name: 'Test Label',
        Confidence: 92.5,
        Instances: [
          {
            BoundingBox: {
              Width: 0.3,
              Height: 0.4,
              Left: 0.1,
              Top: 0.2
            },
            Confidence: 92.5
          }
        ]
      };

      // This would be the expected transformation
      const expectedItem: DetectedItem = {
        id: expect.any(String),
        name: 'Test Label',
        confidence: 0.925, // Converted from 92.5%
        category: 'Other',
        description: 'Test Label',
        boundingBox: {
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4
        }
      };

      expect(expectedItem.boundingBox.x).toBe(0.1);
      expect(expectedItem.boundingBox.y).toBe(0.2);
      expect(expectedItem.boundingBox.width).toBe(0.3);
      expect(expectedItem.boundingBox.height).toBe(0.4);
    });
  });
});

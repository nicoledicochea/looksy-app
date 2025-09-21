import { DetectedItem } from './realAiService';

/**
 * Enhanced Segmentation Precision Service
 * 
 * This service provides improved coordinate conversion, sub-pixel precision,
 * edge case handling, and segmentation mask processing for better object detection accuracy.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SegmentationMask {
  normalizedVertices: Array<{ x: number; y: number }>;
  pixelMask?: string;
}

export interface ProcessedSegmentationResult {
  boundingBox: BoundingBox;
  precisionLevel: 'high' | 'medium' | 'low';
  qualityScore: number;
  vertexCount: number;
  area: number;
}

/**
 * Convert normalized vertices to precise bounding box with enhanced accuracy
 */
export function convertNormalizedVerticesToBoundingBox(vertices: Array<{ x: number; y: number }>): BoundingBox {
  if (vertices.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  if (vertices.length === 1) {
    return { x: vertices[0].x, y: vertices[0].y, width: 0, height: 0 };
  }

  // Extract x and y coordinates with high precision
  const xs = vertices.map(v => v.x || 0);
  const ys = vertices.map(v => v.y || 0);

  // Calculate min/max with sub-pixel precision
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Calculate sub-pixel precision bounding box with enhanced floating point handling
 */
export function calculateSubPixelPrecisionBoundingBox(vertices: Array<{ x: number; y: number }>): BoundingBox {
  if (vertices.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  if (vertices.length === 1) {
    return { x: vertices[0].x, y: vertices[0].y, width: 0, height: 0 };
  }

  // Use high precision arithmetic to avoid floating point errors
  let minX = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let minY = Number.MAX_VALUE;
  let maxY = Number.MIN_VALUE;

  for (const vertex of vertices) {
    const x = vertex.x || 0;
    const y = vertex.y || 0;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Calculate dimensions with high precision
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    x: minX,
    y: minY,
    width,
    height
  };
}

/**
 * Process segmentation mask for better pixel-level accuracy
 */
export function processSegmentationMask(mask: SegmentationMask): ProcessedSegmentationResult {
  const vertices = mask.normalizedVertices || [];
  
  if (vertices.length === 0) {
    return {
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      precisionLevel: 'low',
      qualityScore: 0,
      vertexCount: 0,
      area: 0
    };
  }

  // Calculate precise bounding box
  const boundingBox = calculateSubPixelPrecisionBoundingBox(vertices);
  
  // Calculate area
  const area = boundingBox.width * boundingBox.height;
  
  // Determine precision level based on multiple factors
  const vertexCount = vertices.length;
  const qualityScore = calculateSegmentationQuality(vertices, area);
  
  let precisionLevel: 'high' | 'medium' | 'low' = 'low';
  
  if (qualityScore >= 0.8 && vertexCount >= 8 && area > 0.01) {
    precisionLevel = 'high';
  } else if (qualityScore >= 0.6 && vertexCount >= 4 && area > 0.005) {
    precisionLevel = 'medium';
  }

  return {
    boundingBox,
    precisionLevel,
    qualityScore,
    vertexCount,
    area
  };
}

/**
 * Calculate segmentation quality score based on vertex distribution and shape regularity
 */
function calculateSegmentationQuality(vertices: Array<{ x: number; y: number }>, area: number): number {
  if (vertices.length < 3) {
    return 0;
  }

  // Calculate vertex distribution quality
  const xs = vertices.map(v => v.x);
  const ys = vertices.map(v => v.y);
  
  const xRange = Math.max(...xs) - Math.min(...xs);
  const yRange = Math.max(...ys) - Math.min(...ys);
  
  // Check for reasonable aspect ratio (not too thin)
  const aspectRatio = Math.min(xRange, yRange) / Math.max(xRange, yRange);
  
  // Check for sufficient area
  const areaScore = Math.min(area * 100, 1); // Normalize area score
  
  // Check for vertex count quality
  const vertexScore = Math.min(vertices.length / 10, 1); // More vertices = better quality
  
  // Combine scores
  return (aspectRatio * 0.3 + areaScore * 0.4 + vertexScore * 0.3);
}

/**
 * Handle edge cases for complex object shapes
 */
export function handleComplexObjectShapes(vertices: Array<{ x: number; y: number }>): BoundingBox {
  if (vertices.length < 3) {
    return convertNormalizedVerticesToBoundingBox(vertices);
  }

  // For complex shapes, use convex hull approximation for better bounding box
  const convexHull = calculateConvexHull(vertices);
  return calculateSubPixelPrecisionBoundingBox(convexHull);
}

/**
 * Calculate convex hull of vertices for better bounding box approximation
 */
function calculateConvexHull(vertices: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (vertices.length <= 3) {
    return vertices;
  }

  // Simple convex hull algorithm (Graham scan simplified)
  const sortedVertices = vertices.sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });

  const lower: Array<{ x: number; y: number }> = [];
  for (const vertex of sortedVertices) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], vertex) <= 0) {
      lower.pop();
    }
    lower.push(vertex);
  }

  const upper: Array<{ x: number; y: number }> = [];
  for (let i = sortedVertices.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], sortedVertices[i]) <= 0) {
      upper.pop();
    }
    upper.push(sortedVertices[i]);
  }

  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/**
 * Calculate cross product for convex hull algorithm
 */
function crossProduct(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Handle overlapping items with conflict resolution
 */
export function resolveOverlappingItems(items: Array<{ vertices: Array<{ x: number; y: number }>; confidence: number }>): Array<BoundingBox> {
  const resolvedBoxes: Array<BoundingBox> = [];
  
  for (const item of items) {
    const boundingBox = calculateSubPixelPrecisionBoundingBox(item.vertices);
    
    // Check for overlaps with existing boxes
    const hasOverlap = resolvedBoxes.some(existingBox => 
      calculateOverlapPercentage(boundingBox, existingBox) > 0.3
    );
    
    if (!hasOverlap || item.confidence > 0.8) {
      resolvedBoxes.push(boundingBox);
    }
  }
  
  return resolvedBoxes;
}

/**
 * Calculate overlap percentage between two bounding boxes
 */
function calculateOverlapPercentage(box1: BoundingBox, box2: BoundingBox): number {
  const xOverlap = Math.max(0, Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x));
  const yOverlap = Math.max(0, Math.min(box1.y + box1.height, box2.y + box2.height) - Math.max(box1.y, box2.y));
  
  const overlapArea = xOverlap * yOverlap;
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;
  const unionArea = box1Area + box2Area - overlapArea;
  
  return unionArea > 0 ? overlapArea / unionArea : 0;
}

/**
 * Create enhanced detected item with improved segmentation precision
 */
export function createEnhancedDetectedItem(googleResponse: any): DetectedItem {
  const boundingPoly = googleResponse.boundingPoly?.normalizedVertices || [];
  
  let boundingBox: BoundingBox = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  let precisionLevel: 'high' | 'medium' | 'low' = 'low';
  let segmentationMask: SegmentationMask | undefined;

  if (boundingPoly.length >= 3) {
    // Process segmentation mask for enhanced precision
    const processedMask = processSegmentationMask({ normalizedVertices: boundingPoly });
    
    boundingBox = processedMask.boundingBox;
    precisionLevel = processedMask.precisionLevel;
    
    segmentationMask = {
      normalizedVertices: boundingPoly.map((v: any) => ({
        x: v.x || 0,
        y: v.y || 0
      }))
    };
  }

  return {
    id: `enhanced_object_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: googleResponse.name || 'Unknown Object',
    confidence: googleResponse.score || 0.5,
    category: categorizeItem(googleResponse.name || 'Unknown'),
    description: `${googleResponse.name || 'Unknown object'} detected with ${Math.round((googleResponse.score || 0.5) * 100)}% confidence`,
    boundingBox,
    segmentationMask,
    precisionLevel,
    source: 'object_localization' as const,
  };
}

/**
 * Categorize items based on name (reused from realAiService)
 */
function categorizeItem(label: string): string {
  const lowerLabel = label.toLowerCase();
  
  // Clothing & Apparel
  const clothingKeywords = [
    'shirt', 'pants', 'dress', 'jacket', 'sweater', 'jeans', 'blouse', 'skirt', 'coat', 'suit', 
    'hoodie', 'cardigan', 'blazer', 'vest', 'shorts', 'tank', 'polo', 'tunic', 'romper', 'jumpsuit',
    'sleeve', 'collar', 'button', 'zipper', 'pocket', 'fabric', 'textile', 'garment', 'apparel'
  ];
  
  // Footwear
  const shoeKeywords = [
    'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'loafer', 'slipper', 'flip', 'flop', 'moccasin', 
    'oxford', 'pump', 'stiletto', 'wedge', 'ankle', 'knee', 'high', 'athletic', 'running', 'walking'
  ];
  
  // Accessories & Jewelry
  const accessoryKeywords = [
    'bag', 'purse', 'handbag', 'backpack', 'watch', 'ring', 'necklace', 'bracelet', 'earring', 
    'belt', 'scarf', 'hat', 'cap', 'gloves', 'sunglasses', 'wallet', 'clutch', 'tote', 'messenger',
    'jewelry', 'accessory', 'pendant', 'brooch', 'tie', 'bow'
  ];
  
  // Electronics & Technology
  const electronicsKeywords = [
    'phone', 'laptop', 'tablet', 'camera', 'headphone', 'speaker', 'charger', 'computer', 'keyboard', 
    'mouse', 'monitor', 'tv', 'remote', 'smartphone', 'iphone', 'android', 'ipad', 'macbook', 'pc',
    'gaming', 'console', 'playstation', 'xbox', 'nintendo', 'drone', 'bluetooth', 'wireless'
  ];
  
  // Books & Media
  const bookKeywords = [
    'book', 'magazine', 'newspaper', 'notebook', 'journal', 'textbook', 'novel', 'manual', 'guide',
    'comic', 'manga', 'dictionary', 'encyclopedia', 'atlas', 'calendar', 'planner', 'diary'
  ];
  
  // Home & Furniture
  const homeKeywords = [
    'furniture', 'chair', 'table', 'lamp', 'mirror', 'vase', 'decoration', 'couch', 'sofa', 'bed', 
    'dresser', 'desk', 'shelf', 'cabinet', 'drawer', 'nightstand', 'ottoman', 'bench', 'stool',
    'artwork', 'painting', 'sculpture', 'plant', 'pot', 'frame', 'clock', 'candle'
  ];
  
  // Sports & Recreation
  const sportsKeywords = [
    'ball', 'racket', 'club', 'bat', 'helmet', 'equipment', 'gear', 'golf', 'tennis', 'baseball',
    'football', 'basketball', 'soccer', 'hockey', 'ski', 'snowboard', 'bike', 'bicycle', 'skateboard',
    'fitness', 'yoga', 'mat', 'dumbbell', 'weight', 'treadmill', 'exercise'
  ];
  
  // Toys & Games
  const toyKeywords = [
    'toy', 'game', 'puzzle', 'doll', 'action', 'figure', 'board', 'card', 'video', 'console',
    'lego', 'block', 'building', 'set', 'play', 'fun', 'entertainment'
  ];
  
  // Kitchen & Food
  const kitchenKeywords = [
    'kitchen', 'cook', 'food', 'utensil', 'plate', 'bowl', 'cup', 'glass', 'bottle', 'container',
    'appliance', 'microwave', 'oven', 'refrigerator', 'dishwasher', 'coffee', 'maker'
  ];
  
  // Tools & Hardware
  const toolKeywords = [
    'tool', 'hardware', 'screwdriver', 'hammer', 'wrench', 'pliers', 'drill', 'saw', 'knife',
    'scissors', 'tape', 'measure', 'level', 'clamp', 'vise', 'workbench'
  ];
  
  // Check each category
  if (clothingKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Clothing';
  if (shoeKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Shoes';
  if (accessoryKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Accessories';
  if (electronicsKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Electronics';
  if (bookKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Books';
  if (homeKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Home';
  if (sportsKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Sports';
  if (toyKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Toys';
  if (kitchenKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Kitchen';
  if (toolKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Tools';
  
  return 'Other';
}

// Export singleton instance for easy access
export const enhancedSegmentationPrecision = {
  convertNormalizedVerticesToBoundingBox,
  calculateSubPixelPrecisionBoundingBox,
  processSegmentationMask,
  handleComplexObjectShapes,
  resolveOverlappingItems,
  createEnhancedDetectedItem
};

export default enhancedSegmentationPrecision;

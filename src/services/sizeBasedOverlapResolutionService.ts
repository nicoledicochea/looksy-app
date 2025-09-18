import { DetectedItem } from './realAiService';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OverlapResult {
  overlapPercentage: number;
  intersectionArea: number;
  unionArea: number;
  iou: number; // Intersection over Union
}

export interface ConflictResolution {
  conflictingItems: DetectedItem[];
  resolvedItems: DetectedItem[];
  resolutionMetrics: {
    totalConflicts: number;
    resolvedConflicts: number;
    averageOverlapPercentage: number;
  };
}

export interface OverlapStatistics {
  totalOverlaps: number;
  averageOverlapPercentage: number;
  maxOverlapPercentage: number;
  overlapDistribution: {
    low: number;    // 0-25%
    medium: number; // 25-50%
    high: number;   // 50-75%
    complete: number; // 75-100%
  };
}

/**
 * Calculate the area of a bounding box
 */
export function calculateBoundingBoxArea(boundingBox: BoundingBox): number {
  return boundingBox.width * boundingBox.height;
}

/**
 * Calculate the center point of a bounding box
 */
export function calculateBoundingBoxCenter(boundingBox: BoundingBox): { x: number; y: number } {
  return {
    x: boundingBox.x + boundingBox.width / 2,
    y: boundingBox.y + boundingBox.height / 2
  };
}

/**
 * Calculate the distance between two points
 */
export function calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the intersection area between two bounding boxes
 */
export function calculateIntersectionArea(box1: BoundingBox, box2: BoundingBox): number {
  const left = Math.max(box1.x, box2.x);
  const top = Math.max(box1.y, box2.y);
  const right = Math.min(box1.x + box1.width, box2.x + box2.width);
  const bottom = Math.min(box1.y + box1.height, box2.y + box2.height);

  if (left < right && top < bottom) {
    return (right - left) * (bottom - top);
  }

  return 0;
}

/**
 * Calculate the union area of two bounding boxes
 */
export function calculateUnionArea(box1: BoundingBox, box2: BoundingBox): number {
  const area1 = calculateBoundingBoxArea(box1);
  const area2 = calculateBoundingBoxArea(box2);
  const intersectionArea = calculateIntersectionArea(box1, box2);
  
  return area1 + area2 - intersectionArea;
}

/**
 * Calculate overlap metrics between two bounding boxes
 */
export function calculateOverlapMetrics(box1: BoundingBox, box2: BoundingBox): OverlapResult {
  const intersectionArea = calculateIntersectionArea(box1, box2);
  const unionArea = calculateUnionArea(box1, box2);
  const area1 = calculateBoundingBoxArea(box1);
  const area2 = calculateBoundingBoxArea(box2);
  
  // Overlap percentage = intersection / union
  const overlapPercentage = unionArea > 0 ? intersectionArea / unionArea : 0;
  
  // IoU (Intersection over Union)
  const iou = unionArea > 0 ? intersectionArea / unionArea : 0;
  
  return {
    overlapPercentage,
    intersectionArea,
    unionArea,
    iou
  };
}

/**
 * Check if one bounding box contains another
 */
export function isBoundingBoxContained(containerBox: BoundingBox, containedBox: BoundingBox): boolean {
  return (
    containedBox.x >= containerBox.x &&
    containedBox.y >= containerBox.y &&
    containedBox.x + containedBox.width <= containerBox.x + containerBox.width &&
    containedBox.y + containedBox.height <= containerBox.y + containerBox.height
  );
}

/**
 * Determine if two items have significant overlap
 */
export function hasSignificantOverlap(item1: DetectedItem, item2: DetectedItem, threshold: number = 0.1): boolean {
  const overlapMetrics = calculateOverlapMetrics(item1.boundingBox, item2.boundingBox);
  return overlapMetrics.overlapPercentage >= threshold;
}

/**
 * Calculate object specificity score based on name and category
 */
export function calculateObjectSpecificity(item: DetectedItem): number {
  let specificity = 0;
  
  // Base specificity from category
  const specificCategories = ['Electronics', 'Accessories', 'Books', 'Sports', 'Beauty', 'Health', 'Toys'];
  const genericCategories = ['Other', 'Background', 'Clothing', 'Furniture'];
  
  if (specificCategories.includes(item.category)) {
    specificity += 0.3;
  } else if (genericCategories.includes(item.category)) {
    specificity += 0.1;
  } else {
    specificity += 0.2; // Default
  }
  
  // Name specificity (longer, more descriptive names are more specific)
  const nameWords = item.name.split(' ').length;
  const nameLength = item.name.length;
  
  if (nameWords > 2) {
    specificity += 0.2; // Multi-word names are more specific
  } else if (nameWords === 2) {
    specificity += 0.1;
  }
  
  if (nameLength > 10) {
    specificity += 0.1; // Longer names tend to be more specific
  }
  
  // Confidence factor
  specificity += item.confidence * 0.3;
  
  return Math.min(specificity, 1.0); // Cap at 1.0
}

/**
 * Calculate size-based priority score
 */
export function calculateSizeBasedPriority(item: DetectedItem, allItems: DetectedItem[]): number {
  const itemArea = calculateBoundingBoxArea(item.boundingBox);
  const allAreas = allItems.map(i => calculateBoundingBoxArea(i.boundingBox));
  
  // Calculate percentile (smaller items get higher priority)
  const sortedAreas = allAreas.sort((a, b) => a - b);
  const percentile = sortedAreas.indexOf(itemArea) / sortedAreas.length;
  
  // Invert percentile so smaller items get higher scores
  return 1 - percentile;
}

/**
 * Resolve conflicts between overlapping items
 */
export function resolveOverlapConflicts(items: DetectedItem[], overlapThreshold: number = 0.1): ConflictResolution {
  const conflictingItems: DetectedItem[] = [];
  const resolvedItems: DetectedItem[] = [];
  const processedItems = new Set<string>();
  
  // Find all overlapping pairs
  const overlaps: Array<{ item1: DetectedItem; item2: DetectedItem; overlap: OverlapResult }> = [];
  
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i];
      const item2 = items[j];
      const overlap = calculateOverlapMetrics(item1.boundingBox, item2.boundingBox);
      
      if (overlap.overlapPercentage >= overlapThreshold) {
        overlaps.push({ item1, item2, overlap });
      }
    }
  }
  
  // Sort overlaps by overlap percentage (highest first)
  overlaps.sort((a, b) => b.overlap.overlapPercentage - a.overlap.overlapPercentage);
  
  // Resolve conflicts by prioritizing items
  overlaps.forEach(({ item1, item2, overlap }) => {
    if (processedItems.has(item1.id) || processedItems.has(item2.id)) {
      return; // Already processed
    }
    
    // Calculate priority scores
    const item1Specificity = calculateObjectSpecificity(item1);
    const item2Specificity = calculateObjectSpecificity(item2);
    const item1SizePriority = calculateSizeBasedPriority(item1, items);
    const item2SizePriority = calculateSizeBasedPriority(item2, items);
    
    // Combined priority score (specificity + size priority)
    const item1Priority = item1Specificity + item1SizePriority;
    const item2Priority = item2Specificity + item2SizePriority;
    
    // Choose the item with higher priority
    const chosenItem = item1Priority > item2Priority ? item1 : item2;
    const rejectedItem = item1Priority > item2Priority ? item2 : item1;
    
    resolvedItems.push(chosenItem);
    conflictingItems.push(rejectedItem);
    
    processedItems.add(item1.id);
    processedItems.add(item2.id);
  });
  
  // Add non-conflicting items
  items.forEach(item => {
    if (!processedItems.has(item.id)) {
      resolvedItems.push(item);
    }
  });
  
  // Calculate resolution metrics
  const totalConflicts = overlaps.length;
  const resolvedConflicts = conflictingItems.length;
  const averageOverlapPercentage = overlaps.length > 0 
    ? overlaps.reduce((sum, overlap) => sum + overlap.overlap.overlapPercentage, 0) / overlaps.length
    : 0;
  
  return {
    conflictingItems,
    resolvedItems,
    resolutionMetrics: {
      totalConflicts,
      resolvedConflicts,
      averageOverlapPercentage
    }
  };
}

/**
 * Generate overlap statistics for a set of items
 */
export function generateOverlapStatistics(items: DetectedItem[]): OverlapStatistics {
  const overlaps: number[] = [];
  
  // Calculate all pairwise overlaps
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const overlap = calculateOverlapMetrics(items[i].boundingBox, items[j].boundingBox);
      if (overlap.overlapPercentage > 0) {
        overlaps.push(overlap.overlapPercentage);
      }
    }
  }
  
  const totalOverlaps = overlaps.length;
  const averageOverlapPercentage = totalOverlaps > 0 
    ? overlaps.reduce((sum, overlap) => sum + overlap, 0) / totalOverlaps
    : 0;
  const maxOverlapPercentage = totalOverlaps > 0 ? Math.max(...overlaps) : 0;
  
  // Categorize overlaps
  const overlapDistribution = {
    low: overlaps.filter(o => o >= 0 && o < 0.25).length,
    medium: overlaps.filter(o => o >= 0.25 && o < 0.5).length,
    high: overlaps.filter(o => o >= 0.5 && o < 0.75).length,
    complete: overlaps.filter(o => o >= 0.75 && o <= 1.0).length
  };
  
  return {
    totalOverlaps,
    averageOverlapPercentage,
    maxOverlapPercentage,
    overlapDistribution
  };
}

/**
 * Apply size-based overlap resolution to a set of detected items
 */
export function applySizeBasedOverlapResolution(
  items: DetectedItem[], 
  overlapThreshold: number = 0.1
): {
  resolvedItems: DetectedItem[];
  statistics: OverlapStatistics;
  conflicts: ConflictResolution;
} {
  const conflicts = resolveOverlapConflicts(items, overlapThreshold);
  const statistics = generateOverlapStatistics(items);
  
  return {
    resolvedItems: conflicts.resolvedItems,
    statistics,
    conflicts
  };
}

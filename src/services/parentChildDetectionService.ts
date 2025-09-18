import { DetectedItem } from './realAiService';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IntersectionResult {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

export interface ParentChildRelationship {
  parent: DetectedItem;
  child: DetectedItem;
  containmentRatio: number;
  intersectionArea: number;
}

export interface SpatialAnalysisResult {
  relationships: ParentChildRelationship[];
  prioritizedItems: DetectedItem[];
  filteredItems: DetectedItem[];
}

/**
 * Calculate the intersection area between two bounding boxes
 */
export function calculateBoundingBoxIntersection(box1: BoundingBox, box2: BoundingBox): IntersectionResult | null {
  const left = Math.max(box1.x, box2.x);
  const top = Math.max(box1.y, box2.y);
  const right = Math.min(box1.x + box1.width, box2.x + box2.width);
  const bottom = Math.min(box1.y + box1.height, box2.y + box2.height);

  // Check if there's an intersection
  if (left < right && top < bottom) {
    const width = right - left;
    const height = bottom - top;
    const area = width * height;
    
    return {
      x: left,
      y: top,
      width,
      height,
      area
    };
  }

  return null;
}

/**
 * Calculate the containment percentage of child box within parent box
 */
export function calculateContainmentPercentage(parentBox: BoundingBox, childBox: BoundingBox): number {
  const intersection = calculateBoundingBoxIntersection(parentBox, childBox);
  
  if (!intersection) {
    return 0;
  }

  const parentArea = parentBox.width * parentBox.height;
  const childArea = childBox.width * childBox.height;
  
  // Return the ratio of child area to parent area
  return childArea / parentArea;
}

/**
 * Check if one bounding box is contained within another
 */
export function isContainedWithin(parentBox: BoundingBox, childBox: BoundingBox, threshold: number = 0.8): boolean {
  const containmentRatio = calculateContainmentPercentage(parentBox, childBox);
  return containmentRatio >= threshold;
}

/**
 * Detect parent-child relationships between detected items
 */
export function detectParentChildRelationships(items: DetectedItem[]): ParentChildRelationship[] {
  const relationships: ParentChildRelationship[] = [];
  
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      
      const potentialParent = items[i];
      const potentialChild = items[j];
      
      // Check if child is contained within parent
      const intersection = calculateBoundingBoxIntersection(
        potentialParent.boundingBox,
        potentialChild.boundingBox
      );
      
      if (intersection) {
        const parentArea = potentialParent.boundingBox.width * potentialParent.boundingBox.height;
        const childArea = potentialChild.boundingBox.width * potentialChild.boundingBox.height;
        const containmentRatio = childArea / parentArea;
        
        // Consider it a parent-child relationship if containment ratio is significant
        if (containmentRatio > 0.1 && containmentRatio < 0.9) {
          relationships.push({
            parent: potentialParent,
            child: potentialChild,
            containmentRatio,
            intersectionArea: intersection.area
          });
        }
      }
    }
  }
  
  return relationships;
}

/**
 * Prioritize child objects over parent objects based on size and category
 */
export function prioritizeChildObjects(items: DetectedItem[], relationships: ParentChildRelationship[]): DetectedItem[] {
  const prioritizedItems: DetectedItem[] = [];
  const parentIds = new Set<string>();
  const childIds = new Set<string>();
  
  // First, identify all parent and child items
  relationships.forEach(rel => {
    parentIds.add(rel.parent.id);
    childIds.add(rel.child.id);
  });
  
  // Add child items first (they have higher priority)
  relationships.forEach(rel => {
    if (!prioritizedItems.find(item => item.id === rel.child.id)) {
      prioritizedItems.push(rel.child);
    }
  });
  
  // Add items that are not parents (including standalone items)
  items.forEach(item => {
    if (!parentIds.has(item.id) && !prioritizedItems.find(prioritized => prioritized.id === item.id)) {
      prioritizedItems.push(item);
    }
  });
  
  // Add parent items last (they have lower priority)
  items.forEach(item => {
    if (parentIds.has(item.id) && !prioritizedItems.find(prioritized => prioritized.id === item.id)) {
      prioritizedItems.push(item);
    }
  });
  
  return prioritizedItems;
}

/**
 * Filter out parent objects when child objects are present
 */
export function filterParentObjects(items: DetectedItem[], relationships: ParentChildRelationship[]): DetectedItem[] {
  const parentIds = new Set<string>();
  
  // Identify parent items that have children
  relationships.forEach(rel => {
    parentIds.add(rel.parent.id);
  });
  
  // Filter out parent items, keep only children and standalone items
  return items.filter(item => !parentIds.has(item.id));
}

/**
 * Perform complete spatial analysis for parent-child relationships
 */
export function performSpatialAnalysis(items: DetectedItem[]): SpatialAnalysisResult {
  const relationships = detectParentChildRelationships(items);
  const prioritizedItems = prioritizeChildObjects(items, relationships);
  const filteredItems = filterParentObjects(items, relationships);
  
  return {
    relationships,
    prioritizedItems,
    filteredItems
  };
}

/**
 * Check if an item should be prioritized based on size and category
 */
export function shouldPrioritizeItem(item: DetectedItem, allItems: DetectedItem[]): boolean {
  // Prioritize smaller items (more specific detections)
  const itemArea = item.boundingBox.width * item.boundingBox.height;
  const averageArea = allItems.reduce((sum, i) => sum + (i.boundingBox.width * i.boundingBox.height), 0) / allItems.length;
  
  // If item is significantly smaller than average, prioritize it
  if (itemArea < averageArea * 0.5) {
    return true;
  }
  
  // Prioritize objects of interest over objects to ignore
  const objectsOfInterest = ['Accessories', 'Electronics', 'Books', 'Sports', 'Beauty', 'Health', 'Toys'];
  const objectsToIgnore = ['Clothing', 'Furniture', 'Background'];
  
  if (objectsOfInterest.includes(item.category) && !objectsToIgnore.includes(item.category)) {
    return true;
  }
  
  return false;
}

import { DetectedItem } from './realAiService';

/**
 * Enhanced Contextual Filtering Service
 * 
 * This service provides improved parent-child relationship detection,
 * enhanced spatial analysis, optimized conflict resolution, and specialized
 * watch/sleeve scenario detection for better object detection accuracy.
 */

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
  confidence: number;
  relationshipType: 'containment' | 'overlap' | 'adjacent';
}

export interface SpatialAnalysisResult {
  relationships: ParentChildRelationship[];
  prioritizedItems: DetectedItem[];
  filteredItems: DetectedItem[];
  analysisMetrics: {
    totalRelationships: number;
    containmentRelationships: number;
    overlapRelationships: number;
    filteredCount: number;
  };
}

export interface ConflictResolution {
  conflictingItems: DetectedItem[];
  resolvedItems: DetectedItem[];
  resolutionMetrics: {
    totalConflicts: number;
    resolvedConflicts: number;
    averageOverlapPercentage: number;
    resolutionStrategy: 'size' | 'confidence' | 'category' | 'combined';
  };
}

export interface WatchSleeveScenario {
  isWatchSleeveScenario: boolean;
  watchItem?: DetectedItem;
  sleeveItem?: DetectedItem;
  confidence: number;
  containmentRatio: number;
}

export interface ContextualFilteringResult {
  filteredItems: DetectedItem[];
  filteringMetrics: {
    contextualFilteringApplied: boolean;
    parentChildRelationshipsFound: number;
    conflictsResolved: number;
    watchSleeveScenariosDetected: number;
    processingTime: number;
  };
}

/**
 * Calculate the intersection area between two bounding boxes with enhanced precision
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
 * Calculate enhanced containment ratio with improved accuracy
 */
export function calculateEnhancedContainmentRatio(parent: DetectedItem, child: DetectedItem): number {
  const intersection = calculateBoundingBoxIntersection(parent.boundingBox, child.boundingBox);
  
  if (!intersection) {
    return 0;
  }

  const childArea = child.boundingBox.width * child.boundingBox.height;
  const intersectionArea = intersection.area;
  
  // Enhanced containment calculation with sub-pixel precision
  const containmentRatio = intersectionArea / childArea;
  
  // Apply confidence weighting for more accurate results
  const confidenceWeight = (parent.confidence + child.confidence) / 2;
  const adjustedContainmentRatio = containmentRatio * confidenceWeight;
  
  return Math.min(adjustedContainmentRatio, 1); // Cap at 100%
}

/**
 * Detect enhanced parent-child relationships with improved algorithms
 */
export function detectEnhancedParentChildRelationships(items: DetectedItem[]): ParentChildRelationship[] {
  const relationships: ParentChildRelationship[] = [];
  
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      
      const item1 = items[i];
      const item2 = items[j];
      
      const containmentRatio = calculateEnhancedContainmentRatio(item1, item2);
      const reverseContainmentRatio = calculateEnhancedContainmentRatio(item2, item1);
      
      // Determine parent-child relationship based on containment and other factors
      let parent: DetectedItem;
      let child: DetectedItem;
      let relationshipType: 'containment' | 'overlap' | 'adjacent';
      let confidence: number;
      
      if (containmentRatio > 0.7) {
        // item1 contains item2
        parent = item1;
        child = item2;
        relationshipType = 'containment';
        confidence = containmentRatio;
      } else if (reverseContainmentRatio > 0.7) {
        // item2 contains item1
        parent = item2;
        child = item1;
        relationshipType = 'containment';
        confidence = reverseContainmentRatio;
      } else if (containmentRatio > 0.3 || reverseContainmentRatio > 0.3) {
        // Significant overlap
        parent = containmentRatio > reverseContainmentRatio ? item1 : item2;
        child = containmentRatio > reverseContainmentRatio ? item2 : item1;
        relationshipType = 'overlap';
        confidence = Math.max(containmentRatio, reverseContainmentRatio);
      } else {
        continue; // No significant relationship
      }
      
      // Apply category-based rules for better accuracy
      const categoryWeight = getCategoryRelationshipWeight(parent.category, child.category);
      const finalConfidence = confidence * categoryWeight;
      
      if (finalConfidence > 0.5) {
        const intersection = calculateBoundingBoxIntersection(parent.boundingBox, child.boundingBox);
        
        relationships.push({
          parent,
          child,
          containmentRatio: Math.max(containmentRatio, reverseContainmentRatio),
          intersectionArea: intersection?.area || 0,
          confidence: finalConfidence,
          relationshipType
        });
      }
    }
  }
  
  return relationships;
}

/**
 * Get category relationship weight for better parent-child detection
 */
function getCategoryRelationshipWeight(parentCategory: string, childCategory: string): number {
  const categoryHierarchy: { [key: string]: string[] } = {
    'Clothing': ['Accessories', 'Jewelry'],
    'Body Part': ['Accessories', 'Jewelry'],
    'Furniture': ['Electronics', 'Books', 'Accessories'],
    'Electronics': ['Accessories'],
    'Books': ['Accessories']
  };
  
  // Check if parent category typically contains child category
  if (categoryHierarchy[parentCategory]?.includes(childCategory)) {
    return 1.2; // Boost confidence
  }
  
  // Check for watch/sleeve specific scenarios
  if (parentCategory === 'Clothing' && childCategory === 'Accessories') {
    return 1.1; // Slight boost for clothing-accessories
  }
  
  // Check for body part scenarios
  if (parentCategory === 'Body Part' && childCategory === 'Accessories') {
    return 1.15; // Boost for body part-accessories
  }
  
  return 1.0; // Default weight
}

/**
 * Perform enhanced spatial analysis for complex overlapping situations
 */
export function performEnhancedSpatialAnalysis(items: DetectedItem[]): SpatialAnalysisResult {
  const relationships = detectEnhancedParentChildRelationships(items);
  
  // Prioritize items based on relationships and categories
  const prioritizedItems: DetectedItem[] = [];
  const filteredItems: DetectedItem[] = [];
  
  // Create a map of items and their relationship counts
  const itemRelationshipCounts = new Map<string, number>();
  const itemParentCounts = new Map<string, number>();
  
  relationships.forEach(rel => {
    itemRelationshipCounts.set(rel.child.id, (itemRelationshipCounts.get(rel.child.id) || 0) + 1);
    itemParentCounts.set(rel.parent.id, (itemParentCounts.get(rel.parent.id) || 0) + 1);
  });
  
  // Prioritize items based on multiple factors
  items.forEach(item => {
    const relationshipCount = itemRelationshipCounts.get(item.id) || 0;
    const parentCount = itemParentCounts.get(item.id) || 0;
    const categoryPriority = getCategoryPriority(item.category);
    const confidenceScore = item.confidence;
    
    // Calculate priority score
    const priorityScore = (confidenceScore * 0.4) + 
                         (categoryPriority * 0.3) + 
                         (relationshipCount * 0.2) + 
                         (parentCount * 0.1);
    
    // Be more lenient with filtering - lower threshold
    if (priorityScore > 0.4) {
      prioritizedItems.push(item);
    } else {
      filteredItems.push(item);
    }
  });
  
  // Filter out items that are clearly parents of higher priority items
  const finalFilteredItems = filteredItems.filter(item => {
    const isParentOfHighPriority = relationships.some(rel => 
      rel.parent.id === item.id && 
      prioritizedItems.some(priorityItem => priorityItem.id === rel.child.id)
    );
    
    return !isParentOfHighPriority;
  });
  
  return {
    relationships,
    prioritizedItems,
    filteredItems: finalFilteredItems,
    analysisMetrics: {
      totalRelationships: relationships.length,
      containmentRelationships: relationships.filter(r => r.relationshipType === 'containment').length,
      overlapRelationships: relationships.filter(r => r.relationshipType === 'overlap').length,
      filteredCount: finalFilteredItems.length
    }
  };
}

/**
 * Get category priority for item prioritization
 */
function getCategoryPriority(category: string): number {
  const priorities: { [key: string]: number } = {
    'Accessories': 0.9,
    'Jewelry': 0.95,
    'Electronics': 0.8,
    'Books': 0.7,
    'Clothing': 0.6,
    'Furniture': 0.4,
    'Body Part': 0.2,
    'Other': 0.5
  };
  
  return priorities[category] || 0.5;
}

/**
 * Perform enhanced conflict resolution with optimized logic
 */
export function performEnhancedConflictResolution(items: DetectedItem[]): ConflictResolution {
  const conflicts: Array<{ item1: DetectedItem; item2: DetectedItem; overlapPercentage: number }> = [];
  
  // Find all conflicts
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i];
      const item2 = items[j];
      
      const intersection = calculateBoundingBoxIntersection(item1.boundingBox, item2.boundingBox);
      if (intersection) {
        const item1Area = item1.boundingBox.width * item1.boundingBox.height;
        const item2Area = item2.boundingBox.width * item2.boundingBox.height;
        const unionArea = item1Area + item2Area - intersection.area;
        const overlapPercentage = intersection.area / unionArea;
        
        if (overlapPercentage > 0.3) { // Significant overlap
          conflicts.push({ item1, item2, overlapPercentage });
        }
      }
    }
  }
  
  // Resolve conflicts using enhanced strategy
  const resolvedItems: DetectedItem[] = [];
  const processedItems = new Set<string>();
  
  conflicts.forEach(conflict => {
    if (processedItems.has(conflict.item1.id) || processedItems.has(conflict.item2.id)) {
      return; // Already processed
    }
    
    const winner = resolveConflict(conflict.item1, conflict.item2, conflict.overlapPercentage);
    resolvedItems.push(winner);
    processedItems.add(winner.id);
    processedItems.add(winner.id === conflict.item1.id ? conflict.item2.id : conflict.item1.id);
  });
  
  // Add non-conflicting items
  items.forEach(item => {
    if (!processedItems.has(item.id)) {
      resolvedItems.push(item);
    }
  });
  
  return {
    conflictingItems: conflicts.map(c => [c.item1, c.item2]).flat(),
    resolvedItems,
    resolutionMetrics: {
      totalConflicts: conflicts.length,
      resolvedConflicts: conflicts.length,
      averageOverlapPercentage: conflicts.reduce((sum, c) => sum + c.overlapPercentage, 0) / conflicts.length || 0,
      resolutionStrategy: 'combined'
    }
  };
}

/**
 * Resolve conflict between two items using enhanced strategy
 */
function resolveConflict(item1: DetectedItem, item2: DetectedItem, overlapPercentage: number): DetectedItem {
  // Strategy 1: Category-based priority
  const category1Priority = getCategoryPriority(item1.category);
  const category2Priority = getCategoryPriority(item2.category);
  
  if (Math.abs(category1Priority - category2Priority) > 0.2) {
    return category1Priority > category2Priority ? item1 : item2;
  }
  
  // Strategy 2: Confidence-based priority
  if (Math.abs(item1.confidence - item2.confidence) > 0.1) {
    return item1.confidence > item2.confidence ? item1 : item2;
  }
  
  // Strategy 3: Size-based priority (larger items are usually more important)
  const item1Area = item1.boundingBox.width * item1.boundingBox.height;
  const item2Area = item2.boundingBox.width * item2.boundingBox.height;
  
  if (Math.abs(item1Area - item2Area) > 0.01) {
    return item1Area > item2Area ? item1 : item2;
  }
  
  // Strategy 4: Default to first item
  return item1;
}

/**
 * Detect watch/sleeve scenario with improved accuracy
 */
export function detectWatchSleeveScenario(items: DetectedItem[]): WatchSleeveScenario {
  const watches = items.filter(item => 
    item.category === 'Accessories' && 
    (item.name.toLowerCase().includes('watch') || item.name.toLowerCase().includes('timepiece'))
  );
  
  const sleeves = items.filter(item => 
    item.category === 'Clothing' && 
    (item.name.toLowerCase().includes('sleeve') || item.name.toLowerCase().includes('shirt') || item.name.toLowerCase().includes('jacket'))
  );
  
  if (watches.length === 0 || sleeves.length === 0) {
    return {
      isWatchSleeveScenario: false,
      confidence: 0,
      containmentRatio: 0
    };
  }
  
  // Find the best watch/sleeve pair
  let bestWatch: DetectedItem | null = null;
  let bestSleeve: DetectedItem | null = null;
  let bestContainmentRatio = 0;
  let bestConfidence = 0;
  
  watches.forEach(watch => {
    sleeves.forEach(sleeve => {
      const containmentRatio = calculateEnhancedContainmentRatio(sleeve, watch);
      
      if (containmentRatio > 0.5) {
        const confidence = (watch.confidence + sleeve.confidence) / 2;
        
        if (containmentRatio > bestContainmentRatio) {
          bestWatch = watch;
          bestSleeve = sleeve;
          bestContainmentRatio = containmentRatio;
          bestConfidence = confidence;
        }
      }
    });
  });
  
  if (bestWatch && bestSleeve) {
    return {
      isWatchSleeveScenario: true,
      watchItem: bestWatch,
      sleeveItem: bestSleeve,
      confidence: bestConfidence,
      containmentRatio: bestContainmentRatio
    };
  }
  
  return {
    isWatchSleeveScenario: false,
    confidence: 0,
    containmentRatio: 0
  };
}

/**
 * Detect multiple watch/sleeve scenarios
 */
export function detectMultipleWatchSleeveScenarios(items: DetectedItem[]): WatchSleeveScenario[] {
  const scenarios: WatchSleeveScenario[] = [];
  const processedWatches = new Set<string>();
  const processedSleeves = new Set<string>();
  
  const watches = items.filter(item => 
    item.category === 'Accessories' && 
    (item.name.toLowerCase().includes('watch') || item.name.toLowerCase().includes('timepiece'))
  );
  
  const sleeves = items.filter(item => 
    item.category === 'Clothing' && 
    (item.name.toLowerCase().includes('sleeve') || item.name.toLowerCase().includes('shirt') || item.name.toLowerCase().includes('jacket'))
  );
  
  watches.forEach(watch => {
    if (processedWatches.has(watch.id)) return;
    
    sleeves.forEach(sleeve => {
      if (processedSleeves.has(sleeve.id)) return;
      
      const containmentRatio = calculateEnhancedContainmentRatio(sleeve, watch);
      
      if (containmentRatio > 0.5) {
        const confidence = (watch.confidence + sleeve.confidence) / 2;
        
        scenarios.push({
          isWatchSleeveScenario: true,
          watchItem: watch,
          sleeveItem: sleeve,
          confidence,
          containmentRatio
        });
        
        processedWatches.add(watch.id);
        processedSleeves.add(sleeve.id);
      }
    });
  });
  
  return scenarios;
}

/**
 * Apply advanced contextual filtering to enhanced detection pipeline
 */
export function applyAdvancedContextualFiltering(items: DetectedItem[]): ContextualFilteringResult {
  const startTime = Date.now();
  
  // Step 1: Detect watch/sleeve scenarios
  const watchSleeveScenarios = detectMultipleWatchSleeveScenarios(items);
  
  // Step 2: Perform enhanced spatial analysis
  const spatialAnalysis = performEnhancedSpatialAnalysis(items);
  
  // Step 3: Perform enhanced conflict resolution
  const conflictResolution = performEnhancedConflictResolution(spatialAnalysis.prioritizedItems);
  
  // Step 4: Apply final filtering based on watch/sleeve scenarios
  let finalFilteredItems = conflictResolution.resolvedItems;
  
  // If watch/sleeve scenarios detected, prioritize watches over sleeves
  if (watchSleeveScenarios.length > 0) {
    finalFilteredItems = finalFilteredItems.filter(item => {
      const isSleeve = watchSleeveScenarios.some(scenario => scenario.sleeveItem?.id === item.id);
      return !isSleeve; // Filter out sleeves, keep watches
    });
  }
  
  // Ensure we don't filter out everything - keep at least some items
  if (finalFilteredItems.length === 0 && conflictResolution.resolvedItems.length > 0) {
    // If contextual filtering removed everything, keep the highest priority items
    const priorityItems = conflictResolution.resolvedItems
      .sort((a, b) => {
        const categoryPriorityA = getCategoryPriority(a.category);
        const categoryPriorityB = getCategoryPriority(b.category);
        return categoryPriorityB - categoryPriorityA;
      })
      .slice(0, Math.max(1, Math.floor(conflictResolution.resolvedItems.length / 2)));
    
    finalFilteredItems = priorityItems;
  }
  
  const processingTime = Date.now() - startTime;
  
  return {
    filteredItems: finalFilteredItems,
    filteringMetrics: {
      contextualFilteringApplied: true,
      parentChildRelationshipsFound: spatialAnalysis.analysisMetrics.totalRelationships,
      conflictsResolved: conflictResolution.resolutionMetrics.resolvedConflicts,
      watchSleeveScenariosDetected: watchSleeveScenarios.length,
      processingTime
    }
  };
}

// Export singleton instance for easy access
export const enhancedContextualFiltering = {
  detectEnhancedParentChildRelationships,
  calculateEnhancedContainmentRatio,
  performEnhancedSpatialAnalysis,
  performEnhancedConflictResolution,
  detectWatchSleeveScenario,
  detectMultipleWatchSleeveScenarios,
  applyAdvancedContextualFiltering
};

export default enhancedContextualFiltering;

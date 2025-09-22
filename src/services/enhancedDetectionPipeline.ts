import { DetectedItem } from './realAiService';
import { 
  applyCategoryFiltering, 
  getFilteringStats,
  CategoryFilteringConfig 
} from './categoryFilteringService';
import { 
  performSpatialAnalysis, 
  SpatialAnalysisResult 
} from './parentChildDetectionService';
import { 
  applySizeBasedOverlapResolution,
  OverlapStatistics,
  ConflictResolution
} from './sizeBasedOverlapResolutionService';
import { 
  recordEnhancedDetectionPerformance,
  getPerformanceStatus,
  shouldOptimizeProcessing,
  optimizeProcessing
} from './performanceMonitoringService';
import { 
  qualityMetricsTracker, 
  QualityMetrics 
} from './qualityMetricsService';
import { 
  applyAdvancedContextualFiltering 
} from './enhancedContextualFilteringService';
import { 
  dynamicThresholdManager,
  calculateAdaptiveThreshold,
  getOptimalThresholds,
  DetectionContext
} from './dynamicThresholdService';

/**
 * Enhanced Detection Pipeline
 * 
 * This service combines all enhancement components into a single, optimized pipeline:
 * 1. Category-based filtering
 * 2. Parent-child relationship detection
 * 3. Size-based overlap resolution
 * 4. Performance monitoring
 */

export interface EnhancedDetectionConfig {
  categoryFiltering: CategoryFilteringConfig;
  spatialAnalysis: {
    containmentThreshold: number;
  };
  overlapResolution: {
    overlapThreshold: number;
  };
  performance: {
    maxProcessingTime: number; // milliseconds
    enableMetrics: boolean;
    enableOptimization: boolean;
  };
  contextualFiltering: {
    enableAdvancedFiltering: boolean;
    watchSleeveDetection: boolean;
  };
  dynamicThresholds: {
    enableDynamicThresholds: boolean;
    adaptiveThresholds: boolean;
    categorySpecificThresholds: boolean;
    learningFromFeedback: boolean;
  };
}

export interface EnhancedDetectionResult {
  items: DetectedItem[];
  processingMetrics: {
    totalProcessingTime: number;
    categoryFilteringTime: number;
    spatialAnalysisTime: number;
    overlapResolutionTime: number;
    contextualFilteringTime: number;
    filteringStats: {
      total: number;
      objectsOfInterest: number;
      objectsToIgnore: number;
      default: number;
      filtered: number;
      kept: number;
    };
    spatialStats: {
      relationshipsFound: number;
      itemsPrioritized: number;
      itemsFiltered: number;
    };
    overlapStats: OverlapStatistics;
    conflictStats: {
      totalConflicts: number;
      resolvedConflicts: number;
      averageOverlapPercentage: number;
    };
    contextualStats: {
      parentChildRelationshipsFound: number;
      conflictsResolved: number;
      watchSleeveScenariosDetected: number;
    };
    dynamicThresholdStats: {
      adaptiveThresholdCalculated: boolean;
      categorySpecificThresholdsApplied: boolean;
      thresholdsUpdated: boolean;
      currentThresholds: Record<string, number>;
      thresholdAdjustments: Array<{
        category: string;
        oldThreshold: number;
        newThreshold: number;
        reason: string;
      }>;
    };
  };
  qualityMetrics?: QualityMetrics;
  success: boolean;
  error?: string;
}

const defaultConfig: EnhancedDetectionConfig = {
  categoryFiltering: {
    objectsOfInterest: [
      // Jewelry & Accessories
      'watch', 'ring', 'necklace', 'bracelet', 'earring', 'pendant', 'brooch', 'tie', 'bow',
      // Electronics
      'phone', 'laptop', 'tablet', 'camera', 'headphone', 'speaker', 'charger', 'keyboard', 'mouse', 'monitor', 'tv', 'remote',
      'smartphone', 'iphone', 'android', 'ipad', 'macbook', 'pc', 'gaming', 'console', 'playstation', 'xbox', 'nintendo', 'drone',
      // Clothing & Apparel
      'jacket', 'shirt', 'dress', 'pants', 'jeans', 'sweater', 'blouse', 'skirt', 'coat', 'suit', 'hoodie', 'cardigan', 'blazer', 'vest', 'shorts', 'tank', 'polo', 'tunic', 'romper', 'jumpsuit',
      // Footwear
      'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'loafer', 'slipper', 'flip', 'flop', 'moccasin', 'oxford', 'pump', 'stiletto', 'wedge',
      // Bags & Accessories
      'bag', 'purse', 'handbag', 'backpack', 'wallet', 'clutch', 'tote', 'messenger',
      // Books & Media
      'book', 'magazine', 'newspaper', 'notebook', 'journal', 'textbook', 'novel', 'manual', 'guide', 'comic', 'manga', 'dictionary', 'encyclopedia', 'atlas', 'calendar', 'planner', 'diary',
      // Home Goods
      'lamp', 'mirror', 'vase', 'decoration', 'artwork', 'painting', 'sculpture', 'plant', 'pot', 'frame', 'clock', 'candle',
      // Sports & Recreation
      'ball', 'racket', 'club', 'bat', 'helmet', 'equipment', 'gear', 'golf', 'tennis', 'baseball', 'football', 'basketball', 'soccer', 'hockey', 'ski', 'snowboard', 'bike', 'bicycle', 'skateboard', 'fitness', 'yoga', 'mat', 'dumbbell', 'weight', 'treadmill', 'exercise',
      // Toys & Games
      'toy', 'game', 'puzzle', 'doll', 'action figure', 'lego', 'board game', 'card game', 'video game', 'stuffed animal', 'teddy bear', 'robot', 'model', 'kit', 'building', 'construction',
      // Kitchen & Appliances
      'kitchen', 'appliance', 'microwave', 'toaster', 'blender', 'mixer', 'coffee maker', 'kettle', 'pan', 'pot', 'dish', 'plate', 'bowl', 'cup', 'mug', 'glass', 'cutlery', 'knife', 'fork', 'spoon',
      // Tools & Hardware
      'tool', 'hammer', 'screwdriver', 'wrench', 'pliers', 'drill', 'saw', 'level', 'tape measure', 'hardware', 'screw', 'nail', 'bolt', 'nut', 'bracket', 'hinge', 'lock'
    ],
    objectsToIgnore: [
      // Body Parts
      'sleeve', 'arm', 'hand', 'finger', 'wrist', 'forearm', 'elbow', 'shoulder', 'leg', 'foot', 'toe', 'ankle', 'knee', 'thigh', 'calf',
      'face', 'eye', 'nose', 'mouth', 'ear', 'cheek', 'chin', 'forehead', 'hair', 'beard', 'mustache',
      'neck', 'chest', 'back', 'stomach', 'waist', 'hip', 'buttock', 'person', 'body', 'skin',
      // Furniture & Surfaces
      'table', 'desk', 'chair', 'furniture', 'surface', 'background', 'counter', 'shelf', 'cabinet', 'drawer', 'nightstand', 'ottoman', 'bench', 'stool',
      'couch', 'sofa', 'bed', 'dresser', 'wardrobe', 'closet', 'bookshelf', 'sideboard', 'buffet',
      // Environmental Elements
      'wall', 'floor', 'ceiling', 'sky', 'ground', 'grass', 'tree', 'leaf', 'branch', 'flower', 'plant', 'bush', 'shrub',
      'water', 'ocean', 'sea', 'lake', 'river', 'pond', 'pool', 'fountain',
      'mountain', 'hill', 'valley', 'rock', 'stone', 'boulder', 'cliff',
      'building', 'house', 'home', 'office', 'room', 'door', 'window', 'roof', 'chimney',
      // Generic Terms
      'clothing', 'garment', 'textile', 'fabric', 'material', 'object', 'item', 'thing', 'product', 'fashion',
      'pattern', 'design', 'color', 'texture', 'shape', 'size', 'style'
    ],
    confidenceThresholds: {
      'objects_of_interest': 0.6,
      'objects_to_ignore': 0.8,
      'default': 0.7
    }
  },
  spatialAnalysis: {
    containmentThreshold: 0.8
  },
  overlapResolution: {
    overlapThreshold: 0.1
  },
  performance: {
    maxProcessingTime: 3000, // 3 seconds
    enableMetrics: true,
    enableOptimization: true
  },
  contextualFiltering: {
    enableAdvancedFiltering: true,
    watchSleeveDetection: true
  },
  dynamicThresholds: {
    enableDynamicThresholds: true,
    adaptiveThresholds: true,
    categorySpecificThresholds: true,
    learningFromFeedback: true
  }
};

/**
 * Execute the complete enhanced detection pipeline
 */
export async function executeEnhancedDetectionPipeline(
  items: DetectedItem[],
  config: EnhancedDetectionConfig = defaultConfig
): Promise<EnhancedDetectionResult> {
  const startTime = Date.now();
  
  try {
    // Stage 1: Category-based filtering
    const categoryFilteringStartTime = Date.now();
    const categoryFilteredItems = applyCategoryFiltering(items, config.categoryFiltering);
    const categoryFilteringTime = Date.now() - categoryFilteringStartTime;
    
    const filteringStats = getFilteringStats(items, config.categoryFiltering);
    
    // Stage 2: Parent-child relationship detection and spatial analysis
    const spatialAnalysisStartTime = Date.now();
    const spatialAnalysis: SpatialAnalysisResult = performSpatialAnalysis(categoryFilteredItems);
    const spatialAnalysisTime = Date.now() - spatialAnalysisStartTime;
    
    const spatialStats = {
      relationshipsFound: spatialAnalysis.relationships.length,
      itemsPrioritized: spatialAnalysis.prioritizedItems.length,
      itemsFiltered: spatialAnalysis.filteredItems.length
    };
    
    // Stage 3: Size-based overlap resolution
    const overlapResolutionStartTime = Date.now();
    const overlapResolution = applySizeBasedOverlapResolution(
      spatialAnalysis.filteredItems, 
      config.overlapResolution.overlapThreshold
    );
    const overlapResolutionTime = Date.now() - overlapResolutionStartTime;
    
    const conflictStats = {
      totalConflicts: overlapResolution.conflicts.resolutionMetrics.totalConflicts,
      resolvedConflicts: overlapResolution.conflicts.resolutionMetrics.resolvedConflicts,
      averageOverlapPercentage: overlapResolution.conflicts.resolutionMetrics.averageOverlapPercentage
    };
    
    // Stage 4: Advanced contextual filtering (NEW)
    const contextualFilteringStartTime = Date.now();
    const contextualFilteringResult = applyAdvancedContextualFiltering(overlapResolution.resolvedItems);
    const contextualFilteringTime = Date.now() - contextualFilteringStartTime;
    
    const contextualStats = {
      parentChildRelationshipsFound: contextualFilteringResult.filteringMetrics.parentChildRelationshipsFound,
      conflictsResolved: contextualFilteringResult.filteringMetrics.conflictsResolved,
      watchSleeveScenariosDetected: contextualFilteringResult.filteringMetrics.watchSleeveScenariosDetected
    };
    
    // Stage 5: Dynamic Threshold Adjustment (NEW)
    const dynamicThresholdStartTime = Date.now();
    let dynamicThresholdStats = {
      adaptiveThresholdCalculated: false,
      categorySpecificThresholdsApplied: false,
      thresholdsUpdated: false,
      currentThresholds: dynamicThresholdManager.getCurrentThresholds(),
      thresholdAdjustments: [] as Array<{
        category: string;
        oldThreshold: number;
        newThreshold: number;
        reason: string;
      }>
    };

    // Calculate total processing time so far for use in dynamic threshold processing
    const currentProcessingTime = Date.now() - startTime;

    if (config.dynamicThresholds.enableDynamicThresholds) {
      // Calculate adaptive threshold based on detection context
      if (config.dynamicThresholds.adaptiveThresholds) {
        const detectionContext: DetectionContext = {
          imageQuality: 'high', // Simplified - could be determined from image analysis
          lighting: 'good',     // Simplified - could be determined from image analysis
          itemCount: contextualFilteringResult.filteredItems.length,
          averageConfidence: contextualFilteringResult.filteredItems.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, contextualFilteringResult.filteredItems.length),
          categoryDistribution: contextualFilteringResult.filteredItems.reduce((dist, item) => {
            dist[item.category] = (dist[item.category] || 0) + 1;
            return dist;
          }, {} as Record<string, number>)
        };

        const adaptiveThreshold = calculateAdaptiveThreshold(detectionContext);
        dynamicThresholdStats.adaptiveThresholdCalculated = true;
        
        // Apply adaptive threshold to items (simplified - in practice this would be more sophisticated)
        contextualFilteringResult.filteredItems = contextualFilteringResult.filteredItems.filter(item => 
          item.confidence >= adaptiveThreshold
        );
      }

      // Apply category-specific thresholds
      if (config.dynamicThresholds.categorySpecificThresholds) {
        const currentThresholds = dynamicThresholdManager.getCurrentThresholds();
        contextualFilteringResult.filteredItems = contextualFilteringResult.filteredItems.filter(item => {
          const categoryThreshold = currentThresholds[item.category] || currentThresholds.default;
          return item.confidence >= categoryThreshold;
        });
        dynamicThresholdStats.categorySpecificThresholdsApplied = true;
      }

      // Update thresholds based on quality metrics if available
      if (config.performance.enableMetrics) {
        try {
          const currentMetrics = qualityMetricsTracker.getCurrentMetrics();
          if (currentMetrics.averagePrecision > 0 && currentMetrics.averageRecall > 0) {
            const qualityMetrics: QualityMetrics = {
              precision: currentMetrics.averagePrecision,
              recall: currentMetrics.averageRecall,
              f1Score: currentMetrics.averageF1Score,
              confidenceStats: {
                mean: currentMetrics.averageConfidence,
                median: currentMetrics.averageConfidence,
                min: Math.min(...contextualFilteringResult.filteredItems.map(item => item.confidence)),
                max: Math.max(...contextualFilteringResult.filteredItems.map(item => item.confidence)),
                standardDeviation: 0.1, // Simplified
                outlierCount: 0
              },
              processingTime: currentProcessingTime,
              timestamp: new Date()
            };

            const optimalThresholds = getOptimalThresholds(qualityMetrics);
            const oldThresholds = dynamicThresholdManager.getCurrentThresholds();
            
            // Update thresholds if they've changed significantly
            let thresholdsChanged = false;
            Object.keys(optimalThresholds).forEach(category => {
              const oldThreshold = oldThresholds[category] || oldThresholds.default;
              const newThreshold = optimalThresholds[category];
              if (Math.abs(newThreshold - oldThreshold) > 0.05) { // 5% change threshold
                dynamicThresholdStats.thresholdAdjustments.push({
                  category,
                  oldThreshold,
                  newThreshold,
                  reason: 'quality_metrics_optimization'
                });
                thresholdsChanged = true;
              }
            });

            if (thresholdsChanged) {
              dynamicThresholdManager.updateThresholds(optimalThresholds, 'quality_metrics_optimization', qualityMetrics);
              dynamicThresholdStats.thresholdsUpdated = true;
            }
          }
        } catch (error) {
          console.warn('Failed to update thresholds based on quality metrics:', error);
        }
      }
    }

    const dynamicThresholdTime = Date.now() - dynamicThresholdStartTime;
    
    const totalProcessingTime = Date.now() - startTime;
    
    // Update totalProcessingTime in dynamic threshold stats if needed
    if (config.dynamicThresholds.enableDynamicThresholds && config.dynamicThresholds.learningFromFeedback) {
      dynamicThresholdManager.recordDetectionResult({
        items: contextualFilteringResult.filteredItems,
        processingTime: totalProcessingTime,
        success: true,
        timestamp: new Date()
      });
    }
    
    // Create result object
    const result: EnhancedDetectionResult = {
      items: contextualFilteringResult.filteredItems,
      processingMetrics: {
        totalProcessingTime,
        categoryFilteringTime,
        spatialAnalysisTime,
        overlapResolutionTime,
        contextualFilteringTime,
        filteringStats,
        spatialStats,
        overlapStats: overlapResolution.statistics,
        conflictStats,
        contextualStats,
        dynamicThresholdStats
      },
      success: true
    };
    
    // Record performance metrics
    recordEnhancedDetectionPerformance(result, items.length);
    
    // Calculate and record quality metrics
    if (config.performance.enableMetrics) {
      try {
        qualityMetricsTracker.recordDetectionResult({
          items: result.items,
          processingTime: totalProcessingTime,
          success: true,
          timestamp: new Date()
        });
        
        // Get current quality metrics and add to result
        const currentMetrics = qualityMetricsTracker.getCurrentMetrics();
        result.qualityMetrics = {
          precision: currentMetrics.averagePrecision,
          recall: currentMetrics.averageRecall,
          f1Score: currentMetrics.averageF1Score,
          confidenceStats: {
            mean: currentMetrics.averageConfidence,
            median: currentMetrics.averageConfidence, // Simplified for now
            min: Math.min(...result.items.map(item => item.confidence)),
            max: Math.max(...result.items.map(item => item.confidence)),
            standardDeviation: 0.1, // Simplified for now
            outlierCount: 0 // Simplified for now
          },
          processingTime: totalProcessingTime,
          timestamp: new Date()
        };
        
        console.log('Quality metrics recorded:', {
          precision: result.qualityMetrics.precision,
          recall: result.qualityMetrics.recall,
          f1Score: result.qualityMetrics.f1Score,
          averageConfidence: result.qualityMetrics.confidenceStats.mean
        });
      } catch (error) {
        console.warn('Failed to record quality metrics:', error);
        // Continue without quality metrics - don't fail the entire pipeline
      }
    }
    
    // Check performance requirements and apply optimizations if needed
    if (totalProcessingTime > config.performance.maxProcessingTime) {
      console.warn(`Enhanced detection pipeline exceeded performance target: ${totalProcessingTime}ms > ${config.performance.maxProcessingTime}ms`);
      
      // Apply optimizations for future runs
      if (shouldOptimizeProcessing()) {
        const optimization = optimizeProcessing(items, config);
        if (optimization.optimized) {
          console.log('Performance optimizations applied:', optimization.optimizationsApplied);
        }
      }
    }
    
    return result;
    
  } catch (error) {
    const totalProcessingTime = Date.now() - startTime;
    
    return {
      items: [],
      processingMetrics: {
        totalProcessingTime,
        categoryFilteringTime: 0,
        spatialAnalysisTime: 0,
        overlapResolutionTime: 0,
        contextualFilteringTime: 0,
        filteringStats: {
          total: items.length,
          objectsOfInterest: 0,
          objectsToIgnore: 0,
          default: 0,
          filtered: items.length,
          kept: 0
        },
        spatialStats: {
          relationshipsFound: 0,
          itemsPrioritized: 0,
          itemsFiltered: 0
        },
        overlapStats: {
          totalOverlaps: 0,
          averageOverlapPercentage: 0,
          maxOverlapPercentage: 0,
          overlapDistribution: {
            low: 0,
            medium: 0,
            high: 0,
            complete: 0
          }
        },
        conflictStats: {
          totalConflicts: 0,
          resolvedConflicts: 0,
          averageOverlapPercentage: 0
        },
        contextualStats: {
          parentChildRelationshipsFound: 0,
          conflictsResolved: 0,
          watchSleeveScenariosDetected: 0
        },
        dynamicThresholdStats: {
          adaptiveThresholdCalculated: false,
          categorySpecificThresholdsApplied: false,
          thresholdsUpdated: false,
          currentThresholds: {},
          thresholdAdjustments: []
        }
      },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Execute enhanced detection pipeline with performance monitoring
 */
export async function executeEnhancedDetectionWithMonitoring(
  items: DetectedItem[],
  config: EnhancedDetectionConfig = defaultConfig
): Promise<EnhancedDetectionResult> {
  const result = await executeEnhancedDetectionPipeline(items, config);
  
  if (config.performance.enableMetrics) {
    const performanceStatus = getPerformanceStatus();
    
    console.log('Enhanced Detection Pipeline Performance Metrics:', {
      totalItems: items.length,
      finalItems: result.items.length,
      totalProcessingTime: `${result.processingMetrics.totalProcessingTime}ms`,
      categoryFilteringTime: `${result.processingMetrics.categoryFilteringTime}ms`,
      spatialAnalysisTime: `${result.processingMetrics.spatialAnalysisTime}ms`,
      overlapResolutionTime: `${result.processingMetrics.overlapResolutionTime}ms`,
      contextualFilteringTime: `${result.processingMetrics.contextualFilteringTime}ms`,
      filteringEfficiency: `${((result.processingMetrics.filteringStats.kept / result.processingMetrics.filteringStats.total) * 100).toFixed(1)}%`,
      relationshipsFound: result.processingMetrics.spatialStats.relationshipsFound,
      conflictsResolved: result.processingMetrics.conflictStats.resolvedConflicts,
      contextualRelationshipsFound: result.processingMetrics.contextualStats.parentChildRelationshipsFound,
      watchSleeveScenariosDetected: result.processingMetrics.contextualStats.watchSleeveScenariosDetected,
      performanceStatus
    });
  }
  
  return result;
}

/**
 * Create a custom enhanced detection configuration
 */
export function createCustomEnhancedDetectionConfig(
  customCategoryFiltering?: Partial<CategoryFilteringConfig>,
  customSpatialAnalysis?: Partial<EnhancedDetectionConfig['spatialAnalysis']>,
  customOverlapResolution?: Partial<EnhancedDetectionConfig['overlapResolution']>,
  customPerformance?: Partial<EnhancedDetectionConfig['performance']>,
  customContextualFiltering?: Partial<EnhancedDetectionConfig['contextualFiltering']>,
  customDynamicThresholds?: Partial<EnhancedDetectionConfig['dynamicThresholds']>
): EnhancedDetectionConfig {
  return {
    categoryFiltering: {
      ...defaultConfig.categoryFiltering,
      ...customCategoryFiltering,
      confidenceThresholds: {
        ...defaultConfig.categoryFiltering.confidenceThresholds,
        ...customCategoryFiltering?.confidenceThresholds
      }
    },
    spatialAnalysis: {
      ...defaultConfig.spatialAnalysis,
      ...customSpatialAnalysis
    },
    overlapResolution: {
      ...defaultConfig.overlapResolution,
      ...customOverlapResolution
    },
    performance: {
      ...defaultConfig.performance,
      ...customPerformance
    },
    contextualFiltering: {
      ...defaultConfig.contextualFiltering,
      ...customContextualFiltering
    },
    dynamicThresholds: {
      ...defaultConfig.dynamicThresholds,
      ...customDynamicThresholds
    }
  };
}

/**
 * Validate enhanced detection configuration
 */
export function validateEnhancedDetectionConfig(config: EnhancedDetectionConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate confidence thresholds
  const thresholds = config.categoryFiltering.confidenceThresholds;
  if (thresholds.objects_of_interest < 0 || thresholds.objects_of_interest > 1) {
    errors.push('objects_of_interest confidence threshold must be between 0 and 1');
  }
  if (thresholds.objects_to_ignore < 0 || thresholds.objects_to_ignore > 1) {
    errors.push('objects_to_ignore confidence threshold must be between 0 and 1');
  }
  if (thresholds.default < 0 || thresholds.default > 1) {
    errors.push('default confidence threshold must be between 0 and 1');
  }
  
  // Validate spatial analysis threshold
  if (config.spatialAnalysis.containmentThreshold < 0 || config.spatialAnalysis.containmentThreshold > 1) {
    errors.push('containment threshold must be between 0 and 1');
  }
  
  // Validate overlap resolution threshold
  if (config.overlapResolution.overlapThreshold < 0 || config.overlapResolution.overlapThreshold > 1) {
    errors.push('overlap threshold must be between 0 and 1');
  }
  
  // Validate performance requirements
  if (config.performance.maxProcessingTime <= 0) {
    errors.push('max processing time must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export { defaultConfig };

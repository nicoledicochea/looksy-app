import { DetectedItem } from './realAiService';

export interface CategoryFilteringConfig {
  objectsOfInterest: string[];
  objectsToIgnore: string[];
  confidenceThresholds: {
    [category: string]: number;
  };
}

const defaultFilteringConfig: CategoryFilteringConfig = {
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
};

/**
 * Categorize an item for filtering purposes
 */
export function categorizeForFiltering(itemName: string, config: CategoryFilteringConfig = defaultFilteringConfig): 'objects_of_interest' | 'objects_to_ignore' | 'default' {
  const lowerName = itemName.toLowerCase();
  
  // Check if it's an object of interest
  if (config.objectsOfInterest.some(interest => lowerName.includes(interest.toLowerCase()))) {
    return 'objects_of_interest';
  }
  
  // Check if it's an object to ignore
  if (config.objectsToIgnore.some(ignore => lowerName.includes(ignore.toLowerCase()))) {
    return 'objects_to_ignore';
  }
  
  // Default category for unknown objects
  return 'default';
}

/**
 * Get the confidence threshold for an item based on its category
 */
export function getConfidenceThreshold(item: DetectedItem, config: CategoryFilteringConfig = defaultFilteringConfig): number {
  const category = categorizeForFiltering(item.name, config);
  return config.confidenceThresholds[category];
}

/**
 * Apply category-based filtering to a list of detected items
 */
export function applyCategoryFiltering(items: DetectedItem[], config: CategoryFilteringConfig = defaultFilteringConfig): DetectedItem[] {
  return items.filter(item => {
    const category = categorizeForFiltering(item.name, config);
    const threshold = config.confidenceThresholds[category];
    
    // Apply higher confidence threshold for objects to ignore
    return item.confidence >= threshold;
  });
}

/**
 * Get filtering statistics for analysis
 */
export function getFilteringStats(items: DetectedItem[], config: CategoryFilteringConfig = defaultFilteringConfig): {
  total: number;
  objectsOfInterest: number;
  objectsToIgnore: number;
  default: number;
  filtered: number;
  kept: number;
} {
  const stats = {
    total: items.length,
    objectsOfInterest: 0,
    objectsToIgnore: 0,
    default: 0,
    filtered: 0,
    kept: 0
  };

  items.forEach(item => {
    const category = categorizeForFiltering(item.name, config);
    const threshold = config.confidenceThresholds[category];
    
    switch (category) {
      case 'objects_of_interest':
        stats.objectsOfInterest++;
        break;
      case 'objects_to_ignore':
        stats.objectsToIgnore++;
        break;
      case 'default':
        stats.default++;
        break;
    }
    
    if (item.confidence >= threshold) {
      stats.kept++;
    } else {
      stats.filtered++;
    }
  });

  return stats;
}

/**
 * Create a custom filtering configuration
 */
export function createCustomFilteringConfig(
  objectsOfInterest: string[],
  objectsToIgnore: string[],
  confidenceThresholds?: Partial<CategoryFilteringConfig['confidenceThresholds']>
): CategoryFilteringConfig {
  return {
    objectsOfInterest,
    objectsToIgnore,
    confidenceThresholds: {
      'objects_of_interest': confidenceThresholds?.objects_of_interest ?? defaultFilteringConfig.confidenceThresholds.objects_of_interest,
      'objects_to_ignore': confidenceThresholds?.objects_to_ignore ?? defaultFilteringConfig.confidenceThresholds.objects_to_ignore,
      'default': confidenceThresholds?.default ?? defaultFilteringConfig.confidenceThresholds.default
    }
  };
}

export { defaultFilteringConfig };

// Real Google Cloud Vision API service
import { GOOGLE_CLOUD_CONFIG } from '../config/googleCloud';

export interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  category: string;
  description: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AIAnalysisResult {
  items: DetectedItem[];
  processingTime: number;
  success: boolean;
  error?: string;
}

// Helper function to get category emoji
export function getCategoryEmoji(category: string): string {
  switch (category.toLowerCase()) {
    case 'clothing': return '👕';
    case 'shoes': return '👟';
    case 'accessories': return '👜';
    case 'bags': return '👜';
    case 'jewelry': return '💍';
    case 'electronics': return '📱';
    case 'books': return '📚';
    case 'home': return '🏠';
    case 'sports': return '⚽';
    case 'toys': return '🧸';
    case 'kitchen': return '🍳';
    case 'tools': return '🔧';
    default: return '📦';
  }
}

// Comprehensive categorization system for all item types
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
    'toy', 'game', 'puzzle', 'doll', 'action figure', 'lego', 'board game', 'card game', 'video game',
    'stuffed animal', 'teddy bear', 'robot', 'model', 'kit', 'building', 'construction'
  ];
  
  // Kitchen & Appliances
  const kitchenKeywords = [
    'kitchen', 'appliance', 'microwave', 'toaster', 'blender', 'mixer', 'coffee maker', 'kettle',
    'pan', 'pot', 'dish', 'plate', 'bowl', 'cup', 'mug', 'glass', 'cutlery', 'knife', 'fork', 'spoon'
  ];
  
  // Tools & Hardware
  const toolKeywords = [
    'tool', 'hammer', 'screwdriver', 'wrench', 'pliers', 'drill', 'saw', 'level', 'tape measure',
    'hardware', 'screw', 'nail', 'bolt', 'nut', 'bracket', 'bracket', 'hinge', 'lock'
  ];
  
  // Check categories in order of specificity
  if (electronicsKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Electronics';
  if (clothingKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Clothing';
  if (shoeKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Shoes';
  if (accessoryKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Accessories';
  if (bookKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Books';
  if (homeKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Home';
  if (sportsKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Sports';
  if (toyKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Toys';
  if (kitchenKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Kitchen';
  if (toolKeywords.some(keyword => lowerLabel.includes(keyword))) return 'Tools';
  
  return 'Other';
}

// Enhanced item name detection for all categories
function createItemName(labels: any[]): string {
  const sortedLabels = labels.sort((a, b) => b.score - a.score);
  
  // Define item categories with priority (most specific first)
  const itemCategories = {
    // Electronics (highest priority for specificity)
    electronics: [
      'iphone', 'android', 'smartphone', 'phone', 'ipad', 'tablet', 'macbook', 'laptop', 'computer', 'pc',
      'camera', 'headphone', 'speaker', 'charger', 'keyboard', 'mouse', 'monitor', 'tv', 'remote',
      'gaming', 'console', 'playstation', 'xbox', 'nintendo', 'drone', 'bluetooth', 'wireless'
    ],
    
    // Clothing & Apparel
    clothing: [
      'jacket', 'blazer', 'coat', 'suit', 'cardigan', 'hoodie', 'sweater',
      'shirt', 'blouse', 'polo', 'tank', 'tunic', 'dress', 'romper', 'jumpsuit',
      'pants', 'jeans', 'shorts', 'skirt', 'leggings'
    ],
    
    // Footwear
    shoes: [
      'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'loafer', 'slipper', 'flip', 'flop', 
      'moccasin', 'oxford', 'pump', 'stiletto', 'wedge', 'athletic', 'running', 'walking'
    ],
    
    // Accessories & Jewelry
    accessories: [
      'bag', 'purse', 'handbag', 'backpack', 'watch', 'ring', 'necklace', 'bracelet', 
      'earring', 'belt', 'scarf', 'hat', 'cap', 'gloves', 'sunglasses', 'wallet', 
      'clutch', 'tote', 'messenger', 'jewelry', 'pendant', 'brooch', 'tie', 'bow'
    ],
    
    // Books & Media
    books: [
      'book', 'magazine', 'newspaper', 'notebook', 'journal', 'textbook', 'novel', 
      'manual', 'guide', 'comic', 'manga', 'dictionary', 'encyclopedia', 'atlas', 
      'calendar', 'planner', 'diary'
    ],
    
    // Home & Furniture
    home: [
      'furniture', 'chair', 'table', 'lamp', 'mirror', 'vase', 'decoration', 'couch', 
      'sofa', 'bed', 'dresser', 'desk', 'shelf', 'cabinet', 'drawer', 'nightstand', 
      'ottoman', 'bench', 'stool', 'artwork', 'painting', 'sculpture', 'plant', 'pot', 
      'frame', 'clock', 'candle'
    ],
    
    // Sports & Recreation
    sports: [
      'ball', 'racket', 'club', 'bat', 'helmet', 'equipment', 'gear', 'golf', 'tennis', 
      'baseball', 'football', 'basketball', 'soccer', 'hockey', 'ski', 'snowboard', 
      'bike', 'bicycle', 'skateboard', 'fitness', 'yoga', 'mat', 'dumbbell', 'weight', 
      'treadmill', 'exercise'
    ],
    
    // Toys & Games
    toys: [
      'toy', 'game', 'puzzle', 'doll', 'action figure', 'lego', 'board game', 'card game', 
      'video game', 'stuffed animal', 'teddy bear', 'robot', 'model', 'kit', 'building', 
      'construction'
    ],
    
    // Kitchen & Appliances
    kitchen: [
      'kitchen', 'appliance', 'microwave', 'toaster', 'blender', 'mixer', 'coffee maker', 
      'kettle', 'pan', 'pot', 'dish', 'plate', 'bowl', 'cup', 'mug', 'glass', 'cutlery', 
      'knife', 'fork', 'spoon'
    ],
    
    // Tools & Hardware
    tools: [
      'tool', 'hammer', 'screwdriver', 'wrench', 'pliers', 'drill', 'saw', 'level', 
      'tape measure', 'hardware', 'screw', 'nail', 'bolt', 'nut', 'bracket', 'hinge', 'lock'
    ]
  };
  
  // Find the main item by checking each category
  let mainItem = null;
  let categoryFound = null;
  
  for (const [category, keywords] of Object.entries(itemCategories)) {
    mainItem = sortedLabels.find(label => 
      keywords.some(keyword => label.description.toLowerCase().includes(keyword))
    );
    if (mainItem) {
      categoryFound = category;
      break;
    }
  }
  
  if (mainItem) {
    const itemName = mainItem.description.charAt(0).toUpperCase() + mainItem.description.slice(1);
    
    // Look for color descriptors
    const colorKeywords = [
      'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey', 'brown', 'pink', 
      'purple', 'orange', 'navy', 'beige', 'tan', 'maroon', 'burgundy', 'coral', 'teal', 
      'turquoise', 'silver', 'gold', 'bronze', 'copper'
    ];
    const colorLabel = sortedLabels.find(label => 
      colorKeywords.some(color => label.description.toLowerCase().includes(color))
    );
    
    // Look for material/brand descriptors
    const materialKeywords = [
      'cotton', 'wool', 'silk', 'leather', 'denim', 'polyester', 'linen', 'cashmere', 
      'suede', 'canvas', 'nylon', 'spandex', 'velvet', 'chiffon', 'satin', 'metal', 
      'plastic', 'wood', 'glass', 'ceramic', 'rubber'
    ];
    const materialLabel = sortedLabels.find(label => 
      materialKeywords.some(material => label.description.toLowerCase().includes(material))
    );
    
    // Look for brand names (common brands)
    const brandKeywords = [
      'nike', 'adidas', 'apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo', 
      'gucci', 'prada', 'louis vuitton', 'chanel', 'hermes', 'rolex', 'omega', 
      'calvin klein', 'tommy hilfiger', 'ralph lauren', 'levi', 'gap', 'zara', 'h&m'
    ];
    const brandLabel = sortedLabels.find(label => 
      brandKeywords.some(brand => label.description.toLowerCase().includes(brand))
    );
    
    // Build descriptive name
    let descriptiveName = itemName;
    
    if (brandLabel) {
      descriptiveName = `${brandLabel.description.charAt(0).toUpperCase() + brandLabel.description.slice(1)} ${descriptiveName}`;
    } else if (colorLabel) {
      descriptiveName = `${colorLabel.description.charAt(0).toUpperCase() + colorLabel.description.slice(1)} ${descriptiveName}`;
    }
    
    if (materialLabel && !brandLabel) { // Don't add material if we already have brand
      descriptiveName = `${descriptiveName} (${materialLabel.description})`;
    }
    
    return descriptiveName;
  }
  
  // Fallback: try to infer from context
  const contextKeywords = ['sleeve', 'pocket', 'collar', 'button', 'zipper', 'hood', 'screen', 'keyboard', 'button'];
  const hasContext = sortedLabels.some(label => 
    contextKeywords.some(keyword => label.description.toLowerCase().includes(keyword))
  );
  
  if (hasContext) {
    const colorKeywords = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey', 'brown', 'pink', 'purple', 'orange'];
    const colorLabel = sortedLabels.find(label => 
      colorKeywords.some(color => label.description.toLowerCase().includes(color))
    );
    
    // Try to infer item type from context
    let inferredItem = 'Item';
    if (sortedLabels.some(l => l.description.toLowerCase().includes('screen'))) {
      inferredItem = 'Electronic Device';
    } else if (sortedLabels.some(l => l.description.toLowerCase().includes('sleeve'))) {
      inferredItem = 'Jacket';
    } else if (sortedLabels.some(l => l.description.toLowerCase().includes('keyboard'))) {
      inferredItem = 'Computer';
    }
    
    if (colorLabel) {
      return `${colorLabel.description.charAt(0).toUpperCase() + colorLabel.description.slice(1)} ${inferredItem}`;
    }
    return inferredItem;
  }
  
  // Final fallback
  return sortedLabels[0]?.description.charAt(0).toUpperCase() + sortedLabels[0]?.description.slice(1) || 'Unknown Item';
}

// Helper function to create better descriptions
function createItemDescription(labels: any[], itemName: string): string {
  const sortedLabels = labels.sort((a, b) => b.score - a.score);
  
  // Extract color and material from item name to avoid duplication
  const itemNameLower = itemName.toLowerCase();
  const colorKeywords = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey', 'brown', 'pink', 'purple', 'orange', 'navy', 'beige', 'tan', 'maroon', 'burgundy', 'coral', 'teal', 'turquoise'];
  const materialKeywords = ['cotton', 'wool', 'silk', 'leather', 'denim', 'polyester', 'linen', 'cashmere', 'suede', 'canvas', 'nylon', 'spandex', 'velvet', 'chiffon', 'satin'];
  
  const itemColor = colorKeywords.find(color => itemNameLower.includes(color));
  const itemMaterial = materialKeywords.find(material => itemNameLower.includes(material));
  
  // Filter out generic terms and duplicates
  const genericTerms = ['clothing', 'apparel', 'garment', 'textile', 'fabric', 'material', 'object', 'item', 'thing', 'product', 'fashion'];
  const meaningfulLabels = sortedLabels.filter(label => {
    const labelLower = label.description.toLowerCase();
    
    // Skip generic terms
    if (genericTerms.some(term => labelLower.includes(term))) return false;
    
    // Skip if color already mentioned in item name
    if (itemColor && labelLower.includes(itemColor)) return false;
    
    // Skip if material already mentioned in item name
    if (itemMaterial && labelLower.includes(itemMaterial)) return false;
    
    // Skip if it's the main item name itself
    const mainItemKeywords = ['jacket', 'shirt', 'dress', 'pants', 'jeans', 'sweater', 'blouse', 'skirt', 'coat', 'suit', 'hoodie', 'cardigan', 'blazer', 'vest', 'shorts', 'tank', 'polo'];
    if (mainItemKeywords.some(item => labelLower.includes(item))) return false;
    
    return label.score > 0.5 && labelLower.length > 2;
  });
  
  // Take top 2-3 meaningful descriptors
  const topDescriptors = meaningfulLabels.slice(0, 3).map(label => label.description);
  
  if (topDescriptors.length === 0) {
    return `${itemName} detected`;
  }
  
  return `${itemName} with ${topDescriptors.join(', ')} features`;
}

// Convert image URI to base64 for API
async function imageUriToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Failed to convert image to base64');
  }
}

// Real Google Cloud Vision API call
export async function analyzeImage(imageUri: string): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Check if API key is configured
    if (!GOOGLE_CLOUD_CONFIG.apiKey || GOOGLE_CLOUD_CONFIG.apiKey === 'your-api-key') {
      throw new Error('Google Cloud Vision API key not configured. Please set EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY in your .env file.');
    }

    // Convert image to base64
    const base64Image = await imageUriToBase64(imageUri);
    
    // Prepare API request
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 10,
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10,
            },
          ],
        },
      ],
    };

    // Make API call
    const response = await fetch(
      `${GOOGLE_CLOUD_CONFIG.visionApiUrl}?key=${GOOGLE_CLOUD_CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Cloud Vision API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    // Process the response
    const labels = data.responses[0]?.labelAnnotations || [];
    const objects = data.responses[0]?.localizedObjectAnnotations || [];

    // Filter and process labels to create meaningful items
    const highConfidenceLabels = labels.filter((label: any) => label.score > 0.6);
    
    if (highConfidenceLabels.length === 0) {
      return {
        items: [],
        processingTime,
        success: true,
        error: 'No items detected with sufficient confidence',
      };
    }

    // Create a single, well-described item from the labels
    const itemName = createItemName(highConfidenceLabels);
    const itemDescription = createItemDescription(highConfidenceLabels, itemName);
    const itemCategory = categorizeItem(itemName);
    
    const detectedItems: DetectedItem[] = [{
      id: `real_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: itemName,
      confidence: Math.max(...highConfidenceLabels.map((l: any) => l.score)),
      category: itemCategory,
      description: itemDescription,
    }];

    return {
      items: detectedItems,
      processingTime,
      success: true,
    };

  } catch (error) {
    console.error('Google Cloud Vision API error:', error);
    
    // Fallback to mock data if API fails
    return {
      items: [],
      processingTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Mock fallback function (for development/testing)
export async function analyzeImageMock(imageUri: string): Promise<AIAnalysisResult> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const mockItems = [
    { name: 'Blue Jeans', category: 'Clothing', description: 'Classic blue denim jeans' },
    { name: 'White T-Shirt', category: 'Clothing', description: 'Basic white cotton t-shirt' },
    { name: 'Black Sneakers', category: 'Shoes', description: 'Comfortable black athletic shoes' },
    { name: 'Leather Jacket', category: 'Clothing', description: 'Brown leather outerwear' },
    { name: 'Smartphone', category: 'Electronics', description: 'Mobile phone device' },
  ];

  const numItems = Math.floor(Math.random() * 3) + 1;
  const selectedItems = mockItems
    .sort(() => 0.5 - Math.random())
    .slice(0, numItems)
    .map((item, index) => ({
      id: `mock_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
      name: item.name,
      confidence: Math.random() * 0.3 + 0.7,
      category: item.category,
      description: item.description,
    }));

  return {
    items: selectedItems,
    processingTime: 2000,
    success: true,
  };
}

// Amazon Rekognition API service for enhanced item detection
import AWS from 'aws-sdk';
import { DetectedItem } from './aiService';

// AWS Configuration
const rekognition = new AWS.Rekognition({
  accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY,
  region: process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1'
});

export interface AIAnalysisResult {
  items: DetectedItem[];
  processingTime: number;
  success: boolean;
  error?: string;
}

// Convert image URI to base64 for Amazon Rekognition API
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

// Transform Amazon Rekognition response to DetectedItem format
export function transformRekognitionResponse(labels: any[]): DetectedItem[] {
  return labels.map(label => ({
    id: `amazon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: label.Name,
    confidence: label.Confidence / 100, // Convert to 0-1 scale
    category: categorizeItem(label.Name),
    description: `${label.Name} detected with ${Math.round(label.Confidence)}% confidence`
  }));
}

// Categorize items based on Amazon Rekognition labels
function categorizeItem(label: string): string {
  const lowerLabel = label.toLowerCase();
  
  // Clothing & Apparel
  const clothingKeywords = [
    'shirt', 'pants', 'dress', 'jacket', 'sweater', 'jeans', 'blouse', 'skirt', 'coat', 'suit', 
    'hoodie', 'cardigan', 'blazer', 'vest', 'shorts', 'tank', 'polo', 'tunic', 'romper', 'jumpsuit',
    'clothing', 'apparel', 'garment', 'textile', 'fabric'
  ];
  
  // Footwear
  const shoeKeywords = [
    'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'loafer', 'slipper', 'flip', 'flop', 
    'moccasin', 'oxford', 'pump', 'stiletto', 'wedge', 'athletic', 'running', 'walking',
    'footwear', 'foot'
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
    'gaming', 'console', 'playstation', 'xbox', 'nintendo', 'drone', 'bluetooth', 'wireless',
    'electronic', 'device', 'gadget'
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
    'hardware', 'screw', 'nail', 'bolt', 'nut', 'bracket', 'hinge', 'lock'
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

// Main Amazon Rekognition analysis function
export async function analyzeWithAmazonRekognition(imageUri: string): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Check if AWS credentials are configured
    if (!process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID || 
        !process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured. Please set EXPO_PUBLIC_AWS_ACCESS_KEY_ID and EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY in your .env file.');
    }

    // Convert image to base64
    const base64Image = await imageUriToBase64(imageUri);
    
    // Convert base64 string to Uint8Array for AWS SDK
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Prepare API request
    const params = {
      Image: {
        Bytes: bytes
      },
      MaxLabels: 10,
      MinConfidence: 60
    };

    // Make API call
    const result = await rekognition.detectLabels(params).promise();
    const processingTime = Date.now() - startTime;

    // Transform response to our format
    const detectedItems = transformRekognitionResponse(result.Labels || []);

    return {
      items: detectedItems,
      processingTime,
      success: true
    };

  } catch (error) {
    console.error('Amazon Rekognition API error:', error);
    
    return {
      items: [],
      processingTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

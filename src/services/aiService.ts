// Mock AI service for item detection
// In production, this would connect to Google Cloud Vision API

export interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  category: string;
  description: string;
}

export interface AIAnalysisResult {
  items: DetectedItem[];
  processingTime: number;
  success: boolean;
}

// Mock item detection based on common clothing/accessory items
const MOCK_ITEMS = [
  { name: 'Blue Jeans', category: 'Clothing', description: 'Classic blue denim jeans' },
  { name: 'White T-Shirt', category: 'Clothing', description: 'Basic white cotton t-shirt' },
  { name: 'Black Sneakers', category: 'Shoes', description: 'Comfortable black athletic shoes' },
  { name: 'Red Dress', category: 'Clothing', description: 'Elegant red evening dress' },
  { name: 'Leather Jacket', category: 'Clothing', description: 'Brown leather outerwear' },
  { name: 'Running Shoes', category: 'Shoes', description: 'White and blue running sneakers' },
  { name: 'Denim Jacket', category: 'Clothing', description: 'Classic blue denim jacket' },
  { name: 'Black Handbag', category: 'Accessories', description: 'Stylish black leather handbag' },
  { name: 'Sunglasses', category: 'Accessories', description: 'Black frame sunglasses' },
  { name: 'Watch', category: 'Accessories', description: 'Silver metal wristwatch' },
];

export async function analyzeImage(imageUri: string): Promise<AIAnalysisResult> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Randomly select 1-3 items to simulate detection
  const numItems = Math.floor(Math.random() * 3) + 1;
  const selectedItems = MOCK_ITEMS
    .sort(() => 0.5 - Math.random())
    .slice(0, numItems)
    .map((item, index) => ({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
      name: item.name,
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      category: item.category,
      description: item.description,
    }));

  return {
    items: selectedItems,
    processingTime: 2000,
    success: true,
  };
}

// Helper function to get category emoji
export function getCategoryEmoji(category: string): string {
  switch (category.toLowerCase()) {
    case 'clothing': return '👕';
    case 'shoes': return '👟';
    case 'accessories': return '👜';
    default: return '📦';
  }
}

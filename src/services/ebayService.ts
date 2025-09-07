// eBay API service for price estimation
import { GOOGLE_CLOUD_API_KEY } from '../config/googleCloud';

// eBay API configuration
const EBAY_API_BASE_URL = 'https://api.ebay.com';
const EBAY_SANDBOX_URL = 'https://api.sandbox.ebay.com';

// You'll need to add these to your .env file
const EBAY_APP_ID = process.env.EXPO_PUBLIC_EBAY_APP_ID || '';

export interface PriceEstimate {
  estimatedPrice: {
    min: number;
    max: number;
    average: number;
    currency: string;
  };
  confidence: number;
  dataPoints: number;
  lastUpdated: Date;
  source: 'ebay_sales' | 'ebay_listings' | 'insufficient_data';
}

export interface EbaySearchResult {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  soldDate?: Date;
  listingType: 'auction' | 'fixed_price' | 'best_offer';
}

// Search eBay for similar items using AI-detected item name
export async function searchEbayItems(itemName: string, category?: string): Promise<EbaySearchResult[]> {
  if (!EBAY_APP_ID) {
    throw new Error('eBay App ID not configured');
  }

  try {
    // Clean and optimize search query
    const searchQuery = optimizeSearchQuery(itemName, category);
    
    // Use eBay Browse API to find current listings
    const response = await fetch(
      `${EBAY_API_BASE_URL}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchQuery)}&limit=20&sort=price`,
      {
        headers: {
          'Authorization': `Bearer ${EBAY_APP_ID}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.itemSummaries?.map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      price: parseFloat(item.price?.value || '0'),
      currency: item.price?.currency || 'USD',
      condition: item.condition || 'Unknown',
      listingType: item.listingFormat || 'fixed_price',
    })) || [];

  } catch (error) {
    console.error('eBay search error:', error);
    return [];
  }
}

// Get sales history for price estimation
export async function getSalesHistory(itemName: string, category?: string): Promise<EbaySearchResult[]> {
  if (!EBAY_APP_ID) {
    throw new Error('eBay App ID not configured');
  }

  try {
    const searchQuery = optimizeSearchQuery(itemName, category);
    
    // Use Marketplace Insights API for sales history
    const response = await fetch(
      `${EBAY_API_BASE_URL}/buy/marketplace-insights/v1_beta/item_sales/search?q=${encodeURIComponent(searchQuery)}&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${EBAY_APP_ID}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`eBay Marketplace Insights API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.itemSales?.map((sale: any) => ({
      itemId: sale.itemId,
      title: sale.title,
      price: parseFloat(sale.price?.value || '0'),
      currency: sale.price?.currency || 'USD',
      condition: sale.condition || 'Unknown',
      soldDate: new Date(sale.soldDate),
      listingType: 'auction',
    })) || [];

  } catch (error) {
    console.error('eBay sales history error:', error);
    return [];
  }
}

// Calculate price estimate from search results
export async function estimatePrice(itemName: string, category?: string): Promise<PriceEstimate> {
  // Use mock data if eBay App ID is not configured
  if (!EBAY_APP_ID) {
    console.log('eBay App ID not configured, using mock data');
    return await estimatePriceMock(itemName, category);
  }

  try {
    // Get both current listings and sales history
    const [currentListings, salesHistory] = await Promise.all([
      searchEbayItems(itemName, category),
      getSalesHistory(itemName, category)
    ]);

    const allResults = [...currentListings, ...salesHistory];
    
    if (allResults.length === 0) {
      return {
        estimatedPrice: { min: 0, max: 0, average: 0, currency: 'USD' },
        confidence: 0,
        dataPoints: 0,
        lastUpdated: new Date(),
        source: 'insufficient_data'
      };
    }

    // Filter out unrealistic prices (too high or too low)
    const validPrices = allResults
      .map(item => item.price)
      .filter(price => price > 0 && price < 10000) // Reasonable range
      .sort((a, b) => a - b);

    if (validPrices.length === 0) {
      return {
        estimatedPrice: { min: 0, max: 0, average: 0, currency: 'USD' },
        confidence: 0,
        dataPoints: 0,
        lastUpdated: new Date(),
        source: 'insufficient_data'
      };
    }

    // Calculate price statistics
    const min = validPrices[0];
    const max = validPrices[validPrices.length - 1];
    const average = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
    
    // Calculate confidence based on data points and price consistency
    const priceRange = max - min;
    const priceVariance = priceRange / average;
    const confidence = Math.min(0.95, Math.max(0.1, 
      (validPrices.length / 20) * (1 - Math.min(priceVariance, 1))
    ));

    // Determine data source
    let source: PriceEstimate['source'] = 'insufficient_data';
    if (salesHistory.length > 0) {
      source = 'ebay_sales';
    } else if (currentListings.length > 0) {
      source = 'ebay_listings';
    }

    return {
      estimatedPrice: {
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        average: Math.round(average * 100) / 100,
        currency: allResults[0]?.currency || 'USD'
      },
      confidence: Math.round(confidence * 100) / 100,
      dataPoints: validPrices.length,
      lastUpdated: new Date(),
      source
    };

  } catch (error) {
    console.error('Price estimation error:', error);
    return {
      estimatedPrice: { min: 0, max: 0, average: 0, currency: 'USD' },
      confidence: 0,
      dataPoints: 0,
      lastUpdated: new Date(),
      source: 'insufficient_data'
    };
  }
}

// Optimize search query for better eBay results
function optimizeSearchQuery(itemName: string, category?: string): string {
  let query = itemName.toLowerCase();
  
  // Remove common words that don't help with eBay search
  const stopWords = ['with', 'features', 'the', 'a', 'an', 'and', 'or', 'but'];
  stopWords.forEach(word => {
    query = query.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
  });
  
  // Add category-specific terms for better results
  if (category) {
    const categoryTerms: { [key: string]: string[] } = {
      'clothing': ['clothes', 'apparel', 'fashion'],
      'electronics': ['electronic', 'device', 'gadget'],
      'books': ['book', 'novel', 'textbook'],
      'home': ['furniture', 'home', 'decor'],
      'sports': ['sport', 'athletic', 'fitness'],
      'toys': ['toy', 'game', 'play'],
      'kitchen': ['kitchen', 'cookware', 'appliance'],
      'tools': ['tool', 'hardware', 'equipment']
    };
    
    const terms = categoryTerms[category.toLowerCase()];
    if (terms) {
      query = `${query} ${terms.join(' ')}`;
    }
  }
  
  // Clean up extra spaces
  return query.replace(/\s+/g, ' ').trim();
}

// Mock function for testing when eBay API is not available
export async function estimatePriceMock(itemName: string, category?: string): Promise<PriceEstimate> {
  // Simulate realistic price ranges based on category
  const categoryRanges: { [key: string]: { min: number; max: number } } = {
    'clothing': { min: 5, max: 200 },
    'electronics': { min: 20, max: 1000 },
    'books': { min: 2, max: 50 },
    'home': { min: 10, max: 500 },
    'sports': { min: 15, max: 300 },
    'toys': { min: 5, max: 100 },
    'kitchen': { min: 8, max: 200 },
    'tools': { min: 10, max: 150 }
  };
  
  const range = categoryRanges[category?.toLowerCase() || 'clothing'] || { min: 5, max: 100 };
  const average = (range.min + range.max) / 2;
  
  return {
    estimatedPrice: {
      min: range.min,
      max: range.max,
      average: Math.round(average * 100) / 100,
      currency: 'USD'
    },
    confidence: 0.75, // Mock confidence
    dataPoints: 15, // Mock data points
    lastUpdated: new Date(),
    source: 'insufficient_data'
  };
}

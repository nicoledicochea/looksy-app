import AsyncStorage from '@react-native-async-storage/async-storage';

// Usage tracking keys
const USAGE_KEYS = {
  GOOGLE_VISION: 'usage_googleVision',
  AMAZON_REKOGNITION: 'usage_amazonRekognition',
  OPENAI: 'usage_openai',
} as const;

export type ServiceType = 'googleVision' | 'amazonRekognition' | 'openai';

export interface UsageStats {
  googleVision: number;
  amazonRekognition: number;
  openai: number;
  total: number;
}

/**
 * Check if usage is under the limit for a specific service
 */
export async function checkUsageLimit(service: ServiceType, limit: number): Promise<boolean> {
  try {
    const key = getUsageKey(service);
    const currentUsageStr = await AsyncStorage.getItem(key);
    const currentUsage = currentUsageStr ? parseInt(currentUsageStr, 10) : 0;
    
    return currentUsage < limit;
  } catch (error) {
    console.error(`Failed to check usage limit for ${service}:`, error);
    // If we can't check, assume we're under limit to avoid blocking functionality
    return true;
  }
}

/**
 * Increment usage count for a specific service
 */
export async function incrementUsage(service: ServiceType): Promise<void> {
  try {
    const key = getUsageKey(service);
    const currentUsageStr = await AsyncStorage.getItem(key);
    const currentUsage = currentUsageStr ? parseInt(currentUsageStr, 10) : 0;
    const newUsage = currentUsage + 1;
    
    await AsyncStorage.setItem(key, newUsage.toString());
    console.log(`Incremented ${service} usage to ${newUsage}`);
  } catch (error) {
    console.error(`Failed to increment usage for ${service}:`, error);
    // Don't throw error to avoid breaking the main functionality
  }
}

/**
 * Get current usage statistics for all services
 */
export async function getUsageStats(): Promise<UsageStats> {
  try {
    const [googleVisionUsage, amazonRekognitionUsage, openaiUsage] = await Promise.all([
      AsyncStorage.getItem(USAGE_KEYS.GOOGLE_VISION),
      AsyncStorage.getItem(USAGE_KEYS.AMAZON_REKOGNITION),
      AsyncStorage.getItem(USAGE_KEYS.OPENAI),
    ]);

    const googleVision = googleVisionUsage ? parseInt(googleVisionUsage, 10) : 0;
    const amazonRekognition = amazonRekognitionUsage ? parseInt(amazonRekognitionUsage, 10) : 0;
    const openai = openaiUsage ? parseInt(openaiUsage, 10) : 0;

    return {
      googleVision,
      amazonRekognition,
      openai,
      total: googleVision + amazonRekognition + openai,
    };
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return {
      googleVision: 0,
      amazonRekognition: 0,
      openai: 0,
      total: 0,
    };
  }
}

/**
 * Reset usage count for a specific service
 */
export async function resetUsage(service: ServiceType): Promise<void> {
  try {
    const key = getUsageKey(service);
    await AsyncStorage.setItem(key, '0');
    console.log(`Reset ${service} usage to 0`);
  } catch (error) {
    console.error(`Failed to reset usage for ${service}:`, error);
  }
}

/**
 * Reset usage count for all services
 */
export async function resetAllUsage(): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [USAGE_KEYS.GOOGLE_VISION, '0'],
      [USAGE_KEYS.AMAZON_REKOGNITION, '0'],
      [USAGE_KEYS.OPENAI, '0'],
    ]);
    console.log('Reset all usage counts to 0');
  } catch (error) {
    console.error('Failed to reset all usage:', error);
  }
}

/**
 * Get the storage key for a service type
 */
function getUsageKey(service: ServiceType): string {
  switch (service) {
    case 'googleVision':
      return USAGE_KEYS.GOOGLE_VISION;
    case 'amazonRekognition':
      return USAGE_KEYS.AMAZON_REKOGNITION;
    case 'openai':
      return USAGE_KEYS.OPENAI;
    default:
      throw new Error(`Unknown service type: ${service}`);
  }
}

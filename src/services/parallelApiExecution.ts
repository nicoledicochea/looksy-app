import { analyzeImage } from './realAiService';
import { analyzeWithAmazonRekognition } from './amazonRekognitionService';
import { checkUsageLimit, incrementUsage } from './usageTracking';
import { DetectedItem } from './aiService';
import { summarizeDetections, SummarizedResult } from './aiSummarizationService';

export interface ParallelAnalysisResult {
  success: boolean;
  googleVisionResults?: {
    items: DetectedItem[];
    processingTime: number;
    success: boolean;
    analyzedAt: Date;
    error?: string;
  };
  amazonRekognitionResults?: {
    items: DetectedItem[];
    processingTime: number;
    success: boolean;
    analyzedAt: Date;
    error?: string;
  };
  summarizedResult?: SummarizedResult;
  totalProcessingTime: number;
  error?: string;
}

/**
 * Analyze photo using both Google Vision and Amazon Rekognition APIs in parallel
 */
export async function analyzePhotoWithMultipleAPIs(imageUri: string): Promise<ParallelAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Check usage limits for both APIs
    const [googleVisionAllowed, amazonRekognitionAllowed] = await Promise.all([
      checkUsageLimit('googleVision', 1000),
      checkUsageLimit('amazonRekognition', 1000)
    ]);

    if (!googleVisionAllowed || !amazonRekognitionAllowed) {
      return {
        success: false,
        totalProcessingTime: Date.now() - startTime,
        error: 'Usage limit exceeded for one or more APIs'
      };
    }

    // Execute both APIs in parallel using Promise.allSettled
    const [googleVisionResult, amazonRekognitionResult] = await Promise.allSettled([
      analyzeImage(imageUri),
      analyzeWithAmazonRekognition(imageUri)
    ]);

    // Process Google Vision results
    let googleVisionResults;
    if (googleVisionResult.status === 'fulfilled') {
      googleVisionResults = {
        ...googleVisionResult.value,
        analyzedAt: new Date()
      };
      
      // Increment usage count if successful
      if (googleVisionResult.value.success) {
        await incrementUsage('googleVision');
      }
    } else {
      googleVisionResults = {
        items: [],
        processingTime: 0,
        success: false,
        analyzedAt: new Date(),
        error: googleVisionResult.reason?.message || 'Google Vision API failed'
      };
    }

    // Process Amazon Rekognition results
    let amazonRekognitionResults;
    if (amazonRekognitionResult.status === 'fulfilled') {
      amazonRekognitionResults = {
        ...amazonRekognitionResult.value,
        analyzedAt: new Date()
      };
      
      // Increment usage count if successful
      if (amazonRekognitionResult.value.success) {
        await incrementUsage('amazonRekognition');
      }
    } else {
      amazonRekognitionResults = {
        items: [],
        processingTime: 0,
        success: false,
        analyzedAt: new Date(),
        error: amazonRekognitionResult.reason?.message || 'Amazon Rekognition API failed'
      };
    }

    const totalProcessingTime = Date.now() - startTime;

    // Determine overall success
    const overallSuccess = googleVisionResults.success || amazonRekognitionResults.success;
    
    if (!overallSuccess) {
      return {
        success: false,
        googleVisionResults,
        amazonRekognitionResults,
        totalProcessingTime,
        error: 'Both APIs failed to analyze the image'
      };
    }

    // Perform AI summarization to create single meaningful description
    let summarizedResult: SummarizedResult | undefined;
    try {
      const googleItems = googleVisionResults.success ? googleVisionResults.items : [];
      const amazonItems = amazonRekognitionResults.success ? amazonRekognitionResults.items : [];
      
      summarizedResult = await summarizeDetections(googleItems, amazonItems);
      console.log('AI summarization completed:', summarizedResult);
    } catch (error) {
      console.error('AI summarization failed:', error);
      // Continue without summarization - the individual API results are still available
    }

    return {
      success: true,
      googleVisionResults,
      amazonRekognitionResults,
      summarizedResult,
      totalProcessingTime
    };

  } catch (error) {
    console.error('Parallel API execution failed:', error);
    
    return {
      success: false,
      totalProcessingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Combine results from multiple APIs into a single analysis
 * This will be used in the future for ensemble scoring
 */
export function combineApiResults(
  googleVisionResults: any,
  amazonRekognitionResults: any
): {
  items: DetectedItem[];
  processingTime: number;
  success: boolean;
  analyzedAt: Date;
} {
  const allItems: DetectedItem[] = [];
  
  // Add items from Google Vision
  if (googleVisionResults.success && googleVisionResults.items) {
    allItems.push(...googleVisionResults.items);
  }
  
  // Add items from Amazon Rekognition
  if (amazonRekognitionResults.success && amazonRekognitionResults.items) {
    allItems.push(...amazonRekognitionResults.items);
  }

  // Remove duplicates based on name and category
  const uniqueItems = allItems.reduce((acc: DetectedItem[], current) => {
    const existing = acc.find(item => 
      item.name.toLowerCase() === current.name.toLowerCase() && 
      item.category === current.category
    );
    
    if (!existing) {
      acc.push(current);
    } else {
      // Keep the item with higher confidence
      if (current.confidence > existing.confidence) {
        const index = acc.indexOf(existing);
        acc[index] = current;
      }
    }
    
    return acc;
  }, []);

  return {
    items: uniqueItems,
    processingTime: Math.max(
      googleVisionResults.processingTime || 0,
      amazonRekognitionResults.processingTime || 0
    ),
    success: googleVisionResults.success || amazonRekognitionResults.success,
    analyzedAt: new Date()
  };
}

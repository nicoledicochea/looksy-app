import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DetectedItem } from '../services/aiService';
import { PriceEstimate } from '../services/ebayService';
import { storageService, Photo } from '../services/storageService';

// Photo interface is now imported from storageService

interface PhotoContextType {
  photos: Photo[];
  isLoading: boolean;
  isInitialized: boolean;
  addPhoto: (uri: string) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  analyzePhoto: (photoId: string) => Promise<void>;
  estimatePrice: (photoId: string) => Promise<void>;
  refreshPhotos: () => Promise<void>;
  debugPhotos: () => Promise<void>;
  clearAllPhotos: () => Promise<void>;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize storage and load photos on mount
  useEffect(() => {
    initializeStorage();
  }, []);

  const initializeStorage = async () => {
    try {
      setIsLoading(true);
      await storageService.initialize();
      const savedPhotos = await storageService.loadPhotos();
      setPhotos(savedPhotos);
      setIsInitialized(true);
      console.log(`Loaded ${savedPhotos.length} photos from storage`);
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      setIsInitialized(true); // Still set to true to prevent infinite loading
    } finally {
      setIsLoading(false);
    }
  };

  const addPhoto = async (uri: string) => {
    // Generate a more robust unique ID with better collision resistance
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const newPhoto: Photo = {
      id: `photo_${timestamp}_${randomId}`,
      uri,
      timestamp: new Date(timestamp),
      isAnalyzing: false,
    };
    
    try {
      // Add to storage first
      await storageService.addPhoto(newPhoto);
      // Then update local state
      setPhotos(prev => [newPhoto, ...prev]);
      console.log(`Added photo ${newPhoto.id} to storage and state`);
    } catch (error) {
      console.error('Failed to add photo:', error);
      throw error;
    }
  };

  const removePhoto = async (id: string) => {
    try {
      // Remove from storage first
      await storageService.removePhoto(id);
      // Then update local state
      setPhotos(prev => prev.filter(photo => photo.id !== id));
      console.log(`Removed photo ${id} from storage and state`);
    } catch (error) {
      console.error('Failed to remove photo:', error);
      throw error;
    }
  };

  const analyzePhoto = async (photoId: string) => {
    // Update local state to show analyzing
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, isAnalyzing: true } : photo
    ));

    try {
      const { analyzePhotoWithMultipleAPIs, combineApiResults } = await import('../services/parallelApiExecution');
      const photo = photos.find(p => p.id === photoId);
      if (!photo) {
        console.error(`Photo ${photoId} not found in context`);
        return;
      }

      // Use parallel API execution
      const parallelResult = await analyzePhotoWithMultipleAPIs(photo.uri);
      
      if (!parallelResult.success) {
        throw new Error(parallelResult.error || 'Parallel API analysis failed');
      }

      // Use summarized result if available, otherwise combine results from both APIs
      let aiAnalysis;
      if (parallelResult.summarizedResult) {
        // Create a single item from the summarized result
        aiAnalysis = {
          items: [{
            id: `summarized_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: parallelResult.summarizedResult.name,
            confidence: parallelResult.summarizedResult.confidence,
            category: 'AI Analyzed',
            description: parallelResult.summarizedResult.description,
            boundingBox: {
              x: 0.1,
              y: 0.1,
              width: 0.8,
              height: 0.8,
            },
          }],
          processingTime: parallelResult.totalProcessingTime,
          success: true,
          analyzedAt: new Date(),
          reasoning: parallelResult.summarizedResult.reasoning
        };
      } else {
        // Fallback to combined results
        aiAnalysis = combineApiResults(
          parallelResult.googleVisionResults,
          parallelResult.amazonRekognitionResults
        );
      }
      
      const updatedPhoto = {
        ...photo,
        isAnalyzing: false,
        // Store individual API results
        googleVisionResults: parallelResult.googleVisionResults,
        amazonRekognitionResults: parallelResult.amazonRekognitionResults,
        // Store summarized result
        summarizedResult: parallelResult.summarizedResult,
        // Store AI analysis (summarized or combined)
        aiAnalysis
      };

      // Update in storage first with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await storageService.updatePhoto(photoId, updatedPhoto);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw error; // Re-throw if all retries failed
          }
          console.warn(`Storage update failed, retry ${retryCount}/${maxRetries}:`, error);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }
      
      // Then update local state
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? updatedPhoto : p
      ));
      
      console.log(`Updated parallel AI analysis for photo ${photoId} in storage`);
    } catch (error) {
      console.error('Parallel AI analysis failed:', error);
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId ? { ...photo, isAnalyzing: false } : photo
      ));
    }
  };

  const estimatePrice = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo || !photo.aiAnalysis?.items.length) {
      console.log('No AI analysis available for price estimation');
      return;
    }

    try {
      // Update local state to show estimating
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, isEstimatingPrice: true } : p
      ));

      const { estimatePrice: estimatePriceService, estimatePriceMock } = await import('../services/ebayService');
      
      // Use the first detected item for price estimation
      const item = photo.aiAnalysis.items[0];
      const itemName = item.name;
      const category = item.category;
      
      let priceEstimate;
      try {
        priceEstimate = await estimatePriceService(itemName, category);
      } catch (error) {
        console.log('eBay API failed, using mock:', error);
        priceEstimate = await estimatePriceMock(itemName, category);
      }
      
      const updatedPhoto = {
        ...photo,
        isEstimatingPrice: false,
        priceEstimate
      };

      // Update in storage first
      await storageService.updatePhoto(photoId, updatedPhoto);
      
      // Then update local state
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? updatedPhoto : p
      ));
      
      console.log(`Updated price estimate for photo ${photoId} in storage`);
    } catch (error) {
      console.error('Price estimation failed:', error);
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId ? { ...photo, isEstimatingPrice: false } : photo
      ));
    }
  };

  const refreshPhotos = async () => {
    try {
      const savedPhotos = await storageService.loadPhotos();
      setPhotos(savedPhotos);
      console.log(`Refreshed ${savedPhotos.length} photos from storage`);
    } catch (error) {
      console.error('Failed to refresh photos:', error);
    }
  };

  const debugPhotos = async () => {
    try {
      const savedPhotos = await storageService.loadPhotos();
      console.log('📸 Photos in storage:', savedPhotos.length);
      console.log('📸 Photos in context:', photos.length);
      console.log('📸 Storage photo IDs:', savedPhotos.map(p => p.id));
      console.log('📸 Context photo IDs:', photos.map(p => p.id));
    } catch (error) {
      console.error('Failed to debug photos:', error);
    }
  };

  const clearAllPhotos = async () => {
    try {
      await storageService.clearAllData();
      setPhotos([]);
      console.log('Cleared all photos from storage and state');
    } catch (error) {
      console.error('Failed to clear all photos:', error);
      throw error;
    }
  };

  return (
    <PhotoContext.Provider value={{ 
      photos, 
      isLoading, 
      isInitialized,
      addPhoto, 
      removePhoto, 
      analyzePhoto, 
      estimatePrice,
      refreshPhotos,
      debugPhotos,
      clearAllPhotos
    }}>
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhotos() {
  const context = useContext(PhotoContext);
  if (context === undefined) {
    throw new Error('usePhotos must be used within a PhotoProvider');
  }
  return context;
}

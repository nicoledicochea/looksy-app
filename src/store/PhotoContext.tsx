import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DetectedItem } from '../services/aiService';
import { PriceEstimate } from '../services/ebayService';

interface Photo {
  id: string;
  uri: string;
  timestamp: Date;
  aiAnalysis?: {
    items: DetectedItem[];
    processingTime: number;
    success: boolean;
    analyzedAt: Date;
  };
  priceEstimate?: PriceEstimate;
  isAnalyzing?: boolean;
  isEstimatingPrice?: boolean;
}

interface PhotoContextType {
  photos: Photo[];
  addPhoto: (uri: string) => void;
  removePhoto: (id: string) => void;
  analyzePhoto: (photoId: string) => Promise<void>;
  estimatePrice: (photoId: string) => Promise<void>;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const addPhoto = (uri: string) => {
    const newPhoto: Photo = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uri,
      timestamp: new Date(),
      isAnalyzing: false,
    };
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const analyzePhoto = async (photoId: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, isAnalyzing: true } : photo
    ));

    try {
      const { analyzeImage, analyzeImageMock } = await import('../services/realAiService');
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return;

      // Try real API first, fallback to mock if it fails
      let result;
      try {
        result = await analyzeImage(photo.uri);
      } catch (error) {
        console.log('Real API failed, using mock:', error);
        result = await analyzeImageMock(photo.uri);
      }
      
      setPhotos(prev => prev.map(p => 
        p.id === photoId 
          ? { 
              ...p, 
              isAnalyzing: false,
              aiAnalysis: {
                ...result,
                analyzedAt: new Date(),
              }
            } 
          : p
      ));
    } catch (error) {
      console.error('AI analysis failed:', error);
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
      
      setPhotos(prev => prev.map(p => 
        p.id === photoId 
          ? { 
              ...p, 
              isEstimatingPrice: false,
              priceEstimate
            } 
          : p
      ));
    } catch (error) {
      console.error('Price estimation failed:', error);
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId ? { ...photo, isEstimatingPrice: false } : photo
      ));
    }
  };

  return (
    <PhotoContext.Provider value={{ photos, addPhoto, removePhoto, analyzePhoto, estimatePrice }}>
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

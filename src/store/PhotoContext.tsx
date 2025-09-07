import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DetectedItem } from '../services/aiService';

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
  isAnalyzing?: boolean;
}

interface PhotoContextType {
  photos: Photo[];
  addPhoto: (uri: string) => void;
  removePhoto: (id: string) => void;
  analyzePhoto: (photoId: string) => Promise<void>;
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
      const { analyzeImage } = await import('../services/aiService');
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return;

      const result = await analyzeImage(photo.uri);
      
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

  return (
    <PhotoContext.Provider value={{ photos, addPhoto, removePhoto, analyzePhoto }}>
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

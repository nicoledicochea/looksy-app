import AsyncStorage from '@react-native-async-storage/async-storage';
import { DetectedItem } from './aiService';
import { PriceEstimate } from './ebayService';
import { SummarizedResult } from './aiSummarizationService';

// Storage keys
const STORAGE_KEYS = {
  PHOTOS: 'looksy_photos',
  SETTINGS: 'looksy_settings',
  APP_VERSION: 'looksy_app_version',
} as const;

// Current app version for data migration
const CURRENT_APP_VERSION = '1.1.0';

export interface Photo {
  id: string;
  uri: string;
  timestamp: Date;
  aiAnalysis?: {
    items: DetectedItem[];
    processingTime: number;
    success: boolean;
    analyzedAt: Date;
    reasoning?: string;
  };
  // Separate API results for multi-API ensemble analysis
  googleVisionResults?: {
    items: DetectedItem[];
    processingTime: number;
    success: boolean;
    analyzedAt: Date;
  };
  amazonRekognitionResults?: {
    items: DetectedItem[];
    processingTime: number;
    success: boolean;
    analyzedAt: Date;
  };
  // AI summarized result for single meaningful description
  summarizedResult?: SummarizedResult;
  priceEstimate?: PriceEstimate;
  isAnalyzing?: boolean;
  isEstimatingPrice?: boolean;
  // Interactive item selection properties
  selectedItemIds?: string[];  // Array of selected item IDs for interactive selection
  boundingBoxes?: DetectedItem[]; // Visual overlay data for interactive photo viewer
}

export interface AppSettings {
  defaultCategory: string;
  autoAnalyze: boolean;
  priceEstimationEnabled: boolean;
  lastSyncDate?: Date;
  usageLimits?: {
    googleVision: number;
    amazonRekognition: number;
    openai: number;
  };
}

export interface StorageData {
  photos: Photo[];
  settings: AppSettings;
  version: string;
  lastSaved: Date;
}

class StorageService {
  private static instance: StorageService;
  private isInitialized = false;
  private operationQueue: Promise<any> = Promise.resolve();

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Initialize storage service and handle data migration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if we need to migrate data
      const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
      
      if (!storedVersion) {
        // First time setup
        await this.setupInitialData();
      } else if (storedVersion !== CURRENT_APP_VERSION) {
        // Migrate data if version changed
        await this.migrateData(storedVersion, CURRENT_APP_VERSION);
      }

      this.isInitialized = true;
      console.log('StorageService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize StorageService:', error);
      throw error;
    }
  }

  /**
   * Setup initial data structure
   */
  private async setupInitialData(): Promise<void> {
    const initialData: StorageData = {
      photos: [],
      settings: {
        defaultCategory: 'general',
        autoAnalyze: true,
        priceEstimationEnabled: true,
        usageLimits: {
          googleVision: 1000,
          amazonRekognition: 1000,
          openai: 1000,
        },
      },
      version: CURRENT_APP_VERSION,
      lastSaved: new Date(),
    };

    await this.saveAllData(initialData);
  }

  /**
   * Migrate data between versions
   */
  private async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
    
    try {
      const existingData = await this.loadAllData();
      
      // Migration from 1.0.0 to 1.1.0
      if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
        await this.migrateToV1_1_0(existingData);
      }
      
      // Update version and save
      existingData.version = toVersion;
      existingData.lastSaved = new Date();
      
      await this.saveAllData(existingData);
      console.log('Data migration completed');
    } catch (error) {
      console.error('Data migration failed:', error);
      // If migration fails, reset to initial state
      await this.setupInitialData();
    }
  }

  /**
   * Migration logic for version 1.1.0
   */
  private async migrateToV1_1_0(data: StorageData): Promise<void> {
    console.log('Applying migration to version 1.1.0');
    
    // Add usageLimits to settings if not present
    if (!data.settings.usageLimits) {
      data.settings.usageLimits = {
        googleVision: 1000,
        amazonRekognition: 1000,
        openai: 1000,
      };
      console.log('Added usageLimits to settings');
    }
    
    // Photos already have the new interface structure
    // No migration needed for photos as the new fields are optional
    console.log('Photo interface migration completed');
  }

  /**
   * Queue storage operations to prevent race conditions
   */
  private async queueOperation<T>(operation: () => Promise<T>): Promise<T> {
    this.operationQueue = this.operationQueue.then(async () => {
      try {
        return await operation();
      } catch (error) {
        // Don't let one failed operation break the queue
        console.error('Storage operation failed:', error);
        throw error;
      }
    });
    return this.operationQueue;
  }

  /**
   * Save all app data to storage (internal method without queuing)
   */
  private async saveAllDataInternal(data: StorageData): Promise<void> {
    try {
      const serializedData = JSON.stringify(data, this.dateReplacer);
      await AsyncStorage.setItem(STORAGE_KEYS.PHOTOS, serializedData);
      await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, data.version);
      console.log('All data saved successfully');
    } catch (error) {
      console.error('Failed to save all data:', error);
      throw error;
    }
  }

  /**
   * Save all app data to storage
   */
  async saveAllData(data: StorageData): Promise<void> {
    return this.queueOperation(async () => {
      return await this.saveAllDataInternal(data);
    });
  }

  /**
   * Load all app data from storage (internal method without queuing)
   */
  private async loadAllDataInternal(): Promise<StorageData> {
    try {
      const serializedData = await AsyncStorage.getItem(STORAGE_KEYS.PHOTOS);
      
      if (!serializedData) {
        // Return default data if nothing stored
        return {
          photos: [],
          settings: {
            defaultCategory: 'general',
            autoAnalyze: true,
            priceEstimationEnabled: true,
            usageLimits: {
              googleVision: 1000,
              amazonRekognition: 1000,
              openai: 1000,
            },
          },
          version: CURRENT_APP_VERSION,
          lastSaved: new Date(),
        };
      }

      const data = JSON.parse(serializedData, this.dateReviver);
      
      // Validate and clean up any corrupted data
      const cleanedData = this.validateAndCleanData(data);
      return cleanedData;
    } catch (error) {
      console.error('Failed to load all data:', error);
      // If loading fails completely, clear storage and return default
      try {
        await this.clearAllDataInternal();
      } catch (clearError) {
        console.error('Failed to clear corrupted data:', clearError);
      }
      
      return {
        photos: [],
        settings: {
          defaultCategory: 'general',
          autoAnalyze: true,
          priceEstimationEnabled: true,
          usageLimits: {
            googleVision: 1000,
            amazonRekognition: 1000,
            openai: 1000,
          },
        },
        version: CURRENT_APP_VERSION,
        lastSaved: new Date(),
      };
    }
  }

  /**
   * Load all app data from storage
   */
  async loadAllData(): Promise<StorageData> {
    return this.queueOperation(async () => {
      return await this.loadAllDataInternal();
    });
  }

  /**
   * Save photos array to storage
   */
  async savePhotos(photos: Photo[]): Promise<void> {
    return this.queueOperation(async () => {
      try {
        const data = await this.loadAllDataInternal();
        data.photos = photos;
        data.lastSaved = new Date();
        await this.saveAllDataInternal(data);
        console.log(`Saved ${photos.length} photos to storage`);
      } catch (error) {
        console.error('Failed to save photos:', error);
        throw error;
      }
    });
  }

  /**
   * Load photos from storage
   */
  async loadPhotos(): Promise<Photo[]> {
    try {
      const data = await this.loadAllData();
      return data.photos || [];
    } catch (error) {
      console.error('Failed to load photos:', error);
      return [];
    }
  }

  /**
   * Save app settings
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const data = await this.loadAllData();
      data.settings = settings;
      data.lastSaved = new Date();
      await this.saveAllData(data);
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Load app settings
   */
  async loadSettings(): Promise<AppSettings> {
    try {
      const data = await this.loadAllData();
      return data.settings || {
        defaultCategory: 'general',
        autoAnalyze: true,
        priceEstimationEnabled: true,
        usageLimits: {
          googleVision: 1000,
          amazonRekognition: 1000,
          openai: 1000,
        },
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {
        defaultCategory: 'general',
        autoAnalyze: true,
        priceEstimationEnabled: true,
      };
    }
  }

  /**
   * Add a single photo to storage
   */
  async addPhoto(photo: Photo): Promise<void> {
    return this.queueOperation(async () => {
      try {
        const data = await this.loadAllDataInternal();
        data.photos.unshift(photo); // Add to beginning of array
        data.lastSaved = new Date();
        await this.saveAllDataInternal(data);
        console.log(`Added photo ${photo.id} to storage`);
      } catch (error) {
        console.error('Failed to add photo:', error);
        throw error;
      }
    });
  }

  /**
   * Update a photo in storage
   */
  async updatePhoto(photoId: string, updates: Partial<Photo>): Promise<void> {
    return this.queueOperation(async () => {
      try {
        const data = await this.loadAllDataInternal();
        const photoIndex = data.photos.findIndex(p => p.id === photoId);
        
        if (photoIndex === -1) {
          console.error(`Photo with id ${photoId} not found. Available photos:`, data.photos.map(p => p.id));
          throw new Error(`Photo with id ${photoId} not found`);
        }

        data.photos[photoIndex] = { ...data.photos[photoIndex], ...updates };
        data.lastSaved = new Date();
        await this.saveAllDataInternal(data);
        console.log(`Updated photo ${photoId} in storage`);
      } catch (error) {
        console.error('Failed to update photo:', error);
        throw error;
      }
    });
  }

  /**
   * Remove a photo from storage
   */
  async removePhoto(photoId: string): Promise<void> {
    return this.queueOperation(async () => {
      try {
        const data = await this.loadAllDataInternal();
        data.photos = data.photos.filter(p => p.id !== photoId);
        data.lastSaved = new Date();
        await this.saveAllDataInternal(data);
        console.log(`Removed photo ${photoId} from storage`);
      } catch (error) {
        console.error('Failed to remove photo:', error);
        throw error;
      }
    });
  }

  /**
   * Clear all stored data (internal method without queuing)
   */
  private async clearAllDataInternal(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PHOTOS,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.APP_VERSION,
      ]);
      console.log('All data cleared from storage');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }

  /**
   * Clear all stored data
   */
  async clearAllData(): Promise<void> {
    return this.queueOperation(async () => {
      return await this.clearAllDataInternal();
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalPhotos: number;
    totalSize: number;
    lastSaved: Date | null;
    version: string;
  }> {
    try {
      const data = await this.loadAllData();
      const serializedData = JSON.stringify(data);
      const totalSize = new Blob([serializedData]).size;
      
      return {
        totalPhotos: data.photos.length,
        totalSize,
        lastSaved: data.lastSaved,
        version: data.version,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalPhotos: 0,
        totalSize: 0,
        lastSaved: null,
        version: CURRENT_APP_VERSION,
      };
    }
  }

  /**
   * Validate and clean up data to prevent errors
   */
  private validateAndCleanData(data: any): StorageData {
    try {
      // Ensure we have the basic structure
      const cleanedData: StorageData = {
        photos: Array.isArray(data.photos) ? data.photos.filter((photo: any) => {
          // Filter out invalid photos
          const isValid = photo && 
                 typeof photo.id === 'string' && 
                 typeof photo.uri === 'string' &&
                 (photo.timestamp instanceof Date || 
                  (typeof photo.timestamp === 'string' && !isNaN(new Date(photo.timestamp).getTime())));
          
          return isValid;
        }) : [],
        settings: data.settings && typeof data.settings === 'object' ? {
          defaultCategory: typeof data.settings.defaultCategory === 'string' ? data.settings.defaultCategory : 'general',
          autoAnalyze: typeof data.settings.autoAnalyze === 'boolean' ? data.settings.autoAnalyze : true,
          priceEstimationEnabled: typeof data.settings.priceEstimationEnabled === 'boolean' ? data.settings.priceEstimationEnabled : true,
          lastSyncDate: data.settings.lastSyncDate instanceof Date && !isNaN(data.settings.lastSyncDate.getTime()) ? data.settings.lastSyncDate : undefined,
          usageLimits: data.settings.usageLimits && typeof data.settings.usageLimits === 'object' ? {
            googleVision: typeof data.settings.usageLimits.googleVision === 'number' ? data.settings.usageLimits.googleVision : 1000,
            amazonRekognition: typeof data.settings.usageLimits.amazonRekognition === 'number' ? data.settings.usageLimits.amazonRekognition : 1000,
            openai: typeof data.settings.usageLimits.openai === 'number' ? data.settings.usageLimits.openai : 1000,
          } : {
            googleVision: 1000,
            amazonRekognition: 1000,
            openai: 1000,
          },
        } : {
          defaultCategory: 'general',
          autoAnalyze: true,
          priceEstimationEnabled: true,
          usageLimits: {
            googleVision: 1000,
            amazonRekognition: 1000,
            openai: 1000,
          },
        },
        version: typeof data.version === 'string' ? data.version : CURRENT_APP_VERSION,
        lastSaved: data.lastSaved instanceof Date && !isNaN(data.lastSaved.getTime()) ? data.lastSaved : new Date(),
      };

      return cleanedData;
    } catch (error) {
      console.warn('Error validating data, using defaults:', error);
      return {
        photos: [],
        settings: {
          defaultCategory: 'general',
          autoAnalyze: true,
          priceEstimationEnabled: true,
          usageLimits: {
            googleVision: 1000,
            amazonRekognition: 1000,
            openai: 1000,
          },
        },
        version: CURRENT_APP_VERSION,
        lastSaved: new Date(),
      };
    }
  }

  /**
   * JSON replacer to handle Date objects
   */
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  /**
   * JSON reviver to restore Date objects
   */
  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      try {
        const date = new Date(value.value);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date value found: ${value.value}, using current date`);
          return new Date();
        }
        return date;
      } catch (error) {
        console.warn(`Error parsing date: ${value.value}, using current date`, error);
        return new Date();
      }
    }
    
    // Also handle direct date strings (for timestamp field)
    if (typeof value === 'string' && (key === 'timestamp' || key === 'analyzedAt' || key === 'lastSaved')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (error) {
        console.warn(`Error parsing date string: ${value}`, error);
      }
    }
    
    return value;
  }

  /**
   * Update selected items for a photo
   */
  async updateSelectedItems(photoId: string, selectedItemIds: string[]): Promise<void> {
    return this.updatePhoto(photoId, { selectedItemIds });
  }

  /**
   * Clear selected items for a photo
   */
  async clearSelectedItems(photoId: string): Promise<void> {
    return this.updatePhoto(photoId, { selectedItemIds: [] });
  }

  /**
   * Update bounding boxes for a photo
   */
  async updateBoundingBoxes(photoId: string, boundingBoxes: DetectedItem[]): Promise<void> {
    return this.updatePhoto(photoId, { boundingBoxes });
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();
export default storageService;

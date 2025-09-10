import { storageService } from '../storageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Storage Migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the storage service instance
    (storageService as any).isInitialized = false;
  });

  describe('AppSettings migration', () => {
    it('should add usageLimits to existing settings', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      // Mock existing data without usageLimits
      const existingData = {
        photos: [],
        settings: {
          defaultCategory: 'general',
          autoAnalyze: true,
          priceEstimationEnabled: true,
        },
        version: '1.0.0',
        lastSaved: new Date().toISOString(),
      };

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'looksy_app_version') {
          return Promise.resolve('1.0.0');
        }
        if (key === 'looksy_photos') {
          return Promise.resolve(JSON.stringify(existingData));
        }
        return Promise.resolve(null);
      });

      AsyncStorage.setItem.mockResolvedValue(undefined);

      // Initialize storage service (should trigger migration)
      await storageService.initialize();

      // Verify that usageLimits were added
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'looksy_photos',
        expect.stringContaining('"usageLimits"')
      );
    });

    it('should preserve existing usageLimits during migration', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      // Mock existing data with usageLimits
      const existingData = {
        photos: [],
        settings: {
          defaultCategory: 'general',
          autoAnalyze: true,
          priceEstimationEnabled: true,
          usageLimits: {
            googleVision: 500,
            amazonRekognition: 750,
            openai: 250,
          },
        },
        version: '1.0.0',
        lastSaved: new Date().toISOString(),
      };

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'looksy_app_version') {
          return Promise.resolve('1.0.0');
        }
        if (key === 'looksy_photos') {
          return Promise.resolve(JSON.stringify(existingData));
        }
        return Promise.resolve(null);
      });

      AsyncStorage.setItem.mockResolvedValue(undefined);

      // Initialize storage service
      await storageService.initialize();

      // Verify that existing usageLimits were preserved
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'looksy_photos',
        expect.stringContaining('"googleVision":500')
      );
    });
  });

  describe('Photo interface migration', () => {
    it('should handle photos without separate API results', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      // Mock existing photo data
      const existingData = {
        photos: [
          {
            id: 'test-photo-1',
            uri: 'file://test1.jpg',
            timestamp: new Date().toISOString(),
            aiAnalysis: {
              items: [{ id: 'item1', name: 'Test Item', confidence: 0.9, category: 'Test' }],
              processingTime: 1000,
              success: true,
              analyzedAt: new Date().toISOString(),
            },
          },
        ],
        settings: {
          defaultCategory: 'general',
          autoAnalyze: true,
          priceEstimationEnabled: true,
        },
        version: '1.0.0',
        lastSaved: new Date().toISOString(),
      };

      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'looksy_app_version') {
          return Promise.resolve('1.0.0');
        }
        if (key === 'looksy_photos') {
          return Promise.resolve(JSON.stringify(existingData));
        }
        return Promise.resolve(null);
      });

      AsyncStorage.setItem.mockResolvedValue(undefined);

      // Initialize storage service
      await storageService.initialize();

      // Verify that photos were preserved
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'looksy_photos',
        expect.stringContaining('"test-photo-1"')
      );
    });
  });

  describe('Version migration', () => {
    it('should update version to 1.1.0', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'looksy_app_version') {
          return Promise.resolve('1.0.0');
        }
        if (key === 'looksy_photos') {
          return Promise.resolve(JSON.stringify({
            photos: [],
            settings: { defaultCategory: 'general', autoAnalyze: true, priceEstimationEnabled: true },
            version: '1.0.0',
            lastSaved: new Date().toISOString(),
          }));
        }
        return Promise.resolve(null);
      });

      AsyncStorage.setItem.mockResolvedValue(undefined);

      // Initialize storage service
      await storageService.initialize();

      // Verify that version was updated
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'looksy_app_version',
        '1.1.0'
      );
    });
  });
});

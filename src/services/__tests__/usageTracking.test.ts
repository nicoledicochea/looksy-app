import { checkUsageLimit, incrementUsage, getUsageStats } from '../usageTracking';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Usage Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUsageLimit', () => {
    it('should return true when under limit', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue('50'); // Current usage: 50

      const result = await checkUsageLimit('googleVision', 100);
      
      expect(result).toBe(true);
    });

    it('should return false when at limit', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue('100'); // Current usage: 100

      const result = await checkUsageLimit('googleVision', 100);
      
      expect(result).toBe(false);
    });

    it('should return true when no usage recorded', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue(null); // No usage recorded

      const result = await checkUsageLimit('googleVision', 100);
      
      expect(result).toBe(true);
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage count', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue('50');
      AsyncStorage.setItem.mockResolvedValue(undefined);

      await incrementUsage('googleVision');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('usage_googleVision', '51');
    });

    it('should start at 1 when no usage recorded', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue(undefined);

      await incrementUsage('googleVision');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('usage_googleVision', '1');
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockImplementation((key: string) => {
        const mockData: { [key: string]: string } = {
          'usage_googleVision': '75',
          'usage_amazonRekognition': '25',
          'usage_openai': '10'
        };
        return Promise.resolve(mockData[key] || '0');
      });

      const stats = await getUsageStats();

      expect(stats).toEqual({
        googleVision: 75,
        amazonRekognition: 25,
        openai: 10,
        total: 110
      });
    });

    it('should handle missing usage data', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue(null);

      const stats = await getUsageStats();

      expect(stats).toEqual({
        googleVision: 0,
        amazonRekognition: 0,
        openai: 0,
        total: 0
      });
    });
  });
});

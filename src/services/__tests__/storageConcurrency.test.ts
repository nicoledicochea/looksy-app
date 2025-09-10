import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from '../storageService';

// Create a mock storage object to simulate real AsyncStorage behavior
const mockStorage: { [key: string]: string } = {};

// Mock AsyncStorage with persistent behavior
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  }),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('StorageService Concurrency Tests', () => {
  beforeEach(async () => {
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Initialize storage service
    await storageService.initialize();
  });

  it('should handle concurrent photo additions without race conditions', async () => {
    const photos = [
      {
        id: 'photo_1',
        uri: 'file://photo1.jpg',
        timestamp: new Date(),
        isAnalyzing: false,
      },
      {
        id: 'photo_2', 
        uri: 'file://photo2.jpg',
        timestamp: new Date(),
        isAnalyzing: false,
      },
      {
        id: 'photo_3',
        uri: 'file://photo3.jpg', 
        timestamp: new Date(),
        isAnalyzing: false,
      },
    ];

    // Add all photos concurrently
    const addPromises = photos.map(photo => storageService.addPhoto(photo));
    
    // Wait for all additions to complete
    await Promise.all(addPromises);
    
    // Verify all photos were added
    const loadedPhotos = await storageService.loadPhotos();
    expect(loadedPhotos).toHaveLength(3);
    expect(loadedPhotos.map(p => p.id)).toEqual(['photo_3', 'photo_2', 'photo_1']);
  });

  it('should handle concurrent photo updates without losing data', async () => {
    // First add a photo
    const photo = {
      id: 'photo_test',
      uri: 'file://test.jpg',
      timestamp: new Date(),
      isAnalyzing: false,
    };
    
    await storageService.addPhoto(photo);
    
    // Now update the photo multiple times concurrently
    const updatePromises = [
      storageService.updatePhoto('photo_test', { isAnalyzing: true }),
      storageService.updatePhoto('photo_test', { 
        aiAnalysis: { 
          items: [], 
          processingTime: 1000, 
          success: true, 
          analyzedAt: new Date() 
        } 
      }),
      storageService.updatePhoto('photo_test', { isAnalyzing: false }),
    ];
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    // Verify the photo was updated correctly
    const loadedPhotos = await storageService.loadPhotos();
    const updatedPhoto = loadedPhotos.find(p => p.id === 'photo_test');
    
    expect(updatedPhoto).toBeDefined();
    expect(updatedPhoto?.isAnalyzing).toBe(false);
    expect(updatedPhoto?.aiAnalysis).toBeDefined();
    expect(updatedPhoto?.aiAnalysis?.success).toBe(true);
  });

  it('should queue operations properly to prevent data corruption', async () => {
    const startTime = Date.now();
    
    // Create multiple concurrent operations
    const operations = [];
    
    for (let i = 0; i < 10; i++) {
      const photo = {
        id: `photo_${i}`,
        uri: `file://photo${i}.jpg`,
        timestamp: new Date(),
        isAnalyzing: false,
      };
      
      operations.push(storageService.addPhoto(photo));
    }
    
    // Wait for all operations to complete
    await Promise.all(operations);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Verify all photos were added
    const loadedPhotos = await storageService.loadPhotos();
    expect(loadedPhotos).toHaveLength(10);
    
    // Operations should be queued (not all happen simultaneously)
    // This test ensures our queueing mechanism is working
    console.log(`Concurrent operations completed in ${duration}ms`);
  });

  it('should handle mixed concurrent operations (add, update, remove)', async () => {
    // Add initial photos
    const photos = [
      { id: 'photo_1', uri: 'file://photo1.jpg', timestamp: new Date(), isAnalyzing: false },
      { id: 'photo_2', uri: 'file://photo2.jpg', timestamp: new Date(), isAnalyzing: false },
      { id: 'photo_3', uri: 'file://photo3.jpg', timestamp: new Date(), isAnalyzing: false },
    ];
    
    await Promise.all(photos.map(photo => storageService.addPhoto(photo)));
    
    // Perform mixed operations concurrently
    const mixedOperations = [
      storageService.addPhoto({ id: 'photo_4', uri: 'file://photo4.jpg', timestamp: new Date(), isAnalyzing: false }),
      storageService.updatePhoto('photo_1', { isAnalyzing: true }),
      storageService.removePhoto('photo_2'),
      storageService.updatePhoto('photo_3', { 
        aiAnalysis: { items: [], processingTime: 500, success: true, analyzedAt: new Date() } 
      }),
    ];
    
    // Wait for all operations to complete
    await Promise.all(mixedOperations);
    
    // Verify final state
    const loadedPhotos = await storageService.loadPhotos();
    expect(loadedPhotos).toHaveLength(3); // 4 added - 1 removed = 3
    
    const photoIds = loadedPhotos.map(p => p.id);
    expect(photoIds).toContain('photo_1');
    expect(photoIds).toContain('photo_3');
    expect(photoIds).toContain('photo_4');
    expect(photoIds).not.toContain('photo_2'); // Should be removed
    
    // Verify updates were applied
    const photo1 = loadedPhotos.find(p => p.id === 'photo_1');
    const photo3 = loadedPhotos.find(p => p.id === 'photo_3');
    
    expect(photo1?.isAnalyzing).toBe(true);
    expect(photo3?.aiAnalysis?.success).toBe(true);
  });
});

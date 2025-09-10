import { analyzeWithAmazonRekognition } from '../amazonRekognitionService';

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  Rekognition: jest.fn().mockImplementation(() => ({
    detectLabels: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Labels: [
          {
            Name: 'Test Item',
            Confidence: 85.5,
            Categories: [{ Name: 'Test Category' }]
          }
        ]
      })
    })
  }))
}));

// Mock fetch to simulate different image sizes
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  onloadend: null as any,
  onerror: null as any,
  result: 'data:image/jpeg;base64,testbase64data',
  EMPTY: 0,
  LOADING: 1,
  DONE: 2
};

(global as any).FileReader = jest.fn().mockImplementation(() => mockFileReader);

describe('Amazon Rekognition Size Limit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID = 'test-key';
    process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.EXPO_PUBLIC_AWS_REGION = 'us-east-1';
  });

  it('should handle images within size limit successfully', async () => {
    // Mock a small image (< 4MB)
    const smallBlob = new Blob(['small image data'], { type: 'image/jpeg' });
    Object.defineProperty(smallBlob, 'size', { value: 2 * 1024 * 1024 }); // 2MB
    
    mockFetch.mockResolvedValueOnce({
      blob: () => Promise.resolve(smallBlob)
    });

    // Mock FileReader success
    setTimeout(() => {
      if (mockFileReader.onloadend) {
        mockFileReader.onloadend();
      }
    }, 0);

    const result = await analyzeWithAmazonRekognition('file://test-small-image.jpg');
    
    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Test Item');
  });

  it('should gracefully handle oversized images', async () => {
    // Mock a large image (> 4MB)
    const largeBlob = new Blob(['large image data'], { type: 'image/jpeg' });
    Object.defineProperty(largeBlob, 'size', { value: 6 * 1024 * 1024 }); // 6MB
    
    mockFetch.mockResolvedValueOnce({
      blob: () => Promise.resolve(largeBlob)
    });

    const result = await analyzeWithAmazonRekognition('file://test-large-image.jpg');
    
    expect(result.success).toBe(false);
    expect(result.items).toHaveLength(0);
    expect(result.error).toContain('Image too large for Amazon Rekognition');
    expect(result.error).toContain('Google Vision will still analyze');
  });

  it('should handle AWS validation errors gracefully', async () => {
    // Mock a medium-sized image that passes our check but fails AWS validation
    const mediumBlob = new Blob(['medium image data'], { type: 'image/jpeg' });
    Object.defineProperty(mediumBlob, 'size', { value: 3 * 1024 * 1024 }); // 3MB
    
    mockFetch.mockResolvedValueOnce({
      blob: () => Promise.resolve(mediumBlob)
    });

    // Mock FileReader success
    setTimeout(() => {
      if (mockFileReader.onloadend) {
        mockFileReader.onloadend();
      }
    }, 0);

    // Mock AWS SDK to throw validation error
    const mockRekognition = require('aws-sdk').Rekognition;
    const mockInstance = mockRekognition.mock.results[0].value;
    mockInstance.detectLabels.mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('Value at \'image.bytes\' failed to satisfy constraint: Member must have length less than or equal to 5242880'))
    });

    const result = await analyzeWithAmazonRekognition('file://test-medium-image.jpg');
    
    expect(result.success).toBe(false);
    expect(result.items).toHaveLength(0);
    expect(result.error).toContain('Image too large for Amazon Rekognition');
    expect(result.error).toContain('Google Vision will still analyze');
  });

  it('should handle other AWS errors normally', async () => {
    // Mock a small image
    const smallBlob = new Blob(['small image data'], { type: 'image/jpeg' });
    Object.defineProperty(smallBlob, 'size', { value: 2 * 1024 * 1024 }); // 2MB
    
    mockFetch.mockResolvedValueOnce({
      blob: () => Promise.resolve(smallBlob)
    });

    // Mock FileReader success
    setTimeout(() => {
      if (mockFileReader.onloadend) {
        mockFileReader.onloadend();
      }
    }, 0);

    // Mock AWS SDK to throw non-size-related error
    const mockRekognition = require('aws-sdk').Rekognition;
    const mockInstance = mockRekognition.mock.results[0].value;
    mockInstance.detectLabels.mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('Invalid credentials'))
    });

    const result = await analyzeWithAmazonRekognition('file://test-image.jpg');
    
    expect(result.success).toBe(false);
    expect(result.items).toHaveLength(0);
    expect(result.error).toBe('Invalid credentials');
  });
});

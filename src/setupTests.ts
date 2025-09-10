// Jest setup file for testing
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock fetch
global.fetch = jest.fn();

// Mock FileReader
(global as any).FileReader = class FileReader {
  result: string | null = null;
  onloadend: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;

  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,test-base64-data';
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
};

// Mock Buffer
global.Buffer = require('buffer').Buffer;
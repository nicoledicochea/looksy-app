// Google Cloud Vision API Configuration
// For production, these should be environment variables

export const GOOGLE_CLOUD_CONFIG = {
  // You'll need to set up a Google Cloud project and enable the Vision API
  // Then create a service account and download the JSON key file
  projectId: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_ID || 'your-project-id',
  keyFilename: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_KEY_FILE || './path/to/service-account-key.json',
  
  // For Expo/React Native, you might need to use API key instead of service account
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY || 'your-api-key',
  
  // Vision API endpoints
  visionApiUrl: 'https://vision.googleapis.com/v1/images:annotate',
};

// Instructions for setup:
// 1. Go to Google Cloud Console (console.cloud.google.com)
// 2. Create a new project or select existing one
// 3. Enable the Cloud Vision API
// 4. Create credentials (API key or Service Account)
// 5. For React Native/Expo, API key is usually easier
// 6. Add the API key to your .env file as EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY

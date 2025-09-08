import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { PhotoProvider, usePhotos } from './src/store/PhotoContext';
import ErrorBoundary from './src/components/Common/ErrorBoundary';
import LoadingScreen from './src/components/Common/LoadingScreen';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function AppContent() {
  const { isLoading, isInitialized } = usePhotos();

  // Show loading screen while initializing storage
  if (!isInitialized || isLoading) {
    return <LoadingScreen message="Initializing Looksy..." />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#e0e0e0',
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            tabBarIcon: () => <Text>🏠</Text>,
            headerTitle: 'Looksy',
          }}
        />
        <Tab.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{
            tabBarIcon: () => <Text>📸</Text>,
            headerTitle: 'Camera',
          }}
        />
        <Tab.Screen 
          name="Gallery" 
          component={GalleryScreen}
          options={{
            tabBarIcon: () => <Text>🖼️</Text>,
            headerTitle: 'Gallery',
          }}
        />
        <Tab.Screen 
          name="Catalog" 
          component={CatalogScreen}
          options={{
            tabBarIcon: () => <Text>📋</Text>,
            headerTitle: 'My Items',
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            tabBarIcon: () => <Text>⚙️</Text>,
            headerTitle: 'Settings',
          }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PhotoProvider>
        <AppContent />
      </PhotoProvider>
    </ErrorBoundary>
  );
}

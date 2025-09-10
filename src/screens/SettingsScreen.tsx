import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePhotos } from '../store/PhotoContext';
import { storageService } from '../services/storageService';
import { getUsageStats, UsageStats } from '../services/usageTracking';

interface StorageStats {
  totalPhotos: number;
  totalSize: number;
  lastSaved: Date | null;
  version: string;
}

export default function SettingsScreen() {
  const { clearAllPhotos, photos } = usePhotos();
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageStats();
    loadUsageStats();
  }, []);

  // Refresh stats when photos change
  useEffect(() => {
    if (storageStats && photos.length !== storageStats.totalPhotos) {
      refreshStatsFromPhotos();
    }
  }, [photos.length]);

  // Refresh stats when screen comes into focus (but only if needed)
  useFocusEffect(
    React.useCallback(() => {
      if (storageStats && photos.length !== storageStats.totalPhotos) {
        refreshStatsFromPhotos();
      }
    }, [photos.length, storageStats])
  );

  const refreshStatsFromPhotos = async () => {
    try {
      // Only refresh if we don't have stats or if photo count has changed
      if (!storageStats || photos.length !== storageStats.totalPhotos) {
        const stats = await storageService.getStorageStats();
        setStorageStats(stats);
      }
    } catch (error) {
      console.error('Failed to refresh storage stats:', error);
    }
  };

  const loadStorageStats = async () => {
    try {
      setIsLoading(true);
      const stats = await storageService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
      // Set default stats if loading fails
      setStorageStats({
        totalPhotos: 0,
        totalSize: 0,
        lastSaved: null,
        version: '1.0.0',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
      setUsageStats({
        googleVision: 0,
        amazonRekognition: 0,
        openai: 0,
        total: 0,
      });
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all photos and analysis data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllPhotos();
              await refreshStatsFromPhotos(); // Refresh stats immediately
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    
    try {
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>⚙️ Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Information</Text>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : storageStats ? (
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Photos:</Text>
                <Text style={styles.statValue}>{photos.length}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Storage Used:</Text>
                <Text style={styles.statValue}>{formatFileSize(storageStats.totalSize)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Last Saved:</Text>
                <Text style={styles.statValue}>{formatDate(storageStats.lastSaved)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>App Version:</Text>
                <Text style={styles.statValue}>{storageStats.version}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.errorText}>Failed to load storage information</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Usage</Text>
          {usageStats ? (
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Google Vision:</Text>
                <Text style={styles.statValue}>{usageStats.googleVision} / 1000</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Amazon Rekognition:</Text>
                <Text style={styles.statValue}>{usageStats.amazonRekognition} / 1000</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>OpenAI:</Text>
                <Text style={styles.statValue}>{usageStats.openai} / 1000</Text>
              </View>
              <View style={[styles.statRow, styles.totalRow]}>
                <Text style={styles.statLabel}>Total API Calls:</Text>
                <Text style={styles.statValue}>{usageStats.total}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.loadingText}>Loading usage statistics...</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearAllData}>
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          </TouchableOpacity>
          <Text style={styles.warningText}>
            This will permanently delete all photos, AI analysis, and price estimates.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Looksy</Text>
          <Text style={styles.aboutText}>
            Looksy helps you catalog and value secondhand items using AI-powered image analysis.
          </Text>
          <Text style={styles.aboutText}>
            Perfect for donation tracking, resale inventory, and tax write-offs.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statsContainer: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
});

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Photo } from '../../store/PhotoContext';
import { getCategoryEmoji } from '../../services/realAiService';

interface PhotoItemProps {
  photo: Photo;
  onDelete: (id: string) => void;
  onAnalyze: (id: string) => void;
  onEstimatePrice: (id: string) => void;
}

export default function PhotoItem({ photo, onDelete, onAnalyze, onEstimatePrice }: PhotoItemProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(photo.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.image} />
      
      {/* AI Analysis Results */}
      {photo.aiAnalysis && (
        <View style={styles.aiResults}>
          <Text style={styles.aiTitle}>🤖 Detected Items:</Text>
          {photo.aiAnalysis.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemEmoji}>{getCategoryEmoji(item.category)}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.confidence}>
                  Confidence: {Math.round(item.confidence * 100)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Price Estimation Results */}
      {photo.priceEstimate && (
        <View style={styles.priceResults}>
          <Text style={styles.priceTitle}>💰 Price Estimate:</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceRange}>
              ${photo.priceEstimate.estimatedPrice.min} - ${photo.priceEstimate.estimatedPrice.max}
            </Text>
            <Text style={styles.priceAverage}>
              Avg: ${photo.priceEstimate.estimatedPrice.average}
            </Text>
          </View>
          <Text style={styles.priceConfidence}>
            Confidence: {Math.round(photo.priceEstimate.confidence * 100)}% 
            ({photo.priceEstimate.dataPoints} data points)
          </Text>
          <Text style={styles.priceSource}>
            Source: {photo.priceEstimate.source === 'ebay_sales' ? 'eBay Sales History' : 
                    photo.priceEstimate.source === 'ebay_listings' ? 'eBay Current Listings' : 
                    'Mock Data'}
          </Text>
        </View>
      )}

      {/* Loading State */}
      {photo.isAnalyzing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing image...</Text>
        </View>
      )}

      {/* Price Estimation Loading State */}
      {photo.isEstimatingPrice && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#34C759" />
          <Text style={styles.loadingText}>Estimating price...</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.info}>
        <Text style={styles.timestamp}>{formatDate(photo.timestamp)}</Text>
        <View style={styles.buttonRow}>
          {!photo.isAnalyzing && (
            <TouchableOpacity 
              style={photo.aiAnalysis ? styles.reanalyzeButton : styles.analyzeButton} 
              onPress={() => onAnalyze(photo.id)}
            >
              <Text style={photo.aiAnalysis ? styles.reanalyzeText : styles.analyzeText}>
                {photo.aiAnalysis ? '🔄 Reanalyze' : '🤖 Analyze'}
              </Text>
            </TouchableOpacity>
          )}
          {photo.aiAnalysis && !photo.isEstimatingPrice && (
            <TouchableOpacity 
              style={styles.priceButton} 
              onPress={() => onEstimatePrice(photo.id)}
            >
              <Text style={styles.priceText}>
                {photo.priceEstimate ? '🔄 Re-estimate' : '💰 Estimate Price'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
          >
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  aiResults: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  confidence: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  info: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  analyzeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  reanalyzeButton: {
    backgroundColor: '#8E8E93',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  reanalyzeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  priceButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  priceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  priceResults: {
    padding: 12,
    backgroundColor: '#fff8e1',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceRange: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  priceAverage: {
    fontSize: 14,
    color: '#666',
  },
  priceConfidence: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 2,
  },
  priceSource: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    fontSize: 16,
  },
});

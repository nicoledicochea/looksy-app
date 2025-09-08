import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { usePhotos } from '../../store/PhotoContext';

interface GalleryPickerProps {
  onClose: () => void;
}

export default function GalleryPicker({ onClose }: GalleryPickerProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { addPhoto } = usePhotos();

  const checkPermission = async () => {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  const pickImages = async () => {
    // Check if we have permission
    const hasAccess = await checkPermission();
    
    if (!hasAccess) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Please grant access to your photo library to select images');
        return;
      }
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (uri: string) => {
    setSelectedImages(prev => prev.filter(img => img !== uri));
  };

  const uploadSelectedImages = () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images', 'Please select at least one image to upload');
      return;
    }

    selectedImages.forEach(uri => {
      addPhoto(uri);
    });

    // Reset the selected images after upload
    setSelectedImages([]);

    Alert.alert(
      'Images Added!', 
      `${selectedImages.length} image(s) added to your catalog`
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Images</Text>
        {selectedImages.length > 0 && (
          <TouchableOpacity onPress={pickImages} style={styles.addMoreButton}>
            <Text style={styles.addMoreText}>+</Text>
          </TouchableOpacity>
        )}
        {selectedImages.length === 0 && <View style={styles.headerSpacer} />}
      </View>

      {selectedImages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🖼️</Text>
          <Text style={styles.emptyTitle}>Select Images from Gallery</Text>
          <Text style={styles.emptySubtitle}>
            Choose multiple images from your photo library to add to your catalog
          </Text>
          <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
            <Text style={styles.pickButtonText}>📷 Choose Images</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.imageList}>
          {selectedImages.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.imageItem}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeImage(uri)}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {selectedImages.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.uploadButton} onPress={uploadSelectedImages}>
            <Text style={styles.uploadButtonText}>
              Upload {selectedImages.length} Image{selectedImages.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 40, // Same width as close button for balance
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  pickButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  pickButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imageList: {
    flex: 1,
    padding: 16,
  },
  imageItem: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addMoreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addMoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

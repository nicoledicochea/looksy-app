import React from 'react';
import { View, StyleSheet } from 'react-native';
import GalleryPicker from '../components/Common/GalleryPicker';

interface GalleryScreenProps {
  navigation: any;
}

export default function GalleryScreen({ navigation }: GalleryScreenProps) {
  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <GalleryPicker onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import CameraComponent from '../components/Camera/CameraComponent';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <CameraComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

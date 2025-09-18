import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Image, Dimensions, TouchableOpacity, Animated } from 'react-native';
import Svg, { Rect, Text } from 'react-native-svg';
import { DetectedItem } from '../services/aiService';

interface InteractivePhotoViewerProps {
  photoUri: string;
  detectedItems: DetectedItem[];
  selectedItemIds: string[];
  onItemSelect: (itemId: string) => void;
  onItemDeselect: (itemId: string) => void;
}

interface BoundingBoxOverlayProps {
  detectedItems: DetectedItem[];
  selectedItemIds: string[];
  onItemSelect: (itemId: string) => void;
  imageWidth: number;
  imageHeight: number;
}

const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  detectedItems,
  selectedItemIds,
  onItemSelect,
  imageWidth,
  imageHeight,
}) => {
  const animatedValues = useRef<{ [key: string]: Animated.Value }>({});

  // Initialize animated values for each item
  useEffect(() => {
    detectedItems.forEach(item => {
      if (!animatedValues.current[item.id]) {
        animatedValues.current[item.id] = new Animated.Value(0);
      }
    });
  }, [detectedItems]);

  // Animate selection changes
  useEffect(() => {
    detectedItems.forEach(item => {
      const isSelected = selectedItemIds.includes(item.id);
      const animatedValue = animatedValues.current[item.id];
      
      if (animatedValue) {
        Animated.timing(animatedValue, {
          toValue: isSelected ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [selectedItemIds, detectedItems]);
  const getCategoryColor = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      'Food & Drink': '#4CAF50',
      'Electronics': '#2196F3',
      'Clothing': '#FF9800',
      'Furniture': '#9C27B0',
      'Books': '#607D8B',
      'Sports': '#795548',
      'Beauty': '#E91E63',
      'Home & Garden': '#8BC34A',
      'Toys': '#FFC107',
      'Health': '#F44336',
    };
    return colorMap[category] || '#757575';
  };

  const convertToScreenCoordinates = (boundingBox: DetectedItem['boundingBox']) => {
    return {
      x: boundingBox.x * imageWidth,
      y: boundingBox.y * imageHeight,
      width: boundingBox.width * imageWidth,
      height: boundingBox.height * imageHeight,
    };
  };

  return (
    <Svg
      width={imageWidth}
      height={imageHeight}
      style={{ position: 'absolute', top: 0, left: 0 }}
      testID="bounding-box-overlay"
    >
      {detectedItems.map((item) => {
        const isSelected = selectedItemIds.includes(item.id);
        const screenCoords = convertToScreenCoordinates(item.boundingBox);
        const color = getCategoryColor(item.category);
        const animatedValue = animatedValues.current[item.id];
        
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onItemSelect(item.id)}
            accessibilityLabel={`${item.name} - ${Math.round(item.confidence * 100)}% confidence`}
            testID={`bounding-box-${item.id}`}
          >
            <Rect
              x={screenCoords.x}
              y={screenCoords.y}
              width={screenCoords.width}
              height={screenCoords.height}
              fill={color}
              fillOpacity={animatedValue ? animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.3],
              }) : (isSelected ? 0.3 : 0.1)}
              stroke={color}
              strokeWidth={animatedValue ? animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [2, 3],
              }) : (isSelected ? 3 : 2)}
              strokeOpacity={1}
            />
            <Text
              x={screenCoords.x + 5}
              y={screenCoords.y + 15}
              fontSize="12"
              fill="white"
              fontWeight="bold"
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Svg>
  );
};

export const InteractivePhotoViewer: React.FC<InteractivePhotoViewerProps> = ({
  photoUri,
  detectedItems,
  selectedItemIds,
  onItemSelect,
  onItemDeselect,
}) => {
  const [imageDimensions, setImageDimensions] = useState({ width: 400, height: 300 });

  const handleImageLoad = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
  }, []);

  const handleItemPress = useCallback((itemId: string) => {
    if (selectedItemIds.includes(itemId)) {
      onItemDeselect(itemId);
    } else {
      onItemSelect(itemId);
    }
  }, [selectedItemIds, onItemSelect, onItemDeselect]);

  return (
    <View testID="interactive-photo-viewer" style={{ position: 'relative' }}>
      <Image
        source={{ uri: photoUri }}
        style={{
          width: imageDimensions.width,
          height: imageDimensions.height,
          resizeMode: 'contain',
        }}
        onLoad={handleImageLoad}
        testID="photo-image"
      />
      
      {detectedItems.length > 0 && (
        <BoundingBoxOverlay
          detectedItems={detectedItems}
          selectedItemIds={selectedItemIds}
          onItemSelect={handleItemPress}
          imageWidth={imageDimensions.width}
          imageHeight={imageDimensions.height}
        />
      )}
    </View>
  );
};

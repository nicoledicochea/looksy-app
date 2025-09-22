import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Image, Dimensions, TouchableOpacity, Animated, Text as RNText } from 'react-native';
import Svg, { Rect, Text } from 'react-native-svg';
import { DetectedItem } from '../services/realAiService';
import { EnhancedDetectionResult } from '../services/enhancedDetectionPipeline';

interface InteractivePhotoViewerProps {
  photoUri: string;
  detectedItems: DetectedItem[];
  selectedItemIds: string[];
  onItemSelect: (itemId: string) => void;
  onItemDeselect: (itemId: string) => void;
  enhancedDetectionResult?: EnhancedDetectionResult;
  showProcessingMetrics?: boolean;
}

interface BoundingBoxOverlayProps {
  detectedItems: DetectedItem[];
  selectedItemIds: string[];
  onItemSelect: (itemId: string) => void;
  imageWidth: number;
  imageHeight: number;
  enhancedDetectionResult?: EnhancedDetectionResult;
}

const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  detectedItems,
  selectedItemIds,
  onItemSelect,
  imageWidth,
  imageHeight,
  enhancedDetectionResult,
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
      'Accessories': '#FF5722',
      'AI Analyzed': '#673AB7',
      'Other': '#757575',
    };
    return colorMap[category] || '#757575';
  };

  const getPrecisionColor = (precisionLevel: string): string => {
    const precisionMap: { [key: string]: string } = {
      'high': '#4CAF50',
      'medium': '#FF9800',
      'low': '#F44336',
    };
    return precisionMap[precisionLevel] || '#757575';
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
        const precisionColor = getPrecisionColor(item.precisionLevel);
        const animatedValue = animatedValues.current[item.id];
        
        // Enhanced accessibility label with more information
        const accessibilityLabel = enhancedDetectionResult 
          ? `${item.name} - ${Math.round(item.confidence * 100)}% confidence, ${item.precisionLevel} precision, ${item.source}`
          : `${item.name} - ${Math.round(item.confidence * 100)}% confidence`;
        
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onItemSelect(item.id)}
            accessibilityLabel={accessibilityLabel}
            testID={`bounding-box-${item.id}`}
          >
            <Rect
              x={screenCoords.x}
              y={screenCoords.y}
              width={screenCoords.width}
              height={screenCoords.height}
              fill={color}
              fillOpacity={animatedValue ? 0.3 : (isSelected ? 0.3 : 0.1)}
              stroke={precisionColor}
              strokeWidth={animatedValue ? 3 : (isSelected ? 3 : 2)}
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
            {enhancedDetectionResult && (
              <>
                <Text
                  x={screenCoords.x + 5}
                  y={screenCoords.y + 30}
                  fontSize="10"
                  fill="white"
                  opacity={0.8}
                >
                  {Math.round(item.confidence * 100)}%
                </Text>
                <Text
                  x={screenCoords.x + 5}
                  y={screenCoords.y + 45}
                  fontSize="9"
                  fill={precisionColor}
                  opacity={0.9}
                >
                  {item.precisionLevel}
                </Text>
              </>
            )}
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
  enhancedDetectionResult,
  showProcessingMetrics = false,
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
          enhancedDetectionResult={enhancedDetectionResult}
        />
      )}
      
      {showProcessingMetrics && enhancedDetectionResult && (
        <View 
          style={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            padding: 8, 
            borderRadius: 4 
          }}
          testID="processing-metrics"
        >
          <RNText style={{ color: 'white', fontSize: 10 }}>
            Processing: {enhancedDetectionResult.processingMetrics.totalProcessingTime}ms
          </RNText>
          <RNText style={{ color: 'white', fontSize: 10 }}>
            Items: {enhancedDetectionResult.items.length}/{enhancedDetectionResult.processingMetrics.filteringStats.total}
          </RNText>
          <RNText style={{ color: 'white', fontSize: 10 }}>
            Relationships: {enhancedDetectionResult.processingMetrics.spatialStats.relationshipsFound}
          </RNText>
          <RNText style={{ color: 'white', fontSize: 10 }}>
            Conflicts: {enhancedDetectionResult.processingMetrics.conflictStats.totalConflicts}
          </RNText>
          {enhancedDetectionResult.processingMetrics.dynamicThresholdStats && (
            <>
              <RNText style={{ color: 'white', fontSize: 10 }}>
                Adaptive: {enhancedDetectionResult.processingMetrics.dynamicThresholdStats.adaptiveThresholdCalculated ? 'Yes' : 'No'}
              </RNText>
              <RNText style={{ color: 'white', fontSize: 10 }}>
                Thresholds: {enhancedDetectionResult.processingMetrics.dynamicThresholdStats.thresholdsUpdated ? 'Updated' : 'Stable'}
              </RNText>
            </>
          )}
        </View>
      )}
      
      {showProcessingMetrics && enhancedDetectionResult && (
        <View 
          style={{ 
            position: 'absolute', 
            bottom: 10, 
            right: 10, 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            padding: 8, 
            borderRadius: 4 
          }}
          testID="quality-metrics"
        >
          <RNText style={{ color: 'white', fontSize: 10 }}>
            Quality Metrics
          </RNText>
          <RNText style={{ color: 'white', fontSize: 10 }}>
            Precision: {enhancedDetectionResult.processingMetrics.filteringStats.precision.toFixed(2)}
          </RNText>
          <RNText style={{ color: 'white', fontSize: 10 }}>
            Recall: {enhancedDetectionResult.processingMetrics.filteringStats.recall.toFixed(2)}
          </RNText>
          <RNText style={{ color: 'white', fontSize: 10 }}>
            F1-Score: {enhancedDetectionResult.processingMetrics.filteringStats.f1Score.toFixed(2)}
          </RNText>
          <RNText style={{ color: 'white', fontSize: 10 }}>
            Avg Confidence: {(enhancedDetectionResult.items.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, enhancedDetectionResult.items.length)).toFixed(2)}
          </RNText>
        </View>
      )}
    </View>
  );
};

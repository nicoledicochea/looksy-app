# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-09-amazon-rekognition-integration/spec.md

## Amazon Rekognition API Integration

### DetectLabels Endpoint

**Purpose:** Analyze images for object detection and labeling
**Method:** POST
**Endpoint:** `https://rekognition.{region}.amazonaws.com/`

#### Request Format
```typescript
interface RekognitionRequest {
  Image: {
    Bytes: Buffer; // Base64 encoded image
  };
  MaxLabels: number; // Default: 10
  MinConfidence: number; // Default: 60
}
```

#### Response Format
```typescript
interface RekognitionResponse {
  Labels: Array<{
    Name: string;
    Confidence: number;
    Instances?: Array<{
      BoundingBox: {
        Width: number;
        Height: number;
        Left: number;
        Top: number;
      };
    }>;
    Parents?: Array<{
      Name: string;
    }>;
  }>;
}
```

### Service Implementation

#### analyzeWithAmazonRekognition Function
```typescript
export async function analyzeWithAmazonRekognition(imageUri: string): Promise<AIAnalysisResult> {
  // 1. Convert image URI to base64
  // 2. Create Rekognition client
  // 3. Call DetectLabels API
  // 4. Transform response to DetectedItem format
  // 5. Return AIAnalysisResult
}
```

#### Response Transformation
```typescript
function transformRekognitionResponse(labels: RekognitionLabel[]): DetectedItem[] {
  return labels.map(label => ({
    id: `amazon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: label.Name,
    confidence: label.Confidence / 100, // Convert to 0-1 scale
    category: categorizeItem(label.Name),
    description: `${label.Name} detected with ${Math.round(label.Confidence)}% confidence`
  }));
}
```

## Error Handling

### Possible Errors
- **InvalidImageFormat**: Image cannot be processed
- **ImageTooLarge**: Image exceeds size limits
- **AccessDenied**: AWS credentials invalid
- **ThrottlingException**: Rate limit exceeded
- **ServiceUnavailable**: Amazon Rekognition service down

### Error Response Format
```typescript
interface RekognitionError {
  success: false;
  error: string;
  processingTime: number;
  fallbackUsed: boolean;
}
```

## Usage Tracking API

### Check Usage Limit
```typescript
async function checkUsageLimit(): Promise<boolean> {
  const settings = await storageService.loadSettings();
  return settings.amazonRekognitionUsage < settings.amazonRekognitionLimit;
}
```

### Increment Usage
```typescript
async function incrementUsage(): Promise<void> {
  const settings = await storageService.loadSettings();
  settings.amazonRekognitionUsage += 1;
  await storageService.saveSettings(settings);
}
```

## Integration Points

### PhotoContext Integration
- Modify `analyzePhoto` function to call both APIs
- Handle parallel execution with Promise.allSettled
- Implement fallback logic for individual API failures
- Update photo object with both result sets

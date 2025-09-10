# Data Migration Specification

This is the data migration specification for the spec detailed in @.agent-os/specs/2025-09-09-amazon-rekognition-integration/spec.md

## Storage Changes

### Photo Object Updates

**Current Photo Interface:**
```typescript
interface Photo {
  id: string;
  uri: string;
  timestamp: Date;
  aiAnalysis?: {
    items: DetectedItem[];
    processingTime: number;
    success: boolean;
    analyzedAt: Date;
  };
  priceEstimate?: PriceEstimate;
  isAnalyzing?: boolean;
  isEstimatingPrice?: boolean;
}
```

**Updated Photo Interface:**
```typescript
interface Photo {
  id: string;
  uri: string;
  timestamp: Date;
  aiAnalysis?: {
    items: DetectedItem[];
    processingTime: number;
    success: boolean;
    analyzedAt: Date;
    googleVisionResults?: DetectedItem[];
    amazonRekognitionResults?: DetectedItem[];
  };
  priceEstimate?: PriceEstimate;
  isAnalyzing?: boolean;
  isEstimatingPrice?: boolean;
}
```

### App Settings Updates

**Current AppSettings Interface:**
```typescript
interface AppSettings {
  defaultCategory: string;
  autoAnalyze: boolean;
  priceEstimationEnabled: boolean;
  lastSyncDate?: Date;
}
```

**Updated AppSettings Interface:**
```typescript
interface AppSettings {
  defaultCategory: string;
  autoAnalyze: boolean;
  priceEstimationEnabled: boolean;
  lastSyncDate?: Date;
  amazonRekognitionUsage: number;
  amazonRekognitionLimit: number;
}
```

## Migration Strategy

### Version Management
- Update `CURRENT_APP_VERSION` from '1.0.0' to '1.1.0'
- Implement migration logic in `storageService.ts` migrateData function

### Migration Logic
```typescript
private async migrateData(fromVersion: string, toVersion: string): Promise<void> {
  if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
    const existingData = await this.loadAllData();
    
    // Add Amazon Rekognition usage tracking
    if (!existingData.settings.amazonRekognitionUsage) {
      existingData.settings.amazonRekognitionUsage = 0;
      existingData.settings.amazonRekognitionLimit = 1000;
    }
    
    // Update existing photos to include new fields
    existingData.photos = existingData.photos.map(photo => ({
      ...photo,
      aiAnalysis: photo.aiAnalysis ? {
        ...photo.aiAnalysis,
        googleVisionResults: photo.aiAnalysis.items, // Move existing results
        amazonRekognitionResults: undefined
      } : undefined
    }));
    
    existingData.version = toVersion;
    existingData.lastSaved = new Date();
    await this.saveAllData(existingData);
  }
}
```

## Rationale

- **Backward Compatibility**: Existing photos continue to work with Google Vision results preserved
- **Forward Compatibility**: New structure supports both API results separately
- **Usage Tracking**: Simple counter approach for cost management
- **Migration Safety**: Graceful handling of missing fields with sensible defaults

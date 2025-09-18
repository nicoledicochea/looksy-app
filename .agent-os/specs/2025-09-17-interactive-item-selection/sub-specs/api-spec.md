# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-17-interactive-item-selection/spec.md

## Endpoints

### Google Cloud Vision API Updates

**Purpose:** Enable OBJECT_LOCALIZATION feature to extract bounding box coordinates for detected items
**Parameters:** 
- `features`: Add `OBJECT_LOCALIZATION` to existing feature list
- `image`: Base64 encoded image data (existing)
**Response:** Enhanced response format including:
```json
{
  "localizedObjectAnnotations": [
    {
      "name": "item_name",
      "score": 0.95,
      "boundingPoly": {
        "normalizedVertices": [
          {"x": 0.1, "y": 0.2},
          {"x": 0.8, "y": 0.2},
          {"x": 0.8, "y": 0.9},
          {"x": 0.1, "y": 0.9}
        ]
      }
    }
  ]
}
```
**Errors:** 
- `INVALID_ARGUMENT` if OBJECT_LOCALIZATION feature not enabled
- `PERMISSION_DENIED` if API key lacks required permissions

### Amazon Rekognition API Updates

**Purpose:** Extract bounding box coordinates from DetectLabels response for fashion and brand detection
**Parameters:** 
- `Image`: Base64 encoded image data (existing)
- `MaxLabels`: Maximum number of labels to return (existing)
**Response:** Enhanced response format including:
```json
{
  "Labels": [
    {
      "Name": "item_name",
      "Confidence": 95.0,
      "Instances": [
        {
          "BoundingBox": {
            "Width": 0.7,
            "Height": 0.7,
            "Left": 0.1,
            "Top": 0.2
          },
          "Confidence": 95.0
        }
      ]
    }
  ]
}
```
**Errors:**
- `InvalidParameterException` if image format not supported
- `ImageTooLargeException` if image exceeds 5MB limit

## Controllers

### Enhanced AI Service Controller

**Action:** `analyzeImageWithBoundingBoxes`
**Business Logic:** 
- Call both Google Cloud Vision and Amazon Rekognition APIs
- Extract bounding box coordinates from both responses
- Normalize coordinates to 0-1 range for consistent display
- Combine results with existing detection logic
- Handle cases where APIs don't provide bounding box data
**Error Handling:** 
- Fallback to existing detection if bounding box extraction fails
- Log warnings for missing coordinate data
- Continue processing with available data

### Selection State Controller

**Action:** `manageItemSelection`
**Business Logic:**
- Track selected item IDs across photo and list views
- Synchronize selection state between components
- Persist selection state in AsyncStorage
- Handle selection clearing and multi-item scenarios
**Error Handling:**
- Validate item IDs exist before selection
- Handle concurrent selection updates
- Provide fallback for corrupted selection state

## Purpose

The API updates enable the extraction of precise bounding box coordinates from both Google Cloud Vision and Amazon Rekognition services, allowing the app to display interactive overlays that users can tap to select individual detected items. This creates a seamless visual connection between the AI analysis results and the physical locations of objects in the photo.

# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-09-amazon-rekognition-integration/spec.md

## Technical Requirements

- **AWS SDK Integration**: Use existing aws-sdk dependency (v2.1692.0) to create Amazon Rekognition client
- **Service Architecture**: Create new service file `src/services/amazonRekognitionService.ts` following existing service patterns
- **Authentication**: Use existing AWS credentials from environment variables (EXPO_PUBLIC_AWS_ACCESS_KEY_ID, EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY, EXPO_PUBLIC_AWS_REGION)
- **Image Processing**: Convert image URI to base64 format compatible with Amazon Rekognition API
- **Response Mapping**: Transform Amazon Rekognition response to match existing `DetectedItem` interface
- **Parallel Execution**: Modify `PhotoContext.tsx` analyzePhoto function to call both APIs simultaneously using Promise.allSettled()
- **Error Handling**: Implement try-catch blocks with fallback to Google Vision only if Amazon Rekognition fails
- **Usage Tracking**: Add user usage counter to AsyncStorage with 1000 image limit enforcement
- **UI Feedback**: Display usage status in Settings screen and show appropriate messages when limits approached/reached

## External Dependencies

- **aws-sdk**: Already included in package.json (v2.1692.0)
- **Justification**: Required for Amazon Rekognition API integration, already installed

## API Integration Details

- **Endpoint**: Amazon Rekognition DetectLabels API
- **Parameters**: Image bytes, MaxLabels (10), MinConfidence (60%)
- **Response Processing**: Extract label names, confidence scores, and map to DetectedItem format
- **Cost**: $1.50 per 1,000 images analyzed
- **Rate Limits**: Respect AWS service limits and implement appropriate delays if needed

## Data Storage Changes

- **Usage Tracking**: Add `amazonRekognitionUsage` field to user settings in AsyncStorage
- **Analysis Results**: Store Amazon Rekognition results alongside Google Vision results in photo objects
- **Migration**: Update existing photos to include new fields without breaking existing functionality

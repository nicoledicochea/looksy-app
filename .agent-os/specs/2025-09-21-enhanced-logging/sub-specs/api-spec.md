# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-21-enhanced-logging/spec.md

## External Logging Service APIs

### Splunk HTTP Event Collector Integration

**Purpose:** Send structured logs to Splunk for centralized analysis and monitoring
**Endpoint:** `POST https://your-splunk-instance:8088/services/collector/event`
**Headers:** 
- `Authorization: Splunk <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "time": 1640995200,
  "host": "looksy-app",
  "source": "ai-analysis",
  "sourcetype": "json",
  "event": {
    "level": "INFO",
    "component": "enhancedDetectionPipeline",
    "analysisId": "uuid-123",
    "rawGoogleVision": { /* complete API response */ },
    "rawAmazonRekognition": { /* complete API response */ },
    "overlapAnalysis": { /* overlap calculations */ },
    "visibilityCalculations": { /* visibility data */ }
  }
}
```

### Datadog Logs API Integration

**Purpose:** Send logs to Datadog for real-time monitoring and alerting
**Endpoint:** `POST https://http-intake.logs.datadoghq.com/v1/input/<api-key>`
**Headers:**
- `Content-Type: application/json`
- `DD-API-KEY: <your-api-key>`

**Request Body:**
```json
{
  "ddsource": "looksy-app",
  "ddtags": "env:development,component:ai-analysis",
  "hostname": "mobile-device",
  "message": "Enhanced detection completed",
  "level": "info",
  "timestamp": "2025-01-25T10:30:00Z",
  "service": "looksy",
  "analysisData": {
    "analysisId": "uuid-123",
    "rawGoogleVision": { /* complete API response */ },
    "rawAmazonRekognition": { /* complete API response */ },
    "overlapAnalysis": { /* overlap calculations */ },
    "visibilityCalculations": { /* visibility data */ }
  }
}
```

### LogRocket Custom Events Integration

**Purpose:** Send detailed analysis data to LogRocket for session replay and debugging
**Method:** `LogRocket.captureMessage()` and `LogRocket.captureException()`

**Implementation:**
```javascript
// Custom event for successful analysis
LogRocket.captureMessage('AI Analysis Completed', {
  level: 'info',
  extra: {
    analysisId: 'uuid-123',
    rawGoogleVision: { /* complete API response */ },
    rawAmazonRekognition: { /* complete API response */ },
    overlapAnalysis: { /* overlap calculations */ },
    visibilityCalculations: { /* visibility data */ }
  }
});

// Custom event for analysis errors
LogRocket.captureException(error, {
  extra: {
    analysisId: 'uuid-123',
    errorContext: { /* error details */ }
  }
});
```

## Cursor Integration API

### Splunk MCP Integration (Primary Method)

**Purpose:** Enable Cursor to directly query and analyze Splunk logs using natural language
**Implementation:** Install Splunk MCP Server and configure Cursor MCP settings

**Splunk MCP Configuration:**
```json
{
  "mcpServers": {
    "splunk": {
      "command": "python",
      "args": ["splunk_mcp.py", "stdio"],
      "env": {
        "SPLUNK_HOST": "your_splunk_host",
        "SPLUNK_PORT": "8089",
        "SPLUNK_USERNAME": "your_username",
        "SPLUNK_PASSWORD": "your_password",
        "SPLUNK_SCHEME": "https",
        "VERIFY_SSL": "false"
      }
    }
  }
}
```

**Natural Language Queries in Cursor:**
- "Show me all color detection errors from the last 24 hours"
- "Find analysis sessions with low confidence scores"
- "Display overlap analysis results for photos with multiple items"
- "Show performance metrics for enhanced detection pipeline"

### File-based Log Access (Fallback Method)

**Purpose:** Enable Cursor to read and analyze log files for debugging when MCP is unavailable
**Implementation:** Export logs to structured JSON files in project directory

**File Structure:**
```
/logs/
  /analysis/
    - analysis-2025-01-25.json
    - analysis-2025-01-26.json
  /errors/
    - errors-2025-01-25.json
  /performance/
    - performance-2025-01-25.json
```

**Log File Format:**
```json
{
  "timestamp": "2025-01-25T10:30:00Z",
  "sessionId": "session-123",
  "logs": [
    {
      "level": "INFO",
      "component": "enhancedDetectionPipeline",
      "message": "Raw Google Vision data captured",
      "data": { /* raw API response */ }
    },
    {
      "level": "DEBUG",
      "component": "sizeBasedOverlapResolutionService",
      "message": "Overlap calculation completed",
      "data": { /* overlap analysis */ }
    },
    {
      "level": "INFO",
      "component": "realAiService",
      "message": "Google Vision API response captured",
      "data": { /* Google Vision API response */ }
    },
    {
      "level": "INFO",
      "component": "amazonRekognitionService",
      "message": "Amazon Rekognition API response captured",
      "data": { /* Amazon Rekognition API response */ }
    },
    {
      "level": "INFO",
      "component": "aiSummarizationService",
      "message": "AI summarization completed",
      "data": { /* summarization results */ }
    }
  ]
}
```

### HTTP API for Real-time Log Access

**Purpose:** Enable Cursor to fetch logs via HTTP API for real-time analysis
**Endpoint:** `GET /api/logs/analysis/{analysisId}`
**Response:** Complete log data for specific analysis session

**Endpoint:** `GET /api/logs/recent`
**Response:** Recent logs with pagination support

**Endpoint:** `POST /api/logs/search`
**Request Body:**
```json
{
  "query": "color detection",
  "level": "ERROR",
  "dateRange": {
    "start": "2025-01-25T00:00:00Z",
    "end": "2025-01-25T23:59:59Z"
  }
}
```

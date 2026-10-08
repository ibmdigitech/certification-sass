# Document Capture Implementation

Phase 5 - ID Capture + Crop + Image Processing

## Overview

This module implements a complete mobile document capture workflow for ID documents (licenses, passports, IDs) with advanced image processing capabilities. The system preserves both original and processed versions while ensuring readability and compression for offline persistence.

## Features

### 1. DocumentUploader Component
- **Drag & Drop**: File upload via drag-and-drop interface
- **File Selection**: Standard file picker with validation
- **File Size Limit**: Configurable maximum file size (default: 10MB)
- **File Type Validation**: Supports image formats (PNG, JPG)
- **Preview**: Instant preview of uploaded documents

### 2. DocumentCamera Component
- **Camera Access**: Native camera integration with user/environment facing toggle
- **Video Preview**: Real-time camera feed display
- **Capture**: Photo capture with quality settings (0.9)
- **Rotation Control**: Camera rotation toggle between front/back
- **Error Handling**: Graceful handling of camera permission issues

### 3. DocumentCropper Component
- **Crop**: Manual document selection with precise boundaries
- **Rotate**: Image rotation (90° increments)
- **Zoom**: Scale controls for detailed editing
- **Perspective Correction**: Optional perspective adjustment mode
- **Reset**: Undo all transformations
- **Canvas-Based**: Advanced image manipulation using HTML Canvas

### 4. DocumentEditor Component
- **Compression**: Image compression with configurable quality (0.5-1.0)
- **Rotation**: Additional rotation control (90° increments)
- **Preview**: Side-by-side comparison view
- **Quality Control**: Compression quality slider
- **File Operations**: Download, delete, retake options
- **Version Toggle**: Switch between original and processed images

### 5. DocumentPreview Component
- **Comparison View**: Side-by-side display of original and processed images
- **Rotation Control**: Rotate both versions independently
- **Fullscreen**: Expandable preview mode
- **Download**: Individual download for each version
- **Version Toggle**: Switch between showing original or processed

## Architecture

### Data Flow
1. **Upload/Camera** → Capture raw image data
2. **Crop** → Apply document boundaries and basic transformations
3. **Edit** → Compress, rotate, and optimize image
4. **Preview** → Review and finalize

### State Management
- **Original Version**: Preserved throughout the workflow
- **Processed Version**: Modified through various operations
- **Compression Ratio**: Tracked and stored
- **Transformations**: Rotation, scale, perspective corrections

### Offline Persistence
- **Local Storage**: Images saved locally
- **API Integration**: REST API for document upload and retrieval
- **File Management**: Organized upload directory structure
- **Metadata**: File size, compression ratios, timestamps

## Technical Specifications

### Image Processing Pipeline
1. **Capture**: High-quality image capture from camera or file upload
2. **Cropping**: Document boundary detection and selection
3. **Rotation**: Automatic and manual rotation support
4. **Perspective Correction**: Optional perspective adjustment
5. **Compression**: Configurable quality-based compression
6. **Validation**: Image readability and quality checks

### API Endpoints
- `POST /api/documents`: Upload and process documents
- `GET /api/documents?id=...`: Retrieve documents

### Component Dependencies
- **External Libraries**: 
  - `compress.js`: Image compression
  - `cropperjs`: Image cropping and manipulation
  - `lucide-react`: Icon components
  - `framer-motion`: Animations

### File Structure
```
src/
  components/
    documents/
      DocumentUploader.tsx          # File upload & drag-drop
      DocumentCamera.tsx            # Camera capture
      DocumentCropper.tsx           # Crop & rotate
      DocumentEditor.tsx            # Compression & editing
      DocumentPreview.tsx           # Preview & comparison
      index.ts                      # Component exports
      DocumentCapture.test.tsx      # Test suite
  app/
    IDCaptureApp.tsx               # Main application component
    id-capture/
      page.tsx                     # Route definition
    api/
      documents/
        route.ts                    # API handlers
  public/
    uploads/
      documents/                    # Document storage
```

## Usage Examples

### Basic Document Capture
```tsx
import { DocumentUploader } from '@/components/documents';

<DocumentUploader 
  onDocumentUpload={(file, preview) => {
    // Handle uploaded document
  }}
  accept="image/*"
  maxSize={10 * 1024 * 1024} // 10MB
/>
```

### Complete Workflow
```tsx
import IDCaptureApp from '@/app/IDCaptureApp';

<IDCaptureApp /> // Full capture workflow
```

## Exit Criteria

### User Experience
- ✅ Capture ID on phone/tablet with correct crop
- ✅ Readable image output
- ✅ Rotation support for different orientations
- ✅ Compression for file size reduction
- ✅ Offline persistence

### Technical Requirements
- ✅ Original and processed images kept separate
- ✅ All 5 components implemented
- ✅ Proper error handling
- ✅ Responsive design
- ✅ Accessibility support

## Testing

### Component Tests
- File upload validation
- Camera capture functionality
- Image cropping operations
- Rotation and zoom controls
- Compression quality settings
- Download and save operations

### Integration Tests
- Complete workflow testing
- API endpoint validation
- Offline storage verification
- Cross-device compatibility

## Notes

- **Mobile Optimized**: All components designed for mobile use
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Accessibility**: ARIA labels and keyboard navigation support
- **Performance**: Optimized image processing with Canvas API
- **Error Handling**: Comprehensive error states and recovery options

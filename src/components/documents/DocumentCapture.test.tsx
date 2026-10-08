// src/components/documents/DocumentCapture.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('lucide-react', () => ({
  Upload: () => <div>UploadIcon</div>,
  X: () => <div>XIcon</div>,
  Camera: () => <div>CameraIcon</div>,
  Crop: () => <div>CropIcon</div>,
  RotateCw: () => <div>RotateIcon</div>,
  Save: () => <div>SaveIcon</div>,
  Eye: () => <div>EyeIcon</div>,
}));

// Test document capture components
const TestDocumentCapture = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleUploadComplete = (file: File, preview: string) => {
    setUploadedImage(preview);
  };

  const handleCaptureComplete = (imageSrc: string) => {
    setCapturedImage(imageSrc);
  };

  return (
    <div>
      <h1>ID Document Capture Test</h1>
      <DocumentUploader onDocumentUpload={handleUploadComplete} />
      {uploadedImage && <img src={uploadedImage} alt="Uploaded" data-testid="uploaded-image" />}
    </div>
  );
};

// Mock file upload functionality
describe('DocumentCapture Components', () => {
  beforeEach(() => {
    // Mock File object
    global.File = class MockFile {
      name: string;
      size: number;
      type: string;
      constructor(name: string, size: number, type: string = 'image/jpeg') {
        this.name = name;
        this.size = size;
        this.type = type;
      }
    };

    // Mock FileReader
    global.FileReader = class MockFileReader {
      result: string | null = null;
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
      
      readAsDataURL(file: File) {
        setTimeout(() => {
          if (this.onload) {
            const event = {
              target: { result: 'data:image/jpeg;base64,mockbase64data' }
            } as unknown as ProgressEvent<FileReader>;
            this.onload(event);
          }
        }, 10);
      }
    };

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue(new MediaStream())
      }
    });
  });

  test('DocumentUploader handles file selection', async () => {
    render(<TestDocumentCapture />);
    
    const fileInput = screen.getByRole('button', { name: /upload/i }) ||
      screen.getByTestId('file-input') ||
      document.querySelector('input[type="file"]');
    
    if (fileInput) {
      const file = new File('test-id.jpg', 50000, 'image/jpeg');
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByTestId('uploaded-image')).toBeInTheDocument();
      });
    }
  });
});

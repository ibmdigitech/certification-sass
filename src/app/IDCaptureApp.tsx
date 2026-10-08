import React, { useState } from 'react';
import DocumentUploader from '../components/documents/DocumentUploader';
import DocumentCamera from '../components/documents/DocumentCamera';
import DocumentCropper from '../components/documents/DocumentCropper';
import DocumentEditor from '../components/documents/DocumentEditor';
import DocumentPreview from '../components/documents/DocumentPreview';
import { Camera, Upload, Crop, Edit, Eye } from 'lucide-react';

export interface ProcessedDocument {
  original: string;
  processed: string;
  compression: number;
}

type AppStep = 'upload' | 'camera' | 'crop' | 'edit' | 'preview';

const IDCaptureApp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleUploadComplete = (file: File, preview: string) => {
    setUploadedImage(preview);
    setCurrentStep('crop');
  };

  const handleCaptureComplete = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setCurrentStep('crop');
  };

  const handleCropComplete = (croppedImage: string) => {
    if (uploadedImage) {
      setProcessedDocument({
        original: uploadedImage,
        processed: croppedImage,
        compression: 90
      });
      setCurrentStep('edit');
    } else if (capturedImage) {
      setProcessedDocument({
        original: capturedImage,
        processed: croppedImage,
        compression: 90
      });
      setCurrentStep('edit');
    }
  };

  const handleSaveComplete = (processedImage: string, compression: number) => {
    if (processedDocument) {
      setProcessedDocument({
        ...processedDocument,
        processed: processedImage,
        compression
      });
      setCurrentStep('preview');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setProcessedDocument(null);
    setCurrentStep('camera');
  };

  const handleClose = () => {
    setCurrentStep('upload');
    setUploadedImage(null);
    setCapturedImage(null);
    setProcessedDocument(null);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-2xl font-bold mb-6 text-center">ID Document Capture</h1>
              
              <div className="space-y-6">
                <DocumentUploader onDocumentUpload={handleUploadComplete} />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setCurrentStep('camera')}
                  className="w-full flex items-center justify-center px-6 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Use Camera
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'camera':
        return (
          <DocumentCamera
            onCapture={handleCaptureComplete}
            onClose={handleClose}
          />
        );
        
      case 'crop':
        return (
          <DocumentCropper
            imageSrc={uploadedImage || capturedImage || ''}
            onCropComplete={handleCropComplete}
            onRetake={handleRetake}
            onClose={handleClose}
          />
        );
        
      case 'edit':
        if (!processedDocument) return null;
        return (
          <DocumentEditor
            originalImage={processedDocument.original}
            processedImage={processedDocument.processed}
            onSave={handleSaveComplete}
            onRetake={handleRetake}
            onClose={handleClose}
            onToggleVersions={() => setShowPreview(!showPreview)}
          />
        );
        
      case 'preview':
        if (!processedDocument) return null;
        return (
          <DocumentPreview
            originalImage={processedDocument.original}
            processedImage={processedDocument.processed}
            onClose={() => setCurrentStep('edit')}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {renderStep()}
    </div>
  );
};

export default IDCaptureApp;
import React, { useState } from 'react';
import { X, Download, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

interface DocumentPreviewProps {
  originalImage: string;
  processedImage: string;
  onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  originalImage,
  processedImage,
  onClose
}) => {
  const [showOriginal, setShowOriginal] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState({ original: 0, processed: 0 });

  const ImageViewer = ({ 
    src, 
    title, 
    isActive, 
    rotationAmount 
  }: { 
    src: string; 
    title: string; 
    isActive: boolean; 
    rotationAmount: number; 
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    
    return (
      <div className={`relative ${isActive ? 'block' : 'hidden'} lg:block`}
        style={isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        } : {}}
      >
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium">{title}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRotation(prev => ({ ...prev, [title === 'Original' ? 'original' : 'processed']: (prev[title === 'Original' ? 'original' : 'processed'] + 90) % 360 }))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Rotate 90°"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {!imageLoaded && (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
                <div className="text-gray-400">Loading...</div>
              </div>
            )}
            <img
              src={src}
              alt={title}
              className="w-full h-auto rounded"
              style={rotationAmount !== 0 ? {
                transform: `rotate(${rotationAmount}deg)`
              } : {}}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.download = `id-document-${title.toLowerCase()}-${Date.now()}.jpg`;
                link.href = src;
                link.click();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download {title}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 bg-gray-100 z-50 ${isFullscreen ? 'p-0' : 'p-4'} overflow-auto`}
      style={isFullscreen ? {
        backgroundColor: 'rgba(0,0,0,0.9)',
        zIndex: 9999
      } : {}}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Document Preview</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className={`px-4 py-2 rounded-lg transition-colors ${showOriginal ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            {showOriginal ? 'Showing Original' : 'Showing Processed'}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ImageViewer
          src={originalImage}
          title="Original"
          isActive={showOriginal}
          rotationAmount={rotation.original}
        />
        
        <ImageViewer
          src={processedImage}
          title="Processed"
          isActive={!showOriginal}
          rotationAmount={rotation.processed}
        />
      </div>
    </div>
  );
};

export default DocumentPreview;
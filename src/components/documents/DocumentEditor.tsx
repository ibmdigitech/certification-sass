import React, { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, Download, Trash2, Save, RotateCw, Shrink, X } from 'lucide-react';

interface DocumentEditorProps {
  originalImage: string;
  processedImage: string;
  onSave: (processed: string, compression: number) => void;
  onRetake: () => void;
  onClose: () => void;
  onToggleVersions: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  originalImage,
  processedImage,
  onSave,
  onRetake,
  onClose,
  onToggleVersions
}) => {
  const [currentImage, setCurrentImage] = useState(processedImage);
  const [compression, setCompression] = useState(0.9);
  const [isCompressed, setIsCompressed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [quality, setQuality] = useState(90);
  const [showPreview, setShowPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rotateImage = useCallback(() => {
    const img = new Image();
    img.onload = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rotatedDataUrl = canvas.toDataURL('image/jpeg', quality / 100);
      setCurrentImage(rotatedDataUrl);
    };
    img.src = currentImage;
  }, [currentImage, rotation, quality]);

  const compressImage = useCallback(async () => {
    try {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Calculate new dimensions maintaining aspect ratio
        const maxWidth = 1920;
        const maxHeight = 1080;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', compression);
        setCurrentImage(compressedDataUrl);
        setIsCompressed(true);
      };
      img.src = currentImage;
    } catch (error) {
      console.error('Compression error:', error);
    }
  }, [currentImage, compression]);

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = `id-document-${Date.now()}.jpg`;
    link.href = currentImage;
    link.click();
  };

  const deleteImage = () => {
    if (window.confirm('Delete this image? This cannot be undone.')) {
      onClose();
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-medium">Edit Document</h2>
        <button
          onClick={onToggleVersions}
          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
        >
          Toggle Versions
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="relative">
              <img
                src={currentImage}
                alt="Processed ID Document"
                className="w-full h-auto rounded"
              />
              {isCompressed && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  Compressed
                </div>
              )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {showPreview && (
          <div className="w-full lg:w-80 p-4 bg-white border-t lg:border-t-0 lg:border-l overflow-auto">
            <h3 className="text-sm font-medium mb-3">Image Previews</h3>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Original Version</div>
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full rounded border"
                />
              </div>
              
              <div>
                <div className="text-xs text-gray-600 mb-1">Current Version</div>
                <img
                  src={currentImage}
                  alt="Current"
                  className="w-full rounded border"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
          <button
            onClick={() => setRotation(prev => (prev + 90) % 360)}
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            title="Rotate 90°"
          >
            <RotateCw className="h-5 w-5" />
          </button>
          
          <button
            onClick={rotateImage}
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            title="Apply Rotation"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2 px-3 py-1 bg-white border rounded-lg">
            <Shrink className="h-4 w-4 text-gray-600" />
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.1"
              value={compression}
              onChange={(e) => setCompression(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
          
          <button
            onClick={compressImage}
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            title="Compress Image"
          >
            <Shrink className="h-5 w-5" />
          </button>
          
          <button
            onClick={togglePreview}
            className={`p-2 border rounded-lg transition-colors ${showPreview ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'}`}
            title="Toggle Preview"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={downloadImage}
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          
          <button
            onClick={onRetake}
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            title="Retake"
          >
            <RotateCw className="h-5 w-5" />
          </button>
          
          <button
            onClick={deleteImage}
            className="p-2 bg-white border rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-5 w-5 text-red-600" />
          </button>
          
          <button
            onClick={() => onSave(currentImage, Math.round(compression * 100))}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save & Complete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
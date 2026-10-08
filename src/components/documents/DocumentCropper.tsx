import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Crop, RotateCw, Save, X, Undo, Scissors } from 'lucide-react';

interface DocumentCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onRetake: () => void;
  onClose: () => void;
}

const DocumentCropper: React.FC<DocumentCropperProps> = ({
  imageSrc,
  onCropComplete,
  onRetake,
  onClose
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isPerspectiveMode, setIsPerspectiveMode] = useState(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      // Set initial crop to center of image
      const maxCropWidth = 100;
      const maxCropHeight = 100;
      const imgAspectRatio = img.width / img.height;
      let newWidth = maxCropWidth;
      let newHeight = maxCropWidth / imgAspectRatio;
      
      if (newHeight > maxCropHeight) {
        newHeight = maxCropHeight;
        newWidth = maxCropHeight * imgAspectRatio;
      }
      
      setCrop({
        x: (img.width - newWidth) / 2,
        y: (img.height - newHeight) / 2,
        width: newWidth,
        height: newHeight
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const applyTransformations = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context
    ctx.save();
    
    // Apply transformations in order: scale -> rotate -> translate
    ctx.translate(crop.x + crop.width / 2, crop.y + crop.height / 2);
    ctx.scale(scale, scale);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-crop.width / 2, -crop.height / 2);
    
    // Draw cropped portion
    ctx.drawImage(
      originalImage,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );
    
    // Restore context
    ctx.restore();
  }, [originalImage, crop, rotation, scale]);

  useEffect(() => {
    applyTransformations();
  }, [applyTransformations]);

  const handleCropComplete = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    onCropComplete(dataUrl);
  };

  const resetTransformations = () => {
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
    setRotation(0);
    setScale(1);
    setIsPerspectiveMode(false);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-medium">Crop & Edit Document</h2>
        <button
          onClick={handleCropComplete}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className="relative border-2 border-gray-300"
            style={{
              width: '100%',
              maxWidth: '800px',
              aspectRatio: '3/2'
            }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="ID Document"
              className="hidden"
              onLoad={() => {
                if (originalImage) {
                  applyTransformations();
                }
              }}
            />
            
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain"
              onWheel={handleWheel}
            />
            
            <div
              className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20"
              style={{
                left: `${crop.x}px`,
                top: `${crop.y}px`,
                width: `${crop.width}px`,
                height: `${crop.height}px`
              }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={resetTransformations}
              className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              title="Reset"
            >
              <Undo className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              title="Rotate 90°"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setIsPerspectiveMode(!isPerspectiveMode)}
              className={`p-2 border rounded-lg transition-colors ${isPerspectiveMode ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'}`}
              title="Perspective correction"
            >
              <Scissors className="h-5 w-5" />
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            Drag to crop • Scroll to zoom • Rotate icon to rotate
          </div>
          
          <button
            onClick={onRetake}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Retake
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCropper;
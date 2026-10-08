import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCw } from 'lucide-react';

interface DocumentCameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

const DocumentCamera: React.FC<DocumentCameraProps> = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFacingMode, setIsFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isFacingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        setStream(mediaStream);
        setError(null);
      } catch (err) {
        console.error('Camera access error:', err);
        setError('Camera access denied. Please allow camera permissions and try again.');
      }
    };

    getCameraStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isFacingMode]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleCamera = () => {
    setIsFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageDataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-medium">Capture ID Document</h2>
        <button
          onClick={toggleCamera}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
        >
          <RotateCw className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4">
        {error ? (
          <div className="text-white text-center">
            <p>{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full rounded-lg"
          />
        )}
      </div>

      <div className="p-4">
        <button
          onClick={captureImage}
          disabled={!!error}
          className="w-full max-w-xs mx-auto block px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="inline h-5 w-5 mr-2" />
          Capture
        </button>
      </div>
    </div>
  );
};

export default DocumentCamera;
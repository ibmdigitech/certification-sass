"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Check, RotateCw, Download, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface CapturedPhoto {
  dataUrl: string;
  blob: Blob;
  timestamp: Date;
}

interface PhotoCaptureProps {
  onCapture: (photo: CapturedPhoto) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function PhotoCapture({
  onCapture,
  onError,
  onCancel,
  className,
}: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      onError?.('Unable to access camera. Please check permissions.');
    }
  }, [facingMode, onError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    setIsCapturing(true);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      setIsCapturing(false);
      if (!blob) return;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const photo: CapturedPhoto = {
        dataUrl,
        blob,
        timestamp: new Date(),
      };
      setCapturedPhoto(photo);
    }, 'image/jpeg', 0.9);
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
  }, []);

  const submitPhoto = useCallback(() => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
    }
  }, [capturedPhoto, onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const photo: CapturedPhoto = {
        dataUrl,
        blob: file,
        timestamp: new Date(),
      };
      setCapturedPhoto(photo);
    };
    reader.readAsDataURL(file);
  }, [onError]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <Card className={cn('w-full max-w-xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trainee Photo</span>
          <Badge variant="outline" className="text-xs">Live Capture</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!capturedPhoto && stream && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={switchCamera}
                className="bg-white/90"
              >
                <RotateCw className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                onClick={capturePhoto}
                disabled={isCapturing}
                className="bg-white text-black hover:bg-white/90"
              >
                <Camera className="h-5 w-5 mr-2" />
                {isCapturing ? 'Capturing...' : 'Capture Photo'}
              </Button>
            </div>
          </div>
        )}

        {!capturedPhoto && !stream && (
          <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Starting camera...</p>
            </div>
          </div>
        )}

        {capturedPhoto && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <img
              src={capturedPhoto.dataUrl}
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={retakePhoto}
                className="bg-white/90"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = capturedPhoto.dataUrl;
                  a.download = `trainee-photo-${Date.now()}.jpg`;
                  a.click();
                }}
                className="bg-white/90"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-emerald-500 text-emerald-500-foreground">Photo Captured ✓</Badge>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileUpload}
              className="hidden"
              id="photo-upload"
            />
            <Button variant="outline" className="w-full">
              <Image className="h-4 w-4 mr-2" />
              Upload from Gallery
            </Button>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={submitPhoto} disabled={!capturedPhoto || isCapturing}>
            <Check className="h-4 w-4 mr-2" />
            Use This Photo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
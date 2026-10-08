"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCw, Download, Upload, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type CaptureMode = 'camera' | 'upload';
export type DocumentSide = 'front' | 'back';

export interface CapturedImage {
  dataUrl: string;
  blob: Blob;
  side: DocumentSide;
  timestamp: Date;
}

interface DocumentCaptureProps {
  mode?: CaptureMode;
  documentType?: string;
  requireBothSides?: boolean;
  onCapture: (images: CapturedImage[]) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function DocumentCapture({
  mode = 'camera',
  documentType = 'ID Document',
  requireBothSides = true,
  onCapture,
  onError,
  className,
}: DocumentCaptureProps) {
  const [currentSide, setCurrentSide] = useState<DocumentSide>('front');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const newImage: CapturedImage = {
        dataUrl,
        blob,
        side: currentSide,
        timestamp: new Date(),
      };

      setCapturedImages(prev => [...prev.filter(img => img.side !== currentSide), newImage]);
    }, 'image/jpeg', 0.9);
  }, [currentSide]);

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
      const newImage: CapturedImage = {
        dataUrl,
        blob: file,
        side: currentSide,
        timestamp: new Date(),
      };
      setCapturedImages(prev => [...prev.filter(img => img.side !== currentSide), newImage]);
    };
    reader.readAsDataURL(file);
  }, [currentSide, onError]);

  const retakePhoto = useCallback((side: DocumentSide) => {
    setCapturedImages(prev => prev.filter(img => img.side !== side));
  }, []);

  const submitCapture = useCallback(() => {
    if (requireBothSides && capturedImages.length < 2) {
      onError?.('Please capture both front and back of the document.');
      return;
    }
    if (!requireBothSides && capturedImages.length === 0) {
      onError?.('Please capture at least one image.');
      return;
    }
    onCapture(capturedImages);
  }, [capturedImages, requireBothSides, onCapture, onError]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  const hasFront = capturedImages.some(img => img.side === 'front');
  const hasBack = capturedImages.some(img => img.side === 'back');

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{documentType} Capture</span>
          <Badge variant="outline" className="text-xs">
            {mode === 'camera' ? 'Camera' : 'Upload'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'camera' && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {stream && (
              <>
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
                    Capture {currentSide === 'front' ? 'Front' : 'Back'}
                  </Button>
                </div>
              </>
            )}
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center p-4">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'upload' && (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
              id={`upload-${currentSide}`}
            />
            <label
              htmlFor={`upload-${currentSide}`}
              className="cursor-pointer"
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Upload {currentSide === 'front' ? 'Front' : 'Back'} Side</p>
              <p className="text-sm text-muted-foreground mt-1">Tap or drag and drop</p>
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div
            className={cn(
              'relative aspect-square bg-muted rounded-lg border-2 transition-colors',
              hasFront ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-border'
            )}
          >
            {hasFront ? (
              <>
                <img
                  src={capturedImages.find(img => img.side === 'front')?.dataUrl}
                  alt="Front side"
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => retakePhoto('front')}
                    className="bg-white/90"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const img = capturedImages.find(i => i.side === 'front');
                      if (img) {
                        const a = document.createElement('a');
                        a.href = img.dataUrl;
                        a.download = `${documentType}-front-${Date.now()}.jpg`;
                        a.click();
                      }
                    }}
                    className="bg-white/90"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-emerald-500 text-emerald-500-foreground">Front ✓</Badge>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Camera className="h-8 w-8 mb-2" />
                <span className="text-sm">Front Side</span>
                {requireBothSides && <span className="text-xs">Required</span>}
              </div>
            )}
          </div>

          {requireBothSides && (
            <div
              className={cn(
                'relative aspect-square bg-muted rounded-lg border-2 transition-colors',
                hasBack ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-border'
              )}
            >
              {hasBack ? (
                <>
                  <img
                    src={capturedImages.find(img => img.side === 'back')?.dataUrl}
                    alt="Back side"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => retakePhoto('back')}
                      className="bg-white/90"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const img = capturedImages.find(i => i.side === 'back');
                        if (img) {
                          const a = document.createElement('a');
                          a.href = img.dataUrl;
                          a.download = `${documentType}-back-${Date.now()}.jpg`;
                          a.click();
                        }
                      }}
                      className="bg-white/90"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-emerald-500 text-emerald-500-foreground">Back ✓</Badge>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Camera className="h-8 w-8 mb-2" />
                  <span className="text-sm">Back Side</span>
                  <span className="text-xs">Required</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onCapture([])}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={submitCapture} disabled={isCapturing}>
            <Check className="h-4 w-4 mr-2" />
            {requireBothSides && capturedImages.length < 2 ? 'Capture Both Sides' : 'Confirm'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
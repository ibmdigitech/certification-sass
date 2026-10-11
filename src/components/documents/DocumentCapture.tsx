"use client";

import React, { useState, useCallback, useRef } from "react";
import Webcam from "react-webcam";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Camera, Upload, RotateCcw, Check, X } from "lucide-react";
import getCroppedImg from "@/lib/utils/imageUtils";

interface DocumentCaptureProps {
  onCapture: (blob: Blob, originalBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

type Step = "SELECT" | "CAMERA" | "CROP";

export function DocumentCapture({ onCapture, onCancel, aspectRatio = 1.6 }: DocumentCaptureProps) {
  const [step, setStep] = useState<Step>("SELECT");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  
  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const webcamRef = useRef<Webcam>(null);

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImageSrc(imageSrc);
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => setOriginalBlob(blob));
        setStep("CROP");
      }
    }
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setOriginalBlob(file);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || "");
        setStep("CROP");
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    try {
      if (!imageSrc || !croppedAreaPixels || !originalBlob) return;
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      if (croppedImage) {
        onCapture(croppedImage, originalBlob);
      }
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onCapture, originalBlob]);

  return (
    <div className="flex flex-col h-[500px] w-full bg-black rounded-xl overflow-hidden border">
      {step === "SELECT" && (
        <div className="flex flex-col items-center justify-center flex-1 space-y-6 bg-card">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium text-foreground">Upload Document</h3>
            <p className="text-muted-foreground">Take a photo or upload an existing file</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => setStep("CAMERA")} size="lg" className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Take Photo
            </Button>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="lg" className="flex items-center gap-2 pointer-events-none">
                <Upload className="w-5 h-5" />
                Upload File
              </Button>
            </div>
          </div>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      )}

      {step === "CAMERA" && (
        <div className="relative flex-1 flex flex-col">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="flex-1 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
            <Button variant="ghost" onClick={() => setStep("SELECT")} className="text-white hover:bg-white/20">
              <X className="w-6 h-6" />
            </Button>
            <button
              onClick={handleCapture}
              className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
            />
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      )}

      {step === "CROP" && imageSrc && (
        <div className="relative flex-1 flex flex-col">
          <div className="relative flex-1 bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              rotation={rotation}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="p-4 bg-background border-t flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setStep("SELECT")}>
              Retake
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRotation((r) => r - 90)}
                title="Rotate Left"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRotation((r) => r + 90)}
                title="Rotate Right"
              >
                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
              </Button>
            </div>
            <Button onClick={showCroppedImage} className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

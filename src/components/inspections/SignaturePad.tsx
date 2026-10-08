"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PenTool, RotateCcw, Check, X } from "lucide-react";

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onCancel?: () => void;
  signerName?: string;
  role?: string;
}

interface Point {
  x: number;
  y: number;
}

export function SignaturePad({ onSave, onCancel, signerName = "", role = "" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [name, setName] = useState(signerName);
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a1a";

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCoordinates(e);
    if (!point) return;

    setIsDrawing(true);
    setPoints([point]);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const point = getCoordinates(e);
    if (!point) return;

    setPoints((prev) => [...prev, point]);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPoints([]);
    setHasSignature(false);
  };

  const save = () => {
    if (!hasSignature || !name.trim()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL("image/png");
    onSave(signatureData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Digital Signature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Signer Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        {role && (
          <div className="text-sm text-muted-foreground">
            Signing as: <span className="font-medium">{role}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Signature</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <canvas
              ref={canvasRef}
              className="w-full h-40 bg-white border border-gray-200 rounded cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Draw your signature above using mouse or touch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={clear}
            variant="outline"
            disabled={!hasSignature}
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button
            onClick={save}
            disabled={!hasSignature || !name.trim()}
            className="flex-1"
          >
            <Check className="mr-2 h-4 w-4" />
            Save Signature
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
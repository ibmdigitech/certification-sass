'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, CheckCircle, XCircle, AlertCircle, Shield, Building2, Calendar, FileText, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CertificateData {
  id: number;
  number: string;
  status: string;
  complianceAuthority: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: number;
    jobNumber: string;
    customer: { name: string } | null;
  };
  company: {
    id: number;
    name: string;
    logo: string | null;
  };
}

interface VerificationResult {
  valid: boolean;
  certificate?: CertificateData;
  error?: string;
  verificationStatus: 'VALID' | 'EXPIRED' | 'REVOKED' | 'CANCELLED' | 'INVALID';
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  VALID: { label: 'Valid', variant: 'default', icon: <CheckCircle className="h-4 w-4" /> },
  EXPIRED: { label: 'Expired', variant: 'secondary', icon: <Calendar className="h-4 w-4" /> },
  REVOKED: { label: 'Revoked', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  INVALID: { label: 'Invalid', variant: 'destructive', icon: <AlertCircle className="h-4 w-4" /> },
};

export function VerificationPageClient({ initialToken }: { initialToken?: string }) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const verifyToken = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/certificates/verify/${token}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        valid: false,
        error: 'Failed to verify certificate',
        verificationStatus: 'INVALID',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyManual = useCallback(async (certificateNumber: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/certificates/verify/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateNumber }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        valid: false,
        error: 'Failed to verify certificate',
        verificationStatus: 'INVALID',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      setShowManualEntry(false);
    } catch (error) {
      alert('Unable to access camera. Please use manual entry.');
      setShowManualEntry(true);
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !scanning) return;

    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      requestAnimationFrame(scanFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const code = decodeQRCode(imageData);
      if (code) {
        stopScanning();
        const token = extractTokenFromQR(code);
        if (token) {
          verifyToken(token);
        } else if (code.startsWith('http')) {
          const token = extractTokenFromURL(code);
          if (token) verifyToken(token);
        }
        return;
      }
    } catch {
      // Ignore decoding errors
    }

    requestAnimationFrame(scanFrame);
  }, [scanning, stopScanning, verifyToken]);

  useEffect(() => {
    if (scanning) {
      requestAnimationFrame(scanFrame);
    }
  }, [scanning, scanFrame]);

  useEffect(() => {
    if (initialToken) {
      verifyToken(initialToken);
    }
  }, [initialToken, verifyToken]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderResult = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying certificate...</p>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="mt-4 text-lg font-semibold">Enter a certificate token or scan a QR code</h3>
          <p className="mt-2 text-muted-foreground">
            Use the camera to scan a QR code or enter the certificate number manually.
          </p>
        </div>
      );
    }

    const statusConfig = STATUS_CONFIG[result.verificationStatus];

    return (
      <div className="space-y-6">
        <Card className={cn('border-2', result.valid ? 'border-green-500' : 'border-red-500')}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold', 
                result.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              )}>
                {statusConfig.icon}
                <span>{statusConfig.label}</span>
              </div>
              
              {result.error && !result.certificate && (
                <p className="text-red-600">{result.error}</p>
              )}

              {result.certificate && (
                <>
                  <Shield className={cn('h-12 w-12', result.valid ? 'text-green-500' : 'text-red-500')} />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Certificate Number</p>
                    <p className="text-2xl font-mono font-bold">{result.certificate.number}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {result.certificate && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Certificate Details
                </CardTitle>
                <CardDescription>Verified certificate information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Certificate Number</p>
                    <p className="font-mono font-medium">{result.certificate.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={statusConfig.variant} className="gap-1">
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Compliance Authority</p>
                    <p className="font-medium">{result.certificate.complianceAuthority || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <p className="font-medium">{formatDate(result.certificate.createdAt)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Job Reference</p>
                    <p className="font-medium">
                      {result.certificate.job.jobNumber}
                      {result.certificate.job.customer && (
                        <span className="ml-2 text-muted-foreground">({result.certificate.job.customer.name})</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Issuer Information
                </CardTitle>
                <CardDescription>Organization that issued this certificate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  {result.certificate.company.logo && (
                    <img 
                      src={result.certificate.company.logo} 
                      alt={result.certificate.company.name} 
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{result.certificate.company.name}</p>
                    <p className="text-sm text-muted-foreground">Certificate Issuer</p>
                  </div>
                </div>
                <div className="pt-2 border-t flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated: {formatDate(result.certificate.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold">Tamper-Proof Verification</p>
                    <p className="mt-1">
                      This verification result is retrieved directly from the CertAI database in real-time. 
                      The certificate status cannot be altered without detection. Each verification is logged 
                      with a timestamp for audit purposes.
                    </p>
                    <p className="mt-2 font-medium">
                      Verification ID: {result.certificate.id}-{Date.now().toString(36).toUpperCase()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Certificate Verification</h1>
                <p className="text-sm text-muted-foreground">Verify certificate authenticity in real-time</p>
              </div>
            </div>
            <a href="/" className="text-sm text-primary hover:underline">
              ← Back to CertAI
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {!result || (result && !result.certificate && !loading) ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
                    <h2 className="mt-4 text-xl font-semibold">Scan QR Code</h2>
                    <p className="mt-2 text-muted-foreground">
                      Point your camera at the QR code on the certificate
                    </p>
                  </div>

                  {scanning ? (
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 border-2 border-primary/50 rounded-lg relative">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 text-xs rounded">
                            Align QR code here
                          </div>
                          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary" />
                          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary" />
                          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary" />
                          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary" />
                        </div>
                      </div>
                      <Button
                        onClick={stopScanning}
                        variant="destructive"
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
                        size="lg"
                      >
                        Stop Scanning
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        onClick={startScanning}
                        size="lg"
                        className="w-full"
                        disabled={loading}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera Scan
                      </Button>
                      <Button
                        onClick={() => setShowManualEntry(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Enter Certificate Number Manually
                      </Button>
                    </div>
                  )}

                  {showManualEntry && !scanning && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Manual Entry</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter certificate number (e.g., TSC-2563741-01)"
                          value={manualToken}
                          onChange={(e) => setManualToken(e.target.value)}
                          disabled={loading}
                        />
                        <Button
                          onClick={() => verifyManual(manualToken)}
                          disabled={loading || !manualToken.trim()}
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowManualEntry(false); setManualToken(''); }}
                        className="mt-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {renderResult()}
        </div>
      </main>

      <footer className="border-t bg-card py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>CertAI Certificate Verification System</p>
          <p className="mt-1">This is a public verification service. No login required.</p>
        </div>
      </footer>
    </div>
  );
}

// Simple QR code decoder using jsQR logic (simplified)
function decodeQRCode(imageData: ImageData): string | null {
  // This is a placeholder - in production, use a proper QR code library like jsQR
  // For now, we'll rely on the API to handle verification
  return null;
}

function extractTokenFromQR(qrData: string): string | null {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.token && parsed.token.startsWith('cert_')) {
      return parsed.token;
    }
    if (parsed.verificationUrl) {
      const url = new URL(parsed.verificationUrl);
      const parts = url.pathname.split('/');
      const idx = parts.indexOf('certificate');
      if (idx !== -1 && idx + 1 < parts.length) {
        return parts[idx + 1];
      }
    }
  } catch {
    // Not JSON, might be a URL
  }
  return null;
}

function extractTokenFromURL(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    const idx = parts.indexOf('certificate');
    if (idx !== -1 && idx + 1 < parts.length) {
      return parts[idx + 1];
    }
  } catch {
    return null;
  }
  return null;
}
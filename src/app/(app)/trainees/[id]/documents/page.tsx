"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, FileText, Camera, Upload, Download, Trash2, Eye, AlertCircle, CheckCircle, Clock, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { AlertBanner } from '@/components/ui/alert-banner';
import { DocumentCapture, CapturedImage } from '@/components/id-capture/DocumentCapture';
import { PhotoCapture, CapturedPhoto } from '@/components/id-capture/PhotoCapture';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TraineeDocument {
  id: number;
  name: string;
  type: string;
  url: string;
  expiryDate: string | null;
  status: string;
  createdAt: string;
}

interface Trainee {
  id: number;
  firstName: string;
  lastName: string;
  documents: TraineeDocument[];
}

const DOCUMENT_TYPES = [
  'EMIRATES_ID',
  'PASSPORT',
  'VISA',
  'LICENSE',
  'MEDICAL_CERTIFICATE',
  'PHOTO',
  'OTHER',
] as const;

const DOCUMENT_STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
  valid: { variant: 'default', label: 'Valid', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
  expired: { variant: 'destructive', label: 'Expired', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
  expiring_soon: { variant: 'outline', label: 'Expiring Soon', icon: <Clock className="h-3 w-3 mr-1" /> },
  pending_verification: { variant: 'secondary', label: 'Pending Verification', icon: <Clock className="h-3 w-3 mr-1" /> },
  rejected: { variant: 'destructive', label: 'Rejected', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
};

const getDocumentStatusBadge = (status: string) => {
  const config = DOCUMENT_STATUS_BADGES[status] || { variant: 'outline', label: status, icon: null };
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const isExpiringSoon = (dateString: string | null, days: number = 30) => {
  if (!dateString) return false;
  const expiry = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays >= 0;
};

export default function TraineeDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const traineeId = params?.id as string;

  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [captureMode, setCaptureMode] = useState<'document' | 'photo'>('document');
  const [selectedDocType, setSelectedDocType] = useState<string>('EMIRATES_ID');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchTrainee();
  }, [traineeId]);

  const fetchTrainee = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/trainees/${traineeId}`);
      if (!response.ok) throw new Error('Failed to fetch trainee');
      const data = await response.json();
      setTrainee(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trainee');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentCapture = async (images: CapturedImage[]) => {
    if (images.length === 0) {
      setCaptureMode('document');
      setCapturedImages([]);
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      images.forEach((img, index) => {
        formData.append(`document_${index}`, img.blob, `${selectedDocType}_${img.side}_${Date.now()}.jpg`);
      });
      formData.append('name', selectedDocType);
      formData.append('type', selectedDocType);
      formData.append('traineeId', traineeId);

      const response = await fetch(`/api/trainees/${traineeId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload documents');
      
      setCaptureMode('document');
      setCapturedImages([]);
      setShowAddDialog(false);
      fetchTrainee();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoCapture = async (photo: CapturedPhoto) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', photo.blob, `trainee_photo_${Date.now()}.jpg`);
      formData.append('name', 'Trainee Photo');
      formData.append('type', 'PHOTO');
      formData.append('traineeId', traineeId);

      const response = await fetch(`/api/trainees/${traineeId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload photo');
      
      setCapturedPhoto(null);
      setShowAddDialog(false);
      fetchTrainee();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const response = await fetch(`/api/trainees/${traineeId}/documents/${docId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete document');
      fetchTrainee();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <LoadingState message="Loading documents..." />
      </div>
    );
  }

  if (error || !trainee) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <ErrorState
          title="Failed to Load Documents"
          description={error || 'Unable to load trainee documents.'}
          onRetry={fetchTrainee}
        />
      </div>
    );
  }

  const sortedDocuments = [...trainee.documents].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/trainees/${traineeId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              {trainee.firstName} {trainee.lastName} &middot; {sortedDocuments.length} document(s)
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>

      {/* Documents List */}
      {sortedDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
            <p className="text-muted-foreground mb-4">
              Add identity documents to track expiry dates and verification status
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedDocuments.map(doc => {
            const statusConfig = DOCUMENT_STATUS_BADGES[doc.status] || { variant: 'outline', label: doc.status };
            const isExpiring = isExpiringSoon(doc.expiryDate);
            
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'h-12 w-12 rounded-lg flex items-center justify-center',
                        doc.type === 'PHOTO' ? 'bg-emerald-100' : 'bg-muted'
                      )}>
                        {doc.type === 'PHOTO' ? (
                          <Camera className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {doc.type} • Uploaded {formatDate(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {getDocumentStatusBadge(doc.status)}
                      {doc.expiryDate && (
                        <Badge variant={isExpiring ? 'outline' : 'secondary'} className="text-xs">
                          <Calendar className="mr-1 h-3 w-3" />
                          Expires: {formatDate(doc.expiryDate)}
                          {isExpiring && ' (Soon)'}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={doc.url} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Document Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          
          {captureMode === 'document' && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Document Type</label>
                  <select
                    value={selectedDocType}
                    onChange={e => setSelectedDocType(e.target.value)}
                    className="w-full h-10 px-3 border border-input rounded-md bg-background"
                  >
                    {DOCUMENT_TYPES.map(type => (
                      <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  className="w-[200px]"
                  onClick={() => {
                    setCaptureMode('document');
                    setSelectedDocType('EMIRATES_ID');
                  }}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Camera Capture
                </Button>
                <Button
                  variant="secondary"
                  className="w-[200px]"
                  onClick={() => {
                    setCaptureMode('photo');
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Capture Photo
                </Button>
              </div>
            </div>
          )}

          {captureMode === 'document' && selectedDocType && (
            <DocumentCapture
              documentType={selectedDocType.replace(/_/g, ' ')}
              requireBothSides={['EMIRATES_ID', 'PASSPORT', 'VISA', 'LICENSE'].includes(selectedDocType)}
              onCapture={handleDocumentCapture}
              onError={alert}
            />
          )}

          {captureMode === 'photo' && (
            <PhotoCapture
              onCapture={handlePhotoCapture}
              onError={alert}
              onCancel={() => setCaptureMode('document')}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCaptureMode('document');
              setCapturedImages([]);
              setShowAddDialog(false);
            }}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
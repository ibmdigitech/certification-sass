"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, Download, Eye, CheckCircle, AlertCircle, Clock, Calendar, Loader2, FileText, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

interface Certificate {
  id: number;
  number: string;
  jobNumber: string;
  sequence: number;
  revision: number;
  status: string;
  complianceAuthority: string | null;
  pdfUrl: string | null;
  qrUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Trainee {
  id: number;
  firstName: string;
  lastName: string;
  certificates: Certificate[];
}

const CERTIFICATE_STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
  issued: { variant: 'default', label: 'Issued', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
  draft: { variant: 'secondary', label: 'Draft', icon: <FileText className="h-3 w-3 mr-1" /> },
  pending_approval: { variant: 'outline', label: 'Pending Approval', icon: <Clock className="h-3 w-3 mr-1" /> },
  expired: { variant: 'destructive', label: 'Expired', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
  revoked: { variant: 'destructive', label: 'Revoked', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
  cancelled: { variant: 'destructive', label: 'Cancelled', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
};

const getCertificateStatusBadge = (status: string) => {
  const config = CERTIFICATE_STATUS_BADGES[status] || { variant: 'outline', label: status, icon: null };
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function TraineeCertificatesPage() {
  const params = useParams();
  const router = useRouter();
  const traineeId = params?.id as string;

  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <LoadingState message="Loading certificates..." />
      </div>
    );
  }

  if (error || !trainee) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <ErrorState
          title="Failed to Load Certificates"
          description={error || 'Unable to load certificates.'}
          onRetry={fetchTrainee}
        />
      </div>
    );
  }

  const sortedCertificates = [...trainee.certificates].sort((a, b) => 
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
            <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
            <p className="text-muted-foreground">
              {trainee.firstName} {trainee.lastName} &middot; {sortedCertificates.length} certificate(s)
            </p>
          </div>
        </div>
      </div>

      {/* Certificates List */}
      {sortedCertificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No certificates issued</h3>
            <p className="text-muted-foreground mb-4">
              Certificates will appear here once the trainee completes training and assessments
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedCertificates.map(cert => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Award className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Certificate #{cert.number}</h4>
                        {getCertificateStatusBadge(cert.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Job: {cert.jobNumber} • Sequence: {cert.sequence} • Revision: {cert.revision}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Issued: {formatDate(cert.createdAt)}
                        {cert.complianceAuthority && ` • Authority: ${cert.complianceAuthority}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {cert.pdfUrl && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {cert.pdfUrl && (
                      <Button variant="outline" size="icon" asChild>
                        <Link href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    {cert.qrUrl && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={cert.qrUrl} target="_blank" rel="noopener noreferrer">
                          <QrCode className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
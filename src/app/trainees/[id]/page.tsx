"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Loader2, AlertCircle, CheckCircle, XCircle, FileText, GraduationCap, Award, User, Mail, Phone, Briefcase, Calendar, Building2, IdCard, Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { AlertBanner } from '@/components/ui/alert-banner';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';

interface Trainee {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  employeeId: string | null;
  jobTitle: string | null;
  hireDate: string | null;
  status: string;
  documents: Array<{ id: number; name: string; type: string; url: string; expiryDate: string | null; status: string; createdAt: string }>;
  trainingSessions: Array<{ id: number; sessionDate: string; duration: number | null; topic: string | null; status: string; training: { module: string | null } | null }>;
  _count: {
    documents: number;
    trainingSessions: number;
  };
}

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  active: { variant: 'default', label: 'Active' },
  inactive: { variant: 'secondary', label: 'Inactive' },
  on_leave: { variant: 'outline', label: 'On Leave' },
  terminated: { variant: 'destructive', label: 'Terminated' },
};

const DOCUMENT_STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  valid: { variant: 'default', label: 'Valid' },
  expired: { variant: 'destructive', label: 'Expired' },
  expiring_soon: { variant: 'outline', label: 'Expiring Soon' },
  pending_verification: { variant: 'secondary', label: 'Pending Verification' },
  rejected: { variant: 'destructive', label: 'Rejected' },
};

const TRAINING_STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  scheduled: { variant: 'secondary', label: 'Scheduled' },
  in_progress: { variant: 'default', label: 'In Progress' },
  completed: { variant: 'default', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
};

export default function TraineeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const traineeId = params?.id as string;

  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

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
        <PageHeader
          title="Loading..."
          description="Please wait while we fetch the trainee details."
        />
        <LoadingState message="Loading trainee details..." />
      </div>
    );
  }

  if (error || !trainee) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Trainee Not Found"
          description="The trainee you're looking for doesn't exist or has been removed."
          action={
            <Button onClick={() => router.push('/trainees')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Trainees
            </Button>
          }
        />
        <ErrorState
          title="Trainee Not Found"
          description={error || 'The trainee you\'re looking for doesn\'t exist or has been removed.'}
          onRetry={() => router.push('/trainees')}
        />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_BADGES[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDocumentStatusBadge = (status: string) => {
    const config = DOCUMENT_STATUS_BADGES[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTrainingStatusBadge = (status: string) => {
    const config = TRAINING_STATUS_BADGES[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/trainees')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {trainee.firstName} {trainee.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(trainee.status)}
              {trainee.employeeId && (
                <Badge variant="outline">
                  <IdCard className="mr-1 h-3 w-3" />
                  {trainee.employeeId}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/trainees/${traineeId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Documents ({trainee._count.documents})
          </TabsTrigger>
          <TabsTrigger value="training">
            <GraduationCap className="mr-2 h-4 w-4" />
            Training ({trainee._count.trainingSessions})
          </TabsTrigger>
          <TabsTrigger value="certificates">
            <Award className="mr-2 h-4 w-4" />
            Certificates
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <p className="text-lg font-medium">{trainee.firstName} {trainee.lastName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {trainee.email || '—'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</label>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {trainee.phone || '—'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee ID</label>
                  <p className="flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    {trainee.employeeId || '—'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Employment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Job Title</label>
                  <p className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {trainee.jobTitle || '—'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hire Date</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(trainee.hireDate)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                  <p>{getStatusBadge(trainee.status)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Documents</span>
                  <span className="font-bold text-2xl">{trainee._count.documents}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Training Sessions</span>
                  <span className="font-bold text-2xl">{trainee._count.trainingSessions}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Certificates</span>
                  <span className="font-bold text-2xl">—</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Identity Documents</h2>
              <p className="text-sm text-muted-foreground">Manage ID documents, photos, and certifications</p>
            </div>
            <Button asChild>
              <Link href={`/trainees/${traineeId}/documents/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Document
              </Link>
            </Button>
          </div>

          {trainee.documents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
                <p className="text-muted-foreground mb-4">Add identity documents to track expiry dates and verification status</p>
                <Button asChild>
                  <Link href={`/trainees/${traineeId}/documents/new`}>
                    Add First Document
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trainee.documents.map(doc => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{doc.name}</h4>
                          <p className="text-sm text-muted-foreground">{doc.type} • {formatDate(doc.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getDocumentStatusBadge(doc.status)}
                        {doc.expiryDate && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="mr-1 h-3 w-3" />
                            Expires: {formatDate(doc.expiryDate)}
                          </Badge>
                        )}
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Award className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Training Sessions</h2>
              <p className="text-sm text-muted-foreground">Track training attendance and progress</p>
            </div>
          </div>

          {trainee.trainingSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No training sessions</h3>
                <p className="text-muted-foreground">This trainee hasn't been enrolled in any training sessions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trainee.trainingSessions.map(session => (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{session.training?.module || 'Training Session'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.sessionDate)} • {session.duration ? `${session.duration} min` : 'No duration'}
                          </p>
                          {session.topic && <p className="text-sm text-muted-foreground">{session.topic}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getTrainingStatusBadge(session.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Certificates</h2>
              <p className="text-sm text-muted-foreground">View issued certificates and their status</p>
            </div>
          </div>

          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No certificates issued</h3>
              <p className="text-muted-foreground mb-4">Certificates will appear here once the trainee completes training and assessments</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
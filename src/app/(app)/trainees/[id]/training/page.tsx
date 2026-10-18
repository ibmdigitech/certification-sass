"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Calendar, Clock, CheckCircle, AlertCircle, Loader2, TrendingUp, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

interface TrainingSession {
  id: number;
  sessionDate: string;
  duration: number | null;
  topic: string | null;
  status: string;
  training: { module: string | null; id: number } | null;
}

interface Trainee {
  id: number;
  firstName: string;
  lastName: string;
  trainingSessions: TrainingSession[];
  enrollments: Array<{
    id: number;
    status: string;
    enrolledAt: string;
    completedAt: string | null;
    course: { title: string; code: string | null };
    location: { name: string; code: string | null } | null;
    jobNumber: string | null;
    timesheetNumber: string | null;
    trainingDate: string | null;
    photoUrl: string | null;
    idUrl: string | null;
  }>;
}

const TRAINING_STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  scheduled: { variant: 'secondary', label: 'Scheduled' },
  in_progress: { variant: 'default', label: 'In Progress' },
  completed: { variant: 'default', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
};

const getTrainingStatusBadge = (status: string) => {
  const config = TRAINING_STATUS_BADGES[status] || { variant: 'outline', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (minutes: number | null) => {
  if (!minutes) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export default function TraineeTrainingPage() {
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
        <LoadingState message="Loading training progress..." />
      </div>
    );
  }

  if (error || !trainee) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        <ErrorState
          title="Failed to Load Training"
          description={error || 'Unable to load training progress.'}
          onRetry={fetchTrainee}
        />
      </div>
    );
  }

  const sessions = [...trainee.trainingSessions].sort((a, b) => 
    new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  );

  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const inProgressSessions = sessions.filter(s => s.status === 'in_progress').length;
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled').length;
  const totalHours = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  const completedHours = sessions
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + (s.duration || 0), 0);

  const progress = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  const upcomingSessions = sessions.filter(s => 
    s.status === 'scheduled' || s.status === 'in_progress'
  ).sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/trainees/${traineeId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training Progress</h1>
            <p className="text-muted-foreground">
              {trainee.firstName} {trainee.lastName} &middot; {sessions.length} session(s)
            </p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{completedSessions}</div>
            <p className="text-xs text-muted-foreground">Sessions completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressSessions}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalHours)}</div>
            <p className="text-xs text-muted-foreground">Training time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Training Progress</CardTitle>
          <CardDescription>
            Based on completed training hours vs total scheduled hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1 h-4" />
            <span className="text-lg font-bold w-16 text-right">{progress}%</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>Completed: {formatDuration(completedHours)}</div>
            <div>Total: {formatDuration(totalHours)}</div>
            <div>Remaining: {formatDuration(totalHours - completedHours)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Training Sessions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Training Sessions</CardTitle>
              <CardDescription>History of all training sessions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No training sessions</h3>
              <p className="text-muted-foreground mb-4">This trainee hasn't been enrolled in any training sessions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'h-12 w-12 rounded-lg flex items-center justify-center',
                      session.status === 'completed' ? 'bg-emerald-100' :
                      session.status === 'in_progress' ? 'bg-blue-100' :
                      session.status === 'scheduled' ? 'bg-amber-100' :
                      'bg-red-100'
                    )}>
                      {session.status === 'completed' ? (
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      ) : session.status === 'in_progress' ? (
                        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                      ) : session.status === 'scheduled' ? (
                        <Calendar className="h-6 w-6 text-amber-600" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{session.training?.module || 'Training Session'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.sessionDate)} • {formatDuration(session.duration)}
                      </p>
                      {session.topic && <p className="text-sm text-muted-foreground">{session.topic}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getTrainingStatusBadge(session.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

{/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.slice(0, 3).map(session => (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg border-l-4 border-amber-500">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{session.training?.module || 'Training Session'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.sessionDate)} • {formatDuration(session.duration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getTrainingStatusBadge(session.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {trainee.enrollments && trainee.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Enrollment Details
            </CardTitle>
            <CardDescription>
              Location, job number, timesheet, and other enrollment context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainee.enrollments.map(enrollment => (
                <div key={enrollment.id} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <h4 className="font-medium">{enrollment.course?.title || 'Training Course'}</h4>
                    {getTrainingStatusBadge(enrollment.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {enrollment.location && (
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <span className="ml-1 font-medium">{enrollment.location.name} ({enrollment.location.code})</span>
                      </div>
                    )}
                    {enrollment.jobNumber && (
                      <div>
                        <span className="text-muted-foreground">Job Number:</span>
                        <span className="ml-1 font-medium">{enrollment.jobNumber}</span>
                      </div>
                    )}
                    {enrollment.timesheetNumber && (
                      <div>
                        <span className="text-muted-foreground">Timesheet:</span>
                        <span className="ml-1 font-medium">{enrollment.timesheetNumber}</span>
                      </div>
                    )}
                    {enrollment.trainingDate && (
                      <div>
                        <span className="text-muted-foreground">Training Date:</span>
                        <span className="ml-1 font-medium">{formatDate(enrollment.trainingDate)}</span>
                      </div>
                    )}
                    {enrollment.photoUrl && (
                      <div>
                        <span className="text-muted-foreground">Photo:</span>
                        <a href={enrollment.photoUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600">View</a>
                      </div>
                    )}
                    {enrollment.idUrl && (
                      <div>
                        <span className="text-muted-foreground">ID Document:</span>
                        <a href={enrollment.idUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600">View</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
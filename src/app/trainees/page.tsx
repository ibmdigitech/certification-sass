"use client";

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Users, Loader2 } from 'lucide-react';
import { TraineeListing } from '@/components/trainee/TraineeListing';
import { AlertBanner } from '@/components/ui/alert-banner';

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
  createdAt: string;
  _count: {
    documents: number;
    trainingSessions: number;
  };
  documents: Array<{ id: number; type: string; status: string }>;
  trainingSessions: Array<{ id: number; sessionDate: string; training: { module: string | null } | null; status: string }>;
}

export default function TraineesPage() {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainees = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/trainees');
      if (!response.ok) throw new Error('Failed to fetch trainees');
      const data = await response.json();
      setTrainees(data.trainees || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trainees');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  const handleAddTrainee = () => {
    // Navigate to new trainee page or open modal
    window.location.href = '/trainees/new';
  };

  const handleViewTrainee = (trainee: Trainee) => {
    window.location.href = `/trainees/${trainee.id}`;
  };

  const handleViewDocuments = (trainee: Trainee) => {
    window.location.href = `/trainees/${trainee.id}/documents`;
  };

  const handleViewTraining = (trainee: Trainee) => {
    window.location.href = `/trainees/${trainee.id}/training`;
  };

  const handleViewCertificates = (trainee: Trainee) => {
    window.location.href = `/trainees/${trainee.id}/certificates`;
  };

  const handleEditTrainee = (trainee: Trainee) => {
    window.location.href = `/trainees/${trainee.id}/edit`;
  };

  const handleDeleteTrainee = async (trainee: Trainee) => {
    if (!confirm(`Are you sure you want to delete ${trainee.firstName} ${trainee.lastName}?`)) return;
    try {
      const response = await fetch(`/api/trainees/${trainee.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete trainee');
      fetchTrainees();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete trainee');
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Trainees"
        description="Manage trainees, identity documents, and photos."
        action={
          <Button onClick={handleAddTrainee}>
            <Plus className="mr-2 h-4 w-4" />
            Add Trainee
          </Button>
        }
      />

      {error && (
        <AlertBanner
          variant="error"
          title="Error loading trainees"
          description={error}
        />
      )}

      <TraineeListing
        initialTrainees={trainees}
        onAddTrainee={handleAddTrainee}
        onViewTrainee={handleViewTrainee}
        onViewDocuments={handleViewDocuments}
        onViewTraining={handleViewTraining}
        onViewCertificates={handleViewCertificates}
        onEditTrainee={handleEditTrainee}
        onDeleteTrainee={handleDeleteTrainee}
      />
    </div>
  );
}
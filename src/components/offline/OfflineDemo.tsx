'use client';

import { useState } from 'react';
import { useOfflineApi, useOfflineMutation } from '@/lib/offline/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, Wifi, WifiOff } from 'lucide-react';

export function OfflineDemo() {
  const [jobTitle, setJobTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const { create, processQueue, get } = useOfflineApi();
  const jobMutations = useOfflineMutation('jobs');

  const handleCreateJob = async () => {
    if (!jobTitle || !customerName) {
      setMessage('Please fill in all fields');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('Creating job...');

    const result = await create('jobs', {
      companyId: 1,
      customerId: 1,
      type: 'inspection',
      title: jobTitle,
      customerName,
    });

    if (result.success) {
      if (result.queued) {
        setStatus('success');
        setMessage('Job created offline! Will sync when online.');
      } else {
        setStatus('success');
        setMessage('Job created successfully!');
      }
      setJobTitle('');
      setCustomerName('');
    } else {
      setStatus('error');
      setMessage(result.error?.message || 'Failed to create job');
    }
  };

  const handleSync = async () => {
    setStatus('loading');
    setMessage('Syncing...');
    const result = await processQueue();
    if (result.success) {
      setStatus('success');
      setMessage(`Synced ${result.syncedCount} changes`);
    } else {
      setStatus('error');
      setMessage(`Synced ${result.syncedCount}, failed ${result.failedCount}`);
    }
  };

  const handleFetchCached = async () => {
    setStatus('loading');
    setMessage('Fetching cached data...');
    try {
      const data = await get('jobs-list', async () => {
        const res = await fetch('/api/jobs?companyId=1');
        return res.json();
      }) as { jobs: unknown[] } | undefined;
      setStatus('success');
      setMessage(`Loaded ${data?.jobs?.length || 0} jobs from ${data ? 'cache' : 'server'}`);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to load data');
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">Offline Demo</span>
          {navigator.onLine ? (
            <Wifi className="h-5 w-5 text-emerald-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-destructive" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Input
            placeholder="Job Title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            disabled={status === 'loading'}
          />
          <Input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={status === 'loading'}
          />
        </div>

        <Button onClick={handleCreateJob} disabled={status === 'loading'} className="w-full">
          {status === 'loading' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Job
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleSync} disabled={status === 'loading'} className="w-full">
            <Loader2 className="h-4 w-4 mr-2" /> Sync Now
          </Button>
          <Button variant="outline" onClick={handleFetchCached} disabled={status === 'loading'} className="w-full">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Load Cached
          </Button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
            status === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
            'bg-blue-500/10 text-blue-500 border border-blue-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {status === 'success' && <CheckCircle2 className="h-4 w-4" />}
              {status === 'error' && <AlertCircle className="h-4 w-4" />}
              {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{message}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
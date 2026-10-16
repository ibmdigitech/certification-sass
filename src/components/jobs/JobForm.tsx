"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Job, CreateJobInput, UpdateJobInput, Customer, User } from "@/types/job";
import { cn } from "@/lib/utils";

interface JobFormProps {
  job?: Job | null;
  customers: Customer[];
  engineers: User[];
  onSubmit: (data: CreateJobInput | UpdateJobInput) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function JobForm({ job, customers, engineers, onSubmit, onClose, isLoading = false }: JobFormProps) {
  const isEditing = !!job;
  
  const [formData, setFormData] = useState<Partial<CreateJobInput & UpdateJobInput>>({
    customerId: job?.customerId || 0,
    type: job?.type || '',
    status: job?.status || 'PENDING',
    scheduledDate: job?.scheduledDate ? new Date(job.scheduledDate).toISOString().split('T')[0] : '',
    engineerId: job?.engineerId || 0,
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: CreateJobInput | UpdateJobInput = {
      ...formData,
      customerId: Number(formData.customerId),
      engineerId: formData.engineerId ? Number(formData.engineerId) : undefined,
      scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : undefined,
    } as CreateJobInput | UpdateJobInput;

    await onSubmit(submitData);
  };

  return (
    <Dialog open={!!job} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Job Order' : 'Create Job Order'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update job order ${job?.jobNumber}`
              : 'Fill in the details below to create a new job order.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <select
                id="customerId"
                value={formData.customerId || ''}
                onChange={(e) => handleChange('customerId', e.target.value ? Number(e.target.value) : 0)}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                )}
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.contact} {customer.email ? `(${customer.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Job Type</Label>
              <Input
                id="type"
                placeholder="e.g., Inspection, Training, Certification"
                value={formData.type || ''}
                onChange={(e) => handleChange('type', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status || 'pending'}
                onChange={(e) => handleChange('status', e.target.value)}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                )}
                disabled={!isEditing}
              >
                <option value="NEW">New</option>
                <option value="PENDING">Pending</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={typeof formData.scheduledDate === 'string' ? formData.scheduledDate : ''}
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="engineerId">Assign Engineer</Label>
              <select
                id="engineerId"
                value={formData.engineerId || ''}
                onChange={(e) => handleChange('engineerId', e.target.value ? Number(e.target.value) : 0)}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                )}
              >
                <option value="">Unassigned</option>
                {engineers.map((engineer) => (
                  <option key={engineer.id} value={engineer.id}>
                    {engineer.name} ({engineer.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
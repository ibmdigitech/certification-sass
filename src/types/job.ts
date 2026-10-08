export type JobStatus =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold';

export interface Job {
  id: number;
  companyId: number;
  customerId: number;
  jobNumber: string;
  type: string | null;
  status: JobStatus;
  scheduledDate: Date | string | null;
  engineerId: number | null;
  cancelReason: string | null;
  incompleteReason: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  customer?: Customer;
  engineer?: User;
  _count?: {
    certificates: number;
  };
}

export interface Customer {
  id: number;
  companyId: number;
  contact: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface CreateJobInput {
  companyId: number;
  customerId: number;
  type?: string;
  scheduledDate?: Date | string;
  engineerId?: number;
  jobNumber?: string;
}

export interface UpdateJobInput {
  customerId?: number;
  type?: string;
  status?: JobStatus;
  scheduledDate?: Date | string | null;
  engineerId?: number | null;
  cancelReason?: string | null;
  incompleteReason?: string | null;
}

export interface JobListParams {
  jobNumber?: string;
  status?: JobStatus;
  customerId?: number;
  engineerId?: number;
  page?: number;
  limit?: number;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  on_hold: 'bg-purple-100 text-purple-800 border-purple-200',
};
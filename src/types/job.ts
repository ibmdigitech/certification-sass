export type JobStatus =
  | 'NEW'
  | 'PENDING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'ON_HOLD';

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
  NEW: 'New',
  PENDING: 'Pending',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  NEW: 'bg-gray-100 text-gray-800 border-gray-200',
  PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
  PENDING_APPROVAL: 'bg-purple-100 text-purple-800 border-purple-200',
  APPROVED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  ON_HOLD: 'bg-orange-100 text-orange-800 border-orange-200',
};
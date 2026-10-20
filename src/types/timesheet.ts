import type { TimesheetStatus } from '@/lib/services/timesheet.service';

export type { TimesheetStatus };
export { TIMESHEET_STATUS_LABELS, TIMESHEET_STATUS_COLORS } from '@/lib/services/timesheet.service';

export interface Timesheet {
  id: number;
  companyId: number;
  timesheetNumber: string;
  timesheetType: string;
  userId: number;
  jobId: number | null;
  jobServiceId: number | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  breakMinutes: number;
  travelTimeMinutes: number;
  totalWorkingHours: number | null;
  overtimeHours: number | null;
  additionalWork: string | null;
  workCompletionStatus: string | null;
  inspectionResult: string | null;
  workLocation: string | null;
  description: string | null;
  status: string;
  approvedBy: number | null;
  reviewedBy: number | null;
  reviewComments: string | null;
  reviewedAt: Date | null;
  approvedAt: Date | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimesheetUser {
  id: number;
  name: string;
  email: string | null;
}

export interface TimesheetJob {
  id: number;
  jobNumber: string;
  customer: { id: number; contact: string | null; email: string | null; phone: string | null; name: string | null } | null;
  engineer: { id: number; name: string | null } | null;
  assignedInspector: { id: number; name: string | null } | null;
  location: { id: number; code: string | null; name: string | null } | null;
  site: string | null;
}

export interface TimesheetWithRelations extends Timesheet {
  user: TimesheetUser | null;
  job: TimesheetJob | null;
  equipmentItems: TimesheetEquipmentItem[];
}

export interface TimesheetEquipmentItem {
  id: number;
  companyId: number;
  timesheetId: number;
  equipmentId: number | null;
  equipmentType: string | null;
  equipmentDescription: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  equipmentCode: string | null;
  quantity: number | null;
  inspectionResult: string | null;
  inspectionDate: Date | null;
  remarks: string | null;
  certificateStatus: string | null;
  reportStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimesheetListParams {
  page?: number;
  limit?: number;
  userId?: number;
  jobId?: number;
  jobNumber?: string;
  status?: string;
  statuses?: string[];
  dateFrom?: string;
  dateTo?: string;
  engineerId?: number;
  customerId?: number;
  equipmentType?: string;
  inspectionResult?: string;
}

export interface TimesheetListResponse {
  timesheets: TimesheetWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TimesheetSummary {
  total: number;
  draft: number;
  submitted: number;
  pendingReview: number;
  approved: number;
  returned: number;
  awaitingReport: number;
  awaitingCertificate: number;
  awaitingInvoice: number;
}

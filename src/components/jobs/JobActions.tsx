"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ConfirmDialog } from "@/components/jobs/ConfirmDialog";
import { JobService } from "@/lib/services/job.service";
import {
  UserCheck,
  CalendarClock,
  Play,
  Send,
  CheckCircle2,
  Award,
  Truck,
  XCircle,
  Loader2,
} from "lucide-react";

export interface JobActionTarget {
  id: number;
  status: string;
  jobNumber: string;
}

interface JobActionsProps {
  job: JobActionTarget;
  onActionPerformed: () => void;
}

type ActionKey =
  | "ASSIGN"
  | "RESCHEDULE"
  | "START"
  | "SUBMIT_FOR_APPROVAL"
  | "APPROVE"
  | "COMPLETE"
  | "GENERATE_CERTIFICATE"
  | "CONFIRM_DELIVERY"
  | "CANCEL";

interface ActionDef {
  key: ActionKey;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive" | "outline";
  requiresReason?: boolean;
  requiresDate?: boolean;
  requiresEngineer?: boolean;
  requiresInspector?: boolean;
}

export function JobActions({ job, onActionPerformed }: JobActionsProps) {
  const { data: session } = useSession();
  const role = session?.user?.role || null;

  const [confirmAction, setConfirmAction] = useState<ActionDef | null>(null);
  const [reason, setReason] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [engineerId, setEngineerId] = useState("");
  const [inspectorId, setInspectorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = (job.status || "NEW").toUpperCase();

  // Determine which actions are available for the current status
  const availableActions: ActionDef[] = [];
  const can = (from: string, to: string) => JobService.canTransition(from, to);

  if (status === "NEW" || status === "PENDING") {
    availableActions.push(
      { key: "ASSIGN", label: "Assign Personnel", icon: <UserCheck className="h-4 w-4" />, requiresEngineer: true },
      { key: "RESCHEDULE", label: "Schedule / Reschedule", icon: <CalendarClock className="h-4 w-4" />, requiresDate: true },
      { key: "CANCEL", label: "Cancel Job", icon: <XCircle className="h-4 w-4" />, variant: "destructive", requiresReason: true }
    );
  }
  if (status === "SCHEDULED") {
    availableActions.push(
      { key: "START", label: "Start Work", icon: <Play className="h-4 w-4" /> },
      { key: "RESCHEDULE", label: "Reschedule", icon: <CalendarClock className="h-4 w-4" />, requiresDate: true },
      { key: "CANCEL", label: "Cancel Job", icon: <XCircle className="h-4 w-4" />, variant: "destructive", requiresReason: true }
    );
  }
  if (status === "IN_PROGRESS") {
    availableActions.push(
      { key: "SUBMIT_FOR_APPROVAL", label: "Submit for Approval", icon: <Send className="h-4 w-4" /> },
      { key: "COMPLETE", label: "Complete Job", icon: <CheckCircle2 className="h-4 w-4" /> },
      { key: "CANCEL", label: "Cancel Job", icon: <XCircle className="h-4 w-4" />, variant: "destructive", requiresReason: true }
    );
  }
  if (status === "PENDING_APPROVAL") {
    availableActions.push(
      { key: "APPROVE", label: "Approve", icon: <CheckCircle2 className="h-4 w-4" /> },
      { key: "CANCEL", label: "Cancel Job", icon: <XCircle className="h-4 w-4" />, variant: "destructive", requiresReason: true }
    );
  }
  if (status === "APPROVED" || status === "COMPLETED") {
    availableActions.push(
      { key: "GENERATE_CERTIFICATE", label: "Generate Certificate", icon: <Award className="h-4 w-4" /> },
      { key: "CONFIRM_DELIVERY", label: "Confirm Delivery", icon: <Truck className="h-4 w-4" /> }
    );
  }
  if (status === "ON_HOLD") {
    availableActions.push(
      { key: "START", label: "Resume Work", icon: <Play className="h-4 w-4" /> },
      { key: "CANCEL", label: "Cancel Job", icon: <XCircle className="h-4 w-4" />, variant: "destructive", requiresReason: true }
    );
  }

  // Filter by role authorization; keep blocked ones visible but disabled with explanation
  const visibleActions = availableActions.filter((a) => {
    // Always show the action; disable if role cannot perform
    return true;
  });

  const isAuthorized = (a: ActionDef) => JobService.canRolePerform(a.key, role);

  const blockedReason = (a: ActionDef): string | null => {
    if (!isAuthorized(a)) {
      const roles = (JobService as any).ACTION_ROLES?.[a.key] ?? [];
      return `Your role (${role || "unknown"}) is not authorized for this action. Required: ${roles.join(", ")}.`;
    }
    return null;
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: confirmAction.key,
          reason: reason || undefined,
          scheduledDate: scheduledDate || undefined,
          engineerId: engineerId ? Number(engineerId) : undefined,
          inspectorId: inspectorId ? Number(inspectorId) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }
      setConfirmAction(null);
      setReason("");
      setScheduledDate("");
      setEngineerId("");
      setInspectorId("");
      onActionPerformed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (visibleActions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No actions available for status "{job.status}". This job is in a terminal state.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {visibleActions.map((a) => {
          const blocked = blockedReason(a);
          return (
            <Button
              key={a.key}
              variant={a.variant === "destructive" ? "destructive" : a.variant === "outline" ? "outline" : "default"}
              size="sm"
              disabled={!!blocked}
              title={blocked ?? a.label}
              onClick={() => {
                setConfirmAction(a);
                setError(null);
                setReason("");
              }}
            >
              {a.icon}
              <span className="ml-1.5">{a.label}</span>
            </Button>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction ? `${confirmAction.label} — ${job.jobNumber}` : ""}
        description={
          confirmAction?.key === "CANCEL"
            ? "This will cancel the job order and mark it as cancelled. This action is audited and cannot be undone."
            : confirmAction?.key === "GENERATE_CERTIFICATE"
            ? "Certificate issuance is subject to eligibility and approval rules. You will be redirected to the certificate workflow."
            : confirmAction?.key === "CONFIRM_DELIVERY"
            ? "This confirms that the certificate has been delivered to the customer. Requires an issued certificate."
            : `Are you sure you want to perform "${confirmAction?.label}" on this job order? This action is audited.`
        }
        confirmLabel={confirmAction?.label ?? "Confirm"}
        variant={confirmAction?.variant === "destructive" ? "destructive" : "default"}
        isLoading={isSubmitting}
        blockedReason={confirmAction ? blockedReason(confirmAction) : null}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Extended dialog for actions needing reason/date/personnel */}
      <Dialog open={!!confirmAction && !!(confirmAction.requiresReason || confirmAction.requiresDate || confirmAction.requiresEngineer || confirmAction.requiresInspector)} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmAction?.label} — {job.jobNumber}</DialogTitle>
            <DialogDescription>
              Provide the required details to proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {error && <AlertBanner variant="error" title="Action failed" description={error} />}
            {confirmAction?.requiresReason && (
              <div className="space-y-1">
                <Label>Reason *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={confirmAction.key === "CANCEL" ? "Reason for cancellation..." : "Reason..."}
                  required
                />
              </div>
            )}
            {confirmAction?.requiresDate && (
              <div className="space-y-1">
                <Label>New Scheduled Date *</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>
            )}
            {confirmAction?.requiresEngineer && (
              <div className="space-y-1">
                <Label>Engineer ID</Label>
                <Input
                  type="number"
                  value={engineerId}
                  onChange={(e) => setEngineerId(e.target.value)}
                  placeholder="Engineer user ID"
                />
              </div>
            )}
            {confirmAction?.requiresInspector && (
              <div className="space-y-1">
                <Label>Inspector ID</Label>
                <Input
                  type="number"
                  value={inspectorId}
                  onChange={(e) => setInspectorId(e.target.value)}
                  placeholder="Inspector user ID"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
  blockedReason?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  blockedReason,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={
                variant === "destructive"
                  ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100"
                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10"
              }
            >
              <AlertTriangle
                className={
                  variant === "destructive" ? "h-5 w-5 text-red-600" : "h-5 w-5 text-primary"
                }
              />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {blockedReason && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            <span className="font-semibold">Action blocked: </span>
            {blockedReason}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading || !!blockedReason}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

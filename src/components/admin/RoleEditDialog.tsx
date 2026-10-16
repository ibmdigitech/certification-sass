"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface PermissionOption {
  id: number;
  name: string;
  description: string;
  resource?: string;
}

interface RoleEditDialogProps {
  role: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (roleId: number, updates: any) => void;
  onCancel: () => void;
}

export function RoleEditDialog({ role, open, onOpenChange, onUpdate, onCancel }: RoleEditDialogProps) {
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [availablePermissions, setAvailablePermissions] = useState<PermissionOption[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
    role?.permissions?.map((p: any) => p.permission?.id) || role?.permissions?.map((p: any) => p.id) || []
  );
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(role?.name || "");
      setDescription(role?.description || "");
      setSelectedPermissions(
        role?.permissions?.map((p: any) => p.permission?.id) || role?.permissions?.map((p: any) => p.id) || []
      );
      fetchPermissions();
    }
  }, [open, role]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data = await res.json();
        setAvailablePermissions(data.permissions || []);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (id: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role?.id) {
      onCancel();
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdate(role.id, {
        name,
        description,
        permissions: selectedPermissions,
      });
      onCancel();
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            Update role information and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-role-name">Role Name *</Label>
            <Input
              id="edit-role-name"
              placeholder="e.g. TECHNICAL_MANAGER"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-description">Description</Label>
            <Textarea
              id="edit-role-description"
              placeholder="Description of this role..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-permissions">Permissions</Label>
            <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-1">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading permissions...
                </div>
              ) : (
                availablePermissions.map((perm) => (
                  <div key={perm.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={`perm-edit-${perm.id}`}
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="mt-1"
                    />
                    <div className="grid gap-1 leading-none">
                      <label htmlFor={`perm-edit-${perm.id}`} className="font-medium text-sm cursor-pointer">
                        {perm.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {perm.description || perm.resource || ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCancel()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RoleEditDialog;
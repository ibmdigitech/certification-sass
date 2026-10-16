"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

interface PermissionOption {
  id: number;
  name: string;
  description: string;
  resource?: string;
}

interface RoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (roleData: any) => void;
}

export function RoleCreateDialog({ open, onOpenChange, onCreate }: RoleCreateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availablePermissions, setAvailablePermissions] = useState<PermissionOption[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPermissions();
    }
  }, [open]);

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

  const handleSubmit = async () => {
    if (!name) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        name,
        description,
        permissions: selectedPermissions,
      });
      setName("");
      setDescription("");
      setSelectedPermissions([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create role:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Define a new role with specific permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Role Name *</Label>
            <Input
              id="role-name"
              placeholder="e.g. TECHNICAL_MANAGER"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              placeholder="Brief description of this role..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Permissions</Label>
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
                      id={`perm-${perm.id}`}
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="mt-1"
                    />
                    <div className="grid gap-1 leading-none">
                      <label htmlFor={`perm-${perm.id}`} className="font-medium text-sm cursor-pointer">
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="h-4 w-4 mr-2" /> Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RoleCreateDialog;
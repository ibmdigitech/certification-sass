"use client";

import { UserCog, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage system users, assign roles, and control access permissions.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/30">
        <div className="text-center space-y-3">
          <UserCog className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">User Management</p>
            <p className="text-sm text-muted-foreground/70">User administration coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, ShieldCheck, Award, FileText, Settings } from "lucide-react";
import { AdminUsersPanel } from "./AdminUsersPanel";
import { AdminRolesPanel } from "./AdminRolesPanel";
import { AdminPermissionsPanel } from "./AdminPermissionsPanel";
import { AdminAuditLogsPanel } from "./AdminAuditLogsPanel";
import { AdminSystemPanel } from "./AdminSystemPanel";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Administration Panel</h1>
        <p className="text-sm text-muted-foreground">
          System administration, user management, roles, and permissions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <ShieldCheck className="h-4 w-4 mr-2" /> Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Award className="h-4 w-4 mr-2" /> Permissions
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" /> Audit Logs
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="h-4 w-4 mr-2" /> System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <AdminUsersPanel />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <AdminRolesPanel />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <AdminPermissionsPanel />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AdminAuditLogsPanel />
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <AdminSystemPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Search, CheckCircle2, Bell, Send, Edit, Loader2 } from "lucide-react";

interface NotificationTrigger {
  id: number;
  eventCode: string;
  description: string;
  recipientRole: string | null;
  channels: string;
  templateSubject: string | null;
  templateBody: string | null;
  isActive: boolean;
  lastTriggeredAt: string | null;
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/setup/notifications");
      if (res.ok) {
        const json = await res.json();
        setSettings(json.settings || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const filtered = settings.filter(
    (s) =>
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.eventCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mails & Notifications Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure operational event triggers, automated email dispatch, and client alerts
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search triggers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Table matching Screenshot Page 4 */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 font-bold text-xs">#</TableHead>
                <TableHead className="font-bold text-xs min-w-[280px]">Trigger Description</TableHead>
                <TableHead className="font-bold text-xs">Event Code</TableHead>
                <TableHead className="font-bold text-xs">Target Recipients</TableHead>
                <TableHead className="font-bold text-xs">Channel</TableHead>
                <TableHead className="font-bold text-xs text-center">Status</TableHead>
                <TableHead className="font-bold text-xs">Template Preview</TableHead>
                <TableHead className="font-bold text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-xs text-muted-foreground">
                    No notification triggers found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 text-xs">
                    <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-semibold text-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{item.description}</span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {item.eventCode}
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {item.recipientRole || "All Managers"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                        {item.channels}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-[11px]">
                      {item.templateSubject || "Standard Subject"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

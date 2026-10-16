"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Plus, ShieldCheck, UserCheck, Mail, Loader2, Award } from "lucide-react";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("INSPECTION_ENGINEER");
  const [accreditation, setAccreditation] = useState("EIAC-Dubai");

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (res.ok) {
        const json = await res.json();
        setMembers(json.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch team members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        setName("");
        setEmail("");
        fetchMembers();
      }
    } catch (err) {
      console.error("Failed to create user:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header matching Screenshot Page 2 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm text-muted-foreground">
            Inspector authorizations, technical managers, and operational coordinators
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create +
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Register an inspector, reviewer, or operations coordinator into the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="memberName">Full Name *</Label>
                <Input
                  id="memberName"
                  placeholder="e.g. Bilal Sarwar (Inspection Engineer)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="memberEmail">Email Address *</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  placeholder="engineer@tsc.ae"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="memberRole">Designation / Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSPECTION_ENGINEER">Inspection Engineer (User)</SelectItem>
                    <SelectItem value="TECHNICAL_MANAGER">Technical Manager (Reviewer)</SelectItem>
                    <SelectItem value="OPERATIONS_COORDINATOR">Operations Coordinator (Admin)</SelectItem>
                    <SelectItem value="TRAINER">Certified Trainer</SelectItem>
                    <SelectItem value="CEO">CEO / Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="memberAccreditation">Primary Accreditation Stamp</Label>
                <Select value={accreditation} onValueChange={setAccreditation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EIAC-Dubai">EIAC - Dubai</SelectItem>
                    <SelectItem value="ENAS-Abu Dhabi">ENAS - Abu Dhabi</SelectItem>
                    <SelectItem value="Both">Both (EIAC + ENAS)</SelectItem>
                    <SelectItem value="Internal">Internal Training Scope</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Member
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Input matching Screenshot */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search team members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid of Team Member Cards (Matches Screenshot Page 2) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-28 bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No team members found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((m) => {
            const isActive = m.status === "active";
            // Determine nice display role
            let roleLabel = m.role.replace(/_/g, " ");
            if (m.role === "INSPECTOR" || m.role === "INSPECTION_ENGINEER") roleLabel = "Inspection Engineer (User)";
            if (m.role === "ADMIN") roleLabel = "Operations Coordinator (Admin)";
            if (m.role === "TECHNICAL_MANAGER") roleLabel = "Technical Manager (Reviewer)";

            return (
              <Card key={m.id} className="hover:shadow-md transition p-4 border flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {m.name.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs tracking-tight uppercase line-clamp-1">
                          {m.name}
                        </h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200">
                          EIAC-Dubai
                        </Badge>
                      </div>
                    </div>
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1 ${
                        isActive ? "bg-emerald-500 shadow-sm" : "bg-red-500"
                      }`}
                      title={isActive ? "Active Account" : "Inactive Account"}
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                    {roleLabel}
                  </p>
                </div>

                <div className="pt-2 border-t mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">{m.email}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

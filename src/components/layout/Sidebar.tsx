"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  Award,
  ShieldCheck,
  Briefcase,
  Flag,
  CalendarDays,
  Printer,
  UploadCloud,
  FileText,
  Search,
  DollarSign,
  Truck,
  CheckCircle,
  Menu,
  ChevronDown,
  Wifi,
  WifiOff,
  RotateCcw,
  UserCog,
  Settings,
  Lock,
  Shield,
  Server,
  MapPin,
  Camera,
  ListChecks,
  Eye,
  CalendarClock,
  BarChart3,
  UserPlus,
  Contact,
  FileSignature,
  Hammer,
  CreditCard,
  GitMerge,
  Mail,
  Sliders,
  Clock,
  UserCheck,
  Building2,
  RefreshCw,
  PackageCheck,
  Sparkles,
  Bot,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useOfflineStatus, useOfflineQueue } from "@/lib/offline/hooks";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

// ── Group definitions ──────────────────────────────────────────────

const setupGroup: NavGroup = {
  name: "Setup",
  items: [
    { name: "Team Members", href: "/team", icon: Users },
    { name: "Customers", href: "/customers", icon: Contact },
    // { name: "Sub Contractors", href: "/setup/subcontractors", icon: Building2 }, // TODO: Implement page
    { name: "Job Performing Types", href: "/setup/job-types", icon: ListChecks },
    { name: "General Definitions", href: "/setup/general-definitions", icon: Sliders },
    { name: "Customers Merge", href: "/setup/customers-merge", icon: GitMerge },
    { name: "Mails & Notifications", href: "/setup/notifications", icon: Mail },
  ],
};

const salesGroup: NavGroup = {
  name: "Sales",
  items: [
    // { name: "Sales Persons", href: "/sales/sales-persons", icon: UserCheck }, // TODO: Implement page
    { name: "Sales Inquiries", href: "/sales/inquiries", icon: FileText },
    { name: "Sales Quotations", href: "/sales/quotations", icon: FileSignature },
    { name: "Job Orders", href: "/jobs", icon: Briefcase },
    // { name: "Job Order Assignments", href: "/jobs/assignments", icon: CalendarClock }, // TODO: Implement page
  ],
};

const operationsGroup: NavGroup = {
  name: "Operations & DC",
  items: [
    { name: "Inspector Calendar", href: "/schedule", icon: CalendarDays },
    { name: "Job Performing", href: "/job-performing", icon: ClipboardCheck },
    { name: "Delivery Confirmation", href: "/delivery", icon: Truck },
    { name: "Dispatch Consignments", href: "/delivery/dispatch", icon: PackageCheck },
    { name: "Delivery Logs", href: "/delivery-logs", icon: ClipboardList },
    { name: "Certificates", href: "/certificates", icon: Award },
    { name: "Timesheets", href: "/timesheets?type=INSPECTION", icon: Clock },
    // { name: "Payments", href: "/payments", icon: CreditCard }, // TODO: Implement page
    { name: "Accounts & Invoicing", href: "/accounts", icon: DollarSign },
    { name: "Client LPOs", href: "/accounts/lpos", icon: FileText },
  ],
};

const trainingCertificationGroup: NavGroup = {
  name: "Training Certification",
  items: [
    { name: "Overview", href: "/training/overview", icon: LayoutDashboard },
    { name: "Courses", href: "/training", icon: BookOpen },
    { name: "Sessions", href: "/training/sessions", icon: CalendarDays },
    { name: "Trainees", href: "/trainees", icon: Users },
    { name: "Enrollments", href: "/training/enrollments", icon: UserPlus },
    { name: "Assessments", href: "/training/assessments", icon: ClipboardList },
    { name: "Competencies", href: "/training/competencies", icon: Award },
    { name: "Certificates", href: "/training/certificates", icon: FileCheck2 },
    { name: "Certificate Renewal", href: "/training/certificates/renewal", icon: RefreshCw },
    { name: "Timesheets", href: "/timesheets?type=TRAINING", icon: Clock },
    { name: "Reports", href: "/training/reports", icon: BarChart3 },
  ],
};

const inspectionCertificationGroup: NavGroup = {
  name: "Inspection Certification",
  items: [
    { name: "Overview", href: "/inspections/overview", icon: LayoutDashboard },
    { name: "Inspections", href: "/inspections", icon: ClipboardCheck },
    { name: "Schedule", href: "/inspections/schedule", icon: CalendarClock },
    { name: "Checklists", href: "/inspections/checklists", icon: ListChecks },
    { name: "Findings", href: "/inspections/findings", icon: Flag },
    { name: "Review", href: "/inspections/review", icon: Eye },
    { name: "Reschedule", href: "/inspections/reschedule", icon: RotateCcw },
    { name: "Certificates", href: "/inspections/certificates", icon: ShieldCheck },
    { name: "Competency Matrix", href: "/qms/competency-matrix", icon: Award },
    { name: "Accreditation", href: "/qms/accreditation", icon: ShieldCheck },
  ],
};

const fieldTrainingGroup: NavGroup = {
  name: "Field Training",
  items: [
    { name: "Field Dashboard", href: "/field", icon: MapPin },
    { name: "Today's Sessions", href: "/field/today", icon: CalendarDays },
    { name: "Attendance", href: "/field/attendance", icon: CheckCircle },
    { name: "Document Capture", href: "/field/document-capture", icon: Camera },
    { name: "Assessment", href: "/field/assessment", icon: ClipboardCheck },
  ],
};

const administrationGroup: NavGroup = {
  name: "Administration",
  items: [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Roles", href: "/admin/roles", icon: ShieldCheck },
    { name: "Permissions", href: "/admin/permissions", icon: Award },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
    { name: "System", href: "/admin/system", icon: Server },
  ],
};

const aiGroup: NavGroup = {
  name: "CertAI Copilot",
  items: [
    { name: "AI Assistants Hub", href: "/ai/assistants", icon: Sparkles, badge: "8 Live" },
    { name: "Staged Output Review", href: "/ai/review", icon: Bot, badge: "HITL" },
  ],
};

// ── Workspace top-level items ──────────────────────────────────────

const workspaceItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Global Schedule", href: "/schedule", icon: CalendarDays },
  { name: "All Certificates", href: "/certificates", icon: FileText },
  { name: "Bulk ID Upload", href: "/documents/bulk-upload", icon: UploadCloud },
  { name: "Print Center", href: "/print-center", icon: Printer },
  { name: "Public Verification", href: "/verify", icon: Search },
];

// ── All nav groups ─────────────────────────────────────────────────

const allNavGroups: NavGroup[] = [
  setupGroup,
  salesGroup,
  operationsGroup,
  inspectionCertificationGroup,
  trainingCertificationGroup,
  fieldTrainingGroup,
  aiGroup,
  administrationGroup,
];

// ── Sidebar component ──────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname() ?? "";
  const { isOnline, queueStatus } = useOfflineStatus();
  const { processQueue } = useOfflineQueue();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const isSetup = pathname.startsWith("/team") || pathname.startsWith("/customers") || pathname.startsWith("/setup");
    const isSales = pathname.startsWith("/sales") || pathname.startsWith("/jobs");
    const isOperations = pathname.startsWith("/schedule") || pathname.startsWith("/job-performing") || pathname.startsWith("/delivery") || pathname.startsWith("/delivery-logs") || pathname.startsWith("/certificates") || pathname.startsWith("/timesheets") || pathname.startsWith("/accounts") || pathname.startsWith("/payments");
    const isTraining = pathname.startsWith("/training") || pathname.startsWith("/trainees");
    const isInspection = pathname.startsWith("/inspections");
    const isField = pathname.startsWith("/field");
    const isAdmin = pathname.startsWith("/admin");

    return {
      "Setup": isSetup,
      "Sales": isSales || (!isSetup && !isOperations && !isTraining && !isInspection && !isField && !isAdmin),
      "Operations & DC": isOperations,
      "Training Certification": isTraining,
      "Inspection Certification": isInspection,
      "Field Training": isField,
      "Administration": isAdmin,
    };
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const isItemActive = (href: string) => {
    // Exact-match routes (parent list pages that have sub-routes)
    const exactMatchRoutes = [
      "/training",
      "/inspections",
      "/jobs",
      "/schedule",
      "/accounts",
      "/delivery",
      "/field",
    ];
    if (exactMatchRoutes.includes(href)) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isGroupActive = (items: NavItem[]) => items.some((item) => isItemActive(item.href));

  // ── Sub-components ────────────────────────────────────────────────

  const NavGroupItem = ({ group }: { group: NavGroup }) => {
    const isExpanded = expandedGroups[group.name] ?? false;
    const isActive = isGroupActive(group.items);
    const GroupIcon = group.items[0].icon;

    return (
      <div className="w-full">
        <button
          type="button"
          className={cn(
            "w-full justify-start gap-2.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider h-8 inline-flex items-center rounded-lg transition-all duration-200 group/btn",
            isActive
              ? "text-primary bg-primary/10 font-bold shadow-xs"
              : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/60 hover:translate-x-0.5"
          )}
          onClick={() => toggleGroup(group.name)}
        >
          <GroupIcon className={cn(
            "h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover/btn:scale-110",
            isActive ? "text-primary" : "text-muted-foreground/70"
          )} />
          <span className="flex-1 truncate text-left text-[11px]">{group.name}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 text-muted-foreground/70",
              isExpanded && "rotate-180"
            )}
          />
        </button>
        {isExpanded && (
          <nav className="pl-3.5 mt-1 space-y-1 w-full border-l border-muted/50 ml-2">
            {group.items.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group relative w-full justify-start gap-2.5 px-2.5 py-1.5 text-xs h-8 inline-flex items-center rounded-md transition-all duration-200 cursor-pointer overflow-hidden",
                    active
                      ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent font-semibold text-primary shadow-xs border-l-2 border-primary pl-2"
                      : "text-muted-foreground/90 hover:text-foreground hover:bg-muted/60 hover:translate-x-1"
                  )}
                >
                  <item.icon className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 transition-all duration-200 group-hover:scale-110",
                    active ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary"
                  )} />
                  <span className="flex-1 truncate text-left">{item.name}</span>
                  {item.badge && (
                    <Badge variant="outline" className={cn(
                      "text-[10px] py-0 px-1.5 font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground border-primary" : "bg-muted/60 text-muted-foreground border-border/50"
                    )}>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    );
  };

  const NavWorkspaceItems = () => (
    <nav className="flex flex-col gap-1 w-full">
      <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider flex items-center justify-between">
        <span>Workspace</span>
        <span className="h-1 w-1 rounded-full bg-primary/60" />
      </div>
      {workspaceItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group relative w-full justify-start gap-2.5 px-3 py-1.5 text-xs h-8 inline-flex items-center rounded-md transition-all duration-200 cursor-pointer overflow-hidden",
              isActive
                ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent font-semibold text-primary shadow-xs border-l-2 border-primary pl-2.5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:translate-x-1"
            )}
          >
            <item.icon className={cn(
              "h-3.5 w-3.5 flex-shrink-0 transition-all duration-200 group-hover:scale-110",
              isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary"
            )} />
            <span className="flex-1 truncate text-left">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const BottomConnectionBadge = () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    return (
    <div className="pt-2 border-t px-2 flex flex-col gap-1 text-[11px] text-muted-foreground shrink-0">
      <div className="flex items-center justify-between">
        {isOnline ? (
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="h-3.5 w-3.5" />
            Online
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-rose-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <WifiOff className="h-3.5 w-3.5" />
            Offline Mode
          </span>
        )}
        <span className="font-mono text-[10px] text-muted-foreground/70">v2.5.0</span>
      </div>

      {!isOnline && queueStatus.pending > 0 && (
        <div className="flex items-center justify-between bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded">
          <span>{queueStatus.pending} pending sync</span>
          <button
            onClick={() => processQueue()}
            disabled={queueStatus.isSyncing}
            className="underline font-semibold hover:opacity-80"
          >
            {queueStatus.isSyncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      )}
    </div>
    );
  };

  // ── Sidebar content (shared between desktop & mobile) ─────────────

  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-2 mb-4">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-base tracking-tight leading-none truncate">CertAI</span>
          <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-medium mt-0.5">
            Enterprise SaaS
          </span>
        </div>
      </div>

      {/* Scrollable Nav Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
        <NavWorkspaceItems />

        <div className="space-y-1 pt-2 border-t">
          {allNavGroups.map((group) => (
            <NavGroupItem key={group.name} group={group} />
          ))}
        </div>
      </div>

      {/* Bottom Connection Status */}
      <BottomConnectionBadge />
    </>
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-background/95 backdrop-blur-xl h-screen sticky top-0 px-3 py-4 select-none">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <div className="md:hidden flex items-center justify-between p-3 border-b bg-background">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col h-full">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="font-bold text-sm tracking-tight">CertAI</span>
        </div>
      </div>
    </>
  );
}

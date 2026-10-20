"use client";

import { useEffect, useState } from "react";
import { Bell, User, AlertTriangle, CheckCircle2, XCircle, FileText, Award, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NotificationSummary {
  required: number;
  rejected: number;
  certified: number;
  approval: number;
  total: number;
  breakdown: {
    required: {
      missingRequiredDocuments: number;
      expiringCertificates: number;
      pendingEnrollments: number;
    };
    rejected: {
      rejectedDocuments: number;
      rejectedReports: number;
      revokedCertificates: number;
    };
    certified: {
      issuedCertificates: number;
      approvedReports: number;
    };
    approval: {
      pendingCertificateApproval: number;
      pendingReportApproval: number;
      pendingAccreditation: number;
    };
  };
}

const notificationRoutes = {
  required: {
    missingRequiredDocuments: "/trainees",
    expiringCertificates: "/certificates",
    pendingEnrollments: "/training/enrollments",
  },
  rejected: {
    rejectedDocuments: "/trainees",
    rejectedReports: "/inspections/reports",
    revokedCertificates: "/certificates",
  },
  certified: {
    issuedCertificates: "/certificates",
    approvedReports: "/inspections/reports",
  },
  approval: {
    pendingCertificateApproval: "/certificates",
    pendingReportApproval: "/inspections/reports",
    pendingAccreditation: "/settings/accreditation",
  },
};

const notificationIcons = {
  required: {
    missingRequiredDocuments: FileText,
    expiringCertificates: Award,
    pendingEnrollments: ClipboardCheck,
  },
  rejected: {
    rejectedDocuments: FileText,
    rejectedReports: ClipboardCheck,
    revokedCertificates: Award,
  },
  certified: {
    issuedCertificates: Award,
    approvedReports: ClipboardCheck,
  },
  approval: {
    pendingCertificateApproval: Award,
    pendingReportApproval: ClipboardCheck,
    pendingAccreditation: CheckCircle2,
  },
};

const categoryLabels = {
  required: "Required Action",
  rejected: "Rejected Items",
  certified: "Certified & Approved",
  approval: "Pending Approval",
};

const categoryIcons = {
  required: AlertTriangle,
  rejected: XCircle,
  certified: CheckCircle2,
  approval: CheckCircle2,
};

const categoryColors = {
  required: "text-amber-600 bg-amber-50 border-amber-200",
  rejected: "text-red-600 bg-red-50 border-red-200",
  certified: "text-emerald-600 bg-emerald-50 border-emerald-200",
  approval: "text-blue-600 bg-blue-50 border-blue-200",
};

const categoryIconColors = {
  required: "text-amber-500",
  rejected: "text-red-500",
  certified: "text-emerald-500",
  approval: "text-blue-500",
};

export function Header() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications/summary");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          setHasError(false);
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const getTotalCount = (category: keyof Omit<NotificationSummary, "total" | "breakdown">) => {
    if (!notifications) return 0;
    const breakdown = notifications.breakdown[category];
    return Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  };

  const hasNotifications = notifications && notifications.total > 0;

  return (
    <header className="h-14 sm:h-16 border-b bg-background/50 backdrop-blur-md flex items-center justify-end px-3 sm:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Separate Notification Icons - Hidden on small mobile to avoid header squish, visible on md/tablet+ */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5" role="group" aria-label="Notification categories">
          {/* Required Action - Amber */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative p-2.5 rounded-xl transition-all duration-200",
              getTotalCount("required") > 0
                ? "bg-amber-50 text-amber-600 hover:bg-amber-100 hover:scale-105 active:scale-95"
                : "text-amber-500 hover:bg-amber-50 hover:text-amber-600 hover:scale-105 active:scale-95"
            )}
            onClick={() => router.push("/trainees")}
            title="Required Action"
            aria-label={`Required Action: ${getTotalCount("required")} items`}
          >
            <AlertTriangle className="h-6 w-6 transition-transform duration-200 hover:rotate-3" />
            {getTotalCount("required") > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-h-[18px] w-[18px] rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-background shadow-lg animate-pulse">
                {getTotalCount("required") > 99 ? "99+" : getTotalCount("required")}
              </span>
            )}
          </Button>

          {/* Rejected Items - Red */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative p-2.5 rounded-xl transition-all duration-200",
              getTotalCount("rejected") > 0
                ? "bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 active:scale-95"
                : "text-red-500 hover:bg-red-50 hover:text-red-600 hover:scale-105 active:scale-95"
            )}
            onClick={() => router.push("/inspections/reports")}
            title="Rejected Items"
            aria-label={`Rejected Items: ${getTotalCount("rejected")} items`}
          >
            <XCircle className="h-6 w-6 transition-transform duration-200 hover:-rotate-3" />
            {getTotalCount("rejected") > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-h-[18px] w-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-background shadow-lg animate-pulse">
                {getTotalCount("rejected") > 99 ? "99+" : getTotalCount("rejected")}
              </span>
            )}
          </Button>

          {/* Certified & Approved - Green */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative p-2.5 rounded-xl transition-all duration-200",
              getTotalCount("certified") > 0
                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 active:scale-95"
                : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 hover:scale-105 active:scale-95"
            )}
            onClick={() => router.push("/certificates")}
            title="Certified & Approved"
            aria-label={`Certified & Approved: ${getTotalCount("certified")} items`}
          >
            <CheckCircle2 className="h-6 w-6 transition-transform duration-200 hover:scale-110" />
            {getTotalCount("certified") > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-h-[18px] w-[18px] rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-background shadow-lg">
                {getTotalCount("certified") > 99 ? "99+" : getTotalCount("certified")}
              </span>
            )}
          </Button>

          {/* Pending Approval - Blue */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative p-2.5 rounded-xl transition-all duration-200",
              getTotalCount("approval") > 0
                ? "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 active:scale-95"
                : "text-blue-500 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 active:scale-95"
            )}
            onClick={() => router.push("/inspections/reports")}
            title="Pending Approval"
            aria-label={`Pending Approval: ${getTotalCount("approval")} items`}
          >
            <FileText className="h-6 w-6 transition-transform duration-200 hover:rotate-3" />
            {getTotalCount("approval") > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-h-[18px] w-[18px] rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-background shadow-lg animate-pulse">
                {getTotalCount("approval") > 99 ? "99+" : getTotalCount("approval")}
              </span>
            )}
          </Button>

          <div className="w-px h-7 bg-border mx-1.5" />

        </div>

        {/* Notifications Dropdown (Bell) - Combined View */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
              <Bell className="h-6 w-6 text-muted-foreground transition-transform duration-200 hover:scale-110 hover:text-foreground" />
              {hasNotifications && (
                <span className="absolute -top-0.5 -right-0.5 min-h-[18px] w-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-background shadow-lg animate-bounce">
                  {notifications!.total > 99 ? "99+" : notifications!.total}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[calc(100vw-32px)] sm:w-96 max-w-sm sm:max-w-md p-0">
            <DropdownMenuLabel className="px-4 py-3 border-b flex items-center justify-between">
              <span>Notifications</span>
              {notifications && notifications.total > 0 && (
                <span className="text-xs text-muted-foreground">{notifications.total} total</span>
              )}
            </DropdownMenuLabel>

            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : hasError ? (
              <div className="p-4 text-center text-sm text-red-500">
                Failed to load notifications. <button className="underline ml-1" onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : notifications && notifications.total > 0 ? (
              <>
                {/* Required Category */}
                <div className="border-b">
                  <DropdownMenuLabel className={`px-4 py-2 flex items-center gap-2 ${categoryColors.required}`}>
                    <categoryIcons.required className={`h-4 w-4 ${categoryIconColors.required}`} />
                    <span className="font-medium">Required Action</span>
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                      {getTotalCount("required")}
                    </span>
                  </DropdownMenuLabel>
                  <div className="px-2 py-1 space-y-1">
                    {notifications.breakdown.required.missingRequiredDocuments > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-amber-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.required.missingRequiredDocuments}>
                          <notificationIcons.required.missingRequiredDocuments className="h-3.5 w-3.5 text-amber-500" />
                          <span>Missing required documents</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700">
                            {notifications.breakdown.required.missingRequiredDocuments}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {notifications.breakdown.required.expiringCertificates > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-amber-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.required.expiringCertificates}>
                          <notificationIcons.required.expiringCertificates className="h-3.5 w-3.5 text-amber-500" />
                          <span>Expiring certificates (30 days)</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700">
                            {notifications.breakdown.required.expiringCertificates}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {notifications.breakdown.required.pendingEnrollments > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-amber-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.required.pendingEnrollments}>
                          <notificationIcons.required.pendingEnrollments className="h-3.5 w-3.5 text-amber-500" />
                          <span>Pending training enrollments</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700">
                            {notifications.breakdown.required.pendingEnrollments}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </div>
                </div>

                {/* Rejected Category */}
                <div className="border-b">
                  <DropdownMenuLabel className={`px-4 py-2 flex items-center gap-2 ${categoryColors.rejected}`}>
                    <categoryIcons.rejected className={`h-4 w-4 ${categoryIconColors.rejected}`} />
                    <span className="font-medium">Rejected Items</span>
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      {getTotalCount("rejected")}
                    </span>
                  </DropdownMenuLabel>
                  <div className="px-2 py-1 space-y-1">
                    {notifications.breakdown.rejected.rejectedDocuments > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-red-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.rejected.rejectedDocuments}>
                          <notificationIcons.rejected.rejectedDocuments className="h-3.5 w-3.5 text-red-500" />
                          <span>Rejected documents</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
                            {notifications.breakdown.rejected.rejectedDocuments}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {notifications.breakdown.rejected.rejectedReports > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-red-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.rejected.rejectedReports}>
                          <notificationIcons.rejected.rejectedReports className="h-3.5 w-3.5 text-red-500" />
                          <span>Rejected inspection reports</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
                            {notifications.breakdown.rejected.rejectedReports}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {notifications.breakdown.rejected.revokedCertificates > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-red-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.rejected.revokedCertificates}>
                          <notificationIcons.rejected.revokedCertificates className="h-3.5 w-3.5 text-red-500" />
                          <span>Revoked certificates</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
                            {notifications.breakdown.rejected.revokedCertificates}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </div>
                </div>

                {/* Certified Category */}
                <div className="border-b">
                  <DropdownMenuLabel className={`px-4 py-2 flex items-center gap-2 ${categoryColors.certified}`}>
                    <categoryIcons.certified className={`h-4 w-4 ${categoryIconColors.certified}`} />
                    <span className="font-medium">Certified & Approved</span>
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                      {getTotalCount("certified")}
                    </span>
                  </DropdownMenuLabel>
                  <div className="px-2 py-1 space-y-1">
                    {notifications.breakdown.certified.issuedCertificates > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-emerald-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.certified.issuedCertificates}>
                          <notificationIcons.certified.issuedCertificates className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Issued certificates</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700">
                            {notifications.breakdown.certified.issuedCertificates}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {notifications.breakdown.certified.approvedReports > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-emerald-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.certified.approvedReports}>
                          <notificationIcons.certified.approvedReports className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Approved inspection reports</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700">
                            {notifications.breakdown.certified.approvedReports}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </div>
                </div>

                {/* Approval Category */}
                <div>
                  <DropdownMenuLabel className={`px-4 py-2 flex items-center gap-2 ${categoryColors.approval}`}>
                    <categoryIcons.approval className={`h-4 w-4 ${categoryIconColors.approval}`} />
                    <span className="font-medium">Pending Approval</span>
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {getTotalCount("approval")}
                    </span>
                  </DropdownMenuLabel>
                  <div className="px-2 py-1 space-y-1">
                    {notifications.breakdown.approval.pendingCertificateApproval > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-blue-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.approval.pendingCertificateApproval}>
                          <notificationIcons.approval.pendingCertificateApproval className="h-3.5 w-3.5 text-blue-500" />
                          <span>Certificate approvals pending</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                            {notifications.breakdown.approval.pendingCertificateApproval}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {notifications.breakdown.approval.pendingReportApproval > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-blue-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.approval.pendingReportApproval}>
                          <notificationIcons.approval.pendingReportApproval className="h-3.5 w-3.5 text-blue-500" />
                          <span>Report approvals pending</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                            {notifications.breakdown.approval.pendingReportApproval}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {notifications.breakdown.approval.pendingAccreditation > 0 && (
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-blue-50 rounded-md"
                        inset
                      >
                        <Link href={notificationRoutes.approval.pendingAccreditation}>
                          <notificationIcons.approval.pendingAccreditation className="h-3.5 w-3.5 text-blue-500" />
                          <span>Accreditation pending verification</span>
                          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                            {notifications.breakdown.approval.pendingAccreditation}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className="px-4 py-2 text-center text-sm text-primary hover:bg-primary/10"
              inset
            >
              <Link href="/notifications">View all notifications</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Company Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
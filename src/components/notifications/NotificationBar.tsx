"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle, FileText, Award, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

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

const notificationLabels = {
  required: {
    missingRequiredDocuments: "Missing required documents",
    expiringCertificates: "Expiring certificates (30 days)",
    pendingEnrollments: "Pending training enrollments",
  },
  rejected: {
    rejectedDocuments: "Rejected documents",
    rejectedReports: "Rejected inspection reports",
    revokedCertificates: "Revoked certificates",
  },
  certified: {
    issuedCertificates: "Issued certificates",
    approvedReports: "Approved inspection reports",
  },
  approval: {
    pendingCertificateApproval: "Certificate approvals pending",
    pendingReportApproval: "Report approvals pending",
    pendingAccreditation: "Accreditation pending verification",
  },
};

const categoryConfig = {
  required: {
    label: "Required Action",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    iconColor: "text-amber-500",
    badgeColor: "bg-amber-100 text-amber-700",
    itemBg: "hover:bg-amber-50",
  },
  rejected: {
    label: "Rejected Items",
    icon: XCircle,
    color: "text-red-600 bg-red-50 border-red-200",
    iconColor: "text-red-500",
    badgeColor: "bg-red-100 text-red-700",
    itemBg: "hover:bg-red-50",
  },
  certified: {
    label: "Certified & Approved",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-500",
    badgeColor: "bg-emerald-100 text-emerald-700",
    itemBg: "hover:bg-emerald-50",
  },
  approval: {
    label: "Pending Approval",
    icon: CheckCircle2,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    iconColor: "text-blue-500",
    badgeColor: "bg-blue-100 text-blue-700",
    itemBg: "hover:bg-blue-50",
  },
};

const categoryIcons: Record<Category, Record<string, LucideIcon>> = {
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

type Category = "required" | "rejected" | "certified" | "approval";

interface NotificationBarProps {
  compact?: boolean;
}

export function NotificationBar({ compact = false }: NotificationBarProps) {
  const [notifications, setNotifications] = useState<NotificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications/summary");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const getTotalCount = (category: Category) => {
    if (!notifications) return 0;
    const breakdown = notifications.breakdown[category];
    return Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  };

  const hasNotifications = notifications && notifications.total > 0;

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          Loading notifications...
        </CardContent>
      </Card>
    );
  }

  if (!hasNotifications) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">All caught up!</span>
            <span className="text-sm text-green-600">No pending notifications</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const categories: Category[] = ["required", "rejected", "certified", "approval"];

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const config = categoryConfig[category];
        const count = getTotalCount(category);
        const breakdown = notifications!.breakdown[category];
        const items = Object.entries(breakdown).filter(([, value]) => value > 0);

        if (items.length === 0) return null;

        return (
          <Card key={category} className={`border-l-4 ${config.color}`}>
            <CardContent className={`py-3 ${compact ? "px-3" : "px-4"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <config.icon className={`h-4 w-4 ${config.iconColor}`} />
                  <span className="font-medium text-sm">{config.label}</span>
                  <Badge variant="secondary" className={config.badgeColor}>
                    {count}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1.5 ml-6">
                {items.map(([key, value]) => {
                  const Icon = categoryIcons[category][key];
                  const route = notificationRoutes[category][key as keyof typeof notificationRoutes[typeof category]];
                  return (
                    <Link
                      key={key}
                      href={route}
                      className={`flex items-center gap-2 text-sm ${config.itemBg} rounded px-2 py-1.5 transition-colors`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
                      <span className="flex-1 truncate">{notificationLabels[category][key as keyof typeof notificationLabels[typeof category]]}</span>
                      <Badge variant="secondary" className={config.badgeColor}>
                        {value}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
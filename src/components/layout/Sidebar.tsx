"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  ClipboardCheck,
  FileCheck2,
  Award,
  ShieldCheck,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Search,
  Flag,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  name: string;
  items: NavItem[];
  isExpanded?: boolean;
}

const trainingCertificationGroup: NavGroup = {
  name: "Training Certification",
  isExpanded: true,
  items: [
    { name: "Overview", href: "/training/overview", icon: LayoutDashboard },
    { name: "Courses", href: "/training/courses", icon: BookOpen },
    { name: "Sessions", href: "/training/sessions", icon: Calendar },
    { name: "Trainees", href: "/trainees", icon: Users },
    { name: "Assessments", href: "/training/assessments", icon: ClipboardCheck },
    { name: "Competencies", href: "/training/competencies", icon: Award },
    { name: "Certificates", href: "/training/certificates", icon: FileCheck2 },
  ],
};

const inspectionCertificationGroup: NavGroup = {
  name: "Inspection Certification",
  isExpanded: true,
  items: [
    { name: "Overview", href: "/inspections/overview", icon: LayoutDashboard },
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Inspections", href: "/inspections", icon: ClipboardCheck },
    { name: "Findings", href: "/inspections/findings", icon: Flag },
    { name: "Certificates", href: "/inspections/certificates", icon: ShieldCheck },
  ],
};

const standaloneItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Settings", href: "/settings/system", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname() ?? '';
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Training Certification": true,
    "Inspection Certification": true,
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const isItemActive = (href: string) => pathname.startsWith(href);
  const isGroupActive = (items: NavItem[]) => items.some(item => isItemActive(item.href));

  const NavGroupItem = ({ group, isMobile = false }: { group: NavGroup; isMobile?: boolean }) => {
    const isExpanded = expandedGroups[group.name] ?? true;
    const isActive = isGroupActive(group.items);
    const GroupIcon = group.items[0].icon;

    return (
      <div className="w-full">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 px-2 py-1.5 text-sm font-medium",
            isActive ? "text-foreground bg-secondary/50" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => toggleGroup(group.name)}
        >
          <GroupIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{group.name}</span>
          <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
        </Button>
        {isExpanded && (
          <nav className="pl-6 mt-1 space-y-1 w-full animate-in fade-in slide-in-from-top-2 duration-200">
            {group.items.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link key={item.name} href={item.href} className="w-full">
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 px-2 py-1.5 text-sm",
                      active ? "bg-secondary/50 font-medium text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    );
  };

  const NavStandaloneItems = () => (
    <nav className="flex flex-col gap-2 w-full mt-4">
      {standaloneItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link key={item.name} href={item.href} className="w-full">
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-2", isActive ? "bg-secondary/50 font-medium" : "text-muted-foreground")}
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.name}
            </Button>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-background/50 backdrop-blur-xl h-screen sticky top-0 px-4 py-6">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="h-8 w-8 bg-indigo-600 rounded-md flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">CertAI</span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          <NavStandaloneItems />
          
          <NavGroupItem group={trainingCertificationGroup} />
          
          <NavGroupItem group={inspectionCertificationGroup} />
        </div>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <div className="md:hidden flex items-center p-4 border-b">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-6">
            <div className="flex items-center gap-2 px-2 mb-6 mt-4">
              <div className="h-8 w-8 bg-indigo-600 rounded-md flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">CertAI</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6">
              <NavStandaloneItems />
              
              <NavGroupItem group={trainingCertificationGroup} isMobile />
              
              <NavGroupItem group={inspectionCertificationGroup} isMobile />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
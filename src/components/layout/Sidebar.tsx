"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardCheck,
  FileCheck2,
  Settings,
  Menu,
  X,
  Briefcase
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Training", href: "/training", icon: GraduationCap },
  { name: "Trainees", href: "/trainees", icon: Users },
  { name: "Inspections", href: "/inspections", icon: ClipboardCheck },
  { name: "Certificates", href: "/certificates", icon: FileCheck2 },
  { name: "Settings", href: "/settings/system", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname() ?? '';

  const NavLinks = () => (
    <nav className="flex flex-col gap-2 w-full mt-4">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link key={item.name} href={item.href} className="w-full">
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn("w-full justify-start", isActive ? "bg-secondary/50 font-medium" : "text-muted-foreground")}
            >
              <item.icon className="mr-2 h-4 w-4" />
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
        <NavLinks />
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
            <NavLinks />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

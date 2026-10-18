import { AppShell } from "@/components/layout/AppShell";
import "@/app/globals.css";

export const metadata = {
  title: "CertAI - Offline-First Training & Inspection",
  description: "Enterprise-grade training, competency, and inspection SaaS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CertAI",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>{children}</AppShell>
  );
}
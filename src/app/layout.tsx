import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata = {
  title: "CertAI - Offline-First Training & Inspection",
  description: "Enterprise-grade training, competency, and inspection SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

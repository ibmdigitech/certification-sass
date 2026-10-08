import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/components/providers";
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
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

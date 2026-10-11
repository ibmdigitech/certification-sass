import { Providers } from "@/components/providers";
import { OfflineProviderWrapper } from "@/components/offline/OfflineProviderWrapper";
import "@/app/globals.css";

export const metadata = {
  title: "CertAI - Sign In",
  description: "Sign in to CertAI",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CertAI" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Providers>
          <OfflineProviderWrapper>
            {children}
          </OfflineProviderWrapper>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('SW registered:', registration.scope);
                  }).catch(error => {
                    console.log('SW registration failed:', error);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
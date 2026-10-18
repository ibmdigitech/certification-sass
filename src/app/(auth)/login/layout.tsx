import "@/app/globals.css";

export const metadata = {
  title: "CertAI - Sign In",
  description: "Sign in to CertAI",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {children}
    </div>
  );
}
import { Metadata } from 'next';
import { VerificationPageClient } from './VerificationPageClient';

interface PageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: 'Certificate Verification | CertAI',
  description: 'Verify the authenticity of certificates issued by CertAI',
  robots: 'noindex, nofollow',
};

export default async function VerificationPage({ params }: PageProps) {
  const { token } = await params;

  return <VerificationPageClient initialToken={token} />;
}
import { Metadata } from 'next';
import { VerificationPageClient } from './certificate/[token]/VerificationPageClient';

export const metadata: Metadata = {
  title: 'Certificate Verification | CertAI',
  description: 'Verify the authenticity of certificates issued by CertAI',
  robots: 'noindex, nofollow',
};

export default function VerifyPage() {
  return <VerificationPageClient />;
}
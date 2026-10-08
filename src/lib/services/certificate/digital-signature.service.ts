import * as forge from 'node-forge';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export interface DigitalSignature {
  signature: string;
  algorithm: string;
  publicKey: string;
  timestamp: Date;
  certificateId: number;
}

export interface SignatureVerificationResult {
  valid: boolean;
  signature?: DigitalSignature;
  error?: string;
  verifiedAt: Date;
}

export interface CertificateSigningRequest {
  certificateId: number;
  data: string;
  algorithm?: 'RSA-SHA256' | 'RSA-SHA512' | 'ECDSA-SHA256';
}

export class DigitalSignatureService {
  private static readonly DEFAULT_ALGORITHM = 'RSA-SHA256';
  private static readonly KEY_SIZE = 2048;

  static async generateKeyPair(): Promise<KeyPair> {
    const keys = forge.pki.rsa.generateKeyPair({ bits: this.KEY_SIZE });
    
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
    const publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey);

    return { privateKey: privateKeyPem, publicKey: publicKeyPem };
  }

  static async storeKeyPair(companyId: number, keyPair: KeyPair, purpose: string = 'certificate-signing'): Promise<void> {
    await prisma.document.create({
      data: {
        companyId,
        name: `${purpose}-keys-${Date.now()}`,
        type: 'key-pair',
        category: 'security',
        url: JSON.stringify(keyPair),
        mimeType: 'application/json',
      },
    });
  }

  static async getKeyPair(companyId: number, purpose: string = 'certificate-signing'): Promise<KeyPair | null> {
    const doc = await prisma.document.findFirst({
      where: {
        companyId,
        type: 'key-pair',
        name: { startsWith: purpose },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!doc) return null;

    try {
      return JSON.parse(doc.url) as KeyPair;
    } catch {
      return null;
    }
  }

  static async signCertificate(data: CertificateSigningRequest): Promise<DigitalSignature> {
    const { certificateId, data: signData, algorithm = this.DEFAULT_ALGORITHM } = data;

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { id: true, number: true, companyId: true },
    });

    if (!certificate) {
      throw new Error(`Certificate with id ${certificateId} not found`);
    }

    const keyPair = await this.getKeyPair(certificate.companyId);
    if (!keyPair) {
      throw new Error('No signing key pair found for company');
    }

    const privateKey = forge.pki.privateKeyFromPem(keyPair.privateKey);
    const md = forge.md.sha256.create();
    md.update(signData, 'utf8');
    
    const signature = privateKey.sign(md);
    const signatureB64 = forge.util.encode64(signature);

    const digitalSignature: DigitalSignature = {
      signature: signatureB64,
      algorithm,
      publicKey: keyPair.publicKey,
      timestamp: new Date(),
      certificateId,
    };

    await this.storeSignature(certificateId, digitalSignature);

    return digitalSignature;
  }

  static async storeSignature(certificateId: number, signature: DigitalSignature): Promise<void> {
    await prisma.document.create({
      data: {
        companyId: 0,
        name: `signature-${certificateId}-${Date.now()}`,
        type: 'digital-signature',
        category: 'security',
        url: JSON.stringify(signature),
        mimeType: 'application/json',
        entityType: 'certificate',
        entityId: certificateId,
      },
    });
  }

  static async getSignaturesForCertificate(certificateId: number): Promise<DigitalSignature[]> {
    const docs = await prisma.document.findMany({
      where: {
        entityType: 'certificate',
        entityId: certificateId,
        type: 'digital-signature',
      },
      orderBy: { createdAt: 'desc' },
    });

    return docs
      .map(doc => {
        try {
          return JSON.parse(doc.url) as DigitalSignature;
        } catch {
          return null;
        }
      })
      .filter((s): s is DigitalSignature => s !== null);
  }

  static async verifySignature(
    certificateId: number,
    signature: DigitalSignature,
    originalData: string
  ): Promise<SignatureVerificationResult> {
    try {
      const publicKey = forge.pki.publicKeyFromPem(signature.publicKey);
      const md = forge.md.sha256.create();
      md.update(originalData, 'utf8');
      
      const signatureBytes = forge.util.decode64(signature.signature);
      const valid = publicKey.verify(md.digest().bytes(), signatureBytes);

      return {
        valid,
        signature: valid ? signature : undefined,
        error: valid ? undefined : 'Signature verification failed',
        verifiedAt: new Date(),
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification error',
        verifiedAt: new Date(),
      };
    }
  }

  static async verifyCertificateSignature(certificateId: number, originalData: string): Promise<SignatureVerificationResult> {
    const signatures = await this.getSignaturesForCertificate(certificateId);
    
    if (signatures.length === 0) {
      return {
        valid: false,
        error: 'No digital signature found for certificate',
        verifiedAt: new Date(),
      };
    }

    const latestSignature = signatures[0];
    return this.verifySignature(certificateId, latestSignature, originalData);
  }

  static generateCertificateHash(certificate: {
    id: number;
    number: string;
    companyId: number;
    jobId: number;
    status: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): string {
    const data = `${certificate.id}|${certificate.number}|${certificate.companyId}|${certificate.jobId}|${certificate.status}|${certificate.createdAt.toISOString()}|${certificate.updatedAt.toISOString()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static async signCertificateHash(certificateId: number): Promise<DigitalSignature> {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { id: true, number: true, companyId: true, jobId: true, status: true, createdAt: true, updatedAt: true },
    });

    if (!certificate) {
      throw new Error(`Certificate with id ${certificateId} not found`);
    }

    const hash = this.generateCertificateHash(certificate);
    return this.signCertificate({ certificateId, data: hash });
  }

  static async verifyCertificateIntegrity(certificateId: number): Promise<{
    valid: boolean;
    hashMatch: boolean;
    signatureValid: boolean;
    currentHash: string;
    signedHash?: string;
    error?: string;
  }> {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { id: true, number: true, companyId: true, jobId: true, status: true, createdAt: true, updatedAt: true },
    });

    if (!certificate) {
      return { valid: false, hashMatch: false, signatureValid: false, currentHash: '', error: 'Certificate not found' };
    }

    const currentHash = this.generateCertificateHash(certificate);
    const signatures = await this.getSignaturesForCertificate(certificateId);

    if (signatures.length === 0) {
      return {
        valid: false,
        hashMatch: false,
        signatureValid: false,
        currentHash,
        error: 'No digital signature found',
      };
    }

    const latestSignature = signatures[0];
    const signedData = latestSignature.signature;
    
    const verification = await this.verifySignature(certificateId, latestSignature, currentHash);

    return {
      valid: verification.valid,
      hashMatch: true,
      signatureValid: verification.valid,
      currentHash,
      signedHash: currentHash,
      error: verification.error,
    };
  }

  static async rotateKeys(companyId: number): Promise<KeyPair> {
    const newKeyPair = await this.generateKeyPair();
    await this.storeKeyPair(companyId, newKeyPair, 'certificate-signing');
    return newKeyPair;
  }

  static async createSelfSignedCertificate(companyId: number, commonName: string): Promise<{
    certificate: string;
    privateKey: string;
  }> {
    const keys = forge.pki.rsa.generateKeyPair({ bits: this.KEY_SIZE });
    
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
    
    const attrs = [{
      name: 'commonName',
      value: commonName,
    }, {
      name: 'organizationName',
      value: `Company ${companyId}`,
    }, {
      name: 'organizationalUnitName',
      value: 'Certificate Authority',
    }];
    
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey, forge.md.sha256.create());

    const certificatePem = forge.pki.certificateToPem(cert);
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);

    await prisma.document.create({
      data: {
        companyId,
        name: `ca-cert-${Date.now()}`,
        type: 'ca-certificate',
        category: 'security',
        url: JSON.stringify({ certificate: certificatePem, privateKey: privateKeyPem }),
        mimeType: 'application/json',
      },
    });

    return { certificate: certificatePem, privateKey: privateKeyPem };
  }
}

export default DigitalSignatureService;
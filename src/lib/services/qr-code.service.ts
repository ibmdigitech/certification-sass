import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface CertificateQRData {
  token: string;
  certificateNumber: string;
  verificationUrl: string;
  issuedAt: string;
  issuer: string;
}

export class QRCodeGenerator {
  private static readonly DEFAULT_OPTIONS: Required<QRCodeOptions> = {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  };

  private static readonly BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  static generateVerificationUrl(token: string): string {
    return `${this.BASE_URL}/verify/certificate/${token}`;
  }

  static createQRData(token: string, certificateNumber: string, issuer: string): CertificateQRData {
    return {
      token,
      certificateNumber,
      verificationUrl: this.generateVerificationUrl(token),
      issuedAt: new Date().toISOString(),
      issuer,
    };
  }

  static async generateQRCodeDataURL(
    data: string | CertificateQRData,
    options?: QRCodeOptions
  ): Promise<string> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const qrData = typeof data === 'string' ? data : JSON.stringify(data);

    try {
      return await QRCode.toDataURL(qrData, {
        width: opts.width,
        margin: opts.margin,
        color: opts.color,
        errorCorrectionLevel: opts.errorCorrectionLevel,
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateQRCodeSVG(
    data: string | CertificateQRData,
    options?: QRCodeOptions
  ): Promise<string> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const qrData = typeof data === 'string' ? data : JSON.stringify(data);

    try {
      return await QRCode.toString(qrData, {
        type: 'svg',
        width: opts.width,
        margin: opts.margin,
        color: opts.color,
        errorCorrectionLevel: opts.errorCorrectionLevel,
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code SVG: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateQRCodeBuffer(
    data: string | CertificateQRData,
    options?: QRCodeOptions
  ): Promise<Buffer> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const qrData = typeof data === 'string' ? data : JSON.stringify(data);

    try {
      return await QRCode.toBuffer(qrData, {
        width: opts.width,
        margin: opts.margin,
        color: opts.color,
        errorCorrectionLevel: opts.errorCorrectionLevel,
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateCertificateQRCode(
    token: string,
    certificateNumber: string,
    issuer: string,
    options?: QRCodeOptions
  ): Promise<{
    dataURL: string;
    svg: string;
    buffer: Buffer;
    qrData: CertificateQRData;
  }> {
    const qrData = this.createQRData(token, certificateNumber, issuer);
    const jsonData = JSON.stringify(qrData);

    const [dataURL, svg, buffer] = await Promise.all([
      this.generateQRCodeDataURL(jsonData, options),
      this.generateQRCodeSVG(jsonData, options),
      this.generateQRCodeBuffer(jsonData, options),
    ]);

    return { dataURL, svg, buffer, qrData };
  }

  static parseQRData(qrString: string): CertificateQRData | null {
    try {
      const parsed = JSON.parse(qrString);
      if (
        parsed.token &&
        parsed.certificateNumber &&
        parsed.verificationUrl &&
        parsed.issuedAt &&
        parsed.issuer
      ) {
        return parsed as CertificateQRData;
      }
      return null;
    } catch {
      return null;
    }
  }

  static extractTokenFromURL(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const tokenIndex = pathParts.indexOf('certificate');
      if (tokenIndex !== -1 && tokenIndex + 1 < pathParts.length) {
        return pathParts[tokenIndex + 1];
      }
      return null;
    } catch {
      return null;
    }
  }
}

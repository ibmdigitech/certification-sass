import { prisma } from '@/lib/prisma';

export class CustomerCodeService {
  /**
   * Generates a unique, sequential customer code for a tenant.
   * Format: CUST-YYYY-XXXX (e.g. CUST-2026-0001, CUST-2026-0002)
   */
  static async generateCustomerCode(companyId: number, customPrefix?: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = (customPrefix || 'CUST').toUpperCase().trim();
    const pattern = `${prefix}-${year}-`;

    // Find the latest code for this company matching prefix and year
    const latest = await prisma.customer.findFirst({
      where: {
        companyId,
        code: {
          startsWith: pattern,
        },
      },
      orderBy: {
        code: 'desc',
      },
      select: {
        code: true,
      },
    });

    let nextNumber = 1;
    if (latest?.code) {
      const parts = latest.code.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }

    // Format with 4 digits padding
    const padded = String(nextNumber).padStart(4, '0');
    let candidateCode = `${pattern}${padded}`;

    // Ensure collision safety within company
    let exists = await prisma.customer.findFirst({
      where: { companyId, code: candidateCode },
      select: { id: true },
    });

    while (exists) {
      nextNumber += 1;
      candidateCode = `${pattern}${String(nextNumber).padStart(4, '0')}`;
      exists = await prisma.customer.findFirst({
        where: { companyId, code: candidateCode },
        select: { id: true },
      });
    }

    return candidateCode;
  }

  /**
   * Preview the next customer code without committing.
   */
  static async previewNextCode(companyId: number, customPrefix?: string): Promise<string> {
    return this.generateCustomerCode(companyId, customPrefix);
  }
}

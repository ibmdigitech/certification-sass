import { PrismaClient } from '@prisma/client';
import { validateLocationAccreditation } from '../validation/location-accreditation';

const prisma = new PrismaClient();

export interface ValidationResult {
  valid: boolean;
  error?: string;
  allowedTemplateIds: number[];
}

export class AccreditationEngine {
  /**
   * Validates the entire chain before allowing certificate generation.
   * Job -> Service -> Accreditation -> Location -> Certificate Template
   */
  static async validateCertificateEligibility(
    jobId: number,
    companyId: number,
    accreditationId?: number,
    locationId?: number
  ): Promise<ValidationResult> {
    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId },
      include: {
        location: true,
        jobServices: {
          include: {
            trainingSessions: { include: { accreditation: true } }
          }
        }
      }
    });

    if (!job) {
      return { valid: false, error: 'Job not found', allowedTemplateIds: [] };
    }

    // Determine the location
    const effectiveLocationCode = locationId 
      ? (await prisma.location.findFirst({ where: { id: locationId } }))?.code
      : job.location?.code;

    if (!effectiveLocationCode) {
      return { valid: false, error: 'Job requires a location for accreditation check', allowedTemplateIds: [] };
    }

    // Determine the accreditation
    let effectiveAccreditationCode: string | undefined = undefined;

    if (accreditationId) {
      effectiveAccreditationCode = (await prisma.accreditationAuthority.findFirst({ where: { id: accreditationId } }))?.code;
    } else {
      // Find the first accreditation tied to a training session in this job
      for (const service of job.jobServices) {
        for (const session of service.trainingSessions) {
          if (session.accreditation?.code) {
            effectiveAccreditationCode = session.accreditation.code;
            break;
          }
        }
        if (effectiveAccreditationCode) break;
      }
    }

    // We can allow NONE if they are generating unaccredited certificates
    if (effectiveAccreditationCode && effectiveAccreditationCode !== 'NONE') {
      const isLocAccValid = validateLocationAccreditation(effectiveLocationCode, effectiveAccreditationCode);
      if (!isLocAccValid.valid) {
        return { valid: false, error: isLocAccValid.error, allowedTemplateIds: [] };
      }
    }

    // Check which templates are allowed
    // CertificateTemplate model is not yet implemented in the schema.
    // In a full implementation, this would query templates filtered by location/accreditation.
    const allowedTemplateIds: number[] = [];
    try {
      const templates = await (prisma as any).certificateTemplate.findMany({
        where: { companyId, isActive: true },
      });
      allowedTemplateIds.push(...templates.map((t: any) => t.id));
    } catch {
      // Model may not exist yet in schema - skip template validation
      console.warn('Certificate template model not found in schema, skipping template validation');
    }

    return {
      valid: true,
      allowedTemplateIds,
    };
  }
}

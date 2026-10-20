import { prisma } from '@/lib/prisma';

export interface ScopeEligibilityCheckInput {
  userId: number;
  serviceType: 'INSPECTION' | 'TRAINING';
  scopeCode: string;
  targetDate: Date;
}

export interface ScopeEligibilityResult {
  eligible: boolean;
  reason?: string;
  authorizationLevel?: string;
  validUntil?: Date;
  expiredCredentials?: string[];
}

export class EngineerCompetencyService {
  static async verifySchedulingEligibility(input: ScopeEligibilityCheckInput): Promise<ScopeEligibilityResult> {
    const profile = await prisma.engineerProfile.findUnique({
      where: { userId: input.userId },
      include: { credentials: { where: { mandatoryForField: true, status: 'ACTIVE' } } }
    });
    if (!profile) return { eligible: false, reason: 'No engineer profile found for this user.' };
    if (!profile.isActive) return { eligible: false, reason: 'Engineer profile is currently deactivated.' };
    
    const auth = await prisma.inspectorScopeAuthorization.findFirst({
      where: {
        engineerProfileId: profile.id,
        scopeType: input.serviceType,
        scopeCode: input.scopeCode,
        status: 'ACTIVE',
        validFrom: { lte: input.targetDate },
        validUntil: { gte: input.targetDate },
      }
    });

    if (!auth) {
      return { eligible: false, reason: `Engineer lacks active scope authorization for scope: ${input.scopeCode}` };
    }

    const expiredList = profile.credentials.filter(c => c.expiryDate < input.targetDate).map(c => c.credentialName);
    if (expiredList.length > 0) {
      return { eligible: false, reason: `Mandatory field credentials expired: ${expiredList.join(', ')}`, expiredCredentials: expiredList };
    }

    return { eligible: true, authorizationLevel: auth.authorizationLevel, validUntil: auth.validUntil };
  }

  static async getCompetencyMatrix(companyId: number) {
    const engineers = await prisma.engineerProfile.findMany({
      where: { isActive: true, user: { companyId } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        credentials: true,
        authorizations: { where: { status: 'ACTIVE' } }
      },
      orderBy: { employeeId: 'asc' }
    });

    const now = new Date();
    return engineers.map(eng => {
      const scopes: Record<string, any> = {};
      for (const a of eng.authorizations) {
        const days = Math.ceil((a.validUntil.getTime() - now.getTime()) / 86400000);
        scopes[a.scopeCode] = {
          level: a.authorizationLevel,
          validUntil: a.validUntil,
          daysRemaining: days,
          status: days <= 0 ? 'EXPIRED' : days <= 30 ? 'EXPIRING_SOON' : 'ACTIVE'
        };
      }
      return {
        engineerId: eng.id,
        employeeId: eng.employeeId,
        name: eng.user.name,
        designation: eng.designation,
        primaryDiscipline: eng.primaryDiscipline,
        scopes
      };
    });
  }
}

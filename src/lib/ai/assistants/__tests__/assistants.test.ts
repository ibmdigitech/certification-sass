import { describe, it, expect } from 'vitest';
import {
  AssistantType,
  ASSISTANT_SCHEMAS,
  DocumentExtractorOutputSchema,
  SchedulingRecommendationSchema,
  InspectionQACheckSchema,
  CompetencyAssistantOutputSchema,
  AccreditationAuditReportSchema,
  BillingReconciliationSchema,
  DeliveryBatchTrackingSchema,
  OperationsExecutiveSummarySchema,
} from '../schemas';
import { ASSISTANT_REGISTRY, ASSISTANT_SYSTEM_PROMPTS } from '../prompts';

describe('AI Assistant Governance & Schemas', () => {
  it('should have all 8 specialized assistants in the registry with valid metadata and prompts', () => {
    const expectedTypes: AssistantType[] = [
      'DOCUMENT_EXTRACTOR',
      'SCHEDULING',
      'INSPECTION_QA',
      'COMPETENCY',
      'ACCREDITATION',
      'ACCOUNTS',
      'DELIVERY',
      'OPERATIONS_COPILOT',
    ];

    expect(ASSISTANT_REGISTRY).toHaveLength(8);
    for (const t of expectedTypes) {
      const match = ASSISTANT_REGISTRY.find((a) => a.type === t);
      expect(match).toBeDefined();
      expect(match?.name).toBeTruthy();
      expect(match?.description).toBeTruthy();
      expect(match?.approverRole).toBeTruthy();
      expect(ASSISTANT_SYSTEM_PROMPTS[t]).toBeTruthy();
      expect(ASSISTANT_SCHEMAS[t]).toBeDefined();
    }
  });

  describe('DocumentExtractorOutputSchema', () => {
    it('should validate valid LPO extraction output', () => {
      const valid = {
        clientMetadata: {
          companyName: 'Acme Heavy Industries',
          contactPerson: 'John Smith',
          contactEmail: 'john@acme.com',
          lpoNumber: 'LPO-2026-991',
        },
        equipmentItems: [
          {
            lineNumber: 1,
            description: '50-ton Mobile Crane',
            scopeCode: 'LIFT_CRANE_MOBILE' as const,
            serialNumber: 'CR-10293',
            capacityWithUnit: '50T',
            quantity: 1,
            needsHumanClarification: false,
          },
        ],
        commercialNotes: 'Fast track inspection requested within 48h',
      };
      const res = DocumentExtractorOutputSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('should fail when required clientMetadata or scopeCode is missing/invalid', () => {
      const invalid = {
        clientMetadata: {},
        equipmentItems: [
          {
            lineNumber: 1,
            description: 'Unknown item',
            scopeCode: 'INVALID_SCOPE',
            needsHumanClarification: false,
          },
        ],
      };
      const res = DocumentExtractorOutputSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe('InspectionQACheckSchema', () => {
    it('should validate complete inspection QA verification', () => {
      const valid = {
        overallRecommendation: 'READY_FOR_TM_SIGN_OFF' as const,
        contradictionsDetected: [],
        calculationVerification: {
          statedSWL: 50,
          appliedTestLoad: 62.5,
          calculatedOverloadPercent: 125,
          isWithinPermissibleStandardTolerance: true,
          standardReferenceApplied: 'BS 7121 Part 2',
          comment: 'Proof test load adheres to 125% static overload requirement',
        },
        defectClassificationReview: [
          {
            defectDescription: 'Minor paint peeling on outrigger leg',
            inspectorSeverity: 'PRIORITY_3' as const,
            suggestedSeverity: 'PRIORITY_3' as const,
            justification: 'Cosmetic defect, no structural impact',
          },
        ],
        calibrationAudit: {
          testToolsListed: ['Loadcell LC-901', 'Caliper CAL-04'],
          expiredToolsIdentified: [],
          allToolsValid: true,
        },
      };
      const res = InspectionQACheckSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });

  describe('SchedulingRecommendationSchema', () => {
    it('should validate optimal engineer scheduling assignments', () => {
      const valid = {
        date: '2026-10-21',
        suggestedAssignments: [
          {
            jobId: 101,
            jobServiceId: 201,
            customerName: 'Emirates Steel',
            locationName: 'Musaffah Industrial Area',
            requiredScopeCode: 'LIFT_CRANE_MOBILE',
            assignedEngineerId: 15,
            engineerName: 'Ahmed Al-Mansoor',
            matchConfidenceScore: 95,
            matchReason: 'Valid LEEA lifting accreditation + active port badge',
            estimatedTravelMinutes: 20,
            shiftHoursTotal: 6.5,
          },
        ],
        unassignedOrRiskJobs: [],
      };
      const res = SchedulingRecommendationSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });

  describe('OperationsExecutiveSummarySchema', () => {
    it('should validate executive summary synthesis', () => {
      const valid = {
        overallHealthStatus: 'OPTIMAL' as const,
        executiveKPIs: {
          activeJobsCount: 42,
          completedJobsPendingReview: 8,
          unbilledRevenueAmount: 125000,
          averageQATurnaroundHours: 3.5,
          expiringEquipCalibrationsNext30Days: 2,
        },
        topRisks: [
          {
            department: 'TECHNICAL_QA' as const,
            riskDescription: 'Two test weights due for annual recalibration next week',
            impactLevel: 'MEDIUM' as const,
            recommendedExecutiveIntervention: 'Approve third-party recalibration invoice',
          },
        ],
        strategicHighlights: ['Q3 operational revenue up 18% month-over-month'],
      };
      const res = OperationsExecutiveSummarySchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });
});

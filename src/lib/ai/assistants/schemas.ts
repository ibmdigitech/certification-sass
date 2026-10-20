import { z } from 'zod';

// ─── Assistant Type Enum ────────────────────────────────────────────

export const AssistantType = {
  DOCUMENT_EXTRACTOR: 'DOCUMENT_EXTRACTOR',
  SCHEDULING: 'SCHEDULING',
  INSPECTION_QA: 'INSPECTION_QA',
  COMPETENCY: 'COMPETENCY',
  ACCREDITATION: 'ACCREDITATION',
  ACCOUNTS: 'ACCOUNTS',
  DELIVERY: 'DELIVERY',
  OPERATIONS_COPILOT: 'OPERATIONS_COPILOT',
} as const;

export type AssistantType = (typeof AssistantType)[keyof typeof AssistantType];

// ─── 1. Document Extractor (RFQ, LPO & Spec Parser) ────────────────

export const DocumentExtractorOutputSchema = z.object({
  clientMetadata: z.object({
    companyName: z.string(),
    contactPerson: z.string().optional(),
    contactEmail: z.string().email().optional(),
    lpoNumber: z.string().optional(),
    quotedReference: z.string().optional(),
    siteLocation: z.string().optional(),
  }),
  equipmentItems: z.array(
    z.object({
      lineNumber: z.number(),
      description: z.string(),
      scopeCode: z.enum([
        'LIFT_CRANE_MOBILE',
        'LIFT_CRANE_OVERHEAD',
        'LIFT_FORKLIFT',
        'LIFT_MEWP',
        'LIFT_HOIST',
        'LIFT_GEAR_RIGGING',
        'PRESS_VESSEL_AIR',
        'PRESS_BOILER_STEAM',
        'EARTH_EXCAVATOR',
        'EARTH_LOADER',
        'SCAFF_INSPECT',
        'OTHER_UNCLASSIFIED',
      ]),
      serialNumber: z.string().optional(),
      assetTag: z.string().optional(),
      capacityWithUnit: z.string().optional(),
      quantity: z.number().int().positive().default(1),
      requestedServiceDate: z.string().optional(),
      needsHumanClarification: z.boolean(),
      clarificationNote: z.string().optional(),
    })
  ),
  commercialNotes: z.string().optional(),
});

export type DocumentExtractorOutput = z.infer<typeof DocumentExtractorOutputSchema>;

// ─── 2. Scheduling Assistant (Route & Scope Optimizer) ──────────────

export const SchedulingRecommendationSchema = z.object({
  date: z.string(),
  suggestedAssignments: z.array(
    z.object({
      jobId: z.number(),
      jobServiceId: z.number(),
      customerName: z.string(),
      locationName: z.string(),
      requiredScopeCode: z.string(),
      assignedEngineerId: z.number(),
      engineerName: z.string(),
      matchConfidenceScore: z.number().min(0).max(100),
      matchReason: z.string(),
      estimatedTravelMinutes: z.number(),
      shiftHoursTotal: z.number(),
    })
  ),
  unassignedOrRiskJobs: z.array(
    z.object({
      jobId: z.number(),
      reason: z.string(),
      suggestedAction: z.string(),
    })
  ),
});

export type SchedulingRecommendation = z.infer<typeof SchedulingRecommendationSchema>;

// ─── 3. Inspection Quality Checker (Checklist & Defect Reviewer) ────

export const InspectionQACheckSchema = z.object({
  overallRecommendation: z.enum([
    'READY_FOR_TM_SIGN_OFF',
    'MINOR_ANOMALIES_DETECTED',
    'CRITICAL_DISCREPANCY_REJECT',
  ]),
  contradictionsDetected: z.array(
    z.object({
      checklistQuestion: z.string(),
      inspectorAnswer: z.string(),
      contradictingItem: z.string(),
      explanation: z.string(),
      severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    })
  ),
  calculationVerification: z.object({
    statedSWL: z.number(),
    appliedTestLoad: z.number(),
    calculatedOverloadPercent: z.number(),
    isWithinPermissibleStandardTolerance: z.boolean(),
    standardReferenceApplied: z.string(),
    comment: z.string(),
  }),
  defectClassificationReview: z.array(
    z.object({
      defectDescription: z.string(),
      inspectorSeverity: z.enum(['PRIORITY_1', 'PRIORITY_2', 'PRIORITY_3']),
      suggestedSeverity: z.enum(['PRIORITY_1', 'PRIORITY_2', 'PRIORITY_3']),
      justification: z.string(),
    })
  ),
  calibrationAudit: z.object({
    testToolsListed: z.array(z.string()),
    expiredToolsIdentified: z.array(z.string()),
    allToolsValid: z.boolean(),
  }),
});

export type InspectionQACheck = z.infer<typeof InspectionQACheckSchema>;

// ─── 4. Competency Assistant (Gap & Matrix Analyzer) ────────────────

export const CompetencyAssistantOutputSchema = z.object({
  expiringCredentials: z.array(
    z.object({
      engineerId: z.number(),
      engineerName: z.string(),
      credentialName: z.string(),
      expiryDate: z.string(),
      daysRemaining: z.number(),
      urgency: z.enum([
        'CRITICAL_LESS_THAN_7_DAYS',
        'WARNING_LESS_THAN_30_DAYS',
        'NOTICE',
      ]),
    })
  ),
  dueMonitoringAssessments: z.array(
    z.object({
      engineerId: z.number(),
      engineerName: z.string(),
      scopeCode: z.string(),
      lastWitnessedDate: z.string(),
      monthsElapsed: z.number(),
      recommendedAssessorRole: z.string(),
    })
  ),
  capacityBottlenecks: z.array(
    z.object({
      scopeCode: z.string(),
      activeAuthorizedEngineersCount: z.number(),
      upcomingBookingsCount: z.number(),
      recommendation: z.string(),
    })
  ),
});

export type CompetencyAssistantOutput = z.infer<typeof CompetencyAssistantOutputSchema>;

// ─── 5. Accreditation Assistant (QMS & Audit Readiness) ─────────────

export const AccreditationAuditReportSchema = z.object({
  auditReadinessScorePercent: z.number().min(0).max(100),
  clauseFindings: z.array(
    z.object({
      clause: z.string(),
      clauseTitle: z.string(),
      status: z.enum([
        'CONFORMING',
        'MINOR_NON_CONFORMANCE',
        'MAJOR_NON_CONFORMANCE',
        'OBSERVATION',
      ]),
      evidenceSummary: z.string(),
      deficiencyDescription: z.string().optional(),
      recommendedAction: z.string().optional(),
    })
  ),
  overdueCAPAItems: z.array(
    z.object({
      capaId: z.number(),
      issueDescription: z.string(),
      assignedTo: z.string(),
      targetDate: z.string(),
      daysOverdue: z.number(),
    })
  ),
});

export type AccreditationAuditReport = z.infer<typeof AccreditationAuditReportSchema>;

// ─── 6. Accounts Assistant (Timesheet & Billing Reconciler) ─────────

export const BillingReconciliationSchema = z.object({
  jobId: z.number(),
  quotationTotal: z.number(),
  proposedInvoiceSubtotal: z.number(),
  vatRatePercent: z.number(),
  vatAmount: z.number(),
  grandTotal: z.number(),
  unquotedWorkDiscrepancies: z.array(
    z.object({
      equipmentDescription: z.string(),
      serialNumber: z.string(),
      inspectedQuantity: z.number(),
      quotedQuantity: z.number(),
      suggestedAdditionalCharge: z.number(),
      requiresCommercialApproval: z.literal(true),
    })
  ),
  billableHoursBreakdown: z.object({
    regularHours: z.number(),
    overtimeHours: z.number(),
    holidayHours: z.number(),
    mobilizationCharges: z.number(),
  }),
});

export type BillingReconciliation = z.infer<typeof BillingReconciliationSchema>;

// ─── 7. Delivery Assistant (Dispatch & Tracking Verifier) ───────────

export const DeliveryBatchTrackingSchema = z.object({
  deliveryLogId: z.number(),
  dispatchMethod: z.enum(['COURIER', 'HAND_DELIVERY_BY_DRIVER', 'DIGITAL_PORTAL']),
  trackingNumber: z.string().optional(),
  currentStatus: z.enum([
    'IN_TRANSIT',
    'DELIVERED_PENDING_ACK',
    'ACKNOWLEDGED_SIGNED',
    'EXCEPTION_FAILED',
  ]),
  daysInTransit: z.number(),
  delayed: z.boolean(),
  clientNotificationDraft: z.object({
    recipientEmail: z.string().email(),
    recipientPhone: z.string(),
    messageText: z.string(),
  }),
});

export type DeliveryBatchTracking = z.infer<typeof DeliveryBatchTrackingSchema>;

// ─── 8. Operations Copilot (Executive KPI Synthesizer) ──────────────

export const OperationsExecutiveSummarySchema = z.object({
  overallHealthStatus: z.enum([
    'OPTIMAL',
    'ATTENTION_NEEDED',
    'CRITICAL_ACTION_REQUIRED',
  ]),
  executiveKPIs: z.object({
    activeJobsCount: z.number(),
    completedJobsPendingReview: z.number(),
    unbilledRevenueAmount: z.number(),
    averageQATurnaroundHours: z.number(),
    expiringEquipCalibrationsNext30Days: z.number(),
  }),
  topRisks: z.array(
    z.object({
      department: z.enum([
        'COMMERCIAL',
        'OPERATIONS',
        'TECHNICAL_QA',
        'FINANCE',
        'QMS',
      ]),
      riskDescription: z.string(),
      impactLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM']),
      recommendedExecutiveIntervention: z.string(),
    })
  ),
  strategicHighlights: z.array(z.string()),
});

export type OperationsExecutiveSummary = z.infer<typeof OperationsExecutiveSummarySchema>;

// ─── Schema Registry ────────────────────────────────────────────────

export const ASSISTANT_SCHEMAS = {
  DOCUMENT_EXTRACTOR: DocumentExtractorOutputSchema,
  SCHEDULING: SchedulingRecommendationSchema,
  INSPECTION_QA: InspectionQACheckSchema,
  COMPETENCY: CompetencyAssistantOutputSchema,
  ACCREDITATION: AccreditationAuditReportSchema,
  ACCOUNTS: BillingReconciliationSchema,
  DELIVERY: DeliveryBatchTrackingSchema,
  OPERATIONS_COPILOT: OperationsExecutiveSummarySchema,
} as const;

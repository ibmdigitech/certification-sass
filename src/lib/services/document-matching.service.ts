import { prisma } from '@/lib/prisma';
import { ExtractedDocumentData } from './document-extraction.service';

export interface DocumentMatchContext {
  explicitJobNumber?: string;
  existingTraineeId?: number;
  customerId?: number;
}

export interface DocumentMatchResult {
  matchLevel: 1 | 2 | 3 | 4 | 5 | 6; // 1: Job, 2: Trainee ID, 3: Doc Number, 4: Customer+Name, 5: AI, 6: Manual Review
  jobId?: number;
  traineeId?: number;
  suggestedName: string;
  requiresManualReview: boolean;
  confidence: number;
}

export class DocumentMatchingService {
  /**
   * Generates a standardized document filename according to the convention:
   * {JOB}_{NAME}_{DOCUMENT}_{DATE}
   */
  static generateFilename(
    jobNumber: string | undefined,
    firstName: string | undefined,
    lastName: string | undefined,
    docType: string,
    extension: string = 'jpg'
  ): string {
    const jobStr = jobNumber || 'NOJOB';
    const nameStr = [firstName, lastName].filter(Boolean).join('_') || 'UNKNOWN';
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Clean strings to be safe for filenames
    const cleanStr = (s: string) => s.replace(/[^a-zA-Z0-9-]/g, '_').toUpperCase();
    
    return `${cleanStr(jobStr)}_${cleanStr(nameStr)}_${cleanStr(docType)}_${dateStr}.${extension}`;
  }

  /**
   * Matches a newly uploaded document against the database using the defined hierarchy.
   */
  static async matchDocument(
    companyId: number,
    extractedData: ExtractedDocumentData,
    context: DocumentMatchContext
  ): Promise<DocumentMatchResult> {
    
    // Level 1: Explicit Job Number
    if (context.explicitJobNumber) {
      const job = await prisma.job.findFirst({
        where: { jobNumber: context.explicitJobNumber, companyId },
      });
      if (job) {
        return {
          matchLevel: 1,
          jobId: job.id,
          suggestedName: this.generateFilename(
            job.jobNumber, 
            extractedData.firstName, 
            extractedData.lastName, 
            extractedData.documentType
          ),
          requiresManualReview: false,
          confidence: 1.0
        };
      }
    }

    // Level 2: Existing Trainee ID
    if (context.existingTraineeId) {
      const trainee = await prisma.trainee.findFirst({
        where: { id: context.existingTraineeId, companyId },
      });
      if (trainee) {
        return {
          matchLevel: 2,
          traineeId: trainee.id,
          suggestedName: this.generateFilename(
            undefined,
            trainee.firstName,
            trainee.lastName,
            extractedData.documentType
          ),
          requiresManualReview: false,
          confidence: 1.0
        };
      }
    }

    // Level 3: Document Number (e.g. Emirates ID or Passport)
    if (extractedData.documentNumber) {
      const existingDoc = await prisma.traineeDocument.findFirst({
        where: {
          // If you have a documentNumber field you would search it, 
          // but assuming we match against trainee attributes
          trainee: {
            OR: [
              { emiratesId: extractedData.documentNumber },
              // { passportNumber: extractedData.documentNumber } // if added to schema
            ],
            companyId
          }
        },
        include: { trainee: true }
      });

      if (existingDoc && existingDoc.trainee) {
        return {
          matchLevel: 3,
          traineeId: existingDoc.trainee.id,
          suggestedName: this.generateFilename(
            undefined,
            existingDoc.trainee.firstName,
            existingDoc.trainee.lastName,
            extractedData.documentType
          ),
          requiresManualReview: true, // Should probably review to ensure the doc is indeed for this person
          confidence: 0.9
        };
      }
    }

    // Level 4: Customer + Name
    if (context.customerId && extractedData.firstName && extractedData.lastName) {
      // Find a trainee belonging to this customer (if trainee has customer relation, currently they have company and location)
      // Since Trainee is company-wide, we'll try to find by name within the company
      const trainee = await prisma.trainee.findFirst({
        where: {
          companyId,
          firstName: { equals: extractedData.firstName, mode: 'insensitive' },
          lastName: { equals: extractedData.lastName, mode: 'insensitive' }
        }
      });
      
      if (trainee) {
        return {
          matchLevel: 4,
          traineeId: trainee.id,
          suggestedName: this.generateFilename(
            undefined,
            trainee.firstName,
            trainee.lastName,
            extractedData.documentType
          ),
          requiresManualReview: true,
          confidence: 0.8
        };
      }
    }

    // Level 5: AI Suggested Match (Based on fuzzy extraction)
    if (extractedData.confidenceScore > 0.85 && extractedData.firstName) {
      return {
        matchLevel: 5,
        suggestedName: this.generateFilename(
          undefined,
          extractedData.firstName,
          extractedData.lastName,
          extractedData.documentType
        ),
        requiresManualReview: true,
        confidence: extractedData.confidenceScore
      };
    }

    // Level 6: Manual Review required
    return {
      matchLevel: 6,
      suggestedName: this.generateFilename(
        undefined,
        extractedData.firstName,
        extractedData.lastName,
        extractedData.documentType
      ),
      requiresManualReview: true,
      confidence: 0.0
    };
  }
}



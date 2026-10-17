import { prisma } from '@/lib/prisma';

export interface ExtractedDocumentData {
  documentType: 'EMIRATES_ID' | 'PASSPORT' | 'VISA' | 'LICENSE' | 'UNKNOWN';
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  nationality?: string;
  dateOfBirth?: Date;
  issueDate?: Date;
  expiryDate?: Date;
  confidenceScore: number;
  rawText?: string;
}

export interface AIOcrProvider {
  extractData(imageUrl: string): Promise<ExtractedDocumentData>;
}

export class MockAIOcrProvider implements AIOcrProvider {
  async extractData(imageUrl: string): Promise<ExtractedDocumentData> {
    // In a real application, this would call Google Cloud Vision, AWS Textract, or an LLM (like Claude/GPT-4V).
    // This is a mock implementation that fakes extraction based on the URL or returns generic data.
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          documentType: 'EMIRATES_ID',
          firstName: 'Mohammed',
          lastName: 'Ahmed',
          documentNumber: '784-1234-5678901-1',
          nationality: 'United Arab Emirates',
          dateOfBirth: new Date('1990-01-01'),
          issueDate: new Date('2020-01-01'),
          expiryDate: new Date('2030-01-01'),
          confidenceScore: 0.95,
          rawText: "UNITED ARAB EMIRATES RESIDENT IDENTITY CARD Mohammed Ahmed 784-1234-5678901-1",
        });
      }, 1500); // Simulate network delay
    });
  }
}

export class DocumentExtractionService {
  private ocrProvider: AIOcrProvider;

  constructor(provider?: AIOcrProvider) {
    this.ocrProvider = provider || new MockAIOcrProvider();
  }

  /**
   * Processes a document image and returns the AI-extracted data.
   * Note: The AI only SUGGESTS data. Human review is mandatory.
   */
  async processDocument(documentId: number, companyId: number): Promise<ExtractedDocumentData> {
    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Pass the document URL/Storage key to the OCR provider
    const extractedData = await this.ocrProvider.extractData(document.url);

    // We can log the AI extraction request for audit purposes
    await prisma.auditLog.create({
      data: {
        companyId,
        tenantId: companyId,
        userId: document.uploadedBy || 0, // Fallback if system process
        action: 'DOCUMENT_AI_EXTRACTION',
        entityType: 'Document',
        entityId: documentId,
        newValue: { confidence: extractedData.confidenceScore } as any,
      },
    });

    return extractedData;
  }
}



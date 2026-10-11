import { openRouter, getRecommendedModel, type AIModel, type OpenRouterMessage } from './openrouter';

export interface TrainingCourseInput {
  title: string;
  description?: string;
  category?: string;
  duration?: number;
  targetAudience?: string;
  prerequisites?: string;
  learningObjectives?: string[];
}

export interface InspectionReportInput {
  inspectionType: string;
  equipment?: string;
  location: string;
  findings: Array<{
    item: string;
    status: 'PASS' | 'FAIL' | 'N/A';
    notes?: string;
  }>;
  inspectorName: string;
  date: string;
}

export interface AssessmentQuestionInput {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  learningObjective?: string;
  count?: number;
}

export interface CertificateContentInput {
  certificateType: 'TRAINING' | 'INSPECTION';
  holderName: string;
  courseOrInspection: string;
  issueDate: string;
  expiryDate?: string;
  accreditation?: string;
  achievements?: string[];
}

export interface JobSummaryInput {
  jobNumber: string;
  customer: string;
  location: string;
  services: Array<{
    type: 'TRAINING' | 'INSPECTION';
    details: string;
    status: string;
  }>;
  timeline: {
    startDate: string;
    endDate?: string;
  };
  personnel?: Array<{
    name: string;
    role: string;
    service: 'TRAINING' | 'INSPECTION';
  }>;
}

class AIService {
  private isAvailable(): boolean {
    return openRouter.isConfigured();
  }

  private async generate(
    systemPrompt: string,
    userPrompt: string,
    options?: { model?: AIModel; temperature?: number; maxTokens?: number }
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI service not configured. Please set OPENROUTER_API_KEY in environment variables.');
    }

    return openRouter.generateCompletion(systemPrompt, userPrompt, {
      model: options?.model || getRecommendedModel('balanced'),
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2000,
    });
  }

  async generateTrainingCourseOutline(input: TrainingCourseInput): Promise<string> {
    const systemPrompt = `You are an expert instructional designer creating professional training course outlines for industrial certification programs. Create comprehensive, well-structured outlines that meet regulatory and industry standards.`;

    const userPrompt = `Create a detailed training course outline for:
Title: ${input.title}
Description: ${input.description || 'Not provided'}
Category: ${input.category || 'General'}
Duration: ${input.duration || 'Not specified'} hours
Target Audience: ${input.targetAudience || 'Not specified'}
Prerequisites: ${input.prerequisites || 'None'}
Learning Objectives: ${input.learningObjectives?.join(', ') || 'Not specified'}

Include:
1. Course overview and objectives
2. Module breakdown with topics and duration
3. Lesson structure for each module
4. Assessment methods
5. Required materials and resources
6. Compliance/accreditation considerations
7. Prerequisites and target audience details

Format as a professional training document.`;

    return this.generate(systemPrompt, userPrompt, { temperature: 0.5 });
  }

  async generateTrainingModuleContent(input: {
    courseTitle: string;
    moduleTitle: string;
    moduleDescription?: string;
    duration?: number;
    topics: string[];
  }): Promise<string> {
    const systemPrompt = `You are an expert technical trainer creating detailed training module content for industrial certification courses. Write clear, practical, and engaging content suitable for adult learners in technical fields.`;

    const userPrompt = `Create detailed training content for:
Course: ${input.courseTitle}
Module: ${input.moduleTitle}
Description: ${input.moduleDescription || 'Not provided'}
Duration: ${input.duration || 'Not specified'} minutes
Key Topics: ${input.topics.join(', ')}

Include:
1. Learning objectives for this module
2. Detailed content for each topic with explanations
3. Practical examples and case studies
4. Key takeaways and summary points
5. Discussion questions or activities
6. References to relevant standards/regulations

Write in a clear, professional instructional tone.`;

    return this.generate(systemPrompt, userPrompt, { temperature: 0.6 });
  }

  async generateAssessmentQuestions(input: AssessmentQuestionInput): Promise<string> {
    const systemPrompt = `You are an expert assessment designer creating high-quality evaluation questions for industrial training certification programs. Create questions that effectively test knowledge and competency.`;

    const userPrompt = `Generate ${input.count || 10} ${input.questionType} questions for:
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Learning Objective: ${input.learningObjective || 'Not specified'}

Requirements:
- Questions must be relevant to industrial/technical certification
- Include correct answers and explanations
- For multiple choice: provide 4 options with one correct answer
- For true/false: provide explanation for the answer
- For short answer: provide expected key points in answer
- Ensure questions test understanding, not just memorization
- Align with ${input.difficulty} difficulty level

Format as JSON array with: question, type, options (if applicable), correctAnswer, explanation, points`;

    return this.generate(systemPrompt, userPrompt, { temperature: 0.7 });
  }

  async generateInspectionReport(input: InspectionReportInput): Promise<string> {
    const systemPrompt = `You are a certified inspector writing professional inspection reports for regulatory compliance. Create detailed, objective, and well-structured reports that meet industry standards.`;

    const userPrompt = `Generate a professional inspection report:
Inspection Type: ${input.inspectionType}
Equipment/Asset: ${input.equipment || 'Not specified'}
Location: ${input.location}
Inspector: ${input.inspectorName}
Date: ${input.date}

Findings:
${input.findings.map((f, i) => `${i + 1}. ${f.item} - ${f.status}${f.notes ? `: ${f.notes}` : ''}`).join('\n')}

Include:
1. Executive summary
2. Inspection scope and methodology
3. Equipment/asset details
4. Detailed findings with evidence
5. Compliance assessment
6. Recommendations and corrective actions
7. Overall conclusion and certification status
8. Inspector signature block

Format as a formal inspection report document.`;

    return this.generate(systemPrompt, userPrompt, { temperature: 0.4, maxTokens: 3000 });
  }

  async generateCertificateContent(input: CertificateContentInput): Promise<string> {
    const systemPrompt = `You are a certification authority generating professional certificate content. Create formal, legally compliant certificate text with all required elements.`;

    const userPrompt = `Generate certificate content for:
Certificate Type: ${input.certificateType}
Holder: ${input.holderName}
Course/Inspection: ${input.courseOrInspection}
Issue Date: ${input.issueDate}
Expiry Date: ${input.expiryDate || 'Not specified'}
Accreditation: ${input.accreditation || 'Not specified'}
Achievements: ${input.achievements?.join(', ') || 'Not specified'}

Include:
1. Formal certificate title
2. Holder identification
3. Certification scope and standards
4. Achievement details
5. Validity period
6. Accreditation/authority references
7. Verification information (QR code placeholder)
8. Authorized signatures section

Format as formal certificate text.`;

    return this.generate(systemPrompt, userPrompt, { temperature: 0.3 });
  }

  async generateJobSummary(input: JobSummaryInput): Promise<string> {
    const systemPrompt = `You are a project manager creating executive summaries for job orders in a certification and inspection company. Write clear, concise summaries for stakeholders.`;

    const personnelText = input.personnel?.length
      ? input.personnel.map(p => `- ${p.name} (${p.role}) - ${p.service}`).join('\n')
      : 'Not specified';

    const userPrompt = `Create an executive summary for Job Order:
Job Number: ${input.jobNumber}
Customer: ${input.customer}
Location: ${input.location}
Timeline: ${input.timeline.startDate} to ${input.timeline.endDate || 'Ongoing'}

Services:
${input.services.map(s => `- ${s.type}: ${s.details} (${s.status})`).join('\n')}

Personnel:
${personnelText}

Include:
1. Job overview and objectives
2. Service breakdown and current status
3. Timeline and milestones
4. Resource allocation
5. Risk factors and mitigation
6. Next steps and deliverables

Format as a professional executive summary.`;

    return this.generate(systemPrompt, userPrompt, { temperature: 0.5 });
  }

  async generateEmailTemplate(input: {
    purpose: 'job_confirmation' | 'schedule_notification' | 'certificate_issued' | 'inspection_reminder' | 'payment_reminder' | 'custom';
    recipient: string;
    context: Record<string, string>;
    tone?: 'formal' | 'friendly' | 'urgent';
  }): Promise<string> {
    const systemPrompt = `You are a professional business communicator writing email templates for a certification and inspection company. Create clear, actionable emails.`;

    const userPrompt = `Write an email template for:
Purpose: ${input.purpose}
Recipient: ${input.recipient}
Tone: ${input.tone || 'formal'}

Context variables:
${Object.entries(input.context).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Create a professional email with:
1. Clear subject line
2. Appropriate greeting
3. Purpose statement
4. Relevant details from context
5. Call to action or next steps
6. Professional closing
7. Contact information placeholder

Use {{variable}} syntax for template variables.`;

    return this.generate(systemPrompt, userPrompt, { temperature: 0.6 });
  }

  async improveText(input: {
    text: string;
    goal: 'clarity' | 'professional' | 'concise' | 'technical' | 'persuasive';
    audience?: string;
  }): Promise<string> {
    const systemPrompt = `You are an expert editor improving technical and business documents. Enhance the text while maintaining its original meaning and intent.`;

    const userPrompt = `Improve this text for ${input.goal}${input.audience ? ` (audience: ${input.audience})` : ''}:

"${input.text}"

Provide only the improved version, no explanations.`;

    return this.generate(systemPrompt, userPrompt, { temperature: 0.3 });
  }

  async translateText(input: {
    text: string;
    targetLanguage: string;
    context?: string;
  }): Promise<string> {
    const systemPrompt = `You are a professional translator specializing in technical and business documents. Translate accurately while preserving technical terminology and formal tone.`;

    const userPrompt = `Translate to ${input.targetLanguage}${input.context ? ` (context: ${input.context})` : ''}:

"${input.text}"

Provide only the translation.`;

    return this.generate(systemPrompt, userPrompt, { temperature: 0.2 });
  }

  async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    const systemPrompt = `Analyze the sentiment of the provided text. Respond with only one word: positive, negative, or neutral.`;

    const result = await this.generate(systemPrompt, text, { temperature: 0.1, maxTokens: 10 });
    const normalized = result.toLowerCase().trim();
    if (normalized.includes('positive')) return 'positive';
    if (normalized.includes('negative')) return 'negative';
    return 'neutral';
  }

  async extractKeyPoints(text: string, maxPoints: number = 5): Promise<string[]> {
    const systemPrompt = `Extract the ${maxPoints} most important key points from the text. Return as a JSON array of strings.`;

    const result = await this.generate(systemPrompt, text, { temperature: 0.2, maxTokens: 500 });
    try {
      return JSON.parse(result);
    } catch {
      return result.split('\n').filter(l => l.trim()).slice(0, maxPoints);
    }
  }
}

export const aiService = new AIService();
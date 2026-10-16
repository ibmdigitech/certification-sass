import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCourseInput {
  companyId: number;
  title: string;
  description?: string;
  code?: string;
  duration?: number;
  credits?: number;
  status?: string;
  category?: string;
  tags?: string[];
  courseType?: string;
  trainingHours?: number;
  assessmentRequired?: boolean;
  practicalAssessmentRequired?: boolean;
  certificateValidityMonths?: number;
  trainerRequirements?: string;
  locationId?: number;
  accreditationId?: number;
  version?: string;
  createdBy?: number;
  updatedBy?: number;
}

export interface CreateModuleInput {
  companyId: number;
  courseId: number;
  title: string;
  description?: string;
  order?: number;
  duration?: number;
}

export interface CreateLessonInput {
  companyId: number;
  moduleId: number;
  title: string;
  description?: string;
  content?: string;
  type?: string;
  order?: number;
  duration?: number;
  isRequired?: boolean;
  resources?: string[];
}

export interface CreateAssessmentInput {
  companyId: number;
  lessonId?: number;
  title: string;
  description?: string;
  type?: string;
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
}

export interface CreateQuestionInput {
  companyId: number;
  assessmentId: number;
  text: string;
  type?: string;
  options: Prisma.InputJsonValue;
  correctAnswer: Prisma.InputJsonValue;
  explanation?: string;
  points?: number;
  order?: number;
}

export interface UpdateQuestionInput {
  text?: string;
  type?: string;
  options?: Prisma.InputJsonValue;
  correctAnswer?: Prisma.InputJsonValue;
  explanation?: string;
  points?: number;
  order?: number;
}

interface CreateEnrollmentInput {
  companyId: number;
  courseId: number;
  traineeId: number;
}

export class TrainingCourseService {
  static async createCourse(input: CreateCourseInput) {
    const {
      companyId, title, description, code, duration, credits, status,
      category, tags, courseType, trainingHours, assessmentRequired,
      practicalAssessmentRequired, certificateValidityMonths, trainerRequirements,
      locationId, accreditationId, version, createdBy, updatedBy,
    } = input;

    return prisma.trainingCourse.create({
      data: {
        companyId,
        title,
        description,
        code,
        duration,
        credits,
        status: status ?? 'DRAFT',
        category,
        courseType,
        trainingHours,
        assessmentRequired: assessmentRequired ?? false,
        practicalAssessmentRequired: practicalAssessmentRequired ?? false,
        certificateValidityMonths,
        trainerRequirements,
        locationId,
        accreditationId,
        version: version ?? '1.0',
        createdBy,
        updatedBy,
        tags: tags ?? [],
      },
    });
  }

  static async getCourseById(id: number, companyId: number) {
    return prisma.trainingCourse.findFirst({
      where: { id, companyId },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                assessments: {
                  include: { questions: true },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        enrollments: {
          include: { trainee: true },
        },
        _count: { select: { enrollments: true, modules: true } },
      },
    });
  }

  static async listCourses(companyId: number, options?: {
    status?: string;
    category?: string;
    search?: string;
    activeOnly?: boolean;
    locationId?: number;
    page?: number;
    limit?: number;
  }) {
    const { status, category, search, activeOnly, locationId, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;
    if (category) where.category = category;
    if (locationId) where.locationId = locationId;
    if (activeOnly) where.status = 'ACTIVE';
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.trainingCourse.findMany({
        where,
        include: {
          location: { select: { id: true, code: true, name: true } },
          accreditation: { select: { id: true, code: true, name: true } },
          _count: { select: { enrollments: true, modules: true } },
        },
        orderBy: { title: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trainingCourse.count({ where }),
    ]);

    return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateCourse(id: number, companyId: number, data: Partial<CreateCourseInput>) {
    const {
      title, description, code, duration, credits, status,
      category, tags, courseType, trainingHours, assessmentRequired,
      practicalAssessmentRequired, certificateValidityMonths, trainerRequirements,
      locationId, accreditationId, version, createdBy, updatedBy,
    } = data;

    return prisma.trainingCourse.update({
      where: { id, companyId },
      data: {
        title,
        description,
        code,
        duration,
        credits,
        status,
        category,
        courseType,
        trainingHours,
        assessmentRequired,
        practicalAssessmentRequired,
        certificateValidityMonths,
        trainerRequirements,
        locationId,
        accreditationId,
        version,
        createdBy,
        updatedBy,
        tags,
      },
    });
  }

  static async deleteCourse(id: number, companyId: number) {
    return prisma.trainingCourse.delete({
      where: { id, companyId },
    });
  }

  static async publishCourse(id: number, companyId: number) {
    return prisma.trainingCourse.update({
      where: { id, companyId },
      data: { status: 'published' },
    });
  }

  static async getCourseStats(companyId: number) {
    const [total, published, draft, archived] = await Promise.all([
      prisma.trainingCourse.count({ where: { companyId } }),
      prisma.trainingCourse.count({ where: { companyId, status: 'published' } }),
      prisma.trainingCourse.count({ where: { companyId, status: 'draft' } }),
      prisma.trainingCourse.count({ where: { companyId, status: 'archived' } }),
    ]);

    return { total, published, draft, archived };
  }
}

export class TrainingModuleService {
  static async createModule(input: CreateModuleInput) {
    const maxOrder = await prisma.trainingModule.findFirst({
      where: { courseId: input.courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return prisma.trainingModule.create({
      data: {
        companyId: input.companyId,
        courseId: input.courseId,
        title: input.title,
        description: input.description,
        order: input.order ?? (maxOrder?.order ?? 0) + 1,
        duration: input.duration,
      },
    });
  }

  static async getModuleById(id: number, companyId: number) {
    return prisma.trainingModule.findFirst({
      where: { id, companyId },
      include: {
        lessons: {
          include: {
            assessments: { include: { questions: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  static async listModules(courseId: number, companyId: number) {
    return prisma.trainingModule.findMany({
      where: { courseId, companyId },
      include: {
        _count: { select: { lessons: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  static async updateModule(id: number, companyId: number, data: Partial<CreateModuleInput>) {
    return prisma.trainingModule.update({
      where: { id, companyId },
      data,
    });
  }

  static async deleteModule(id: number, companyId: number) {
    return prisma.trainingModule.delete({
      where: { id, companyId },
    });
  }

  static async reorderModules(courseId: number, companyId: number, moduleIds: number[]) {
    await Promise.all(
      moduleIds.map((id, index) =>
        prisma.trainingModule.update({
          where: { id, companyId, courseId },
          data: { order: index },
        })
      )
    );
  }
}

export class TrainingLessonService {
  static async createLesson(input: CreateLessonInput) {
    const maxOrder = await prisma.trainingLesson.findFirst({
      where: { moduleId: input.moduleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return prisma.trainingLesson.create({
      data: {
        companyId: input.companyId,
        moduleId: input.moduleId,
        title: input.title,
        description: input.description,
        content: input.content,
        type: input.type ?? 'video',
        order: input.order ?? (maxOrder?.order ?? 0) + 1,
        duration: input.duration,
        isRequired: input.isRequired ?? true,
        resources: input.resources ?? [],
      },
    });
  }

  static async getLessonById(id: number, companyId: number) {
    return prisma.trainingLesson.findFirst({
      where: { id, companyId },
      include: {
        assessments: {
          include: { questions: { orderBy: { order: 'asc' } } },
        },
      },
    });
  }

  static async listLessons(moduleId: number, companyId: number) {
    return prisma.trainingLesson.findMany({
      where: { moduleId, companyId },
      include: {
        assessments: { include: { _count: { select: { questions: true } } } },
      },
      orderBy: { order: 'asc' },
    });
  }

  static async updateLesson(id: number, companyId: number, data: Partial<CreateLessonInput>) {
    return prisma.trainingLesson.update({
      where: { id, companyId },
      data,
    });
  }

  static async deleteLesson(id: number, companyId: number) {
    return prisma.trainingLesson.delete({
      where: { id, companyId },
    });
  }

  static async reorderLessons(moduleId: number, companyId: number, lessonIds: number[]) {
    await Promise.all(
      lessonIds.map((id, index) =>
        prisma.trainingLesson.update({
          where: { id, companyId, moduleId },
          data: { order: index },
        })
      )
    );
  }
}

export class AssessmentService {
  static async createAssessment(input: CreateAssessmentInput) {
    return prisma.assessment.create({
      data: {
        companyId: input.companyId,
        lessonId: input.lessonId,
        title: input.title,
        description: input.description,
        type: input.type ?? 'quiz',
        passingScore: input.passingScore ?? 70,
        timeLimit: input.timeLimit,
        maxAttempts: input.maxAttempts ?? 3,
        shuffleQuestions: input.shuffleQuestions ?? false,
      },
    });
  }

  static async getAssessmentById(id: number, companyId: number) {
    return prisma.assessment.findFirst({
      where: { id, companyId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        lesson: true,
      },
    });
  }

  static async listAssessments(companyId: number, options?: {
    lessonId?: number;
    page?: number;
    limit?: number;
  }) {
    const { lessonId, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (lessonId) where.lessonId = lessonId;

    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        include: {
          _count: { select: { questions: true, attempts: true } },
          lesson: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.assessment.count({ where }),
    ]);

    return { assessments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateAssessment(id: number, companyId: number, data: Partial<CreateAssessmentInput>) {
    return prisma.assessment.update({
      where: { id, companyId },
      data,
    });
  }

  static async deleteAssessment(id: number, companyId: number) {
    return prisma.assessment.delete({
      where: { id, companyId },
    });
  }
}

export class QuestionService {
  static async createQuestion(input: CreateQuestionInput) {
    return prisma.question.create({
      data: {
        companyId: input.companyId,
        assessmentId: input.assessmentId,
        text: input.text,
        type: input.type ?? 'multiple_choice',
        options: input.options,
        correctAnswer: input.correctAnswer,
        explanation: input.explanation,
        points: input.points ?? 1,
        order: input.order ?? 0,
      },
    });
  }

  static async bulkCreateQuestions(assessmentId: number, companyId: number, questions: Omit<CreateQuestionInput, 'assessmentId' | 'companyId'>[]) {
    return prisma.question.createMany({
      data: questions.map((q, index) => ({
        companyId,
        assessmentId,
        ...q,
        order: q.order ?? index,
      })),
    });
  }

  static async getQuestionById(id: number, companyId: number) {
    return prisma.question.findFirst({
      where: { id, companyId },
    });
  }

  static async listQuestions(assessmentId: number, companyId: number) {
    return prisma.question.findMany({
      where: { assessmentId, companyId },
      orderBy: { order: 'asc' },
    });
  }

  static async updateQuestion(id: number, companyId: number, data: UpdateQuestionInput) {
    return prisma.question.update({
      where: { id, companyId },
      data,
    });
  }

  static async deleteQuestion(id: number, companyId: number) {
    return prisma.question.delete({
      where: { id, companyId },
    });
  }

  static async reorderQuestions(assessmentId: number, companyId: number, questionIds: number[]) {
    await Promise.all(
      questionIds.map((id, index) =>
        prisma.question.update({
          where: { id, companyId, assessmentId },
          data: { order: index },
        })
      )
    );
  }
}
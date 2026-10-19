import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface CreateEnrollmentInput {
  companyId: number;
  courseId: number;
  traineeId: number;
  locationId?: number;
  jobId?: number;
  jobNumber?: string;
  trainingDate?: string;
  timesheetNumber?: string;
  photoUrl?: string;
  idUrl?: string;
}

export interface UpdateLessonProgressInput {
  companyId: number;
  enrollmentId: number;
  lessonId: number;
  status?: string;
  timeSpent?: number;
}

export interface StartAssessmentAttemptInput {
  companyId: number;
  assessmentId: number;
  enrollmentId?: number;
  lessonProgressId?: number;
  traineeId: number;
}

export interface SubmitAssessmentAttemptInput {
  id: number;
  companyId: number;
  answers: Prisma.InputJsonValue;
  timeSpent: number;
}

export class EnrollmentService {
  static async createEnrollment(input: CreateEnrollmentInput) {
    const course = await prisma.trainingCourse.findFirst({
      where: { id: input.courseId, companyId: input.companyId },
      include: { modules: { include: { lessons: true } } },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        companyId: input.companyId,
        courseId: input.courseId,
        traineeId: input.traineeId,
        locationId: input.locationId,
        jobId: input.jobId,
        jobNumber: input.jobNumber,
        trainingDate: input.trainingDate ? new Date(input.trainingDate) : undefined,
        timesheetNumber: input.timesheetNumber,
        photoUrl: input.photoUrl,
        idUrl: input.idUrl,
        status: 'active',
        enrolledAt: new Date(),
      },
      include: {
        trainee: true,
        course: { select: { title: true, code: true } },
        location: true,
        job: true,
      },
    });

    // Create lesson progress records for all lessons in the course
    const allLessons = course.modules.flatMap(m => m.lessons);
    if (allLessons.length > 0) {
      await prisma.lessonProgress.createMany({
        data: allLessons.map(lesson => ({
          companyId: input.companyId,
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
          status: 'not_started',
        })),
      });
    }

    return enrollment;
  }

  static async getEnrollmentById(id: number, companyId: number) {
    return prisma.enrollment.findFirst({
      where: { id, companyId },
      include: {
        trainee: true,
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  include: {
                    assessments: { include: { questions: true } },
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        progress: {
          include: {
            lesson: true,
            assessmentAttempts: { include: { assessment: true } },
          },
        },
      },
    });
  }

  static async listEnrollments(companyId: number, options?: {
    courseId?: number;
    traineeId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { courseId, traineeId, status, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (courseId) where.courseId = courseId;
    if (traineeId) where.traineeId = traineeId;
    if (status) where.status = status;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          trainee: true,
          course: { select: { title: true, code: true } },
          location: { select: { name: true, code: true } },
          job: { select: { jobNumber: true } },
          _count: { select: { progress: true } },
        },
        orderBy: { enrolledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return { enrollments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateEnrollmentStatus(id: number, companyId: number, status: string) {
    const data: Record<string, unknown> = { status };
    if (status === 'in_progress' && !await this.hasStarted(id, companyId)) {
      data.startedAt = new Date();
    }
    if (status === 'completed') {
      data.completedAt = new Date();
    }

    return prisma.enrollment.update({
      where: { id, companyId },
      data,
    });
  }

  static async hasStarted(id: number, companyId: number) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id, companyId },
      select: { startedAt: true },
    });
    return !!enrollment?.startedAt;
  }

  static async getEnrollmentProgress(enrollmentId: number, companyId: number) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, companyId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: { id: true, isRequired: true },
                },
              },
            },
          },
        },
        progress: true,
      },
    });

    if (!enrollment) return null;

    const allLessons = enrollment.course.modules.flatMap(m => m.lessons);
    const requiredLessons = allLessons.filter(l => l.isRequired);
    const completedLessons = enrollment.progress.filter(p => p.status === 'completed');
    const inProgressLessons = enrollment.progress.filter(p => p.status === 'in_progress');

    const totalRequired = requiredLessons.length;
    const completedRequired = completedLessons.filter(p => 
      requiredLessons.some(l => l.id === p.lessonId)
    ).length;

    return {
      enrollmentId: enrollment.id,
      totalLessons: allLessons.length,
      requiredLessons: totalRequired,
      completedLessons: completedLessons.length,
      inProgressLessons: inProgressLessons.length,
      completedRequired,
      progressPercentage: totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0,
      status: enrollment.status,
    };
  }

  static async deleteEnrollment(id: number, companyId: number) {
    return prisma.enrollment.delete({
      where: { id, companyId },
    });
  }
}

export class LessonProgressService {
  static async getLessonProgress(enrollmentId: number, lessonId: number, companyId: number) {
    return prisma.lessonProgress.findFirst({
      where: { enrollmentId, lessonId, companyId },
      include: {
        lesson: {
          include: { assessments: { include: { questions: true } } },
        },
        assessmentAttempts: {
          include: { assessment: true },
          orderBy: { startedAt: 'desc' },
        },
      },
    });
  }

  static async updateLessonProgress(input: UpdateLessonProgressInput) {
    const { enrollmentId, lessonId, companyId, status, timeSpent } = input;

    const existing = await prisma.lessonProgress.findFirst({
      where: { enrollmentId, lessonId, companyId },
    });

    if (!existing) {
      throw new Error('Lesson progress not found');
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (timeSpent !== undefined) data.timeSpent = { increment: timeSpent };
    if (status === 'in_progress' && !existing.startedAt) {
      data.startedAt = new Date();
    }
    if (status === 'completed' && !existing.completedAt) {
      data.completedAt = new Date();
    }

    return prisma.lessonProgress.update({
      where: { id: existing.id },
      data,
    });
  }

  static async startLesson(enrollmentId: number, lessonId: number, companyId: number) {
    return this.updateLessonProgress({
      companyId,
      enrollmentId,
      lessonId,
      status: 'in_progress',
    });
  }

  static async completeLesson(enrollmentId: number, lessonId: number, companyId: number, timeSpent: number) {
    return this.updateLessonProgress({
      companyId,
      enrollmentId,
      lessonId,
      status: 'completed',
      timeSpent,
    });
  }

static async checkCourseCompletion(enrollmentId: number, companyId: number) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, companyId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: { select: { id: true, isRequired: true } },
              },
            },
          },
        },
        progress: true,
        trainee: true,
      },
    });

    if (!enrollment) return false;

    const allRequiredLessons = enrollment.course.modules.flatMap(m => m.lessons).filter(l => l.isRequired);
    const completedRequiredLessons = enrollment.progress.filter(p => 
      p.status === 'completed' && allRequiredLessons.some(l => l.id === p.lessonId)
    );

    if (completedRequiredLessons.length === allRequiredLessons.length) {
      await prisma.enrollment.update({
        where: { id: enrollmentId, companyId },
        data: { status: 'completed', completedAt: new Date() },
      });

      // NOTE: Certificate generation is NOT automatic.
      // It requires explicit generation via POST /api/training/certificates/generate
      // which validates the full job/scheduling workflow first.
      // This prevents certificates being issued without proper job creation and scheduling.

      return true;
    }

return false;
  }
}

export class AssessmentAttemptService {
  static async startAttempt(input: StartAssessmentAttemptInput) {
    const assessment = await prisma.assessment.findFirst({
      where: { id: input.assessmentId, companyId: input.companyId },
      include: { questions: true },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        companyId: input.companyId,
        assessmentId: input.assessmentId,
        enrollmentId: input.enrollmentId,
        lessonProgressId: input.lessonProgressId,
        traineeId: input.traineeId,
        score: 0,
        maxScore: assessment.questions.reduce((sum, q) => sum + q.points, 0),
        passed: false,
        answers: {},
        startedAt: new Date(),
        timeSpent: 0,
      },
      include: { assessment: true },
    });

    return attempt;
  }

  static async submitAttempt(input: SubmitAssessmentAttemptInput) {
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: { id: input.id, companyId: input.companyId },
      include: { assessment: true },
    });

    if (!attempt) {
      throw new Error('Assessment attempt not found');
    }

    if (attempt.completedAt) {
      throw new Error('Attempt already submitted');
    }

    const maxAttempts = attempt.assessment.maxAttempts;
    const previousAttempts = await prisma.assessmentAttempt.count({
      where: {
        assessmentId: attempt.assessmentId,
        traineeId: attempt.traineeId,
        companyId: input.companyId,
      },
    });

    if (previousAttempts >= maxAttempts) {
      throw new Error('Maximum attempts exceeded');
    }

    // Calculate score
    let score = 0;
    const questions = await prisma.question.findMany({
      where: { assessmentId: attempt.assessmentId },
    });

    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

    for (const question of questions) {
      const userAnswer = (input.answers as Record<string, unknown>)[question.id.toString()];
      if (userAnswer && JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)) {
        score += question.points;
      }
    }

    const passed = maxScore > 0 && (score / maxScore) * 100 >= attempt.assessment.passingScore;

    const updatedAttempt = await prisma.assessmentAttempt.update({
      where: { id: input.id, companyId: input.companyId },
      data: {
        score,
        maxScore,
        passed,
        answers: input.answers as Prisma.InputJsonValue,
        completedAt: new Date(),
        timeSpent: input.timeSpent,
      },
    });

    // If this attempt is linked to lesson progress, update it
    if (attempt.lessonProgressId) {
      const lessonProgress = await prisma.lessonProgress.findFirst({
        where: { id: attempt.lessonProgressId },
        include: { lesson: { include: { assessments: true } } },
      });

      if (lessonProgress && passed) {
        // Check if all assessments for this lesson are passed
        const lessonAssessments = lessonProgress.lesson.assessments;
        const allPassed = await Promise.all(
          lessonAssessments.map(async (a) => {
            const latestAttempt = await prisma.assessmentAttempt.findFirst({
              where: {
                assessmentId: a.id,
                lessonProgressId: lessonProgress.id,
                traineeId: attempt.traineeId,
              },
              orderBy: { startedAt: 'desc' },
            });
            return latestAttempt?.passed ?? false;
          })
        );

        if (allPassed.every(p => p)) {
          await prisma.lessonProgress.update({
            where: { id: lessonProgress.id },
            data: { status: 'completed', completedAt: new Date() },
          });
        }
      }
    }

    // Check course completion if linked to enrollment
    if (attempt.enrollmentId) {
      await LessonProgressService.checkCourseCompletion(attempt.enrollmentId, input.companyId);
    }

    return updatedAttempt;
  }

  static async getAttemptById(id: number, companyId: number) {
    return prisma.assessmentAttempt.findFirst({
      where: { id, companyId },
      include: {
        assessment: { include: { questions: true } },
        enrollment: { include: { course: true, trainee: true } },
        lessonProgress: { include: { lesson: true } },
        trainee: true,
      },
    });
  }

  static async listAttempts(companyId: number, options?: {
    assessmentId?: number;
    traineeId?: number;
    enrollmentId?: number;
    page?: number;
    limit?: number;
  }) {
    const { assessmentId, traineeId, enrollmentId, page = 1, limit = 20 } = options ?? {};

    const where: Record<string, unknown> = { companyId };
    if (assessmentId) where.assessmentId = assessmentId;
    if (traineeId) where.traineeId = traineeId;
    if (enrollmentId) where.enrollmentId = enrollmentId;

    const [attempts, total] = await Promise.all([
      prisma.assessmentAttempt.findMany({
        where,
        include: {
          assessment: { select: { title: true, passingScore: true } },
          trainee: { select: { firstName: true, lastName: true } },
          enrollment: { include: { course: { select: { title: true } } } },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.assessmentAttempt.count({ where }),
    ]);

    return { attempts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getTraineeAssessmentHistory(traineeId: number, companyId: number) {
    return prisma.assessmentAttempt.findMany({
      where: { traineeId, companyId },
      include: {
        assessment: { select: { title: true, type: true, passingScore: true } },
        enrollment: { include: { course: { select: { title: true } } } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}

export class TrainingReportService {
  static async getCourseReport(courseId: number, companyId: number) {
    const course = await prisma.trainingCourse.findFirst({
      where: { id: courseId, companyId },
      include: {
        modules: {
          include: {
            lessons: {
              include: { assessments: { include: { questions: true } } },
            },
          },
        },
        enrollments: {
          include: {
            trainee: true,
            progress: {
              include: {
                lesson: true,
                assessmentAttempts: { include: { assessment: true } },
              },
            },
          },
        },
      },
    });

    if (!course) return null;

    const report = {
      course: { id: course.id, title: course.title, code: course.code, status: course.status },
      totalEnrollments: course.enrollments.length,
      enrollments: await Promise.all(course.enrollments.map(async (e) => {
        const progress = await EnrollmentService.getEnrollmentProgress(e.id, companyId);
        return {
          trainee: `${e.trainee.firstName} ${e.trainee.lastName}`,
          traineeId: e.traineeId,
          status: e.status,
          enrolledAt: e.enrolledAt,
          startedAt: e.startedAt,
          completedAt: e.completedAt,
          ...progress,
        };
      })),
      modules: course.modules.map(m => ({
        id: m.id,
        title: m.title,
        order: m.order,
        lessons: m.lessons.map(l => ({
          id: l.id,
          title: l.title,
          type: l.type,
          isRequired: l.isRequired,
          hasAssessment: l.assessments.length > 0,
        })),
      })),
    };

    return report;
  }

  static async getTraineeProgressReport(traineeId: number, companyId: number) {
    const enrollments = await prisma.enrollment.findMany({
      where: { traineeId, companyId },
      include: {
        course: { select: { title: true, code: true, status: true } },
        progress: {
          include: {
            lesson: { select: { title: true, isRequired: true } },
            assessmentAttempts: { include: { assessment: { select: { title: true, passingScore: true } } } },
          },
        },
      },
    });

    return enrollments.map(e => {
      const allLessons = e.progress;
      const requiredLessons = allLessons.filter(p => p.lesson.isRequired);
      const completedRequired = requiredLessons.filter(p => p.status === 'completed');
      const inProgress = allLessons.filter(p => p.status === 'in_progress');

      return {
        course: e.course,
        enrollmentStatus: e.status,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        totalLessons: allLessons.length,
        requiredLessons: requiredLessons.length,
        completedLessons: completedRequired.length,
        inProgressLessons: inProgress.length,
        progressPercentage: requiredLessons.length > 0 
          ? Math.round((completedRequired.length / requiredLessons.length) * 100) 
          : 0,
        lessons: allLessons.map(p => ({
          title: p.lesson.title,
          status: p.status,
          isRequired: p.lesson.isRequired,
          timeSpent: p.timeSpent,
          assessmentAttempts: p.assessmentAttempts.map(a => ({
            assessment: a.assessment.title,
            score: a.score,
            maxScore: a.maxScore,
            passed: a.passed,
            completedAt: a.completedAt,
          })),
        })),
      };
    });
  }

  static async getCompanyTrainingDashboard(companyId: number) {
    const [
      totalCourses,
      publishedCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalTrainees,
      recentAttempts,
    ] = await Promise.all([
      prisma.trainingCourse.count({ where: { companyId } }),
      prisma.trainingCourse.count({ where: { companyId, status: 'published' } }),
      prisma.enrollment.count({ where: { companyId } }),
      prisma.enrollment.count({ where: { companyId, status: 'in_progress' } }),
      prisma.enrollment.count({ where: { companyId, status: 'completed' } }),
      prisma.trainee.count({ where: { companyId, status: 'active' } }),
      prisma.assessmentAttempt.findMany({
        where: { companyId },
        take: 10,
        orderBy: { startedAt: 'desc' },
        include: {
          assessment: { select: { title: true } },
          trainee: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    return {
      stats: {
        totalCourses,
        publishedCourses,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        totalTrainees,
        completionRate,
      },
      recentActivity: recentAttempts.map(a => ({
        trainee: `${a.trainee.firstName} ${a.trainee.lastName}`,
        assessment: a.assessment.title,
        score: a.score,
        maxScore: a.maxScore,
        passed: a.passed,
        date: a.startedAt,
      })),
    };
  }
}

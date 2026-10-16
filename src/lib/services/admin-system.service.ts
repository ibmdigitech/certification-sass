import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminSystemService {
  static async getSystemStats(filters: {
    companyId: number;
  }) {
    const { companyId } = filters;

    const [
      totalUsers,
      activeUsers,
      totalJobs,
      totalCertificates,
      totalInspections,
      systemMetrics
    ] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.user.count({ where: { companyId, status: 'active' } }),
      prisma.job.count({ where: { companyId } }),
      prisma.certificate.count({ where: { companyId } }),
      prisma.inspection.count({ where: { companyId } }),
      this.getSystemMetrics()
    ]);

    return {
      totalUsers,
      activeUsers,
      totalJobs,
      totalCertificates,
      totalInspections,
      systemHealth: systemMetrics,
      lastBackup: new Date().toISOString(), // This would come from a backup service in a real implementation
      uptime: process.uptime() // This would be more sophisticated in a real implementation
    };
  }

  static async getSystemMetrics() {
    // In a real implementation, this would gather actual system metrics
    // For now, we'll return mock data
    return {
      responseTime: 45, // ms
      activeConnections: 12,
      databaseLatency: 8,
      memoryUsage: {
        rss: 45056000, // ~43 MB
        heapTotal: 33554432, // ~32 MB
        heapUsed: 20132659 // ~19 MB
      },
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

export default AdminSystemService;
/**
 * Analytics Service
 * Handles admin analytics and metrics aggregation
 */

import { Prisma } from '../generated/prisma';
import { BaseService, ServiceContext } from './base.service';
import { ApiResponse, AssessmentStatus, UserRole, InvoiceStatus, SubscriptionStatus, BillingCycle, TransactionType } from '../types/database';

// Type definitions
interface AssessmentMetrics {
  total: number;
  started: number;
  completed: number;
  inProgress: number;
  abandoned: number;
  completionRate: number;
  avgCompletionTime: number;
  byStatus: {
    DRAFT: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    FAILED: number;
  };
  byTemplate: Array<{
    templateId: string;
    templateName: string;
    count: number;
    percentage: number;
  }>;
  trend: Array<{
    date: string;
    started: number;
    completed: number;
    abandoned: number;
  }>;
}

interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

interface VendorAnalytics {
  totalVendors: number;
  activeVendors: number;
  totalClicks: number;
  uniqueVisitors: number;
  totalContacts: number;
  conversionRate: number;
  clickThroughRate: number;
  avgMatchScore: number;
  topVendors: Array<{
    vendorId: string;
    companyName: string;
    clicks: number;
    contacts: number;
    conversionRate: number;
    trend: 'up' | 'down' | 'stable';
    trendDirection?: 'up' | 'down' | 'stable';
  }>;
  clicksByCategory: Array<{
    category: string;
    clicks: number;
    contacts: number;
  }>;
  trend: Array<{
    date: string;
    clicks: number;
    contacts: number;
    uniqueVisitors: number;
  }>;
}

interface VendorAnalyticsParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  verifiedUsers: number;
  retentionRate: number;
  conversionFunnel: {
    signups: number;
    emailVerified: number;
    profileCompleted: number;
    assessmentStarted: number;
    assessmentCompleted: number;
    upgradedToPremium: number;
  };
  usersByRole: {
    USER: number;
    ADMIN: number;
    VENDOR: number;
  };
  signupTrend: Array<{
    date: string;
    signups: number;
    verifications: number;
  }>;
  engagementSegments: {
    highlyActive: number;
    active: number;
    inactive: number;
    churned: number;
  };
}

interface ActivityEvent {
  id: string;
  type: 'USER_REGISTERED' | 'ASSESSMENT_STARTED' | 'ASSESSMENT_COMPLETED' | 'VENDOR_CONTACTED' | 'SUBSCRIPTION_CREATED';
  userId: string;
  userName: string;
  userEmail: string;
  metadata?: any;
  timestamp: Date;
}

interface ActivityFeedParams {
  limit?: number;
  eventType?: string;
  userEmail?: string;
}

interface ExportParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Analytics Service
 * Provides aggregated metrics for admin dashboard
 */
export class AnalyticsService extends BaseService {
  /**
   * Get assessment metrics
   */
  async getAssessmentMetrics(
    params: AnalyticsParams = {},
    context?: ServiceContext
  ): Promise<ApiResponse<AssessmentMetrics>> {
    try {
      // Only admins can view analytics
      this.requirePermission(context, [UserRole.ADMIN]);

      // Set defaults
      const endDate = params.endDate ? new Date(params.endDate) : new Date();
      const startDate = params.startDate
        ? new Date(params.startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const groupBy = params.groupBy || 'day';

      // Validate date range (max 1 year)
      const daysDiff = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        throw this.createError('Date range cannot exceed 1 year', 400, 'INVALID_DATE_RANGE');
      }

      // Build date filter
      const dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      // Get status counts using groupBy
      const statusCounts = await this.prisma.assessment.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: true
      });

      const byStatus = {
        DRAFT: statusCounts.find(s => s.status === AssessmentStatus.DRAFT)?._count || 0,
        IN_PROGRESS: statusCounts.find(s => s.status === AssessmentStatus.IN_PROGRESS)?._count || 0,
        COMPLETED: statusCounts.find(s => s.status === AssessmentStatus.COMPLETED)?._count || 0,
        FAILED: statusCounts.find(s => s.status === AssessmentStatus.FAILED)?._count || 0
      };

      const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
      const started = byStatus.IN_PROGRESS + byStatus.COMPLETED;
      const completed = byStatus.COMPLETED;
      const inProgress = byStatus.IN_PROGRESS;
      const completionRate = started > 0 ? Math.round((completed / started) * 100 * 100) / 100 : 0;

      // Calculate abandoned assessments (IN_PROGRESS + updatedAt > 7 days ago)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const abandoned = await this.prisma.assessment.count({
        where: {
          status: AssessmentStatus.IN_PROGRESS,
          updatedAt: { lt: sevenDaysAgo },
          ...dateFilter
        }
      });

      // Calculate average completion time using raw SQL
      const avgTimeResult = await this.prisma.$queryRaw<Array<{ avg_minutes: number | null }>>`
        SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 60) as avg_minutes
        FROM "Assessment"
        WHERE status::text = ${AssessmentStatus.COMPLETED}
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
      `;
      const avgCompletionTime = Math.round(avgTimeResult[0]?.avg_minutes || 0);

      // Get template distribution
      const byTemplateRaw = await this.prisma.assessment.groupBy({
        by: ['templateId'],
        where: dateFilter,
        _count: true
      });

      // Fetch template names
      const templateIds = byTemplateRaw.map(t => t.templateId);
      const templates = await this.prisma.template.findMany({
        where: { id: { in: templateIds } },
        select: { id: true, name: true }
      });

      const totalByTemplate = byTemplateRaw.reduce((sum, t) => sum + t._count, 0);
      const byTemplate = byTemplateRaw.map(t => {
        const template = templates.find(tpl => tpl.id === t.templateId);
        return {
          templateId: t.templateId,
          templateName: template?.name || 'Unknown',
          count: t._count,
          percentage: totalByTemplate > 0 ? Math.round((t._count / totalByTemplate) * 100 * 100) / 100 : 0
        };
      });

      // Generate trend data using raw SQL with date_trunc
      const groupByMapping = {
        day: 'day',
        week: 'week',
        month: 'month'
      };
      const truncType = groupByMapping[groupBy];

      const trend = await this.prisma.$queryRaw<Array<{
        date: Date;
        started: bigint;
        completed: bigint;
        abandoned: bigint;
      }>>`
        SELECT
          DATE_TRUNC(${truncType}, "createdAt")::date as date,
          COUNT(*) FILTER (WHERE status::text IN (${AssessmentStatus.IN_PROGRESS}, ${AssessmentStatus.COMPLETED})) as started,
          COUNT(*) FILTER (WHERE status::text = ${AssessmentStatus.COMPLETED}) as completed,
          COUNT(*) FILTER (
            WHERE status::text = ${AssessmentStatus.IN_PROGRESS}
            AND "updatedAt" < NOW() - INTERVAL '7 days'
          ) as abandoned
        FROM "Assessment"
        WHERE "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY 1
        ORDER BY date ASC
      `;

      // Format trend data
      const formattedTrend = trend.map(t => ({
        date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date).split('T')[0],
        started: Number(t.started),
        completed: Number(t.completed),
        abandoned: Number(t.abandoned)
      }));

      const metrics: AssessmentMetrics = {
        total,
        started,
        completed,
        inProgress,
        abandoned,
        completionRate,
        avgCompletionTime,
        byStatus,
        byTemplate,
        trend: formattedTrend
      };

      return this.createResponse(true, metrics);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getAssessmentMetrics');
    }
  }

  /**
   * Get vendor analytics
   */
  async getVendorAnalytics(
    params: VendorAnalyticsParams = {},
    context?: ServiceContext
  ): Promise<ApiResponse<VendorAnalytics>> {
    try {
      // Only admins can view analytics
      this.requirePermission(context, [UserRole.ADMIN]);

      // Set defaults
      const endDate = params.endDate ? new Date(params.endDate) : new Date();
      const startDate = params.startDate
        ? new Date(params.startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const limit = params.limit || 10;

      // Build date filter
      const dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      // Total vendors count
      const totalVendors = await this.prisma.vendor.count();

      // Active vendors (vendors with at least one match)
      const activeVendorsResult = await this.prisma.vendor.findMany({
        where: {
          matches: {
            some: {}
          }
        },
        select: { id: true }
      });
      const activeVendors = activeVendorsResult.length;

      // Total clicks from VendorMatch (where viewed = true)
      const vendorMatchClicks = await this.prisma.vendorMatch.count({
        where: {
          viewed: true,
          ...dateFilter
        }
      });

      // Total direct clicks from Vendor.clickCount (aggregate all vendor click counts)
      const vendorClicksAgg = await this.prisma.vendor.aggregate({
        _sum: {
          clickCount: true
        }
      });
      const directVendorClicks = vendorClicksAgg._sum.clickCount || 0;

      // Combined total clicks
      const totalClicks = vendorMatchClicks + directVendorClicks;

      // Unique visitors (distinct userIds from VendorMatch through Gap and Assessment)
      const uniqueVisitorsRaw = await this.prisma.$queryRaw<Array<{ distinct_users: bigint }>>`
        SELECT COUNT(DISTINCT a."userId") as distinct_users
        FROM "VendorMatch" vm
        JOIN "Gap" g ON vm."gapId" = g.id
        JOIN "Assessment" a ON g."assessmentId" = a.id
        WHERE vm.viewed = true
          AND vm."createdAt" >= ${dateFilter.createdAt.gte}
          AND vm."createdAt" <= ${dateFilter.createdAt.lte}
      `;
      const uniqueVisitors = Number(uniqueVisitorsRaw[0]?.distinct_users || 0);

      // Total contacts
      const totalContacts = await this.prisma.vendorContact.count({
        where: dateFilter
      });

      // Conversion rate
      const conversionRate = totalClicks > 0 ? Math.round((totalContacts / totalClicks) * 100 * 100) / 100 : 0;

      // Average match score
      const avgScoreResult = await this.prisma.vendorMatch.aggregate({
        where: dateFilter,
        _avg: {
          matchScore: true
        }
      });
      const avgMatchScore = Math.round((avgScoreResult._avg.matchScore || 0) * 100) / 100;

      // Top vendors by engagement
      const vendorEngagement = await this.prisma.vendor.findMany({
        select: {
          id: true,
          companyName: true,
          clickCount: true,
          _count: {
            select: {
              matches: {
                where: {
                  viewed: true,
                  ...dateFilter
                }
              },
              contacts: {
                where: dateFilter
              }
            }
          }
        },
        take: limit * 2 // Get more to ensure we have enough after filtering
      });

      // Calculate engagement scores and trends
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const topVendorsWithTrend = await Promise.all(
        vendorEngagement.map(async (vendor) => {
          const matchClicks = vendor._count.matches;
          const directClicks = vendor.clickCount || 0;
          const totalClicks = matchClicks + directClicks;
          const contacts = vendor._count.contacts;
          const engagementScore = totalClicks * 1 + contacts * 5;

          // Get clicks for last 7 days vs previous 7 days
          const [recentClicks, previousClicks] = await Promise.all([
            this.prisma.vendorMatch.count({
              where: {
                vendorId: vendor.id,
                viewed: true,
                createdAt: { gte: sevenDaysAgo, lte: endDate }
              }
            }),
            this.prisma.vendorMatch.count({
              where: {
                vendorId: vendor.id,
                viewed: true,
                createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo }
              }
            })
          ]);

          // Calculate trend
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (previousClicks > 0) {
            const changePercent = ((recentClicks - previousClicks) / previousClicks) * 100;
            if (changePercent > 10) trend = 'up';
            else if (changePercent < -10) trend = 'down';
          } else if (recentClicks > 0) {
            trend = 'up';
          }

          return {
            vendorId: vendor.id,
            companyName: vendor.companyName,
            clicks: totalClicks,
            contacts,
            conversionRate: totalClicks > 0 ? Math.round((contacts / totalClicks) * 100 * 100) / 100 : 0,
            trend,
            trendDirection: trend, // Add trendDirection for frontend compatibility
            engagementScore
          };
        })
      );

      // Sort by engagement and take top N
      const topVendors = topVendorsWithTrend
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, limit)
        .map(({ engagementScore, ...vendor }) => vendor);

      // Clicks by category
      const clicksByCategoryRaw = await this.prisma.vendorMatch.groupBy({
        by: ['vendorId'],
        where: {
          viewed: true,
          ...dateFilter
        },
        _count: true
      });

      // Get vendor categories and aggregate by category
      const vendorCategories = await this.prisma.vendor.findMany({
        where: {
          id: { in: clicksByCategoryRaw.map(c => c.vendorId) }
        },
        select: { id: true, categories: true }
      });

      const categoryMap = new Map<string, { clicks: number; contacts: number }>();

      for (const click of clicksByCategoryRaw) {
        const vendor = vendorCategories.find(v => v.id === click.vendorId);
        if (vendor && vendor.categories) {
          const categories = Array.isArray(vendor.categories) ? vendor.categories : [vendor.categories];
          for (const category of categories) {
            const existing = categoryMap.get(category) || { clicks: 0, contacts: 0 };
            categoryMap.set(category, {
              clicks: existing.clicks + click._count,
              contacts: existing.contacts
            });
          }
        }
      }

      // Get contacts by category
      const contactsByVendor = await this.prisma.vendorContact.groupBy({
        by: ['vendorId'],
        where: dateFilter,
        _count: true
      });

      for (const contact of contactsByVendor) {
        const vendor = vendorCategories.find(v => v.id === contact.vendorId);
        if (vendor && vendor.categories) {
          const categories = Array.isArray(vendor.categories) ? vendor.categories : [vendor.categories];
          for (const category of categories) {
            const existing = categoryMap.get(category) || { clicks: 0, contacts: 0 };
            categoryMap.set(category, {
              clicks: existing.clicks,
              contacts: existing.contacts + contact._count
            });
          }
        }
      }

      const clicksByCategory = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.clicks - a.clicks);

      // Trend data - Note: VendorMatch doesn't have userId, need to join through Gap -> Assessment
      const trend = await this.prisma.$queryRaw<Array<{
        date: Date;
        clicks: bigint;
        contacts: bigint;
        unique_visitors: bigint;
      }>>`
        SELECT
          DATE_TRUNC('day', vm."createdAt")::date as date,
          COUNT(DISTINCT vm.id) FILTER (WHERE vm.viewed = true) as clicks,
          0 as contacts,
          COUNT(DISTINCT a."userId") FILTER (WHERE vm.viewed = true) as unique_visitors
        FROM "VendorMatch" vm
        LEFT JOIN "Gap" g ON vm."gapId" = g.id
        LEFT JOIN "Assessment" a ON g."assessmentId" = a.id
        WHERE vm."createdAt" >= ${startDate}
          AND vm."createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('day', vm."createdAt")

        UNION ALL

        SELECT
          DATE_TRUNC('day', vc."createdAt")::date as date,
          0 as clicks,
          COUNT(DISTINCT vc.id) as contacts,
          0 as unique_visitors
        FROM "VendorContact" vc
        WHERE vc."createdAt" >= ${startDate}
          AND vc."createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('day', vc."createdAt")

        ORDER BY date ASC
      `;

      // Aggregate trend data by date
      const trendMap = new Map<string, { clicks: number; contacts: number; uniqueVisitors: number }>();

      for (const row of trend) {
        const dateKey = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0];
        const existing = trendMap.get(dateKey) || { clicks: 0, contacts: 0, uniqueVisitors: 0 };
        trendMap.set(dateKey, {
          clicks: existing.clicks + Number(row.clicks),
          contacts: existing.contacts + Number(row.contacts),
          uniqueVisitors: Math.max(existing.uniqueVisitors, Number(row.unique_visitors))
        });
      }

      const formattedTrend = Array.from(trendMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate click-through rate (from views to contacts)
      const clickThroughRate = totalClicks > 0 ? (totalContacts / totalClicks) * 100 : 0;

      const analytics: VendorAnalytics = {
        totalVendors,
        activeVendors,
        totalClicks,
        uniqueVisitors,
        totalContacts,
        conversionRate,
        clickThroughRate,
        avgMatchScore,
        topVendors,
        clicksByCategory,
        trend: formattedTrend
      };

      return this.createResponse(true, analytics);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getVendorAnalytics');
    }
  }

  /**
   * Get user activity and conversion metrics
   */
  async getUserAnalytics(
    context?: ServiceContext
  ): Promise<ApiResponse<UserAnalytics>> {
    try {
      // Only admins can view analytics
      this.requirePermission(context, [UserRole.ADMIN]);

      // Date thresholds
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Basic user counts
      const [totalUsers, activeUsers, newUsers, verifiedUsers, activeInWeek] = await Promise.all([
        this.prisma.user.count({ where: { status: { not: 'DELETED' } } }),
        this.prisma.user.count({
          where: {
            lastLogin: { gte: thirtyDaysAgo },
            status: { not: 'DELETED' }
          }
        }),
        this.prisma.user.count({
          where: {
            createdAt: { gte: thirtyDaysAgo },
            status: { not: 'DELETED' }
          }
        }),
        this.prisma.user.count({
          where: {
            emailVerified: true,
            status: { not: 'DELETED' }
          }
        }),
        this.prisma.user.count({
          where: {
            lastLogin: { gte: sevenDaysAgo },
            status: { not: 'DELETED' }
          }
        })
      ]);

      // Retention rate
      const retentionRate = totalUsers > 0 ? Math.round((activeInWeek / totalUsers) * 100 * 100) / 100 : 0;

      // Conversion funnel
      const [
        signups,
        emailVerified,
        profileCompleted,
        assessmentStarted,
        assessmentCompleted,
        upgradedToPremium
      ] = await Promise.all([
        this.prisma.user.count({ where: { status: { not: 'DELETED' } } }),
        this.prisma.user.count({
          where: {
            emailVerified: true,
            status: { not: 'DELETED' }
          }
        }),
        this.prisma.user.count({
          where: {
            organization: { isNot: null },
            status: { not: 'DELETED' }
          }
        }),
        this.prisma.user.count({
          where: {
            assessments: { some: {} },
            status: { not: 'DELETED' }
          }
        }),
        this.prisma.user.count({
          where: {
            assessments: { some: { status: 'COMPLETED' } },
            status: { not: 'DELETED' }
          }
        }),
        this.prisma.user.count({
          where: {
            subscription: {
              plan: { in: ['PREMIUM', 'ENTERPRISE'] },
              status: 'ACTIVE'
            },
            status: { not: 'DELETED' }
          }
        })
      ]);

      const conversionFunnel = {
        signups,
        emailVerified,
        profileCompleted,
        assessmentStarted,
        assessmentCompleted,
        upgradedToPremium
      };

      // Users by role
      const roleGroups = await this.prisma.user.groupBy({
        by: ['role'],
        where: { status: { not: 'DELETED' } },
        _count: true
      });

      const usersByRole = {
        USER: roleGroups.find(r => r.role === 'USER')?._count || 0,
        ADMIN: roleGroups.find(r => r.role === 'ADMIN')?._count || 0,
        VENDOR: roleGroups.find(r => r.role === 'VENDOR')?._count || 0
      };

      // Signup trend (last 30 days)
      const signupTrendRaw = await this.prisma.$queryRaw<Array<{
        date: Date;
        signups: bigint;
        verifications: bigint;
      }>>`
        SELECT
          DATE_TRUNC('day', "createdAt")::date as date,
          COUNT(*) as signups,
          COUNT(*) FILTER (WHERE "emailVerified" = true) as verifications
        FROM "User"
        WHERE "createdAt" >= ${thirtyDaysAgo}
          AND status != 'DELETED'
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `;

      const signupTrend = signupTrendRaw.map(row => ({
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0],
        signups: Number(row.signups),
        verifications: Number(row.verifications)
      }));

      // Engagement segments
      const segmentsRaw = await this.prisma.$queryRaw<Array<{
        segment: string;
        count: bigint;
      }>>`
        SELECT
          CASE
            WHEN assessment_count >= 5 THEN 'highlyActive'
            WHEN assessment_count BETWEEN 2 AND 4 THEN 'active'
            WHEN assessment_count BETWEEN 0 AND 1 AND "lastLogin" > ${ninetyDaysAgo} THEN 'inactive'
            ELSE 'churned'
          END as segment,
          COUNT(*) as count
        FROM (
          SELECT
            u.id,
            COUNT(a.id) as assessment_count,
            u."lastLogin"
          FROM "User" u
          LEFT JOIN "Assessment" a ON u.id = a."userId"
          WHERE u.status != 'DELETED'
          GROUP BY u.id, u."lastLogin"
        ) user_stats
        GROUP BY segment
      `;

      const engagementSegments = {
        highlyActive: Number(segmentsRaw.find(s => s.segment === 'highlyActive')?.count || 0),
        active: Number(segmentsRaw.find(s => s.segment === 'active')?.count || 0),
        inactive: Number(segmentsRaw.find(s => s.segment === 'inactive')?.count || 0),
        churned: Number(segmentsRaw.find(s => s.segment === 'churned')?.count || 0)
      };

      const analytics: UserAnalytics = {
        totalUsers,
        activeUsers,
        newUsers,
        verifiedUsers,
        retentionRate,
        conversionFunnel,
        usersByRole,
        signupTrend,
        engagementSegments
      };

      return this.createResponse(true, analytics);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getUserAnalytics');
    }
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(
    params: ActivityFeedParams = {},
    context?: ServiceContext
  ): Promise<ApiResponse<ActivityEvent[]>> {
    try {
      // Only admins can view activity feed
      this.requirePermission(context, [UserRole.ADMIN]);

      const { limit = 20, eventType, userEmail } = params;

      // Build email filter
      const emailFilter = userEmail ? { contains: userEmail, mode: 'insensitive' as const } : undefined;

      // Fetch recent events from different sources
      const events: ActivityEvent[] = [];

      // User registrations
      if (!eventType || eventType === 'USER_REGISTERED') {
        const users = await this.prisma.user.findMany({
          where: {
            ...(emailFilter && { email: emailFilter }),
            status: { not: 'DELETED' }
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        });

        events.push(...users.map(user => ({
          id: user.id,
          type: 'USER_REGISTERED' as const,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          timestamp: user.createdAt
        })));
      }

      // Assessment starts
      if (!eventType || eventType === 'ASSESSMENT_STARTED') {
        const assessments = await this.prisma.assessment.findMany({
          where: {
            ...(emailFilter && { user: { email: emailFilter } })
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            template: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        });

        events.push(...assessments.map(assessment => ({
          id: assessment.id,
          type: 'ASSESSMENT_STARTED' as const,
          userId: assessment.userId,
          userName: `${assessment.user.firstName} ${assessment.user.lastName}`,
          userEmail: assessment.user.email,
          metadata: { templateName: assessment.template.name },
          timestamp: assessment.createdAt
        })));
      }

      // Assessment completions
      if (!eventType || eventType === 'ASSESSMENT_COMPLETED') {
        const completed = await this.prisma.assessment.findMany({
          where: {
            status: 'COMPLETED',
            completedAt: { not: null },
            ...(emailFilter && { user: { email: emailFilter } })
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            template: {
              select: {
                name: true
              }
            }
          },
          orderBy: { completedAt: 'desc' },
          take: limit
        });

        events.push(...completed.map(assessment => ({
          id: assessment.id,
          type: 'ASSESSMENT_COMPLETED' as const,
          userId: assessment.userId,
          userName: `${assessment.user.firstName} ${assessment.user.lastName}`,
          userEmail: assessment.user.email,
          metadata: { templateName: assessment.template.name },
          timestamp: assessment.completedAt!
        })));
      }

      // Vendor contacts
      if (!eventType || eventType === 'VENDOR_CONTACTED') {
        const contacts = await this.prisma.vendorContact.findMany({
          where: {
            ...(emailFilter && { user: { email: emailFilter } })
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            vendor: {
              select: {
                companyName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        });

        events.push(...contacts.map(contact => ({
          id: contact.id,
          type: 'VENDOR_CONTACTED' as const,
          userId: contact.userId,
          userName: `${contact.user.firstName} ${contact.user.lastName}`,
          userEmail: contact.user.email,
          metadata: { vendorName: contact.vendor.companyName },
          timestamp: contact.createdAt
        })));
      }

      // Subscriptions
      if (!eventType || eventType === 'SUBSCRIPTION_CREATED') {
        const subscriptions = await this.prisma.subscription.findMany({
          where: {
            ...(emailFilter && { user: { email: emailFilter } })
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        });

        events.push(...subscriptions.map(sub => ({
          id: sub.id,
          type: 'SUBSCRIPTION_CREATED' as const,
          userId: sub.userId,
          userName: `${sub.user.firstName} ${sub.user.lastName}`,
          userEmail: sub.user.email,
          metadata: { plan: sub.plan },
          timestamp: sub.createdAt
        })));
      }

      // Sort all events by timestamp and take limit
      const sortedEvents = events
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

      return this.createResponse(true, sortedEvents);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getActivityFeed');
    }
  }

  /**
   * Export analytics data to CSV (Excel-compatible)
   */
  async exportAnalytics(
    params: ExportParams = {},
    context?: ServiceContext
  ): Promise<ApiResponse<string>> {
    try {
      // Only admins can export analytics
      this.requirePermission(context, [UserRole.ADMIN]);

      // Get all analytics data
      const [assessments, vendors, users] = await Promise.all([
        this.getAssessmentMetrics(
          { startDate: params.startDate, endDate: params.endDate, groupBy: 'day' },
          context
        ),
        this.getVendorAnalytics(
          { startDate: params.startDate, endDate: params.endDate },
          context
        ),
        this.getUserAnalytics(context)
      ]);

      if (!assessments.success || !vendors.success || !users.success) {
        throw this.createError('Failed to fetch analytics data', 500, 'EXPORT_ERROR');
      }

      // Build comprehensive CSV with multiple sections
      const Papa = await import('papaparse');
      let csvOutput = '';

      // Section 1: Summary Metrics
      csvOutput += '=== ANALYTICS SUMMARY ===\n';
      csvOutput += `Export Date,${new Date().toISOString()}\n`;
      csvOutput += `Date Range,${params.startDate || 'All Time'} to ${params.endDate || 'Present'}\n`;
      csvOutput += '\n';

      const summaryData = [
        { Metric: 'Total Assessments', Value: assessments.data.total },
        { Metric: 'Completed Assessments', Value: assessments.data.completed },
        { Metric: 'Completion Rate (%)', Value: assessments.data.completionRate },
        { Metric: 'Average Completion Time (min)', Value: assessments.data.avgCompletionTime },
        { Metric: 'Total Vendors', Value: vendors.data.totalVendors },
        { Metric: 'Active Vendors', Value: vendors.data.activeVendors },
        { Metric: 'Total Vendor Clicks', Value: vendors.data.totalClicks },
        { Metric: 'Vendor Conversion Rate (%)', Value: vendors.data.conversionRate },
        { Metric: 'Total Users', Value: users.data.totalUsers },
        { Metric: 'Active Users', Value: users.data.activeUsers },
        { Metric: 'New Users', Value: users.data.newUsers },
        { Metric: 'User Retention Rate (%)', Value: users.data.retentionRate }
      ];
      csvOutput += Papa.unparse(summaryData) + '\n\n';

      // Section 2: Assessment Trend
      csvOutput += '=== ASSESSMENT TREND ===\n';
      csvOutput += Papa.unparse(assessments.data.trend) + '\n\n';

      // Section 3: Assessment by Template
      csvOutput += '=== ASSESSMENTS BY TEMPLATE ===\n';
      csvOutput += Papa.unparse(assessments.data.byTemplate) + '\n\n';

      // Section 4: Top Vendors
      csvOutput += '=== TOP VENDORS ===\n';
      csvOutput += Papa.unparse(vendors.data.topVendors) + '\n\n';

      // Section 5: Vendor Clicks by Category
      csvOutput += '=== VENDOR CLICKS BY CATEGORY ===\n';
      csvOutput += Papa.unparse(vendors.data.clicksByCategory) + '\n\n';

      // Section 6: User Conversion Funnel
      csvOutput += '=== USER CONVERSION FUNNEL ===\n';
      const funnelData = Object.entries(users.data.conversionFunnel).map(([stage, count]) => ({
        Stage: stage,
        Users: count
      }));
      csvOutput += Papa.unparse(funnelData) + '\n\n';

      // Section 7: User Engagement Segments
      csvOutput += '=== USER ENGAGEMENT SEGMENTS ===\n';
      const segmentData = Object.entries(users.data.engagementSegments).map(([segment, count]) => ({
        Segment: segment,
        Users: count
      }));
      csvOutput += Papa.unparse(segmentData) + '\n\n';

      // Section 8: Signup Trend
      csvOutput += '=== SIGNUP TREND ===\n';
      csvOutput += Papa.unparse(users.data.signupTrend) + '\n\n';

      return this.createResponse(true, csvOutput);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'exportAnalytics');
    }
  }

  /**
   * Get revenue analytics for admin dashboard
   *
   * @param context - Authentication context
   * @param view - Analytics view type (overview | trends | customers | breakdown)
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Revenue analytics data
   */
  async getRevenueAnalytics(
    context: any,
    view: 'overview' | 'trends' | 'customers' | 'breakdown',
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      // Require admin permission
      this.requirePermission(context, [UserRole.ADMIN]);

      // Default date range: last 12 months
      const end = endDate || new Date();
      const start = startDate || new Date(end.getFullYear(), end.getMonth() - 12, end.getDate());

      this.logger.info('Getting revenue analytics', {
        view,
        startDate: start,
        endDate: end,
        userId: context.userId
      });

      let data: any;

      switch (view) {
        case 'overview':
          data = await this.getRevenueOverview(start, end);
          break;
        case 'trends':
          data = await this.getRevenueTrends(start, end);
          break;
        case 'customers':
          data = await this.getRevenueByCustomer(start, end);
          break;
        case 'breakdown':
          data = await this.getRevenueBreakdown(start, end);
          break;
        default:
          throw this.createError(`Invalid view type: ${view}`, 400, 'INVALID_VIEW_TYPE');
      }

      return this.createResponse(true, data);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getRevenueAnalytics');
    }
  }

  /**
   * Get revenue overview with key metrics
   */
  private async getRevenueOverview(startDate: Date, endDate: Date): Promise<any> {
    // Get all PAID invoices in date range
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        subscription: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });

    // Calculate total revenue
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Get unique paying customers (organizations)
    const uniqueCustomers = new Set(
      invoices
        .map(inv => inv.subscription?.user?.organization?.id)
        .filter(Boolean)
    );

    // Calculate MRR (normalize all subscriptions to monthly)
    const mrrContributions = invoices.map(inv => {
      const billingCycle = inv.subscription?.billingCycle;
      if (billingCycle === BillingCycle.MONTHLY) {
        return inv.amount;
      } else if (billingCycle === BillingCycle.ANNUAL) {
        return inv.amount / 12; // Annual normalized to monthly
      }
      return 0;
    });

    const currentMRR = mrrContributions.reduce((sum, mrr) => sum + mrr, 0);

    // Calculate ARR (MRR × 12)
    const currentARR = currentMRR * 12;

    // Get active subscriptions count
    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        billingCycle: { not: null }
      }
    });

    // Calculate previous period for growth comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = startDate;

    const previousInvoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: previousStart,
          lt: previousEnd
        }
      }
    });

    const previousRevenue = previousInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Calculate growth percentage
    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return {
      totalRevenue,
      revenueGrowth,
      currentMRR,
      currentARR,
      activeSubscriptions,
      payingCustomers: uniqueCustomers.size,
      invoiceCount: invoices.length,
      averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0
    };
  }

  /**
   * Get revenue trends over time (monthly breakdown)
   */
  private async getRevenueTrends(startDate: Date, endDate: Date): Promise<any> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        subscription: true
      },
      orderBy: {
        paidAt: 'asc'
      }
    });

    // Group by month
    const monthlyData = new Map<string, { revenue: number; invoices: number; mrr: number }>();

    invoices.forEach(invoice => {
      const month = invoice.paidAt
        ? `${invoice.paidAt.getFullYear()}-${String(invoice.paidAt.getMonth() + 1).padStart(2, '0')}`
        : 'unknown';

      if (!monthlyData.has(month)) {
        monthlyData.set(month, { revenue: 0, invoices: 0, mrr: 0 });
      }

      const data = monthlyData.get(month)!;
      data.revenue += invoice.amount;
      data.invoices += 1;

      // Add MRR contribution
      const billingCycle = invoice.subscription?.billingCycle;
      if (billingCycle === BillingCycle.MONTHLY) {
        data.mrr += invoice.amount;
      } else if (billingCycle === BillingCycle.ANNUAL) {
        data.mrr += invoice.amount / 12;
      }
    });

    // Convert to array and sort by month
    const trends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        invoiceCount: data.invoices,
        mrr: data.mrr,
        arr: data.mrr * 12
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { trends };
  }

  /**
   * Get revenue by customer (top customers by revenue)
   */
  private async getRevenueByCustomer(startDate: Date, endDate: Date): Promise<any> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        subscription: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });

    // Group by organization
    const customerData = new Map<string, {
      organizationId: string;
      organizationName: string;
      revenue: number;
      invoiceCount: number;
    }>();

    invoices.forEach(invoice => {
      const org = invoice.subscription?.user?.organization;
      if (!org) return;

      if (!customerData.has(org.id)) {
        customerData.set(org.id, {
          organizationId: org.id,
          organizationName: org.name,
          revenue: 0,
          invoiceCount: 0
        });
      }

      const data = customerData.get(org.id)!;
      data.revenue += invoice.amount;
      data.invoiceCount += 1;
    });

    // Convert to array and sort by revenue (descending)
    const customers = Array.from(customerData.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20); // Top 20 customers

    return { customers };
  }

  /**
   * Get revenue breakdown by subscription plan
   */
  private async getRevenueBreakdown(startDate: Date, endDate: Date): Promise<any> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        subscription: true
      }
    });

    // Group by plan
    const planData = new Map<string, { revenue: number; invoiceCount: number; subscriptionCount: Set<string> }>();

    invoices.forEach(invoice => {
      const plan = invoice.subscription.plan;
      const cycle = invoice.subscription.billingCycle || 'UNKNOWN';
      const key = `${plan}_${cycle}`;

      if (!planData.has(key)) {
        planData.set(key, { revenue: 0, invoiceCount: 0, subscriptionCount: new Set() });
      }

      const data = planData.get(key)!;
      data.revenue += invoice.amount;
      data.invoiceCount += 1;
      data.subscriptionCount.add(invoice.subscription.id);
    });

    // Convert to array
    const breakdown = Array.from(planData.entries())
      .map(([key, data]) => {
        const [plan, cycle] = key.split('_');
        return {
          plan,
          billingCycle: cycle,
          revenue: data.revenue,
          invoiceCount: data.invoiceCount,
          subscriptionCount: data.subscriptionCount.size,
          averageRevenue: data.revenue / data.invoiceCount
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return { breakdown };
  }

  /**
   * Get detailed transaction list for revenue reports
   * Combines invoices and credit transactions
   */
  async getRevenueTransactions(
    context: any,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<any> {
    try {
      // Require admin permission
      this.requirePermission(context, [UserRole.ADMIN]);

      // Default date range: last 30 days
      const end = endDate || new Date();
      const start = startDate || new Date(end.getFullYear(), end.getMonth() - 1, end.getDate());

      this.logger.info('Getting revenue transactions', {
        startDate: start,
        endDate: end,
        limit,
        userId: context.userId
      });

      // Fetch invoices (subscription payments)
      const invoices = await this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.PAID,
          paidAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          subscription: {
            include: {
              user: {
                include: {
                  organization: true
                }
              }
            }
          }
        },
        orderBy: {
          paidAt: 'desc'
        },
        take: limit
      });

      // Fetch credit transactions (only PURCHASE transactions that generate revenue)
      const creditTransactions = await this.prisma.creditTransaction.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
          },
          type: TransactionType.PURCHASE // Only actual purchases, not bonuses or admin grants
        },
        include: {
          subscription: {
            include: {
              user: {
                include: {
                  organization: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      // Combine and transform transactions
      const transactions: any[] = [];

      // Add invoices
      invoices.forEach(invoice => {
        // Handle cases where subscription might be null (orphaned invoices)
        const org = invoice.subscription?.user?.organization;
        const plan = invoice.subscription?.plan || 'Unknown Plan';
        const billingCycle = invoice.subscription?.billingCycle || 'N/A';

        transactions.push({
          id: invoice.id,
          date: invoice.paidAt || invoice.createdAt,
          organization: org?.name || 'Unknown Organization',
          type: 'subscription',
          description: `${plan} Plan - ${billingCycle}`,
          amount: invoice.amount,
          status: invoice.status.toLowerCase(),
          metadata: {
            invoiceNumber: invoice.number,
            stripeInvoiceId: invoice.stripeInvoiceId,
            hasSubscription: !!invoice.subscription
          }
        });
      });

      // Add credit transactions (PURCHASE only)
      this.logger.info(`Found ${creditTransactions.length} credit transactions`);
      
      creditTransactions.forEach((transaction, index) => {
        // Handle cases where subscription might be null
        const org = transaction.subscription?.user?.organization;
        
        this.logger.info(`Processing credit transaction ${index}:`, {
          id: transaction.id,
          amount: transaction.amount,
          description: transaction.description,
          createdAt: transaction.createdAt,
          hasSubscription: !!transaction.subscription,
          hasOrg: !!org,
          orgName: org?.name
        });
        
        // Calculate revenue from credit purchases
        // Based on Heliolus pricing: 50 credits = €299
        const CREDIT_PRICE = 299 / 50; // €5.98 per credit
        let monetaryAmount = 0;
        
        if (transaction.amount > 0) {
          // Standard pricing: 50 credits for €299
          if (transaction.amount === 50) {
            monetaryAmount = 299;
          } else {
            // For other amounts, use per-credit pricing
            monetaryAmount = transaction.amount * CREDIT_PRICE;
          }
        }

        const txObject = {
          id: transaction.id,
          date: transaction.createdAt,
          organization: org?.name || 'Unknown Organization',
          type: 'credits',
          description: transaction.description,
          amount: monetaryAmount,
          status: 'paid',
          metadata: {
            creditAmount: transaction.amount,
            balance: transaction.balance,
            transactionType: transaction.type,
            hasSubscription: !!transaction.subscription
          }
        };
        
        this.logger.info(`Created transaction object:`, txObject);
        transactions.push(txObject);
      });

      // Sort all transactions by date (descending)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Limit results
      const limitedTransactions = transactions.slice(0, limit);

      return this.createResponse(true, { transactions: limitedTransactions });
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getRevenueTransactions');
    }
  }
}

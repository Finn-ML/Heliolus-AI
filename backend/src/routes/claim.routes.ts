import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../generated/prisma';
import { requireAnonymousSession, ANONYMOUS_COOKIE_NAME } from '../middleware/anonymous-session.middleware';

declare module 'fastify' {
  interface FastifyReply {
    clearCookie(name: string, options?: any): FastifyReply;
  }
}

export default async function claimRoutes(
  fastify: FastifyInstance,
  options: { prisma: PrismaClient }
) {
  const { prisma } = options;

  // POST /anon/claim - Migrate anonymous session data to authenticated user
  fastify.post('/claim', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user; // From auth middleware
    
    if (!user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    // Get anonymous session from cookie
    const sessionToken = request.cookies[ANONYMOUS_COOKIE_NAME];
    if (!sessionToken) {
      return reply.status(400).send({ error: 'No anonymous session found' });
    }

    // Find the active anonymous session
    const anonymousSession = await prisma.anonymousSession.findUnique({
      where: { 
        sessionToken,
        status: 'ACTIVE'
      },
      include: {
        organizationDraft: true,
        assessmentDrafts: true,
        documentDrafts: true
      }
    });

    if (!anonymousSession) {
      return reply.status(404).send({ error: 'Anonymous session not found or expired' });
    }

    // Check if session was already claimed
    if (anonymousSession.status === 'CLAIMED') {
      return reply.status(409).send({ 
        error: 'Session already claimed',
        claimedBy: anonymousSession.claimedByUserId,
        claimedAt: anonymousSession.claimedAt
      });
    }

    try {
      // Start transaction for atomic migration
      const result = await prisma.$transaction(async (tx) => {
        const migrationResult = {
          organizationId: null as string | null,
          assessmentIds: [] as string[],
          documentIds: [] as string[],
          documentsMigrated: 0
        };

        // 1. Handle Organization Data
        let organization = await tx.organization.findUnique({
          where: { userId: user.id }
        });

        if (anonymousSession.organizationDraft) {
          const draft = anonymousSession.organizationDraft;
          
          if (!organization) {
            // Create new organization from draft
            organization = await tx.organization.create({
              data: {
                userId: user.id,
                name: draft.name || 'My Organization',
                website: draft.website,
                industry: draft.industry,
                size: draft.size,
                country: draft.country,
                region: draft.region,
                description: draft.description,
                annualRevenue: draft.annualRevenue,
                complianceTeamSize: draft.complianceTeamSize,
                geography: draft.geography,
                riskProfile: draft.riskProfile,
                complianceGaps: draft.complianceGaps,
                onboardingCompleted: true
              }
            });
          } else {
            // Update existing organization with non-null draft values
            const updateData: any = {};
            if (draft.name) updateData.name = draft.name;
            if (draft.website) updateData.website = draft.website;
            if (draft.industry) updateData.industry = draft.industry;
            if (draft.size) updateData.size = draft.size;
            if (draft.country) updateData.country = draft.country;
            if (draft.region) updateData.region = draft.region;
            if (draft.description) updateData.description = draft.description;
            if (draft.annualRevenue) updateData.annualRevenue = draft.annualRevenue;
            if (draft.complianceTeamSize) updateData.complianceTeamSize = draft.complianceTeamSize;
            if (draft.geography) updateData.geography = draft.geography;
            if (draft.riskProfile) updateData.riskProfile = draft.riskProfile;
            if (draft.complianceGaps?.length) updateData.complianceGaps = draft.complianceGaps;

            if (Object.keys(updateData).length > 0) {
              organization = await tx.organization.update({
                where: { id: organization.id },
                data: updateData
              });
            }
          }
          
          migrationResult.organizationId = organization.id;
        }

        // 2. Migrate Assessment Drafts
        for (const assessmentDraft of anonymousSession.assessmentDrafts) {
          const assessment = await tx.assessment.create({
            data: {
              userId: user.id,
              organizationId: organization?.id || null,
              templateId: assessmentDraft.templateId,
              answers: assessmentDraft.answers as any,
              status: assessmentDraft.status
            }
          });
          migrationResult.assessmentIds.push(assessment.id);
        }

        // 3. Migrate Document Drafts
        for (const documentDraft of anonymousSession.documentDrafts) {
          // Generate new object key for organization
          const newObjectKey = documentDraft.objectKey.replace(
            `anon/${anonymousSession.id}/`,
            `org/${organization?.id || 'temp'}/`
          );

          const document = await tx.document.create({
            data: {
              organizationId: organization?.id || null,
              filename: documentDraft.filename,
              originalName: documentDraft.originalName,
              mimeType: documentDraft.mimeType,
              size: Number(documentDraft.size),
              s3Key: newObjectKey,
              s3Bucket: documentDraft.bucket,
              documentType: documentDraft.documentType,
              parsedContent: documentDraft.parsedContent as any,
              extractedData: documentDraft.extractedData as any,
              encrypted: documentDraft.encrypted,
              encryptionKey: documentDraft.encryptionKey,
              uploadedBy: user.id
            }
          });
          
          migrationResult.documentIds.push(document.id);
          migrationResult.documentsMigrated++;

          // TODO: Move actual file in object storage from anon/ to org/ prefix
          // This would involve calling the object storage service to copy/move files
        }

        // 4. Mark session as claimed
        await tx.anonymousSession.update({
          where: { id: anonymousSession.id },
          data: {
            status: 'CLAIMED',
            claimedByUserId: user.id,
            claimedAt: new Date()
          }
        });

        // 5. Clean up draft data
        if (anonymousSession.organizationDraft) {
          await tx.organizationDraft.delete({
            where: { sessionId: anonymousSession.id }
          });
        }

        await tx.assessmentDraft.deleteMany({
          where: { sessionId: anonymousSession.id }
        });

        await tx.documentDraft.deleteMany({
          where: { sessionId: anonymousSession.id }
        });

        return migrationResult;
      });

      // Clear the anonymous session cookie
      reply.clearCookie(ANONYMOUS_COOKIE_NAME, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Log successful migration
      fastify.log.info({
        userId: user.id,
        sessionId: anonymousSession.id,
        organizationId: result.organizationId,
        assessmentCount: result.assessmentIds.length,
        documentCount: result.documentIds.length
      }, 'Anonymous session successfully claimed and migrated');

      return {
        success: true,
        message: 'Anonymous session data successfully migrated to your account',
        migration: {
          organizationId: result.organizationId,
          assessmentCount: result.assessmentIds.length,
          documentCount: result.documentIds.length,
          documentsMigrated: result.documentsMigrated
        }
      };

    } catch (error) {
      fastify.log.error({
        error,
        userId: user.id,
        sessionId: anonymousSession.id
      }, 'Failed to claim anonymous session');

      return reply.status(500).send({
        error: 'Failed to migrate session data',
        message: 'Please try again or contact support if the problem persists'
      });
    }
  });

  // GET /anon/claim/status - Check if current session can be claimed
  fastify.get('/claim/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionToken = request.cookies[ANONYMOUS_COOKIE_NAME];
    
    if (!sessionToken) {
      return { canClaim: false, reason: 'No anonymous session found' };
    }

    const session = await prisma.anonymousSession.findUnique({
      where: { sessionToken },
      include: {
        organizationDraft: true,
        documentDrafts: true,
        assessmentDrafts: true
      }
    });

    if (!session || session.status !== 'ACTIVE') {
      return { canClaim: false, reason: 'Session not active or expired' };
    }

    const hasData = !!(
      session.organizationDraft ||
      session.documentDrafts.length > 0 ||
      session.assessmentDrafts.length > 0
    );

    return {
      canClaim: hasData,
      sessionId: session.id,
      dataPreview: {
        hasProfile: !!session.organizationDraft,
        documentCount: session.documentDrafts.length,
        assessmentCount: session.assessmentDrafts.length,
        profileComplete: !!(session.organizationDraft?.name && session.organizationDraft?.industry)
      }
    };
  });
}
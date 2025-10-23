import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { PrismaClient, AnonymousSession, AnonymousSessionStatus } from '../generated/prisma';

export interface AnonymousSessionContext {
  sessionId: string;
  sessionToken: string;
  isAnonymous: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    anonymousSession?: AnonymousSessionContext;
    cookies: { [cookieName: string]: string | undefined };
  }
  interface FastifyReply {
    setCookie(name: string, value: string, options?: any): FastifyReply;
  }
}

export const ANONYMOUS_COOKIE_NAME = 'heliolus_anon';
export const SESSION_EXPIRY_DAYS = 14;

export interface AnonymousSessionMiddlewareOptions {
  secret: string;
  prisma: PrismaClient;
}

export async function anonymousSessionMiddleware(
  fastify: FastifyInstance,
  options: AnonymousSessionMiddlewareOptions
) {
  const { secret, prisma } = options;

  console.log('🔧 Registering anonymous session middleware...');

  // Plugin for anonymous session support
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log(`🔍 Anonymous middleware checking: ${request.method} ${request.url}`);
    // Only process anonymous session for /anon routes
    if (!request.url.startsWith('/v1/anon/')) {
      return;
    }

    try {
      // Check for existing session cookie
      const sessionToken = request.cookies[ANONYMOUS_COOKIE_NAME];
      
      if (sessionToken) {
        // Verify and load existing session
        const session = await loadSession(sessionToken, prisma);
        if (session) {
          // Update last seen
          await prisma.anonymousSession.update({
            where: { id: session.id },
            data: { lastSeenAt: new Date() }
          });
          
          request.anonymousSession = {
            sessionId: session.id,
            sessionToken: session.sessionToken,
            isAnonymous: true
          };
          return;
        }
      }

      // Create new session if none exists or invalid
      const newSession = await createNewSession(request, prisma);
      
      // Set secure cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 14 days in seconds
        path: '/',
        signed: true
      };

      reply.setCookie(ANONYMOUS_COOKIE_NAME, newSession.sessionToken, cookieOptions);
      
      request.anonymousSession = {
        sessionId: newSession.id,
        sessionToken: newSession.sessionToken,
        isAnonymous: true
      };
      
    } catch (error) {
      // Log error but don't fail the request
      fastify.log.error({ error }, 'Anonymous session middleware error');
      
      // Create fallback session
      const fallbackSession = await createNewSession(request, prisma);
      request.anonymousSession = {
        sessionId: fallbackSession.id,
        sessionToken: fallbackSession.sessionToken,
        isAnonymous: true
      };
    }
  });
}

async function createNewSession(request: FastifyRequest, prisma: PrismaClient) {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  const session = await prisma.anonymousSession.create({
    data: {
      sessionToken,
      expiresAt,
      ipAddress: getClientIP(request),
      userAgent: request.headers['user-agent'] || null,
      status: 'ACTIVE'
    }
  });

  return session;
}

async function loadSession(sessionToken: string, prisma: PrismaClient) {
  const session = await prisma.anonymousSession.findUnique({
    where: { 
      sessionToken,
      status: 'ACTIVE'
    }
  });

  // Check if session is expired
  if (session && session.expiresAt < new Date()) {
    // Mark as expired
    await prisma.anonymousSession.update({
      where: { id: session.id },
      data: { status: 'EXPIRED' }
    });
    return null;
  }

  return session;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getClientIP(request: FastifyRequest): string | null {
  // Handle various proxy headers
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }
  
  return request.ip || null;
}

// Helper function to require anonymous session
export function requireAnonymousSession(request: FastifyRequest) {
  if (!request.anonymousSession) {
    throw new Error('Anonymous session required');
  }
  return request.anonymousSession;
}

// Helper function to clean up expired sessions (can be called periodically)
export async function cleanupExpiredSessions(prisma: PrismaClient) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - SESSION_EXPIRY_DAYS);
  
  const result = await prisma.anonymousSession.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: {
        lt: new Date()
      }
    },
    data: {
      status: 'EXPIRED'
    }
  });

  return result.count;
}
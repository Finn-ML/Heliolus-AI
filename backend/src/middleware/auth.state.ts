/**
 * Authentication State Management
 * Tracks and manages user authentication states
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole, UserStatus } from '../types/database';

export enum AuthState {
  // Unauthenticated states
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  
  // Registration flow states
  REGISTERING = 'REGISTERING',
  EMAIL_VERIFICATION_PENDING = 'EMAIL_VERIFICATION_PENDING',
  KYC_PENDING = 'KYC_PENDING', // Company verification
  
  // Authenticated states
  AUTHENTICATED = 'AUTHENTICATED',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE', // Missing business profile
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  
  // Password reset flow
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  
  // Session states
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',
}

export interface UserSession {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  organizationId?: string;
  state: AuthState;
  emailVerified: boolean;
  hasBusinessProfile: boolean;
  subscriptionPlan?: string;
  subscriptionActive: boolean;
  lastActivity: Date;
  sessionExpiry: Date;
}

/**
 * Determine user's authentication state
 */
export async function getUserAuthState(user: any): Promise<AuthState> {
  if (!user) {
    return AuthState.UNAUTHENTICATED;
  }

  // Check account status
  if (user.status === UserStatus.SUSPENDED) {
    return AuthState.ACCOUNT_SUSPENDED;
  }

  if (user.status === UserStatus.DELETED) {
    return AuthState.UNAUTHENTICATED;
  }

  // Check email verification
  if (!user.emailVerified) {
    return AuthState.EMAIL_VERIFICATION_PENDING;
  }

  // Check KYC/company verification (if required)
  if (user.organization && !user.organization.verified) {
    return AuthState.KYC_PENDING;
  }

  // Check business profile completion
  if (!user.organization || !user.organization.hasCompletedProfile) {
    return AuthState.PROFILE_INCOMPLETE;
  }

  // Check subscription status (for non-admin users)
  if (user.role !== UserRole.ADMIN) {
    if (user.subscription && user.subscription.status === 'EXPIRED') {
      return AuthState.SUBSCRIPTION_EXPIRED;
    }
  }

  return AuthState.AUTHENTICATED;
}

/**
 * Validate authentication state for specific actions
 */
export function requireAuthState(...allowedStates: AuthState[]) {
  return async (request: FastifyRequest & { userState?: AuthState }, reply: FastifyReply) => {
    if (!request.userState) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedStates.includes(request.userState)) {
      return reply.code(403).send({
        success: false,
        message: 'Invalid authentication state for this action',
        code: 'INVALID_AUTH_STATE',
        currentState: request.userState,
        requiredStates: allowedStates
      });
    }
  };
}

/**
 * Authentication state transitions
 */
export const AUTH_STATE_TRANSITIONS = {
  [AuthState.UNAUTHENTICATED]: [
    AuthState.REGISTERING,
    AuthState.AUTHENTICATED,
    AuthState.PASSWORD_RESET_REQUESTED
  ],
  [AuthState.REGISTERING]: [
    AuthState.EMAIL_VERIFICATION_PENDING,
    AuthState.UNAUTHENTICATED
  ],
  [AuthState.EMAIL_VERIFICATION_PENDING]: [
    AuthState.KYC_PENDING,
    AuthState.PROFILE_INCOMPLETE,
    AuthState.AUTHENTICATED,
    AuthState.UNAUTHENTICATED
  ],
  [AuthState.KYC_PENDING]: [
    AuthState.PROFILE_INCOMPLETE,
    AuthState.AUTHENTICATED,
    AuthState.ACCOUNT_SUSPENDED
  ],
  [AuthState.PROFILE_INCOMPLETE]: [
    AuthState.AUTHENTICATED,
    AuthState.SUBSCRIPTION_EXPIRED,
    AuthState.UNAUTHENTICATED
  ],
  [AuthState.AUTHENTICATED]: [
    AuthState.SUBSCRIPTION_EXPIRED,
    AuthState.ACCOUNT_SUSPENDED,
    AuthState.UNAUTHENTICATED,
    AuthState.SESSION_EXPIRED
  ],
  [AuthState.SUBSCRIPTION_EXPIRED]: [
    AuthState.AUTHENTICATED,
    AuthState.UNAUTHENTICATED
  ],
  [AuthState.ACCOUNT_SUSPENDED]: [
    AuthState.AUTHENTICATED,
    AuthState.UNAUTHENTICATED
  ],
  [AuthState.PASSWORD_RESET_REQUESTED]: [
    AuthState.UNAUTHENTICATED,
    AuthState.AUTHENTICATED
  ],
  [AuthState.SESSION_EXPIRED]: [
    AuthState.UNAUTHENTICATED,
    AuthState.AUTHENTICATED
  ],
  [AuthState.SESSION_INVALID]: [
    AuthState.UNAUTHENTICATED
  ]
};

/**
 * Check if state transition is valid
 */
export function isValidStateTransition(fromState: AuthState, toState: AuthState): boolean {
  const allowedTransitions = AUTH_STATE_TRANSITIONS[fromState];
  return allowedTransitions ? allowedTransitions.includes(toState) : false;
}

/**
 * Get required actions for current state
 */
export function getRequiredActions(state: AuthState): string[] {
  const actions: string[] = [];

  switch (state) {
    case AuthState.EMAIL_VERIFICATION_PENDING:
      actions.push('VERIFY_EMAIL');
      break;
    case AuthState.KYC_PENDING:
      actions.push('COMPLETE_KYC');
      actions.push('UPLOAD_COMPANY_DOCUMENTS');
      break;
    case AuthState.PROFILE_INCOMPLETE:
      actions.push('COMPLETE_BUSINESS_PROFILE');
      break;
    case AuthState.SUBSCRIPTION_EXPIRED:
      actions.push('RENEW_SUBSCRIPTION');
      break;
    case AuthState.ACCOUNT_SUSPENDED:
      actions.push('CONTACT_SUPPORT');
      break;
    case AuthState.PASSWORD_RESET_REQUESTED:
      actions.push('RESET_PASSWORD');
      break;
    case AuthState.SESSION_EXPIRED:
      actions.push('LOGIN');
      break;
  }

  return actions;
}

/**
 * Track authentication events for audit
 */
export interface AuthEvent {
  userId: string;
  event: string;
  fromState: AuthState;
  toState: AuthState;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuthEvent(event: AuthEvent): Promise<void> {
  // TODO: Implement audit logging to database
  console.log('Auth Event:', event);
}
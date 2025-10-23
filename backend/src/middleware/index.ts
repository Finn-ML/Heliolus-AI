/**
 * Middleware Index
 * Central export point for all middleware
 */

export {
  errorHandler,
  notFoundHandler,
  createErrorResponse,
  asyncHandler,
  type ErrorResponse,
} from './error.middleware';

export {
  loggingMiddleware,
  logSecurityEvent,
  logPerformanceMetric,
  type RequestContext,
} from './logging.mock';

export {
  authenticationMiddleware,
  optionalAuthenticationMiddleware,
  requireRole as mockRequireRole,
  requireOwnership,
  requireOrganization,
  requireVendor,
  type AuthenticatedUser,
} from './auth.mock';

export {
  requireRole,
  requireOwnershipOrAdmin,
  requireFeature,
  getUserPermissions,
  requirePremium,
  FEATURE_PERMISSIONS,
  type AuthenticatedRequest,
} from './rbac.middleware';

export {
  getUserAuthState,
  requireAuthState,
  isValidStateTransition,
  getRequiredActions,
  logAuthEvent,
  AuthState,
  AUTH_STATE_TRANSITIONS,
  type UserSession,
  type AuthEvent,
} from './auth.state';
import { z } from 'zod';

// Schema for frontend environment variable validation
const envSchema = z.object({
  // API Configuration
  VITE_API_URL: z.string().url('API URL must be a valid URL'),
  VITE_WS_URL: z.string().optional(),

  // Application Configuration
  VITE_APP_NAME: z.string().min(1, 'App name is required'),
  VITE_APP_VERSION: z.string().min(1, 'App version is required'),
  VITE_APP_DESCRIPTION: z.string().optional(),
  VITE_NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Authentication
  VITE_AUTH_TOKEN_KEY: z.string().default('heliolus_auth_token'),
  VITE_REFRESH_TOKEN_KEY: z.string().default('heliolus_refresh_token'),
  VITE_SESSION_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()).default('60'),

  // External Services
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_GA_MEASUREMENT_ID: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),

  // Feature Flags
  VITE_ENABLE_ANALYTICS: z
    .string()
    .transform(val => val === 'true')
    .default('true'),
  VITE_ENABLE_ERROR_REPORTING: z
    .string()
    .transform(val => val === 'true')
    .default('true'),
  VITE_ENABLE_DEV_TOOLS: z
    .string()
    .transform(val => val === 'true')
    .default('true'),
  VITE_ENABLE_SERVICE_WORKER: z
    .string()
    .transform(val => val === 'true')
    .default('false'),

  // UI/UX Configuration
  VITE_DEFAULT_THEME: z.enum(['light', 'dark', 'system']).default('light'),
  VITE_DEFAULT_LOCALE: z.string().default('en'),
  VITE_SUPPORTED_LOCALES: z.string().default('en,es,fr,de'),

  // Performance
  VITE_API_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()).default('30000'),
  VITE_MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('10485760'),
  VITE_ALLOWED_FILE_TYPES: z.string().default('image/*,application/pdf,.doc,.docx'),

  // Development Configuration
  VITE_HMR_PORT: z.string().transform(Number).pipe(z.number().optional()).optional(),
  VITE_HMR_HOST: z.string().default('localhost'),
  VITE_DEV_SERVER_HOST: z.string().default('localhost'),
  VITE_DEV_SERVER_PORT: z.string().transform(Number).pipe(z.number().optional()).optional(),

  // Social/External Links
  VITE_COMPANY_WEBSITE: z.string().url().optional(),
  VITE_SUPPORT_EMAIL: z.string().email().optional(),
  VITE_PRIVACY_POLICY_URL: z.string().url().optional(),
  VITE_TERMS_OF_SERVICE_URL: z.string().url().optional(),
  VITE_TWITTER_URL: z.string().url().optional(),
  VITE_LINKEDIN_URL: z.string().url().optional(),
  VITE_GITHUB_URL: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Get all import.meta.env variables that start with VITE_
function getViteEnvVariables(): Record<string, string> {
  const viteEnv: Record<string, string> = {};

  // In development/build time, use import.meta.env
  if (typeof window !== 'undefined' && (import.meta as any)?.env) {
    Object.entries((import.meta as any).env).forEach(([key, value]) => {
      if (key.startsWith('VITE_') && typeof value === 'string') {
        viteEnv[key] = value;
      }
    });
  }

  return viteEnv;
}

// Validate environment variables
export function validateEnv(): EnvConfig {
  try {
    const viteEnv = getViteEnvVariables();
    const env = envSchema.parse(viteEnv);

    // Additional validation rules
    if (env.VITE_NODE_ENV === 'production') {
      // In production, require certain environment variables
      const requiredInProduction = ['VITE_API_URL', 'VITE_APP_NAME', 'VITE_APP_VERSION'];

      const missingRequired = requiredInProduction.filter(key => !env[key as keyof EnvConfig]);
      if (missingRequired.length > 0) {
        throw new Error(
          `Missing required environment variables in production: ${missingRequired.join(', ')}`
        );
      }

      // Validate production URLs
      if (env.VITE_API_URL.includes('localhost') || env.VITE_API_URL.includes('127.0.0.1')) {
        console.warn('Warning: Using localhost API URL in production environment');
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment variable validation failed:\n${errorMessages.join('\n')}`);
    }
    throw error;
  }
}

// Helper functions for accessing validated environment variables
export function getApiUrl(): string {
  return validateEnv().VITE_API_URL;
}

export function getAppConfig() {
  const env = validateEnv();
  return {
    name: env.VITE_APP_NAME,
    version: env.VITE_APP_VERSION,
    description: env.VITE_APP_DESCRIPTION,
    environment: env.VITE_NODE_ENV,
  };
}

export function getFeatureFlags() {
  const env = validateEnv();
  return {
    analytics: env.VITE_ENABLE_ANALYTICS,
    errorReporting: env.VITE_ENABLE_ERROR_REPORTING,
    devTools: env.VITE_ENABLE_DEV_TOOLS,
    serviceWorker: env.VITE_ENABLE_SERVICE_WORKER,
  };
}

// Export validated environment variables
// Commented out to prevent immediate validation errors in development
// export const env = validateEnv();

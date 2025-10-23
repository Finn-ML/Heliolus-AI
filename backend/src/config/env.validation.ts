import { z } from 'zod';

// Schema for environment variable validation
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  HOST: z.string().default('localhost'),

  // Database Configuration
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  DATABASE_URL_TEST: z.string().optional(),

  // Redis Configuration
  REDIS_URL: z.string().min(1, 'Redis URL is required').optional(),

  // JWT Configuration
  JWT_SECRET: z
    .string()
    .min(32, 'JWT Secret must be at least 32 characters long')
    .refine(
      val => val !== 'development-secret-change-in-production-minimum-32-chars',
      'JWT Secret must be changed from default value in production'
    ),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT Refresh Secret must be at least 32 characters long')
    .optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // External API Keys
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_MAX_TOKENS: z.coerce.number().positive().default(2048),

  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  AWS_ENDPOINT_URL: z.string().optional(),

  // Security Configuration
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().positive().default(900000),

  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  FROM_NAME: z.string().optional(),

  // Postmark Configuration
  POSTMARK_API_KEY: z.string().min(1, 'Postmark API key is required for email sending').optional(),
  POSTMARK_FROM_EMAIL: z.string().email().default('heliolusadmin@ai-thea.com'),
  POSTMARK_FROM_NAME: z.string().default('Heliolus Platform'),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('debug'),

  // Monitoring & Analytics
  SENTRY_DSN: z.string().optional(),
  ANALYTICS_API_KEY: z.string().optional(),

  // Docker Configuration (for production)
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Validate environment variables
export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);

    // Additional validation rules
    if (env.NODE_ENV === 'production') {
      // In production, require certain environment variables
      const requiredInProduction = ['JWT_SECRET', 'DATABASE_URL', 'REDIS_URL'];

      const missingRequired = requiredInProduction.filter(key => !env[key as keyof EnvConfig]);
      if (missingRequired.length > 0) {
        throw new Error(
          `Missing required environment variables in production: ${missingRequired.join(', ')}`
        );
      }

      // Warn about using default JWT secret
      if (env.JWT_SECRET === 'development-secret-change-in-production-minimum-32-chars') {
        throw new Error('JWT Secret must be changed from default value in production');
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment variable validation failed:\n${errorMessages.join('\n')}`);
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

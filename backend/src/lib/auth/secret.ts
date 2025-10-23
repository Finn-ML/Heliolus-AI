export const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'development-secret-change-in-production';
};
# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy any additional runtime files
COPY --from=builder /app/scripts ./scripts

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Add labels for metadata
LABEL maintainer="Heliolus Platform Team"
LABEL version="1.0.0"
LABEL description="Heliolus Platform Backend API"

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); \
               const options = { \
                 host: 'localhost', \
                 port: 3001, \
                 path: '/health', \
                 method: 'GET', \
                 timeout: 2000 \
               }; \
               const req = http.request(options, (res) => { \
                 if (res.statusCode === 200) process.exit(0); \
                 else process.exit(1); \
               }); \
               req.on('error', () => process.exit(1)); \
               req.on('timeout', () => process.exit(1)); \
               req.end();"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
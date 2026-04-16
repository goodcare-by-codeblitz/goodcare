# Multi-stage Dockerfile for Goodcare Backend
# 
# Stages:
# 1. dev        - Development environment with hot-reload via tsx
# 2. builder    - Build TypeScript to JavaScript
# 3. production - Lean runtime image for production

# ============================================================================
# Stage 1: Development
# ============================================================================
FROM node:24-alpine AS dev

WORKDIR /app

# Install build tools for native dependencies
RUN apk add --no-cache python3 make g++

# Copy workspace root files (pnpm-workspace.yaml, package.json, pnpm-lock.yaml)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy backend package
COPY apps/backend ./apps/backend

# Copy database package (required by backend via @repo/db)
COPY packages/db ./packages/db

# Copy helpers package (required by backend via @repo/helpers)
COPY packages/helpers ./packages/helpers

# Install pnpm globally and install dependencies
RUN npm install -g pnpm

RUN pnpm install --frozen-lockfile

# Generate Prisma client (required before running backend)
RUN cd packages/db && pnpm db:generate

# Expose backend port
EXPOSE 5000

# Health check for development
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/v1/health', (res) => { if (res.statusCode !== 200) throw new Error(res.statusCode) })" || exit 1

# Default command: run backend in watch mode for development
CMD ["pnpm", "-F", "@repo/backend", "dev"]

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all packages and apps
COPY apps/backend ./apps/backend
COPY packages/db ./packages/db
COPY packages/helpers ./packages/helpers

# Install dependencies (only production deps after build)
RUN npm install -g pnpm && pnpm install

# Generate Prisma client
RUN cd packages/db && pnpm db:generate

# Build backend (compile TypeScript to JavaScript)
RUN pnpm -F @repo/backend build

# ============================================================================
# Stage 3: Production Runtime
# ============================================================================
FROM node:24-alpine AS production

WORKDIR /app

# Install dumb-init to handle process signals gracefully
RUN apk add --no-cache dumb-init curl

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all source packages
COPY apps/backend ./apps/backend
COPY packages/db ./packages/db
COPY packages/helpers ./packages/helpers

# Install pnpm and only production dependencies
RUN npm install -g pnpm && pnpm install --prod

# Generate Prisma client for runtime
RUN cd packages/db && pnpm db:generate

# Copy compiled JavaScript from builder
COPY --from=builder /app/apps/backend/dist /app/apps/backend/dist

# Create non-root user for security (optional but recommended)
# RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -G nodejs
# USER nodejs

# Expose backend port
EXPOSE 5000

# Health check for production
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/v1/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start the backend server
CMD ["node", "apps/backend/dist/server.js"]

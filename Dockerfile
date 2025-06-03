# -------- Stage 1: Install dependencies --------
FROM node:18-alpine AS deps
WORKDIR /app

# Fix for Prisma OpenSSL issue
RUN apk add --no-cache openssl1.1

# Set NODE_OPTIONS for legacy OpenSSL
ENV NODE_OPTIONS=--openssl-legacy-provider

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Disable Next.js telemetry
RUN npx next telemetry disable

# -------- Stage 2: Build app --------
FROM node:18-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl1.1

ENV NODE_OPTIONS=--openssl-legacy-provider

COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Prisma generate (optional)
RUN npx prisma generate || echo "No prisma"

# Build Next.js
RUN npm run build

# Optional: update browserslist to silence warnings
RUN npx update-browserslist-db@latest || true

# -------- Stage 3: Production runner --------
FROM node:18-alpine AS runner
WORKDIR /app

# Install dumb-init to handle signals gracefully
RUN apk add --no-cache dumb-init openssl1.1

# Environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS=--openssl-legacy-provider

# Copy built app from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/prisma ./prisma

# Expose the port
EXPOSE 3005

# Start the app
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npx", "next", "start", "-p", "3005"]

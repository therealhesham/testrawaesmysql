# -------- Stage 1: Install dependencies --------
FROM node:18-alpine AS deps
WORKDIR /app

# Avoid Alpine openssl issues
ENV NODE_OPTIONS=--openssl-legacy-provider

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# -------- Stage 2: Build app --------
FROM node:18-alpine AS builder
WORKDIR /app

ENV NODE_OPTIONS=--openssl-legacy-provider

COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Generate Prisma client if applicable
RUN npx prisma generate || echo "No prisma"

# Build Next.js app
RUN npm run build

# -------- Stage 3: Production --------
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--openssl-legacy-provider

# Optional: install tini for better signal handling (recommended for Node)
RUN apk add --no-cache dumb-init

# Copy only required files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

# Expose the port
EXPOSE 3005

# Run with dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npx", "next", "start", "-p", "3005"]

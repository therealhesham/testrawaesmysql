# Install dependencies only when needed
FROM node:18-alpine AS deps
WORKDIR /app



# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN npx prisma generate
# Build the Next.js app
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm run build

# Production image, copy all necessary files
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--openssl-legacy-provider
# Copy only the output of the build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port Next.js will run on
EXPOSE 3005

# Start the Next.js app
CMD ["npx", "next", "start"]

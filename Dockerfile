FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json./
RUN npm i --force

FROM node:22-alpine AS builder
WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NODE_OPTIONS --openssl-legacy-provider
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port Next.js will run on
EXPOSE 3005

# Start the Next.js app
CMD ["npx", "next", "start"]

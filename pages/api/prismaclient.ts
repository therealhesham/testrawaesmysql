// prismaClient.js
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | undefined;

if (process.env.NODE_ENV === "production") {
  // In production, reuse the same client instance
  prisma = global.prisma || new PrismaClient();
  if (process.env.NODE_ENV !== "production") global.prisma = prisma;
} else {
  // In development, avoid the same Prisma Client instance being reused across hot reloads
  prisma = new PrismaClient();
}

export default prisma;

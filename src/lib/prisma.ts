import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is always a valid file: protocol string even on serverless runtimes
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("file:")) {
  process.env.DATABASE_URL = "file:./dev.db";
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "file:./dev.db",
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;

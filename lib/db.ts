import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  // railway.internal = Railway dahili ağı, SSL desteklenmiyor
  // Harici Railway URL'leri SSL gerektirir
  const isInternalRailway = connectionString?.includes("railway.internal");
  const needsSsl =
    !isInternalRailway &&
    (connectionString?.includes("railway") ||
      process.env.NODE_ENV === "production");

  const adapter = new PrismaPg({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

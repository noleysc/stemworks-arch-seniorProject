/* Copyright (c) 2026 Diaz Ventures LLC. All rights reserved. Confidential and proprietary. */

import { PrismaClient } from "@prisma/client";

// Require the PostgreSQL database connection
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Configure the Supabase PostgreSQL connection."
  );
}

//Reuse PrismaClient during development to avoid excess connections.
const globalForPrisma = globalThis as unknown as { 
  prisma?: PrismaClient 
};

export const prisma = 
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

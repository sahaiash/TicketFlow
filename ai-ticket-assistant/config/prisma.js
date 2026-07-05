import { PrismaClient } from "@prisma/client";

// Single shared Prisma client for the whole app. Prisma manages the underlying
// connection pool, so one instance is reused across all requests.
export const prisma = new PrismaClient();

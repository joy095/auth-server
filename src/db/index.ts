import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./schema/auth-schema";

declare global {
  // allow global reuse in dev / serverless
  var _db: ReturnType<typeof drizzle> | undefined;
}

export const createDb = () => {
  if (global._db) return global._db;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(databaseUrl, {
    prepare: false, // IMPORTANT for serverless
    max: 1, // 🔥 VERY IMPORTANT on Vercel
  });

  const db = drizzle(client, {
    schema: { ...authSchema },
  });

  global._db = db;

  return db;
};

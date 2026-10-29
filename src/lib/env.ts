import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  TEST_DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters long for cryptographic security"),
  AUTH_SESSION_COOKIE_NAME: z.string().default("construct_crm_session"),
  AUTH_SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24),
  STORAGE_DRIVER: z.enum(["local", "s3", "supabase"]).default("local"),
  STORAGE_LOCAL_ROOT: z.string().default("./storage/uploads"),
  AUDIT_LOG_ENABLED: z.string().transform((v) => v === "true").default("true"),
});

export const env = envSchema.parse(process.env);


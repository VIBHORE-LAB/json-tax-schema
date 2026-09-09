import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().url(),
  FRONTEND_ORIGIN: z.string().url().optional(),
  CORS_ORIGIN: z.string().url().optional(),
});

const env = envSchema.parse(process.env);
const storageDirectory = process.env.VERCEL
  ? "/tmp/instead-assignment-storage"
  : fileURLToPath(new URL("../storage/", import.meta.url));

export const config = {
  ...env,
  FRONTEND_ORIGIN: env.FRONTEND_ORIGIN ?? env.CORS_ORIGIN ?? "http://localhost:3000",
  storageDirectory,
};

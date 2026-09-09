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


export const config = {
  ...envSchema.parse(process.env),
  FRONTEND_ORIGIN: envSchema.parse(process.env).FRONTEND_ORIGIN ?? envSchema.parse(process.env).CORS_ORIGIN ?? "http://localhost:3000",

  storageDirectory: fileURLToPath(
    new URL("../storage/", import.meta.url),
  ),
};

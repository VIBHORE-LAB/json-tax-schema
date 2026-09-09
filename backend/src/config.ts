import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().url(),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
});


export const config = {
  ...envSchema.parse(process.env),

  storageDirectory: fileURLToPath(
    new URL("../storage/", import.meta.url),
  ),
};
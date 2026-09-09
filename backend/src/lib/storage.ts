import {
  mkdir,
  readFile,
  writeFile,
  unlink,
} from "node:fs/promises";

import path from "node:path";
import { config } from "../config.js";

function getPath(key: string): string {
  if (!/^[a-f0-9-]{36}\.pdf$/.test(key)) {
    throw new Error("Invalid internal storage key");
  }

  return path.join(config.storageDirectory, key);
}

export async function saveSource(
  key: string,
  bytes: Buffer,
): Promise<void> {
  await mkdir(config.storageDirectory, { recursive: true });
  await writeFile(getPath(key), bytes, { flag: "wx" });
}

export function readSource(key: string): Promise<Buffer> {
  return readFile(getPath(key));
}

export async function removeSource(key: string): Promise<void> {
  await unlink(getPath(key));
}

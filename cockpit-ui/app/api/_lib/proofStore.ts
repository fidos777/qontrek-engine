import { promises as fs } from "fs";
import path from "path";

const proofRoot = path.resolve(process.cwd(), "../proof");

async function ensureDirectory(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function readProofJson<T>(relativePath: string, fallback: T): Promise<T> {
  const fullPath = path.join(proofRoot, relativePath);
  try {
    const raw = await fs.readFile(fullPath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error) {
    return fallback;
  }
}

export async function writeProofJson(relativePath: string, data: unknown) {
  const fullPath = path.join(proofRoot, relativePath);
  await ensureDirectory(fullPath);
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

export async function appendProofLog(relativePath: string, entry: unknown) {
  const existing = await readProofJson(relativePath, [] as unknown[]);
  if (!Array.isArray(existing)) {
    throw new Error(`Proof log at ${relativePath} is not an array`);
  }

  const next = [...existing, entry];
  await writeProofJson(relativePath, next);
}

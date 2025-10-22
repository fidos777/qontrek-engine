// lib/logs/logger.ts
// Secure logging with rotation and privacy

import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve(process.cwd(), ".logs/mcp");
const LOG_FILE = "events.log.jsonl";
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5 MB
const RETENTION_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Write a log entry to the private log file with automatic rotation
 */
export function writeLog(entry: any): void {
  try {
    // Ensure log directory exists
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const logPath = path.join(LOG_DIR, LOG_FILE);
    const payload = JSON.stringify(entry) + "\n";

    // Append log entry
    fs.appendFileSync(logPath, payload, "utf8");

    // Check for rotation
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      if (stats.size > MAX_LOG_SIZE) {
        rotateLog(logPath);
      }
    }
  } catch (error) {
    console.error("Failed to write log:", error);
  }
}

/**
 * Rotate log file when it exceeds max size
 */
function rotateLog(logPath: string): void {
  const timestamp = Date.now();
  const backupPath = logPath.replace(".log.jsonl", `-${timestamp}.bak.jsonl`);

  try {
    fs.renameSync(logPath, backupPath);
    console.log(`Log rotated: ${backupPath}`);
  } catch (error) {
    console.error("Failed to rotate log:", error);
  }
}

/**
 * Prune old log files beyond retention period
 */
export function pruneLogs(): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      return;
    }

    const now = Date.now();
    const files = fs.readdirSync(LOG_DIR);

    for (const file of files) {
      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > RETENTION_MS) {
        fs.rmSync(filePath);
        console.log(`Pruned old log: ${file}`);
      }
    }
  } catch (error) {
    console.error("Failed to prune logs:", error);
  }
}

/**
 * Read last N lines from log file
 */
export function readLogTail(lines: number = 100): any[] {
  try {
    const logPath = path.join(LOG_DIR, LOG_FILE);

    if (!fs.existsSync(logPath)) {
      return [];
    }

    const content = fs.readFileSync(logPath, "utf8");
    const allLines = content.trim().split("\n").filter(Boolean);
    const tail = allLines.slice(-lines);

    return tail.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line, error: "parse_failed" };
      }
    });
  } catch (error) {
    console.error("Failed to read log tail:", error);
    return [];
  }
}

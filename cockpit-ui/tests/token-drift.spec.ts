import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Token Governance - No Drift', () => {
  test('should not have hardcoded Tailwind grays or whites', async () => {
    const violations: string[] = [];
    const appDir = path.resolve(process.cwd(), 'app');

    function scanDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            scanDir(fullPath);
          }
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
          checkFile(fullPath);
        }
      }
    }

    function checkFile(filePath: string) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for gray-XXX
        if (/gray-[0-9]{2,3}/.test(line)) {
          violations.push(`${filePath}:${index + 1} - Contains gray-XXX`);
        }
        // Check for white
        if (/(?:text|bg)-white(?!\s*\/\/)/.test(line)) {
          violations.push(`${filePath}:${index + 1} - Contains white token`);
        }
        // Check for hex colors (but allow in comments)
        if (/#[0-9A-Fa-f]{6}/.test(line) && !line.trim().startsWith('//')) {
          violations.push(`${filePath}:${index + 1} - Contains hex color`);
        }
      });
    }

    scanDir(appDir);

    if (violations.length > 0) {
      console.error('Token violations found:');
      violations.forEach(v => console.error(v));
    }

    expect(violations).toHaveLength(0);
  });
});

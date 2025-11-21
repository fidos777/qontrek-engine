/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(process.cwd(), 'cockpit-ui/app');
const VIOLATIONS = [];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDir(full);
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      checkFile(full);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const durationMatch = line.match(/duration:\s*([0-9.]+)/);
    if (durationMatch) {
      const duration = parseFloat(durationMatch[1]);
      if (duration > 1.5) {
        VIOLATIONS.push(
          `${filePath}:${index + 1} - duration=${duration} (> 1.5s) may feel sluggish`
        );
      }
    }
  });
}

scanDir(rootDir);

if (VIOLATIONS.length > 0) {
  console.warn('\u26a0\ufe0f Motion drift warnings:');
  VIOLATIONS.forEach((v) => console.warn(v));
  process.exit(0);
} else {
  console.log('\u2705 No motion drift issues detected.');
  process.exit(0);
}

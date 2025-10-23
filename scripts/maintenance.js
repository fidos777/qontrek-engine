#!/usr/bin/env node
/**
 * Maintenance Jobs
 *
 * Scheduled maintenance tasks:
 * - Prune old logs
 * - Archive proof files
 * - Reset panic mode
 * - Cleanup expired nonces
 *
 * Usage: node scripts/maintenance.js [--task=all|logs|archive|panic|nonces]
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const LOG_RETENTION_HOURS = 48;
const PROOF_ARCHIVE_ENABLED = true;

/**
 * Prune old log files
 */
async function pruneLogs() {
  console.log('=== Pruning Old Logs ===');

  const logsDir = path.join(__dirname, '..', 'logs', 'mcp');
  const cutoffTime = Date.now() - (LOG_RETENTION_HOURS * 60 * 60 * 1000);
  let prunedCount = 0;

  try {
    await fs.mkdir(logsDir, { recursive: true });
    const files = await fs.readdir(logsDir);

    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;

      const filePath = path.join(logsDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < cutoffTime) {
        await fs.unlink(filePath);
        prunedCount++;
        console.log(`  Pruned: ${file}`);
      }
    }

    console.log(`✅ Pruned ${prunedCount} log files older than ${LOG_RETENTION_HOURS}h`);
  } catch (error) {
    console.error('Error pruning logs:', error.message);
  }
}

/**
 * Archive proof files daily
 */
async function archiveProofs() {
  console.log('\n=== Archiving Proof Files ===');

  if (!PROOF_ARCHIVE_ENABLED) {
    console.log('Proof archival disabled');
    return;
  }

  const proofDir = path.join(__dirname, '..', 'proof');
  const archiveDir = path.join(__dirname, '..', 'archive', 'proof');
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const archivePath = path.join(archiveDir, today);

  try {
    await fs.mkdir(archivePath, { recursive: true });

    // Copy proof files to archive
    const files = await fs.readdir(proofDir);
    let archivedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const srcPath = path.join(proofDir, file);
      const destPath = path.join(archivePath, file);

      const stats = await fs.stat(srcPath);
      if (stats.isFile()) {
        await fs.copyFile(srcPath, destPath);
        archivedCount++;
      }
    }

    // Compress archive
    const tarPath = `${archivePath}.tar.gz`;
    execSync(`tar -czf ${tarPath} -C ${archiveDir} ${today}`);
    console.log(`  Created archive: ${tarPath}`);

    // Remove uncompressed archive
    await fs.rm(archivePath, { recursive: true });

    console.log(`✅ Archived ${archivedCount} proof files to ${tarPath}`);

    // Optional: Encrypt archive
    if (process.env.ARCHIVE_ENCRYPTION_KEY) {
      const encryptedPath = `${tarPath}.enc`;
      execSync(`openssl enc -aes-256-cbc -salt -in ${tarPath} -out ${encryptedPath} -pass pass:${process.env.ARCHIVE_ENCRYPTION_KEY}`);
      await fs.unlink(tarPath); // Remove unencrypted
      console.log(`  Encrypted: ${encryptedPath}`);
    }

  } catch (error) {
    console.error('Error archiving proofs:', error.message);
  }
}

/**
 * Reset panic mode if conditions are met
 */
async function resetPanicMode() {
  console.log('\n=== Checking Panic Mode Reset ===');

  try {
    // Check if ATLAS_PANIC flag exists
    const panicFlagPath = path.join(__dirname, '..', 'data', 'ATLAS_PANIC');

    try {
      const panicData = await fs.readFile(panicFlagPath, 'utf-8');
      const panic = JSON.parse(panicData);

      const panicAge = Date.now() - new Date(panic.triggeredAt).getTime();
      const panicAgeHours = panicAge / (1000 * 60 * 60);

      const AUTO_RESET_HOURS = parseInt(process.env.PANIC_AUTO_RESET_HOURS || '4', 10);

      console.log(`  Panic mode active for ${panicAgeHours.toFixed(1)} hours`);

      // Check if governance is green
      const fetch = (await import('node-fetch')).default;
      const healthRes = await fetch('http://localhost:3000/api/mcp/healthz');

      if (healthRes.ok) {
        const health = await healthRes.json();

        if (!health.panicMode?.active && panicAgeHours >= AUTO_RESET_HOURS) {
          // Reset panic mode
          await fs.unlink(panicFlagPath);
          console.log(`✅ Panic mode auto-reset after ${panicAgeHours.toFixed(1)} hours`);

          // Emit proof
          const proof = {
            schema: 'panic_reset_v1',
            resetAt: new Date().toISOString(),
            reason: 'auto_reset',
            panicDurationHours: panicAgeHours,
            previousPanic: panic,
          };

          await fs.writeFile(
            path.join(__dirname, '..', 'proof', 'panic_reset.json'),
            JSON.stringify(proof, null, 2)
          );
        } else {
          console.log('  Panic mode conditions still active, skipping reset');
        }
      }

    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      console.log('  No panic mode active');
    }

  } catch (error) {
    console.error('Error checking panic mode:', error.message);
  }
}

/**
 * Cleanup expired nonces
 */
async function cleanupNonces() {
  console.log('\n=== Cleaning Up Expired Nonces ===');

  try {
    // This would call the nonceStore cleanup function
    // For now, use a simple SQL cleanup
    const { execSync } = require('child_process');
    const dbPath = path.join(__dirname, '..', 'data', 'nonce_store.db');

    if (await fs.access(dbPath).then(() => true).catch(() => false)) {
      const result = execSync(
        `sqlite3 ${dbPath} "DELETE FROM nonces WHERE expires_at <= strftime('%s', 'now') * 1000; SELECT changes();"`,
        { encoding: 'utf-8' }
      ).trim();

      console.log(`✅ Cleaned up ${result} expired nonces`);
    } else {
      console.log('  Nonce database not found');
    }

  } catch (error) {
    console.error('Error cleaning up nonces:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Factory Runtime Maintenance ===');
  console.log(`Started at: ${new Date().toISOString()}\n`);

  const task = process.argv.find(arg => arg.startsWith('--task='))?.split('=')[1] || 'all';

  if (task === 'all' || task === 'logs') {
    await pruneLogs();
  }

  if (task === 'all' || task === 'archive') {
    await archiveProofs();
  }

  if (task === 'all' || task === 'panic') {
    await resetPanicMode();
  }

  if (task === 'all' || task === 'nonces') {
    await cleanupNonces();
  }

  console.log(`\n✅ Maintenance complete at ${new Date().toISOString()}`);
}

// Execute
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

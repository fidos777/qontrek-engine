#!/usr/bin/env node
/**
 * autoTagRelease.js - Automated Release Tagging for Tower Genesis
 * Mission: G19.9.2-R1.4.9-GENESIS-FINALIZATION
 * Phase: C - Auto-Tagging + CI Release
 *
 * Reads Tower receipt and creates git release tag
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOWER_RECEIPT_PATH = path.join(__dirname, '../proof/tower_receipt_v1.json');
const GENESIS_PACKAGE_PATH = path.join(__dirname, '../proof/factory_master_closure_v1.json');

// Execute git command safely
function gitExec(command, description) {
  try {
    console.log(`\n🔧 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - Success`);
    return result.trim();
  } catch (error) {
    console.error(`❌ ${description} - Failed:`, error.message);
    throw error;
  }
}

// Main auto-tag function
async function autoTagRelease() {
  console.log('🏷️  Auto-Tagging Release R1.4.9...\n');

  // Load Tower receipt
  if (!fs.existsSync(TOWER_RECEIPT_PATH)) {
    throw new Error('Tower receipt not found. Run buildGenesis.js first.');
  }

  const towerReceipt = JSON.parse(fs.readFileSync(TOWER_RECEIPT_PATH, 'utf8'));
  const genesisPackage = JSON.parse(fs.readFileSync(GENESIS_PACKAGE_PATH, 'utf8'));

  // Verify certification
  if (!towerReceipt.certification.certified) {
    throw new Error('Genesis not certified by Tower. Cannot tag release.');
  }

  console.log(`📋 Receipt ID: ${towerReceipt.co_sign.receipt_id}`);
  console.log(`🔐 Genesis Hash: ${towerReceipt.co_sign.genesis_hash}`);
  console.log(`✅ Certification: ${towerReceipt.certification.certificate_id}`);

  // Tag information
  const TAG_NAME = 'R1.4.9';
  const TAG_MESSAGE = `Factory Runtime Genesis Certified

Mission: G19.9.2-R1.4.9-GENESIS-FINALIZATION
Certification: ${towerReceipt.certification.certificate_id}
Genesis Hash: ${towerReceipt.co_sign.genesis_hash}
Tower Receipt: ${towerReceipt.co_sign.receipt_id}

Governance Gates (9/9):
${towerReceipt.governance_snapshot.gates_certified.map(g => `  ✅ ${g}`).join('\n')}

Coverage: ${towerReceipt.verification.coverage}
Integrity: ${towerReceipt.verification.integrity_verified ? 'Verified' : 'Failed'}
Federation: ${towerReceipt.ledger_registration.federation_status}

Tower Registry: ${towerReceipt.ledger_registration.registry_url}

Generated with Tower Genesis Builder
Certified: ${towerReceipt.certification.valid_from}`;

  // Check if tag already exists
  try {
    const existingTag = gitExec(`git tag -l ${TAG_NAME}`, 'Check existing tag');
    if (existingTag) {
      console.log(`\n⚠️  Tag ${TAG_NAME} already exists. Skipping tag creation.`);
      return { skipped: true, tag: TAG_NAME, reason: 'Tag already exists' };
    }
  } catch (error) {
    // Tag doesn't exist, continue
  }

  // Create annotated tag
  const tagFile = path.join(__dirname, '../.git-tag-message.tmp');
  fs.writeFileSync(tagFile, TAG_MESSAGE);

  try {
    gitExec(`git tag -a ${TAG_NAME} -F ${tagFile}`, `Create tag ${TAG_NAME}`);
    fs.unlinkSync(tagFile);
  } catch (error) {
    if (fs.existsSync(tagFile)) fs.unlinkSync(tagFile);
    throw error;
  }

  console.log(`\n🎉 Tag ${TAG_NAME} created successfully!`);
  console.log(`\n📤 To push the tag, run:`);
  console.log(`   git push -u origin ${TAG_NAME}`);

  return {
    success: true,
    tag: TAG_NAME,
    receipt_id: towerReceipt.co_sign.receipt_id,
    genesis_hash: towerReceipt.co_sign.genesis_hash,
    certification_id: towerReceipt.certification.certificate_id
  };
}

// Execute
if (require.main === module) {
  autoTagRelease()
    .then((result) => {
      if (result.skipped) {
        console.log(`\n⏭️  Tag creation skipped: ${result.reason}\n`);
        process.exit(0);
      } else {
        console.log('\n✨ Auto-tagging complete!\n');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n❌ Auto-tagging failed:', error.message);
      process.exit(1);
    });
}

module.exports = { autoTagRelease };

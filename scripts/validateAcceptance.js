#!/usr/bin/env node
/**
 * validateAcceptance.js - Factory Runtime Acceptance Validation
 * Mission: G19.9.2-R1.4.9-GENESIS-FINALIZATION
 * Phase: D - Validation + Final Proof
 *
 * Validates all Genesis artifacts and proof coverage
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROOF_DIR = path.join(__dirname, '../proof');

// Required proof files for acceptance
const REQUIRED_PROOFS = [
  'pr_sync_status_v1.json',
  'factory_master_closure_v1.json',
  'tower_receipt_v1.json',
  'tower_sync_cert_v19.json',
  'v19_operational_ui_certification_final.json',
  'v19_fullchain_verification.json',
  'tower_sync_summary.json',
  'tower_sync_validation.json',
  'trust_summary.json'
];

// Gate validation criteria
const GATE_VALIDATIONS = {
  G13: { proof: 'tower_sync_cert_v17.json', description: 'Tower Sync v17' },
  G14: { proof: 'tower_sync_cert_v18.json', description: 'Tower Sync v18' },
  G15: { proof: 'tower_sync_cert_v18_2_ops.json', description: 'Tower Ops v18.2' },
  G16: { proof: 'tower_sync_cert_v19.json', description: 'Tower Sync v19' },
  G17: { proof: 'tower_sync_validation.json', description: 'Tower Validation' },
  G18: { proof: 'v19_operational_ui_certification.json', description: 'UI Certification v19' },
  G19: { proof: 'cfo_summary.json', description: 'CFO Lens Summary' },
  G20: { proof: 'v19_operational_ui_certification_final.json', description: 'Final UI Certification' },
  G21: { proof: 'tower_receipt_v1.json', description: 'Genesis Federation Certified' }
};

// Validation result tracker
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Verify file exists and is valid JSON
function validateProofFile(filename) {
  const filepath = path.join(PROOF_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return { valid: false, error: 'File not found' };
  }

  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(content);
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    return {
      valid: true,
      size: content.length,
      hash: hash,
      data: data
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Validate individual gate
function validateGate(gateId, criteria) {
  console.log(`\n🔍 Validating ${gateId}: ${criteria.description}...`);

  const result = validateProofFile(criteria.proof);

  if (result.valid) {
    console.log(`   ✅ ${gateId} - PASS`);
    results.passed.push({
      gate: gateId,
      proof: criteria.proof,
      description: criteria.description,
      hash: result.hash
    });
    return true;
  } else {
    console.log(`   ❌ ${gateId} - FAIL: ${result.error}`);
    results.failed.push({
      gate: gateId,
      proof: criteria.proof,
      description: criteria.description,
      error: result.error
    });
    return false;
  }
}

// Validate Genesis package integrity
function validateGenesisPackage() {
  console.log(`\n🔍 Validating Genesis Package...`);

  const result = validateProofFile('factory_master_closure_v1.json');

  if (!result.valid) {
    console.log(`   ❌ Genesis Package - FAIL: ${result.error}`);
    return false;
  }

  const genesis = result.data;

  // Check coverage
  if (genesis.integrity.coverage.percentage !== 100) {
    console.log(`   ⚠️  Coverage not 100%: ${genesis.integrity.coverage.percentage}%`);
    results.warnings.push(`Genesis coverage: ${genesis.integrity.coverage.percentage}%`);
  }

  // Verify Tower ready status
  if (!genesis.tower_ready) {
    console.log(`   ❌ Tower not ready`);
    return false;
  }

  console.log(`   ✅ Genesis Package - PASS`);
  console.log(`      Merkle Root: ${genesis.integrity.merkle_root}`);
  console.log(`      Coverage: ${genesis.integrity.coverage.percentage}%`);
  console.log(`      Tower Ready: ✅`);

  return true;
}

// Validate Tower receipt
function validateTowerReceipt() {
  console.log(`\n🔍 Validating Tower Receipt...`);

  const result = validateProofFile('tower_receipt_v1.json');

  if (!result.valid) {
    console.log(`   ❌ Tower Receipt - FAIL: ${result.error}`);
    return false;
  }

  const receipt = result.data;

  // Verify certification
  if (!receipt.certification.certified) {
    console.log(`   ❌ Not certified by Tower`);
    return false;
  }

  // Verify hash match
  if (!receipt.co_sign.hash_match) {
    console.log(`   ❌ Hash mismatch`);
    return false;
  }

  console.log(`   ✅ Tower Receipt - PASS`);
  console.log(`      Certificate: ${receipt.certification.certificate_id}`);
  console.log(`      Receipt ID: ${receipt.co_sign.receipt_id}`);
  console.log(`      Federation: ${receipt.ledger_registration.federation_status}`);

  return true;
}

// Main validation
async function validate() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🔐 FACTORY RUNTIME ACCEPTANCE VALIDATION');
  console.log('  Mission: G19.9.2-R1.4.9-GENESIS-FINALIZATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Validate required proofs
  console.log('📋 Validating Required Proofs...');
  let requiredCount = 0;
  for (const proof of REQUIRED_PROOFS) {
    const result = validateProofFile(proof);
    if (result.valid) {
      console.log(`   ✅ ${proof}`);
      requiredCount++;
    } else {
      console.log(`   ❌ ${proof} - ${result.error}`);
    }
  }
  console.log(`\n   Coverage: ${requiredCount}/${REQUIRED_PROOFS.length} required proofs`);

  // Validate all gates
  console.log('\n📋 Validating Governance Gates...');
  for (const [gateId, criteria] of Object.entries(GATE_VALIDATIONS)) {
    validateGate(gateId, criteria);
  }

  // Validate Genesis package
  const genesisValid = validateGenesisPackage();

  // Validate Tower receipt
  const receiptValid = validateTowerReceipt();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  📊 VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`✅ Passed: ${results.passed.length} gates`);
  console.log(`❌ Failed: ${results.failed.length} gates`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  console.log(`\n🔐 Genesis Package: ${genesisValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`🏛️  Tower Receipt: ${receiptValid ? '✅ Valid' : '❌ Invalid'}`);

  const allPassed = results.failed.length === 0 && genesisValid && receiptValid;

  console.log('\n═══════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('  ✨ ACCEPTANCE VALIDATION PASSED ✨');
  } else {
    console.log('  ❌ ACCEPTANCE VALIDATION FAILED');
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  return {
    success: allPassed,
    summary: {
      required_proofs: requiredCount,
      total_required: REQUIRED_PROOFS.length,
      gates_passed: results.passed.length,
      gates_failed: results.failed.length,
      genesis_valid: genesisValid,
      receipt_valid: receiptValid,
      warnings: results.warnings.length
    },
    results: results
  };
}

// Execute
if (require.main === module) {
  validate()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Validation error:', error);
      process.exit(1);
    });
}

module.exports = { validate };

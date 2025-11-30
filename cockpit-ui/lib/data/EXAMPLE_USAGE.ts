/**
 * Example usage of the Voltek Excel parser
 *
 * This file demonstrates how to use the importVoltekExcel function
 * to parse and validate Voltek Excel files.
 *
 * USAGE:
 * 1. First install dependencies: npm install xlsx zod
 * 2. Update mapping/voltek.xlsx.map.json to match your Excel file headers
 * 3. Import and use as shown below
 */

import { importVoltekExcel, previewWorkbook, getWorkbookInfo } from './ingest/voltek';
import { hashFile, createFileProof } from './proof/docHash';

/**
 * Example 1: Basic import
 */
export async function exampleBasicImport(file: File) {
  console.log('=== Example 1: Basic Import ===');

  const result = await importVoltekExcel(file);

  if (result.success) {
    console.log('✓ Import successful!');
    console.log(`  Projects: ${result.stats.projectsCount}`);
    console.log(`  Leads: ${result.stats.leadsCount}`);
    console.log(`  Financials: ${result.stats.financialsCount}`);
    console.log(`  Installation Tasks: ${result.stats.installationTasksCount}`);
    console.log(`  Materials: ${result.stats.materialsCount}`);

    // Access the data
    if (result.data) {
      console.log('\nFirst 3 projects:');
      result.data.projects.slice(0, 3).forEach((project, i) => {
        console.log(`  ${i + 1}. ${project.projectName} - ${project.status}`);
      });
    }
  } else {
    console.error('✗ Import failed');
    console.error('Issues found:', result.issues.length);
    result.issues.forEach((issue) => {
      console.error(`  [${issue.severity}] ${issue.message}`);
      if (issue.sheet) console.error(`    Sheet: ${issue.sheet}`);
      if (issue.row) console.error(`    Row: ${issue.row}`);
      if (issue.field) console.error(`    Field: ${issue.field}`);
    });
  }

  return result;
}

/**
 * Example 2: Preview workbook before importing
 */
export async function examplePreviewWorkbook(file: File) {
  console.log('\n=== Example 2: Preview Workbook ===');

  // Get basic info
  const info = await getWorkbookInfo(file);
  console.log(`File: ${info.fileName} (${info.fileSize} bytes)`);
  console.log(`Sheets found: ${info.sheetNames.join(', ')}`);

  // Preview first 3 rows from each sheet
  const preview = await previewWorkbook(file, 3);
  Object.entries(preview.sheets).forEach(([sheetName, data]) => {
    console.log(`\nSheet: ${sheetName}`);
    console.log(`Headers: ${data.headers.slice(0, 5).join(', ')}...`);
    console.log(`Rows: ${data.rows.length}`);
  });
}

/**
 * Example 3: Import with file hashing for audit trail
 */
export async function exampleImportWithProof(file: File) {
  console.log('\n=== Example 3: Import with Proof ===');

  // Create proof before importing
  const proof = await createFileProof(file);
  console.log('File proof created:');
  console.log(`  Hash: ${proof.hash.substring(0, 16)}...`);
  console.log(`  Algorithm: ${proof.algorithm}`);
  console.log(`  Timestamp: ${proof.timestamp}`);

  // Import the file
  const result = await importVoltekExcel(file);

  if (result.success) {
    console.log('✓ Import successful and proof recorded');

    // You could save this proof to a database or file
    const importRecord = {
      ...proof,
      importStats: result.stats,
      importedAt: new Date().toISOString(),
    };

    console.log('\nImport record:', JSON.stringify(importRecord, null, 2));
  }

  return { result, proof };
}

/**
 * Example 4: Handle validation issues gracefully
 */
export async function exampleHandleValidationIssues(file: File) {
  console.log('\n=== Example 4: Handle Validation Issues ===');

  const result = await importVoltekExcel(file);

  // Categorize issues by severity
  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');
  const info = result.issues.filter((i) => i.severity === 'info');

  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Info: ${info.length}`);

  // You can still use partial data even with warnings
  if (errors.length === 0 && result.data) {
    console.log('\n✓ No critical errors, proceeding with data');
    console.log(`Using ${result.data.projects.length} projects`);

    if (warnings.length > 0) {
      console.log('\nWarnings to review:');
      warnings.slice(0, 5).forEach((w) => {
        console.log(`  - ${w.message}`);
      });
    }
  } else {
    console.log('\n✗ Critical errors found, cannot proceed');
    errors.forEach((e) => {
      console.log(`  - ${e.message}`);
    });
  }

  return result;
}

/**
 * Example 5: Using data in a React component
 */
export async function exampleReactUsage(file: File) {
  console.log('\n=== Example 5: React Component Usage ===');

  const result = await importVoltekExcel(file);

  if (result.success && result.data) {
    // Example: Calculate summary statistics
    const stats = {
      totalProjects: result.data.projects.length,
      completedProjects: result.data.projects.filter(
        (p) => p.status === 'completed'
      ).length,
      totalEstimatedValue: result.data.projects.reduce(
        (sum, p) => sum + (p.estimatedValue || 0),
        0
      ),
      totalActualValue: result.data.projects.reduce(
        (sum, p) => sum + (p.actualValue || 0),
        0
      ),
      activeLeads: result.data.leads.filter(
        (l) => l.status === 'active' || !l.status
      ).length,
      totalExpenses: result.data.financials
        .filter((f) => f.type === 'expense')
        .reduce((sum, f) => sum + f.amount, 0),
      totalIncome: result.data.financials
        .filter((f) => f.type === 'income')
        .reduce((sum, f) => sum + f.amount, 0),
    };

    console.log('Dashboard Statistics:');
    console.log(`  Total Projects: ${stats.totalProjects}`);
    console.log(`  Completed: ${stats.completedProjects}`);
    console.log(`  Est. Value: $${stats.totalEstimatedValue.toLocaleString()}`);
    console.log(`  Actual Value: $${stats.totalActualValue.toLocaleString()}`);
    console.log(`  Active Leads: ${stats.activeLeads}`);
    console.log(`  Total Expenses: $${stats.totalExpenses.toLocaleString()}`);
    console.log(`  Total Income: $${stats.totalIncome.toLocaleString()}`);
    console.log(
      `  Net: $${(stats.totalIncome - stats.totalExpenses).toLocaleString()}`
    );

    return stats;
  }

  return null;
}

/**
 * Run all examples (for testing)
 */
export async function runAllExamples(file: File) {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Voltek Excel Parser Usage Examples   ║');
  console.log('╚════════════════════════════════════════╝\n');

  await examplePreviewWorkbook(file);
  await exampleBasicImport(file);
  await exampleImportWithProof(file);
  await exampleHandleValidationIssues(file);
  await exampleReactUsage(file);

  console.log('\n✓ All examples completed');
}

// For browser console testing:
// const fileInput = document.querySelector('input[type="file"]');
// fileInput.addEventListener('change', async (e) => {
//   const file = e.target.files[0];
//   if (file) {
//     await runAllExamples(file);
//   }
// });

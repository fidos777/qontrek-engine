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

import { importVoltekExcel } from './ingest/voltek';

/**
 * Example 1: Basic import
 */
export async function exampleBasicImport(file: File) {
  console.log('=== Example 1: Basic Import ===');

  const result = await importVoltekExcel(file);

  if (result.success) {
    console.log('✓ Import successful!');
    console.log(`  Projects imported: ${result.dataset.length}`);
    console.log(`  Issues found: ${result.issues.length}`);

    // Access the data
    if (result.dataset.length > 0) {
      console.log('\nFirst 3 projects:');
      result.dataset.slice(0, 3).forEach((project, i) => {
        console.log(`  ${i + 1}. ${project.name} - ${project.status || 'N/A'}`);
      });
    }
  } else {
    console.error('✗ Import failed');
    console.error('Issues found:', result.issues.length);
    result.issues.forEach((issue) => {
      console.error(`  ${issue.message}`);
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
  console.log(`File: ${file.name} (${file.size} bytes)`);
  console.log(`Type: ${file.type}`);
  // Note: getWorkbookInfo and previewWorkbook functions are not available
}

/**
 * Example 3: Import with file hashing for audit trail
 */
export async function exampleImportWithProof(file: File) {
  console.log('\n=== Example 3: Import with Proof ===');

  // Import the file
  const result = await importVoltekExcel(file);

  if (result.success) {
    console.log('✓ Import successful');
    console.log(`  Projects: ${result.dataset.length}`);
    console.log(`  Issues: ${result.issues.length}`);
  }

  return { result };
}

/**
 * Example 4: Handle validation issues gracefully
 */
export async function exampleHandleValidationIssues(file: File) {
  console.log('\n=== Example 4: Handle Validation Issues ===');

  const result = await importVoltekExcel(file);

  // Check if import was successful
  if (result.success) {
    console.log('\n✓ Import successful, proceeding with data');
    console.log(`Using ${result.dataset.length} projects`);

    if (result.issues.length > 0) {
      console.log('\nIssues to review:');
      result.issues.slice(0, 5).forEach((issue) => {
        console.log(`  - ${issue.message}`);
      });
    }
  } else {
    console.log('\n✗ Import failed');
    result.issues.forEach((issue) => {
      console.log(`  - ${issue.message}`);
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

  if (result.success) {
    // Example: Calculate summary statistics
    const stats = {
      totalProjects: result.dataset.length,
      completedProjects: result.dataset.filter(
        (p) => p.status === 'completed'
      ).length,
      totalBudget: result.dataset.reduce(
        (sum, p) => sum + (p.budget || 0),
        0
      ),
      totalRevenue: result.dataset.reduce(
        (sum, p) => sum + (p.revenue || 0),
        0
      ),
    };

    console.log('Dashboard Statistics:');
    console.log(`  Total Projects: ${stats.totalProjects}`);
    console.log(`  Completed: ${stats.completedProjects}`);
    console.log(`  Total Budget: $${stats.totalBudget.toLocaleString()}`);
    console.log(`  Total Revenue: $${stats.totalRevenue.toLocaleString()}`);

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

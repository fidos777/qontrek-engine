# Voltek Data Import Library

This library provides robust Excel parsing for Voltek project data files with configurable column mapping, data validation, and file hashing for audit trails.

## Installation

First, install the required dependencies:

```bash
cd cockpit-ui
npm install xlsx zod
```

## Quick Start

### Basic Import

```typescript
import { importVoltekExcel } from '@/lib/data/ingest/voltek';

// In a component or API route
async function handleFileUpload(file: File) {
  const result = await importVoltekExcel(file);

  if (result.success) {
    console.log('Import successful!');
    console.log(`Projects: ${result.stats.projectsCount}`);
    console.log(`Leads: ${result.stats.leadsCount}`);
    console.log(`Financials: ${result.stats.financialsCount}`);
    console.log(`Installation Tasks: ${result.stats.installationTasksCount}`);
    console.log(`Materials: ${result.stats.materialsCount}`);

    // Access the normalized data
    const dataset = result.data;
    dataset.projects.forEach(project => {
      console.log(`Project: ${project.projectName} - ${project.status}`);
    });
  } else {
    console.error('Import failed with issues:');
    result.issues.forEach(issue => {
      console.error(`[${issue.severity}] ${issue.message}`);
      if (issue.sheet) console.error(`  Sheet: ${issue.sheet}`);
      if (issue.row) console.error(`  Row: ${issue.row}`);
      if (issue.field) console.error(`  Field: ${issue.field}`);
    });
  }
}
```

### Preview Workbook

```typescript
import { previewWorkbook, getWorkbookInfo } from '@/lib/data/ingest/voltek';

// Get basic info about the workbook
const info = await getWorkbookInfo(file);
console.log(`File: ${info.fileName} (${info.fileSize} bytes)`);
console.log(`Sheets: ${info.sheetNames.join(', ')}`);

// Preview first 5 rows from each sheet
const preview = await previewWorkbook(file, 5);
Object.entries(preview.sheets).forEach(([sheetName, data]) => {
  console.log(`\nSheet: ${sheetName}`);
  console.log('Headers:', data.headers);
  console.log('Sample rows:', data.rows);
});
```

### Hash Files for Audit Trail

```typescript
import { hashFile, createFileProof, createBatchProof } from '@/lib/data/proof/docHash';

// Hash a single file
const hash = await hashFile(file);
console.log(`File hash: ${hash}`);

// Create a proof record with metadata
const proof = await createFileProof(file);
console.log(proof);
// {
//   filename: "document.xlsx",
//   size: 45678,
//   hash: "a1b2c3d4...",
//   algorithm: "SHA-256",
//   timestamp: "2025-10-26T12:34:56.789Z"
// }

// Create batch proof for multiple files
const batchProof = await createBatchProof([excelFile, docxFile, pdfFile]);
console.log(`Batch hash: ${batchProof.batchHash}`);
console.log(`Files: ${batchProof.fileCount}, Total size: ${batchProof.totalSize}`);
```

## Directory Structure

```
lib/data/
├── README.md                      # This file
├── schemas.ts                     # Zod schemas for validation
├── mapping/
│   └── voltek.xlsx.map.json      # Column mapping configuration
├── ingest/
│   ├── excel.ts                  # Generic Excel parser
│   └── voltek.ts                 # Voltek-specific importer
└── proof/
    └── docHash.ts                # File hashing utilities
```

## Configuration

### Customizing Column Mappings

The column mappings are defined in `mapping/voltek.xlsx.map.json`. To adjust for different Excel file formats:

1. **Update sheet names**: Modify the `sheetNames` array to match your Excel file
2. **Update column headers**: Add alternative header names to `sourceHeaders` arrays
3. **Add new fields**: Add new column mapping entries with appropriate transforms

Example mapping entry:
```json
{
  "sourceHeaders": ["Project Name", "Name", "Project", "Title"],
  "targetField": "projectName",
  "required": true,
  "transform": "toString"
}
```

Available transforms:
- `toString` - Convert to trimmed string
- `toNumber` - Parse as number (handles currency, commas)
- `toDate` - Parse as Date object
- `toLower` - Convert to lowercase string
- `toUpper` - Convert to uppercase string
- `toBoolean` - Parse as boolean

### Validation

All data is validated using Zod schemas defined in `schemas.ts`. The schemas define:
- Required vs optional fields
- Data types (string, number, Date, etc.)
- Enum values (for status, priority, etc.)
- Email validation
- Array structures

To modify validation rules, edit the schemas in `schemas.ts`.

## Data Types

### VoltekDataset

The main data structure containing all imported data:

```typescript
interface VoltekDataset {
  projects: VoltekProject[];
  leads: VoltekLead[];
  financials: VoltekFinancial[];
  installationTasks: VoltekInstallationTask[];
  materials: VoltekMaterial[];
}
```

### VoltekProject

```typescript
interface VoltekProject {
  id: string;
  projectName: string;
  clientName: string;
  status: 'lead' | 'qualified' | 'in_progress' | 'installed' | 'completed' | 'cancelled' | 'on_hold';
  priority?: 'high' | 'medium' | 'low';
  startDate?: Date;
  endDate?: Date;
  estimatedValue?: number;
  actualValue?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

See `schemas.ts` for complete type definitions.

## Error Handling

The import function returns an `ImportResult` with detailed error information:

```typescript
interface ImportResult {
  success: boolean;
  data?: VoltekDataset;
  issues: ValidationIssue[];
  stats: {
    projectsCount: number;
    leadsCount: number;
    financialsCount: number;
    installationTasksCount: number;
    materialsCount: number;
  };
}

interface ValidationIssue {
  sheet?: string;
  row?: number;
  column?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}
```

Issues are categorized by severity:
- **error**: Critical validation failures
- **warning**: Non-critical issues (e.g., missing optional fields)
- **info**: Informational messages (e.g., sheet not found but not required)

## Testing

### Test Import Function

Create a simple test script to verify the import:

```typescript
// test-voltek-import.ts
import { importVoltekExcel } from '@/lib/data/ingest/voltek';
import { readFileSync } from 'fs';

async function testImport() {
  // Create a File object from a local file
  const buffer = readFileSync('./path/to/voltek-file.xlsx');
  const file = new File([buffer], 'test.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const result = await importVoltekExcel(file);

  console.log('Import result:', result);
  console.log('Dataset length:', result.data?.projects.length || 0);
}

testImport();
```

## TODO

Before using with real Voltek files, update `mapping/voltek.xlsx.map.json`:

1. Open your Voltek Excel files
2. Note the exact sheet names and column headers
3. Update the `sheetNames` arrays to match
4. Add any missing column header variations to `sourceHeaders` arrays
5. Test the import and adjust as needed

## Advanced Usage

### Using the Generic Excel Parser

The generic parser can be used for non-Voltek Excel files:

```typescript
import { parseExcelFile } from '@/lib/data/ingest/excel';
import myCustomMapping from './my-mapping.json';

const result = await parseExcelFile(file, myCustomMapping);
console.log('Parsed sheets:', result.sheets);
console.log('Issues:', result.issues);
```

### Custom Data Normalization

Extend the normalization functions for custom business logic:

```typescript
import { parseExcelFile } from '@/lib/data/ingest/excel';
import voltekMapping from '@/lib/data/mapping/voltek.xlsx.map.json';

const parsed = await parseExcelFile(file, voltekMapping);

// Custom normalization
const projects = parsed.sheets.projects?.rows.map(row => ({
  ...row,
  // Custom business logic
  isPriority: row.priority === 'high' || row.estimatedValue > 100000,
  daysUntilDeadline: row.endDate
    ? Math.ceil((row.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null,
}));
```

## Support

For issues or questions, refer to the inline documentation in each module or check the Zod validation errors for specific data issues.

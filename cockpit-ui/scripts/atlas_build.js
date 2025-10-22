#!/usr/bin/env node
// scripts/atlas_build.js
// Atlas Registry Generator - crawl /proof/ and schemas to generate MCP-compatible index

const { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } = require("fs");
const { join } = require("path");
const { createHash } = require("crypto");

const PROOF_DIR = join(__dirname, "..", "..", "proof");
const OUTPUT_DIR = join(__dirname, "..", "public", "mcp");
const SCHEMA_FILE = join(__dirname, "..", "app", "lib", "schemas", "fixtures.ts");

function computeETag(buffer) {
  const hash = createHash("sha256").update(buffer).digest("hex");
  return `W/"${hash}"`;
}

function extractSchema(content) {
  try {
    const data = JSON.parse(content);
    if (data.schema_version) {
      // Try to infer schema name from structure
      if (data.series) return "ForecastV1";
      if (data.rows && data.rows[0]?.response_quality !== undefined) return "LeaderboardV1";
      if (data.rows && data.rows[0]?.credits !== undefined) return "CreditBurnV1";
      if (data.packs) return "CreditPackV1";
      if (data.items) return "TriggersV1";
      if (data.install_success_rate !== undefined) return "ConfidenceV1";
      if (data.PLS !== undefined) return "ReflexMetricsV1";
    }
  } catch {}
  return undefined;
}

function scanProofDirectory() {
  const resources = [];

  try {
    const files = readdirSync(PROOF_DIR);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const fullPath = join(PROOF_DIR, file);
      const buffer = readFileSync(fullPath);
      const stat = statSync(fullPath);
      const etag = computeETag(buffer);
      const schema = extractSchema(buffer.toString());

      resources.push({
        uri: `/proof/${file}`,
        etag,
        schema,
        locale: "ms-MY",
        size: stat.size,
        modified: stat.mtime.toISOString(),
      });
    }
  } catch (error) {
    console.error("Error scanning proof directory:", error);
  }

  return resources;
}

function extractSchemas() {
  const schemas = [];

  try {
    const content = readFileSync(SCHEMA_FILE, "utf-8");

    // Extract schema names from fixtures.ts
    const schemaPattern = /export const (\w+V1)\s*=/g;
    let match;

    while ((match = schemaPattern.exec(content)) !== null) {
      const schemaName = match[1];
      schemas.push({
        name: schemaName,
        path: `app/lib/schemas/fixtures.ts#${schemaName}`,
        description: `v1 schema for ${schemaName.replace("V1", "")}`,
      });
    }
  } catch (error) {
    console.error("Error extracting schemas:", error);
  }

  return schemas;
}

function defineTools() {
  return [
    {
      name: "loadProof",
      description: "Load and validate proof artifact with auto-upgrade from v0 to v1",
      endpoint: "/api/proof",
      method: "GET",
    },
    {
      name: "checkProofFreshness",
      description: "Check proof ETag without downloading full content",
      endpoint: "/api/proof",
      method: "HEAD",
    },
    {
      name: "listMCPResources",
      description: "List all available proof resources with ETags and schemas",
      endpoint: "/api/mcp/resources",
      method: "GET",
    },
    {
      name: "listMCPTools",
      description: "List all available MCP tools and endpoints",
      endpoint: "/api/mcp/tools",
      method: "GET",
    },
    {
      name: "streamMCPEvents",
      description: "Subscribe to proof update events",
      endpoint: "/api/mcp/events",
      method: "GET",
    },
  ];
}

function defineEvents() {
  return [
    {
      type: "proof.updated",
      description: "Emitted when a proof artifact's ETag changes",
      schema: "{ ref: string, etag: string, timestamp: number }",
    },
    {
      type: "proof.loaded",
      description: "Emitted when a proof is loaded via API",
      schema: "{ ref: string, route: string, etag?: string, schema?: string }",
    },
    {
      type: "schema.validated",
      description: "Emitted when a proof passes schema validation",
      schema: "{ ref: string, schema: string, version: string }",
    },
  ];
}

function buildRegistry() {
  console.log("🧭 Atlas Registry Generator — Building MCP index...\n");

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Scan proof directory
  console.log("📂 Scanning /proof directory...");
  const resources = scanProofDirectory();
  console.log(`   Found ${resources.length} proof artifacts\n`);

  // Extract schemas
  console.log("📋 Extracting schemas from fixtures.ts...");
  const schemas = extractSchemas();
  console.log(`   Found ${schemas.length} v1 schemas\n`);

  // Define tools
  console.log("🔧 Defining MCP tools...");
  const tools = defineTools();
  console.log(`   Defined ${tools.length} tools\n`);

  // Define events
  console.log("⚡ Defining MCP events...");
  const events = defineEvents();
  console.log(`   Defined ${events.length} event types\n`);

  // Build registries
  const generatedAt = new Date().toISOString();

  const resourceRegistry = {
    version: "1.0.0",
    generated_at: generatedAt,
    resources,
    schemas,
  };

  const toolRegistry = {
    version: "1.0.0",
    generated_at: generatedAt,
    tools,
  };

  const eventRegistry = {
    version: "1.0.0",
    generated_at: generatedAt,
    events,
  };

  // Write output files
  console.log("💾 Writing MCP registry files...");
  writeFileSync(
    join(OUTPUT_DIR, "resources.json"),
    JSON.stringify(resourceRegistry, null, 2)
  );
  console.log("   ✅ /public/mcp/resources.json");

  writeFileSync(
    join(OUTPUT_DIR, "tools.json"),
    JSON.stringify(toolRegistry, null, 2)
  );
  console.log("   ✅ /public/mcp/tools.json");

  writeFileSync(
    join(OUTPUT_DIR, "events.json"),
    JSON.stringify(eventRegistry, null, 2)
  );
  console.log("   ✅ /public/mcp/events.json");

  // Summary
  console.log("\n🏁 Atlas Registry Build Complete!");
  console.log(`   Resources: ${resources.length}`);
  console.log(`   Schemas: ${schemas.length}`);
  console.log(`   Tools: ${tools.length}`);
  console.log(`   Events: ${events.length}`);
  console.log(`   Generated: ${generatedAt}\n`);
}

// Run if executed directly
if (require.main === module) {
  buildRegistry();
}

module.exports = { buildRegistry };

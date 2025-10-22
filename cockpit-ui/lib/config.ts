// lib/config.ts
// Central configuration for Atlas features and flags

/**
 * Check if Atlas Federation is enabled
 * Default: false (safe for demos)
 */
export function isFederationEnabled(): boolean {
  return process.env.ATLAS_FEDERATION_ENABLED === "true";
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: string): boolean {
  const value = process.env[`ATLAS_FEATURE_${flag.toUpperCase()}`];
  return value === "true";
}

/**
 * Get Atlas configuration
 */
export function getAtlasConfig() {
  return {
    federation: {
      enabled: isFederationEnabled(),
      syncInterval: parseInt(process.env.ATLAS_SYNC_INTERVAL_MS || "60000", 10),
    },
    security: {
      sharedKey: process.env.TOWER_SHARED_KEY || "",
      nodeId: process.env.ATLAS_NODE_ID || "atlas-local",
    },
    tower: {
      url: process.env.TOWER_WEBHOOK_URL || "",
    },
    logging: {
      logDir: process.env.ATLAS_LOG_DIR || "/var/log/mcp",
      retentionHours: parseInt(process.env.ATLAS_LOG_RETENTION_HOURS || "48", 10),
      maxFileSizeMB: parseInt(process.env.ATLAS_LOG_MAX_SIZE_MB || "5", 10),
    },
  };
}

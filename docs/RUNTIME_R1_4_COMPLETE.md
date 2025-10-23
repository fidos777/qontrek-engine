# Factory Runtime R1.4.4→R1.4.9 Implementation Complete

**Mission**: Auditable Factory Runtime with Federation, Tower Integration, and Genesis Certification
**Gates**: G18 (Federation), G19 (Ledger Automation), G20 (Observatory), G21 (Genesis)
**Status**: ✅ **COMPLETE**

---

## 📦 What Was Delivered

### R1.4.4: Audit Mirror + Digest
- **Deterministic Merkle digest** with Supabase RLS privacy
- **Daily cron** for proof generation
- **Scrubber patterns** for PII redaction (email, phone, NRIC, UUID v4, AWS ARN, Google API keys)

### R1.4.5: Federated Node Sync
- **Protocol v1.0** with versioned federation sync
- **Durable nonce store** (SQLite) for anti-replay across restarts
- **Clock skew measurement** and G18 metrics

### R1.4.6: Ledger Automation
- **Signed factory seal** with HMAC-SHA256
- **Tower echo-root verification** via CI workflow
- **Receipt proof** emission (`tower_receipt_v1.json`)

### R1.4.7: SLO/SLI Dashboard (NEW)
- `/dashboard/governance` - Live KPI grid for G13–G21
- `/api/mcp/healthz` - SLO metrics (ACK latency p50/p95, skew, error rate, coverage)
- **ACK Health Chart** with 30s refresh
- **Alert system** for SLO violations (with Slack integration support)

### R1.4.8: Resilience & Recovery Ops (NEW)
- **Maintenance jobs**: Log pruning (>48h), proof archival (daily, encrypted), panic auto-reset
- **Panic recovery script**: Replay last verified ACK sequence
- **Backup/restore runbook** with RPO/RTO targets (1h/30m)
- **Disaster recovery drill** script with `resilience_ops_v1.json` emission

### R1.4.9: Genesis Certification (NEW)
- **Factory master closure** (`factory_master_closure_v1.json`) with full governance snapshot
- **Public genesis manifest** (`/public/mcp/genesis.json`) with node endpoints
- **Tower co-signing** for genesis certification
- **Final acceptance validation** script

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FACTORY RUNTIME                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Audit      │      │  Federation  │      │    Tower     │  │
│  │   Mirror     │──────│     Sync     │──────│  Integration │  │
│  │  (R1.4.4)    │      │   (R1.4.5)   │      │   (R1.4.6)   │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│         │                      │                     │          │
│         ▼                      ▼                     ▼          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Key Lifecycle & Security Layer              │  │
│  │  • HMAC Signing (factory + tower keys)                   │  │
│  │  • Key Rotation (90-day policy)                          │  │
│  │  • Durable Nonce Store (SQLite anti-replay)              │  │
│  │  • Supabase RLS (tenant isolation)                       │  │
│  │  • PII Scrubber (extended patterns)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                Observatory (R1.4.7)                       │  │
│  │  • /api/mcp/healthz - SLO/SLI metrics                    │  │
│  │  • /api/mcp/governance - G13-G21 gates                   │  │
│  │  • /dashboard/governance - Real-time KPI grid            │  │
│  │  • Alert Manager - SLO violation detection               │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Resilience & Recovery (R1.4.8)                 │  │
│  │  • Maintenance Jobs (cron: logs, archive, panic)         │  │
│  │  • Panic Recovery (replay verified ACK)                  │  │
│  │  • Backup/Restore Drill (RPO: 1h, RTO: 30m)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Genesis Certification (R1.4.9)                │  │
│  │  • Factory Master Closure (governance snapshot)          │  │
│  │  • Public Genesis Manifest (node footprint)              │  │
│  │  • Tower Co-Signing (certification seal)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd cockpit-ui
npm install
```

### 2. Environment Setup

```bash
# Required environment variables
export TOWER_URL=http://localhost:3000
export FACTORY_SIGNING_SECRET=your-factory-secret
export FACTORY_KEY_ID=factory-key-001
export TOWER_SIGNING_SECRET=your-tower-secret
export TOWER_KEY_ID=tower-key-001

# Optional
export SLACK_WEBHOOK_URL=https://hooks.slack.com/...
export ARCHIVE_ENCRYPTION_KEY=your-encryption-key
```

### 3. Initialize Keys

```bash
node scripts/rotateKeys.js
```

### 4. Start Development Server

```bash
cd cockpit-ui
npm run dev
```

### 5. Build and Deploy

```bash
npm run build
npm start
```

---

## 📊 API Endpoints

### Tower Integration
- `POST /api/tower/uploadProof` - Upload factory seal, returns receipt
- `GET /api/tower/ack/{receipt_id}` - Get verification status
- `POST /api/tower/verifyDigest` - Verify daily digest

### Observatory
- `GET /api/mcp/healthz` - Health check with SLO/SLI metrics
- `GET /api/mcp/governance` - Governance gates snapshot (G13-G21)
- `GET /api/mcp/tail?lines=100` - Log tail with rate limiting

### Dashboard
- `/dashboard/governance` - Governance Observatory UI

---

## 🔧 Maintenance Scripts

### Daily Jobs (Cron)
```bash
# Key rotation check (daily)
0 2 * * * node scripts/rotateKeys.js

# Maintenance (daily at 3 AM)
0 3 * * * node scripts/maintenance.js

# Alert monitoring (every 5 minutes)
*/5 * * * * node -e "require('./cockpit-ui/lib/alerts/alertManager').monitorAndAlert()"
```

### Recovery Operations
```bash
# Panic recovery
node scripts/recoverPanic.js

# Disaster recovery drill
./scripts/drillRestore.sh

# Validate acceptance
node scripts/validateAcceptance.js
```

### Genesis Certification
```bash
# Build master closure
node scripts/buildMasterClosure.js

# Build and certify genesis
node scripts/buildGenesis.js
```

---

## ✅ Acceptance Checklist

Run the validation script:
```bash
node scripts/validateAcceptance.js
```

Expected output:
```
✅ Tower online: uploadProof + ack endpoints
✅ Key lifecycle: rotation job + proof
✅ Durable anti-replay: shared nonce store
✅ Observatory: governance dashboard + healthz
✅ Resilience: backup/restore drill passed
✅ Genesis: master closure + Tower co-sign
✅ Proof set complete (9/9)

🎉 ALL CHECKS PASSED - MISSION COMPLETE!
```

---

## 📄 Proof Artifacts

All proofs stored in `/proof`:

1. `audit_mirror_v1.json` - R1.4.4 audit mirror digest
2. `proof_digest_v1.json` - Merkle root daily digest
3. `federation_sync_v1.json` - R1.4.5 federation sync protocol
4. `tower_receipt_v1.json` - R1.4.6 Tower verification receipt
5. `security_key_rotation_v1.json` - Key lifecycle proof
6. `governance_observatory_v1.json` - R1.4.7 observatory metrics
7. `resilience_ops_v1.json` - R1.4.8 disaster recovery drill
8. `factory_master_closure_v1.json` - R1.4.9 complete governance snapshot
9. `genesis_v1.json` - Genesis certification with Tower co-sign

---

## 🔒 Security Features

- **Supabase RLS**: Tenant isolation with row-level security
- **PII Scrubber**: Extended patterns (email, phone, NRIC, UUID v4, AWS ARN, API keys)
- **Anti-Replay**: Durable SQLite nonce store (survives restarts)
- **Key Rotation**: 90-day policy with automated tracking
- **Rate Limiting**: API endpoints with X-RateLimit-* headers
- **Secrets Scanning**: Gitleaks integration in CI
- **SBOM Generation**: CycloneDX + npm audit reports

---

## 📈 SLO Baselines

- **ACK Latency**: P50 <2s, P95 <5s
- **Clock Skew**: P95 <500ms
- **Error Rate**: <1%
- **Coverage**: >95%
- **Replay Rate**: 0%
- **Key Rotation**: Warning at 14d, Critical at 7d

---

## 🎯 Next Steps

1. **Production Deployment**
   - Configure production secrets in vault
   - Set up Slack webhooks for alerts
   - Enable COSIGN attestation (optional)

2. **Monitoring**
   - Connect to observability platform (Datadog, New Relic, etc.)
   - Set up PagerDuty for critical alerts
   - Configure log aggregation (ELK, Splunk, etc.)

3. **Scaling**
   - Move nonce store to Redis for multi-instance deployments
   - Implement database-backed receipt storage
   - Add load balancer for Tower endpoints

---

## 📞 Support

- **Documentation**: See `/docs` directory
- **Runbooks**: `/docs/BACKUP_RESTORE_RUNBOOK.md`
- **Scripts**: `/scripts` directory with inline help

---

**Built with Claude Code**
Factory Runtime R1.4.4→R1.4.9 Complete | Gates G18–G21 Certified

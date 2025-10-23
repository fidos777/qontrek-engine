# Backup & Restore Runbook

Factory Runtime Disaster Recovery Procedures

## Recovery Objectives

- **RPO (Recovery Point Objective)**: 1 hour (daily backups + hourly proof archives)
- **RTO (Recovery Time Objective)**: 30 minutes (automated restore + verification)

## Backup Strategy

### What Gets Backed Up

1. **Proof Files** (`/proof`)
   - Daily compressed archives
   - Encrypted with `ARCHIVE_ENCRYPTION_KEY`
   - Stored in `/archive/proof/YYYY-MM-DD.tar.gz.enc`

2. **Configuration** (`/config`)
   - Key registry (metadata only, no secrets)
   - Governance policies
   - Alert rules

3. **Database** (`/data`)
   - SQLite federation ledger
   - Nonce store
   - Receipt database

4. **Logs** (`/logs`)
   - Last 48 hours retained
   - Alert logs archived separately

### Backup Schedule

```bash
# Daily proof archive (automated via maintenance.js)
0 2 * * * node /path/to/scripts/maintenance.js --task=archive

# Weekly full backup
0 3 * * 0 /path/to/scripts/backupFull.sh

# Hourly incremental (proof changes only)
0 * * * * /path/to/scripts/backupIncremental.sh
```

## Restore Procedures

### 1. Full System Restore

```bash
# Stop all services
systemctl stop qontrek-runtime

# Restore from latest backup
./scripts/restore.sh --date=2025-10-23 --verify

# Verify integrity
node scripts/verifyBackup.js

# Restart services
systemctl start qontrek-runtime

# Run health check
curl http://localhost:3000/api/mcp/healthz
```

### 2. Proof-Only Restore

```bash
# Extract specific date archive
tar -xzf archive/proof/2025-10-23.tar.gz -C proof/

# Verify merkle roots
node scripts/verifyProofs.js

# Rebuild receipt index
node scripts/rebuildReceiptIndex.js
```

### 3. Ledger Restore

```bash
# Stop federation sync
systemctl stop federation-sync

# Restore ledger from backup
cp backup/data/federation_ledger.db data/

# Verify integrity
sqlite3 data/federation_ledger.db "PRAGMA integrity_check;"

# Rebuild nonce store
node scripts/rebuildNonceStore.js

# Restart sync
systemctl start federation-sync
```

### 4. Panic Recovery

```bash
# Run panic recovery script
node scripts/recoverPanic.js

# Verify recovery
node scripts/verifyRecovery.js

# Check governance status
curl http://localhost:3000/api/mcp/governance
```

## Disaster Recovery Drill

**Frequency**: Quarterly

**Procedure**:

1. **Simulate Disaster** (in staging environment)
   ```bash
   # Delete ledger
   rm data/federation_ledger.db

   # Corrupt proof files
   rm proof/*.json

   # Trigger panic mode
   touch data/ATLAS_PANIC
   ```

2. **Execute Recovery**
   ```bash
   # Run full restore
   ./scripts/restore.sh --date=latest --verify

   # Run panic recovery
   node scripts/recoverPanic.js

   # Verify federation continuity
   node scripts/verifyFederationContinuity.js
   ```

3. **Verify Outcomes**
   - [ ] All proof files restored
   - [ ] Merkle root chain continuous
   - [ ] Federation sync resumed
   - [ ] Nonce store rebuilt
   - [ ] No replay attacks possible
   - [ ] Tower receipts verified
   - [ ] Governance gates pass

4. **Emit Drill Proof**
   ```bash
   node scripts/emitDrillProof.js
   ```

## Backup Verification

### Daily Verification

```bash
# Verify latest archive
./scripts/verifyArchive.sh archive/proof/$(date +%Y-%m-%d).tar.gz.enc

# Check archive size (should be >1MB)
du -h archive/proof/$(date +%Y-%m-%d).tar.gz.enc

# Verify encryption
openssl enc -d -aes-256-cbc -in archive.tar.gz.enc | tar -tzf - | head
```

### Integrity Checks

```bash
# Verify proof merkle roots
node scripts/verifyProofChain.js --from=2025-10-01 --to=2025-10-23

# Verify Tower receipts
node scripts/verifyTowerReceipts.js

# Check digest continuity
node scripts/verifyDigestContinuity.js
```

## Emergency Contacts

- **On-Call Engineer**: [PagerDuty rotation]
- **Tower Admin**: tower-admin@example.com
- **Backup Location**: s3://qontrek-backups/factory-runtime/

## Recovery Scripts

All scripts located in `/scripts`:

- `backupFull.sh` - Full system backup
- `backupIncremental.sh` - Incremental proof backup
- `restore.sh` - Full restore procedure
- `verifyBackup.js` - Backup verification
- `recoverPanic.js` - Panic mode recovery
- `rebuildNonceStore.js` - Rebuild nonce database
- `verifyFederationContinuity.js` - Verify federation chain

## Post-Recovery Checklist

After any restore operation:

- [ ] Verify all services running
- [ ] Check `/api/mcp/healthz` returns healthy
- [ ] Verify `/api/mcp/governance` shows gates passing
- [ ] Confirm Tower receipts accessible
- [ ] Test federation sync (send test batch)
- [ ] Verify anti-replay protection (attempt replay)
- [ ] Check alert system operational
- [ ] Emit `resilience_ops_v1.json` proof
- [ ] Update incident log
- [ ] Schedule post-mortem review

## Retention Policy

- **Proof Archives**: 90 days
- **Database Backups**: 30 days
- **Logs**: 7 days
- **Recovery Proofs**: Permanent

## Encryption Keys

Store encryption keys in secure vault (e.g., AWS Secrets Manager, HashiCorp Vault):

- `ARCHIVE_ENCRYPTION_KEY` - Archive encryption
- `FACTORY_SIGNING_SECRET` - Factory signing key
- `TOWER_SIGNING_SECRET` - Tower signing key

**Never commit secrets to git.**

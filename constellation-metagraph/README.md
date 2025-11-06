# LexLink Constellation Metagraph

Production-grade Constellation Network metagraph for immutable license, dispute, and AI training provenance.

## Architecture

This metagraph implements a **dual-layer legal-blockchain architecture**:

- **Story Protocol** (Layer 1): Mutable legal contracts and IP asset registry
- **Constellation Network** (This metagraph): Immutable audit trail with cryptographic proofs
- **ICP Canister**: Cross-chain orchestration and Bitcoin escrow

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Server Actions (Next.js App Router)             │
│  • Story Protocol SDK (license minting)                      │
│  • ICP Actor (escrow, attestations)                          │
│  • Metagraph Client (evidence submission) ← THIS REPO        │
└──┬──────────────────┬──────────────────┬────────────────────┘
   │                  │                  │
   ▼                  ▼                  ▼
Story Protocol   ICP Canister    LexLink Metagraph
(Mutable)        (Orchestrator)  (Immutable)
```

## Data Model

### LicenseUpdate

Immutable record of a license sale transaction:

```scala
case class LicenseUpdate(
  orderId: String,              // UUID
  ipId: String,                 // Story Protocol IP ID
  licenseTokenId: String,       // ERC-721 token ID
  buyerPrincipal: String,       // Internet Identity
  mintTo: String,               // Ethereum address
  amountSats: Long,             // Payment amount
  attestationHash: String,      // ICP attestation
  c2paHash: String,             // C2PA provenance
  vcHash: String,               // Verifiable credential
  complianceScore: Int,         // 0-100
  timestamp: Long               // Unix milliseconds
  // ... +15 more fields
)
```

### DisputeUpdate

Immutable record of a copyright dispute:

```scala
case class DisputeUpdate(
  disputeId: String,
  ipId: String,
  evidenceCid: String,
  txHash: String,
  status: String,
  timestamp: Long
)
```

### TrainingBatchUpdate

Immutable record of AI training data usage:

```scala
case class TrainingBatchUpdate(
  batchId: String,
  ipId: String,
  units: Long,
  evidenceHash: String,
  timestamp: Long
)
```

## Query API

The L0 layer exposes rich query endpoints:

### License Queries

- `GET /licenses` - List all licenses
- `GET /licenses/{orderId}` - Get license + related disputes/training
- `GET /licenses/by-buyer/{principal}` - Get buyer profile

### IP Asset Analytics

- `GET /ip-assets/{ipId}/analytics` - Comprehensive IP analytics
  - Total licenses sold
  - Total revenue (sats)
  - Dispute count
  - Training usage

### Dispute Queries

- `GET /disputes` - List all disputes
- `GET /disputes/{disputeId}` - Get dispute details
- `GET /disputes/by-ip/{ipId}` - Get disputes for an IP

### Training Batch Queries

- `GET /training-batches` - List all batches
- `GET /training-batches/{batchId}` - Get batch details
- `GET /training-batches/by-ip/{ipId}` - Get training for an IP

### Network Statistics

- `GET /stats` - Overall metagraph statistics

### Health Check

- `GET /health` - Health status

## Development

### Prerequisites

- Java 11+
- sbt 1.8.0+
- Scala 2.13.10

### Build

```bash
cd constellation-metagraph
sbt compile
```

### Package

```bash
sbt "project l0" assembly
sbt "project data_l1" assembly
```

### Run Locally

```bash
# Terminal 1: Data L1
sbt "project data_l1" run

# Terminal 2: L0
sbt "project l0" run
```

## Validation Rules

All submissions are validated before acceptance:

### LicenseUpdate Validation

- ✅ Order ID must be non-empty, ≤128 chars
- ✅ IP ID must be valid Ethereum address (0x + 40 hex)
- ✅ Content hash must be SHA-256 (64 hex chars)
- ✅ License contract must be valid Ethereum address
- ✅ Mint-to address must be valid Ethereum address
- ✅ Payment mode must be "ckbtc" or "btc"
- ✅ Amount must be positive
- ✅ Compliance score must be 0-100
- ✅ Timestamp must be valid (not in future)
- ✅ No duplicate order IDs

### DisputeUpdate Validation

- ✅ Dispute ID must be non-empty
- ✅ Evidence CID must be valid IPFS CID
- ✅ No duplicate dispute IDs

### TrainingBatchUpdate Validation

- ✅ Batch ID must be non-empty
- ✅ Units must be non-negative
- ✅ No duplicate batch IDs

## Deployment

### Docker Build

```bash
# Build base image (Tessellation SDK)
cd infra/metagraph-ubuntu
docker build -t lexlink-base:tess3.4.0-rc.13 .

# Build custom image (LexLink code)
cd ../metagraph-base-image
docker build -t lexlink-metagraph:v1.0.0 .
```

### AWS Deployment (Terraform)

```bash
cd deployment/aws
terraform init
terraform plan
terraform apply
```

**Resources created:**
- VPC with public subnet
- Security group (ports 9000-9400)
- EC2 t3.medium instance
- SSH key pair

### Manual Deployment

1. **SSH into EC2 instance**:
   ```bash
   ssh -i lexlink-key.pem ubuntu@<ec2-ip>
   ```

2. **Pull Docker image**:
   ```bash
   docker pull lexlink-metagraph:v1.0.0
   ```

3. **Run 3-node cluster**:
   ```bash
   # Node 1 (Genesis + L0)
   docker run -d -p 9200:9200 -p 9201:9201 \
     -e NODE_ENV=genesis-l0 \
     lexlink-metagraph:v1.0.0

   # Node 2 (Validator 1 + Data L1)
   docker run -d -p 9400:9400 -p 9401:9401 \
     -e NODE_ENV=validator1-data-l1 \
     lexlink-metagraph:v1.0.0

   # Node 3 (Validator 2 + Data L1)
   docker run -d -p 9500:9400 -p 9501:9401 \
     -e NODE_ENV=validator2-data-l1 \
     lexlink-metagraph:v1.0.0
   ```

4. **Verify health**:
   ```bash
   curl http://localhost:9200/health
   ```

## Integration with Next.js

### Update constellation.ts

Replace the simple dag4 transfer with proper metagraph submission:

```typescript
import { env } from '@/lib/env'

const METAGRAPH_DATA_L1_URL = env.CONSTELLATION_METAGRAPH_URL // e.g., http://your-ec2-ip:9400

export async function publishLicenseEvidence(
  license: LicenseUpdate
): Promise<EvidenceResult> {
  try {
    // Sign the update with Tessellation SDK (server-side)
    const signedUpdate = await signDataUpdate(license)

    // POST to Data L1
    const response = await fetch(`${METAGRAPH_DATA_L1_URL}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signedUpdate)
    })

    if (!response.ok) {
      throw new Error(`Metagraph submission failed: ${response.statusText}`)
    }

    const result = await response.json()
    const txHash = result.hash || result.transactionHash

    return { status: 'ok', txHash }
  } catch (error) {
    console.error('[Metagraph] Submission failed:', error)
    return { status: 'skipped', reason: error.message }
  }
}
```

### Query License from Frontend

```typescript
async function getLicenseDetails(orderId: string) {
  const response = await fetch(
    `${METAGRAPH_L0_URL}/licenses/${orderId}`
  )
  const data = await response.json()

  return {
    license: data.license,
    relatedDisputes: data.relatedDisputes,
    relatedTraining: data.relatedTraining
  }
}
```

## Environment Variables

Add to `.env`:

```bash
# Constellation Metagraph
CONSTELLATION_METAGRAPH_URL="http://your-ec2-ip:9400"  # Data L1
CONSTELLATION_METAGRAPH_L0_URL="http://your-ec2-ip:9200"  # L0 (queries)
CONSTELLATION_METAGRAPH_PRIVATE_KEY="0x..."  # Signing key

NEXT_PUBLIC_CONSTELLATION_METAGRAPH_L0_URL="http://your-ec2-ip:9200"
```

## Monitoring

### Prometheus Metrics

- Exposed on port 9090 (per node)
- Grafana dashboard on port 3000

### Logs

```bash
# Follow logs
docker logs -f <container-id>

# Search for errors
docker logs <container-id> | grep ERROR
```

## Cost Estimate (AWS)

| Resource | Type | Monthly Cost |
|----------|------|--------------|
| EC2 Instance | t3.medium | ~$35 |
| EBS Storage | 30 GB | ~$3 |
| Data Transfer | 1 TB | ~$90 |
| **Total** | | **~$128/month** |

For production, use t3.large ($70/month) for better performance.

## Testing

### Unit Tests

```bash
sbt test
```

### Integration Tests

```bash
sbt it:test
```

### Submit Test License

```bash
curl -X POST http://localhost:9400/data \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-123",
    "ipId": "0x1234567890123456789012345678901234567890",
    "contentHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "licenseTokenId": "42",
    "buyerPrincipal": "test-principal",
    "mintTo": "0x9876543210987654321098765432109876543210",
    "amountSats": 100000,
    "timestamp": 1699000000000,
    ...
  }'
```

### Query Test License

```bash
curl http://localhost:9200/licenses/test-order-123
```

## Troubleshooting

### Port Conflicts

```bash
# Check ports
lsof -i :9200
lsof -i :9400

# Kill process
kill -9 <pid>
```

### Docker Issues

```bash
# Clean up
docker system prune -a

# Restart daemon
sudo systemctl restart docker
```

### Validation Errors

Check logs for detailed validation messages:

```bash
docker logs <container-id> | grep "Validation failed"
```

## Security

- **Keystore management**: Never commit `.p12` files
- **Private keys**: Use environment variables
- **API access**: Add authentication for production
- **Rate limiting**: Implement for public endpoints

## License

MIT

## Support

- **Constellation Docs**: https://docs.constellationnetwork.io
- **LexLink GitHub**: https://github.com/your-repo
- **Discord**: https://discord.gg/constellation

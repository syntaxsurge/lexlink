# LexLink

LexLink is a production-ready, cross-protocol legaltech stack:

- **Story Protocol (Aeneid Testnet)** registers IP assets, attaches
  PIL-compliant licenses, and mints license tokens when settlements clear.
- **ICP Bitcoin Escrow Canister** derives dedicated P2WPKH deposit addresses per
  license order, verifies incoming transactions via the Bitcoin integration, and
  emits signed attestations.
- **Constellation IntegrationNet** receives an on-ledger heartbeat for every
  completed license sale so auditors can correlate Story transactions with
  Bitcoin settlements.
- **Convex** stores operational mirrors (IP catalogue, license orders, evidence
  hashes) to power the dashboard.

This repository contains the full end-to-end implementation for Days 2 and 3 of
the build plan, ready to deploy without placeholders.

## 1. Prerequisites

- Node.js ≥ 18
- `pnpm` ≥ 9
- Convex CLI (`npm install -g convex`) with an initialized deployment
- `dfx` CLI ≥ 0.17 if you intend to run or deploy the ICP canister locally
- An Aeneid funded wallet and Constellation IntegrationNet private key

## 2. Installation

```bash
pnpm install
```

## 3. Environment variables

Create a `.env.local` file at the repository root using the template below. All
values must point to real infrastructure—no placeholders remain in the code.

```dotenv
# Public RPCs
NEXT_PUBLIC_AENEID_RPC="https://aeneid.storyrpc.io"
NEXT_PUBLIC_CONVEX_URL="https://<your-convex-deployment>.convex.cloud"

# Story Protocol signer
STORY_RPC_URL="https://aeneid.storyrpc.io"
STORY_CHAIN_ID="1315"
STORY_SPG_NFT_ADDRESS="0x..."                        # SPG NFT contract
STORY_LICENSE_TEMPLATE_ADDRESS="0x..."               # PIL license template
STORY_PRIVATE_KEY="0x..."                            # 32-byte hex private key
STORY_PIL_URI="https://example.com/pil.json"

# ICP Bitcoin escrow canister
ICP_HOST="https://icp0.io"                           # or local replica
ICP_ESCROW_CANISTER_ID="<canister-id>"
ICP_IDENTITY_PEM_PATH="icp/icp_identity.pem"

# Constellation IntegrationNet signer
CONSTELLATION_PRIVATE_KEY="0x..."
CONSTELLATION_ADDRESS="DAG..."
CONSTELLATION_BE_URL="https://be-integrationnet.constellationnetwork.io"
CONSTELLATION_L0_URL="https://l0-lb-integrationnet.constellationnetwork.io"
CONSTELLATION_L1_URL="https://l1-lb-integrationnet.constellationnetwork.io"
BTC_NETWORK="testnet"                                 # or "mainnet"

# Convex
CONVEX_URL="https://<your-convex-deployment>.convex.cloud"
CONVEX_DEPLOYMENT="<deployment-name>"
```

### How to obtain each env value (commands + links)

Use this checklist to source every value in `.env.local`.

1) Public RPCs (Story / Convex)
- `NEXT_PUBLIC_AENEID_RPC` and `STORY_RPC_URL`
  - Use Aeneid public RPC: `https://aeneid.storyrpc.io` (no change needed)
  - Deployed contracts: https://docs.story.foundation/developers/deployed-smart-contracts
- `NEXT_PUBLIC_CONVEX_URL` / `CONVEX_URL`
  - From a Convex deployment: `npx convex deploy` then copy the deployment URL
  - Convex docs: https://docs.convex.dev/home
- `CONVEX_DEPLOYMENT`
  - The name shown when you deploy via `npx convex deploy` (e.g., `dev`)

2) Story Protocol signer
- `STORY_CHAIN_ID`
  - Aeneid = `1315` (no change needed)
- `STORY_PRIVATE_KEY`
  - Generate a test key: `openssl rand -hex 32` (prefix with `0x`)
  - Import into MetaMask if desired; keep it funded on Aeneid
- `STORY_SPG_NFT_ADDRESS` (SPG Collection address)
  - Create via script in this repo:
    - `pnpm spg:create`
    - Output JSON includes `spgNftContract` — paste that value here
  - Workflows ref: https://github.com/storyprotocol/protocol-periphery-v1/blob/main/docs/WORKFLOWS.md
- `STORY_LICENSE_TEMPLATE_ADDRESS`
  - Aeneid PILicenseTemplate: `0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316`
  - Verify: https://aeneid.storyscan.io/address/0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316
- `STORY_PIL_URI`
  - Use your hosted legal page: `https://<your-vercel-app>/legal/pil`
  - Local dev: `http://localhost:3000/legal/pil`
  - PIL overview: https://docs.story.foundation/concepts/programmable-ip-license/overview

3) ICP Bitcoin escrow canister
- Install IC SDK (dfx):
  - macOS (Apple Silicon): `softwareupdate --install-rosetta`
  - Install: `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`
  - Ensure PATH: `echo 'export PATH="$HOME/.local/share/dfx/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc`
  - Verify: `dfx --version`
- `ICP_HOST`
  - Playground: `https://icp0.io`
  - Local replica: `http://127.0.0.1:4943`
- `ICP_ESCROW_CANISTER_ID`
  - Deploy (Playground): `dfx deploy --playground btc_escrow`
  - Read ID: `dfx canister id btc_escrow --playground`
  - Local: `dfx start --background && dfx deploy btc_escrow && dfx canister id btc_escrow`
- `ICP_IDENTITY_PEM_PATH`
  - Export your identity: `dfx identity whoami` (e.g., `default`)
  - `dfx identity export default > icp/icp_identity.pem`
  - Set `ICP_IDENTITY_PEM_PATH="icp/icp_identity.pem"`
  - Identity docs: https://internetcomputer.org/docs/current/developer-docs/getting-started/developer-identity
  - Test canister call (Playground): `dfx canister call --playground btc_escrow request_deposit_address '("order-1")'`

4) Constellation IntegrationNet signer
- Install Stargazer Wallet (Chrome):
  - https://chromewebstore.google.com/detail/stargazer-wallet/pgiaagfkgcbnmiiolekcfmljdagdhlcm?pli=1
  - Switch to IntegrationNet; copy your DAG address (`CONSTELLATION_ADDRESS`)
  - Export the private key for test use (`CONSTELLATION_PRIVATE_KEY`, 0x-prefixed)
- Fund the wallet on IntegrationNet:
  - Faucet: `GET https://faucet.constellationnetwork.io/integrationnet/faucet/<YOUR_DAG_ADDRESS>`
- Base URLs (keep defaults):
  - `CONSTELLATION_BE_URL=https://be-integrationnet.constellationnetwork.io`
  - `CONSTELLATION_L0_URL=https://l0-lb-integrationnet.constellationnetwork.io`
  - `CONSTELLATION_L1_URL=https://l1-lb-integrationnet.constellationnetwork.io`
- `BTC_NETWORK` should remain `testnet` for free testing

5) Convex
- `CONVEX_URL` / `CONVEX_DEPLOYMENT`
  - Initialize & deploy: `npx convex deploy`
  - Copy the URL and deployment name into the env

Sanity checks
- Story: `pnpm spg:create` returns a valid `spgNftContract`
- ICP: `dfx canister call --playground btc_escrow request_deposit_address '("order-1")'`
- Constellation: Fund DAG address via faucet; ensure wallet shows balance
- Convex: `npx convex deploy` then `pnpm convex:dev` for local dev

### Story configuration

- `STORY_SPG_NFT_ADDRESS` must be an SPG contract you control on Aeneid.
- `STORY_LICENSE_TEMPLATE_ADDRESS` should point to the PIL template (public
  deployments are published in Story documentation).
- The private key will sign all workflows; keep it secure.

### ICP configuration

- The canister expects an ECDSA key with the name `lexlink-btc`. On mainnet,
  file a boundary node proposal; locally, run `dfx identity get-principal` and
  enable ECDSA signing in `dfx.json`.
- `ICP_IDENTITY_PEM_PATH` can be a filesystem path (default shown) or inline PEM content; the key must correspond to the
  controller of the escrow canister.

### Constellation configuration

- The private key controls the DAG address used for evidence pulses. Fund the
  account on IntegrationNet via the public faucet.

### Convex configuration

- Create a deployment via `npx convex deploy` and set both `CONVEX_URL` and
  `CONVEX_DEPLOYMENT`. The schema expects the tables defined in
  `convex/schema.ts` and functions in `convex/ipAssets.ts` +
  `convex/licenses.ts`.

## 4. Local development

Start Convex (for a local dev deployment) and Next.js:

```bash
pnpm convex:dev          # optional if you prefer local Convex
pnpm dev
```

Visit http://localhost:3000/app to access the console.

## 5. ICP canister (optional but recommended)

The Motoko canister that powers Bitcoin escrow lives in `icp/`.

```bash
cd icp
# Deploy locally
dfx start --background
BITCOIN_PROVIDER="https://btc-testnet-api.icp0.io" dfx deploy btc_escrow
```

The canister exposes three methods:

- `request_deposit_address(orderId: Text) -> Text`
- `confirm_payment(orderId: Text, txid: Text)`
- `attestation(orderId: Text) -> Text`

Configure `ICP_ESCROW_CANISTER_ID` with the output of deployment.

## 6. Production build

```bash
pnpm build
pnpm start
```

## 7. Project structure

```
.
├── src/app/app/actions.ts    # Server actions for Story, ICP, Constellation
├── src/app/app/page.tsx      # Operational console (server component)
├── src/components/app/       # Client-side forms for registration & sales
├── src/lib/                  # Integrations (Story, ICP, Constellation, Convex)
├── convex/                   # Convex schema and functions
└── icp/                      # Motoko canister for Bitcoin escrow
```

## 8. Testing & linting

Run the standard checks before shipping updates:

```bash
pnpm typecheck
pnpm lint
```

## 9. Operational flow

1. **Register IP** – The console fetches metadata, hashes its contents, and
   calls `StoryClient.ipAsset.mintAndRegisterIpAssetWithPilTerms`. Convex stores
   the mirrored record.
2. **Create Bitcoin deposit** – `createLicenseOrder` asks the ICP canister for a
   dedicated address and records the order in Convex.
3. **Buyer pays in BTC** – Once the transaction is visible (the operator copies
   the txid), `completeLicenseSale` requests the canister to verify UTXOs, mints
   a Story license token to the buyer, hashes the attestation, and publishes a
   heartbeat transaction to Constellation IntegrationNet.
4. **Compliance dashboard** – Every completed order shows the Story IP ID,
   Bitcoin txid, Constellation tx hash, and the SHA-256 attestation hash for
   auditors.
5. **Raise disputes** – Operators can submit UMA-backed disputes against any
   registered IP, log the evidence hash to Constellation, and track the status
   inside the console for downstream compliance teams.

## 10. Deploying to production

- Provision hosted Constellation, Story RPC, and Convex services.
- Deploy the Motoko canister to ICP mainnet (or an enterprise subnet) and
  register the `lexlink-btc` key with threshold signing.
- Build and deploy the Next.js application using `pnpm build` or your preferred
  platform (Vercel, Fly.io, etc.).

LexLink now provides a unified surface for Story Protocol licensing, ICP Bitcoin
escrow, and Constellation compliance evidence—no placeholders, ready for real
integrations.

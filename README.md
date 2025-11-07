# LexLink

Programmable licensing, ckBTC settlement, and verifiable evidence for AI and human-created IP.

[![LexLink Demo](public/images/lexlink-demo.png)](https://www.youtube.com/watch?v=gs01pInUGZ0)

---

## Quick Links

- Live app: https://lexlink-legal.vercel.app/
- YouTube demo: https://www.youtube.com/watch?v=gs01pInUGZ0
- GitHub repo: https://github.com/syntaxsurge/lexlink
- ckTESTBTC faucet (testnet): https://testnet-faucet.ckboost.com/
- ICP escrow canister (Candid UI): https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=bqf6p-rqaaa-aaaaa-qc46q-cai

## Core Capabilities

- Story Protocol (Aeneid) registration with PIL terms and license token minting on settlement
- ICP ckBTC escrow (ICRC‑1) with deterministic subaccounts and II-based buyer checkout
- Constellation IntegrationNet anchoring with explorer + raw JSON payloads for evidence
- Downloadable C2PA license passport and signed verifiable credential (Ed25519)
- UMA-backed dispute reporting, IPFS-pinned evidence, and owner counter‑evidence flows
- Convex-powered dashboards for IP, licensing, disputes, compliance, and verification

---

## Sponsor Track Alignment (Hackathon)

### Story Protocol

- Best LegalTech IP Tool: LexLink registers IP (manual upload and AI Studio), attaches PIL terms, sets royalty splits, and mints license tokens post-settlement; includes a searchable registry (Gallery/Marketplace) and end-to-end licensing flows.
- Best Dispute Resolution App: Public “Report IP” form pins evidence to IPFS, raises a Story dispute with UMA liveness, and provides a Case Manager for owners to post counter‑evidence and follow resolution; links to StoryScan and transaction details are surfaced throughout.

### The Internet Computer (ICP)

- Best Consumer‑Focused Legal Solution: Consumer‑grade buyer checkout uses Internet Identity and ckBTC, remembers license wallet preferences, and provides receipts and downloadable compliance artifacts (C2PA + VC).
- Best B2B or Legal System Solution: Operator dashboard manages IP catalog, pricing, royalty policy, invoices, compliance ledger, and disputes with role‑based access via NextAuth + Convex.
- Best use of ICP’s Bitcoin Integration (consumer product): Licensing invoices derive deterministic ckBTC subaccounts on the escrow canister; buyers pay from the browser against the ckBTC ledger and finalization mints the Story license token.

### Constellation DAG

- Best LegalTech DApp: Every completed license anchors a “digital evidence” pulse to IntegrationNet via dag4; UI links to the explorer and to the signed JSON payload so auditors can correlate settlement with Story licensing.
- Best RegTech Tool: Compliance views and the public Verify page expose Constellation hash, explorer link, attestation hash, and compliance score; artifacts include the C2PA passport and verifiable credential for downstream checks.

---

## Contracts, Canisters & Network References

- Story (Aeneid testnet):
  - PILicenseToken: `0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC`
  - PILicenseTemplate: `0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316`
  - DisputeModule: `0x9b7A9c70AFF961C799110954fc06F3093aeb94C5`
  - UMA Arbitration Policy: `0xfFD98c3877B8789124f02C7E8239A4b0Ef11E936`
- ICP (ckBTC escrow canister):
  - Canister ID: `bqf6p-rqaaa-aaaaa-qc46q-cai`
  - Candid UI: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=bqf6p-rqaaa-aaaaa-qc46q-cai
- Constellation:
  - Network: `integrationnet`
  - Explorer: https://integrationnet.dagexplorer.io/

---

## High‑Level Architecture

```
Client (Next.js App Router)
  └─> Server Actions (Node runtime)
       ├─ Story Protocol (Aeneid): IP registration, PIL terms, license token mint
       ├─ ICP ckBTC: escrow canister (ICRC‑1), ledger balance checks, II authentication
       ├─ Constellation IntegrationNet: dag4 anchor + explorer link + JSON payload
       └─ Convex: IP catalog, invoices, disputes, compliance ledger, artifacts (C2PA/VC)
```

### License Sale Finalization (Sequence)

```
Create order → derive ckBTC subaccount → share invoice link
Buyer (II) → set license wallet → ckBTC transfer to escrow
Ledger credit detected → mint Story license token → issue C2PA + VC → Constellation anchor
Convex mirrors updated → Verify page exposes proofs, artifacts, and explorer links
```

---

## Additional End‑to‑End Flows

### IP Registration (Manual vs AI Studio)

```
[Creator]
   |
   |  Manual: upload cover + primary media (or URLs)
   |  AI Studio: enter prompt, title, description, price/royalty
   v
[Next.js UI]
   |
   v
[Server Actions]
   |-- Pin media/metadata → [IPFS / Pinata]
   |-- Register IPA + PIL → [Story Protocol]
   |-- Mirror record      → [Convex]
   '-- Return IP ID + links → [UI]
```

### Invoice Creation (ckBTC)

```
[Operator]
   |
   | Select IP to license
   v
[Licenses UI]
   |
   | Create order → derive ckBTC subaccount (escrow)
   | Return shareable payment link
   v
[Server Actions] → [ICP Escrow Canister] → [ckBTC Ledger]
```

### Buyer Checkout & Finalization (ckBTC)

```
[Buyer (Internet Identity)]
   |
   | Open share link in browser
   v
[Invoice UI]
   |
   | Enter license wallet (remember preference)
   | Submit ckBTC payment (icrc1_transfer)
   v
[ckBTC Ledger] → Escrow credited (block index)
   |
   v
[Server Actions]
   | Mint Story license token → [Story Protocol]
   | Issue C2PA + VC → [IPFS]
   | Anchor evidence → [Constellation]
   | Mirror updates → [Convex]
   v
[Invoice UI] → Verification timeline updates (payment credited, token minted)
```

### Dispute & Resolution (UMA)

```
[Reporter] → [Report IP UI] → [Server Actions]
      |                          |-- Pin evidence → [IPFS]
      |                          |-- Raise dispute → [Story DisputeModule]
      |                          '-- Anchor payload → [Constellation]
      v
 [Dispute ID + IP + evidence bundle + tx hash]

[Owner] → [Case Manager] → Add counter‑evidence (note + file)
      |                          |-- Pin counter → [IPFS]
      |                          '-- Respond → [Story / UMA]
      v
  [UMA Liveness Window] → [Resolution] → [Convex mirrors] → [Dashboards]
```

### Compliance & Verification

```
[Verify Page] ← [Convex]
   | shows: compliance score, attestation hash, Story links, Constellation link
   | artifacts: download C2PA archive + Verifiable Credential (JSON)
   | explorers: open Constellation transaction + raw JSON payload
```

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

Create a `.env` file at the repository root using the `.env.example` template. All
values must point to real infrastructure—no placeholders remain in the code.

### How to obtain each env value (commands + links)

Use this checklist to source every value in `.env`.

1. App shell, auth, and Convex

- `NEXTAUTH_URL`
  - Local dev: `http://localhost:3000`
  - Production: your deployed Vercel/Next URL
- `NEXTAUTH_SECRET`
  - Generate once: `openssl rand -hex 32`
- `NEXT_PUBLIC_SITE_DOMAIN`
  - Hostname used by the browser (e.g. `localhost:3000` or `lexlink.app`)
- `NEXT_PUBLIC_IDENTITY_PROVIDER_URL` (optional)
  - Override when pointing to a custom Internet Identity deployment; defaults to
    `https://identity.internetcomputer.org`
- `NEXT_PUBLIC_STORY_NETWORK`
  - Switch Story explorer links between `aeneid` (testnet, default) and
    `mainnet`
- `ICP_HOST`
  - Server-side configuration for the ICP escrow canister (production / staging)
- `NEXT_PUBLIC_ICP_HOST` / `NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID`
  - Frontend + shared configuration for the escrow canister; useful when
    `dfx start` is running on `http://127.0.0.1:4943`

#### Local ICP escrow canister workflow (dfx)

```bash
# Restart replica on a clean slate
dfx stop
dfx start --clean --background

# Deploy the escrow canister
dfx deploy btc_escrow

# Sanity checks
dfx canister call btc_escrow version
dfx canister call btc_escrow request_deposit_address '("invoice-demo")'

# Point LexLink at the local canister
export NEXT_PUBLIC_ICP_HOST="http://127.0.0.1:4943"
export NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID=$(dfx canister id btc_escrow)
export ICP_HOST="http://127.0.0.1:4943"
export ICP_IDENTITY_PEM_PATH="icp/icp_identity.pem"
pnpm encode:icp-identity
export NEXT_PUBLIC_IC_NETWORK="local"
```

- `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_URL`
  - `npx convex dashboard` → copy the deployment URL (format
    `https://<slug>.convex.cloud`)
- `CONVEX_DEPLOYMENT`
  - Shown in the Convex dashboard under “Deployment name” (e.g. `main`)

2. Public RPCs (Story)

- `NEXT_PUBLIC_AENEID_RPC` and `STORY_RPC_URL`
  - Use Aeneid public RPC: `https://aeneid.storyrpc.io` (no change needed)
  - Deployed contracts:
    https://docs.story.foundation/developers/deployed-smart-contracts

3. Story Protocol signer

- `STORY_CHAIN_ID`
  - Aeneid = `1315` (no change needed)
- `STORY_PRIVATE_KEY`
  - Generate a test key: `openssl rand -hex 32` (prefix with `0x`)
  - Import into MetaMask if desired; keep it funded on Aeneid
- `STORY_SPG_NFT_ADDRESS` (SPG Collection address)
  - Create via script in this repo:
    - `pnpm spg:create`
    - Output JSON includes `spgNftContract` — paste that value here
  - Workflows ref:
    https://github.com/storyprotocol/protocol-periphery-v1/blob/main/docs/WORKFLOWS.md
- `STORY_LICENSE_TOKEN_ADDRESS`
  - Aeneid PILicenseToken: `0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC`
  - Verify:
    https://aeneid.storyscan.io/token/0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC
- `STORY_LICENSE_TEMPLATE_ADDRESS`
  - Aeneid PILicenseTemplate: `0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316`
  - Verify:
    https://aeneid.storyscan.io/address/0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316
- `STORY_PIL_URI`
  - Use your hosted legal page: `https://<your-vercel-app>/legal/pil`
  - Local dev: `http://localhost:3000/legal/pil`
  - PIL overview:
    https://docs.story.foundation/concepts/programmable-ip-license/overview
- `STORY_DISPUTE_MODULE_ADDRESS`
  - Aeneid DisputeModule: `0x9b7A9c70AFF961C799110954fc06F3093aeb94C5`
  - Verify:
    https://aeneid.storyscan.io/address/0x9b7A9c70AFF961C799110954fc06F3093aeb94C5
- `STORY_ARBITRATION_POLICY_ADDRESS`
  - Aeneid UMA policy: `0xfFD98c3877B8789124f02C7E8239A4b0Ef11E936`
  - Verify:
    https://aeneid.storyscan.io/address/0xfFD98c3877B8789124f02C7E8239A4b0Ef11E936
- `STORY_DISPUTE_BOND_TOKEN_ADDRESS`
  - Use the zero address on testnets to bypass bond funding; supply the WIP
    token address on mainnet.
- `STORY_DISPUTE_DEFAULT_LIVENESS`
  - Seconds before UMA finalizes a dispute (default 259200 ≈ 3 days).

4. ICP ckBTC escrow canister

- Install IC SDK (dfx):
  - macOS (Apple Silicon): `softwareupdate --install-rosetta`
  - Install: `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`
  - Ensure PATH:
    `echo 'export PATH="$HOME/.local/share/dfx/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc`
  - Verify: `dfx --version`
- `ICP_HOST`
  - Playground: `https://icp0.io`
  - Local replica: `http://127.0.0.1:4943`
- `NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID`
  - Deploy (Playground): `dfx deploy --playground btc_escrow`
  - Read ID: `dfx canister id btc_escrow --playground`
  - Local:
    `dfx start --background && dfx deploy btc_escrow && dfx canister id btc_escrow`
- `ICP_IDENTITY_PEM_PATH`
  - Export your identity: `dfx identity whoami` (e.g., `default`)
  - `dfx identity export default > icp/icp_identity.pem`
  - Set `ICP_IDENTITY_PEM_PATH="icp/icp_identity.pem"`
  - Run `pnpm encode:icp-identity` to refresh `ICP_IDENTITY_PEM_BASE64` in your
    local `.env` whenever the PEM changes (`pnpm encode:icp-identity -- --example`
    will also sync `.env.example` if you need to share sample configs)
  - Identity docs:
    https://internetcomputer.org/docs/current/developer-docs/getting-started/developer-identity
  - Test canister call (Playground):
    `dfx canister call --playground btc_escrow request_deposit_address '("order-1")'`

5. Constellation anchoring

- Install Stargazer Wallet (Chrome):
  - https://chromewebstore.google.com/detail/stargazer-wallet/pgiaagfkgcbnmiiolekcfmljdagdhlcm?pli=1
  - Switch to IntegrationNet; copy your DAG address (`CONSTELLATION_ADDRESS`)
  - Export the private key for test use (`CONSTELLATION_PRIVATE_KEY`,
    0x-prefixed)
- Generate a second wallet or cold address as the evidence sink:
  - Copy the address into `CONSTELLATION_SINK_ADDRESS`
  - Keep the sink and signer distinct; dag4 rejects self-sends
- Control anchoring with:
  - `CONSTELLATION_ENABLED=true|false`
  - `CONSTELLATION_NETWORK=integrationnet|testnet|mainnet`
- Fund the signer wallet on IntegrationNet:
  - Faucet:
    `GET https://faucet.constellationnetwork.io/integrationnet/faucet/<YOUR_DAG_ADDRESS>`

**Sanity checks**

- Story: `pnpm spg:create` returns a valid `spgNftContract`
- ICP:
  `dfx canister call --playground btc_escrow request_deposit_address '("order-1")'`
- Constellation: Fund DAG address via faucet; ensure wallet shows balance
- Convex: `npx convex deploy` then `pnpm convex:dev` for local dev

### Story configuration

- `STORY_SPG_NFT_ADDRESS` must be an SPG contract you control on Aeneid.
- `STORY_LICENSE_TOKEN_ADDRESS` points at the PILicenseToken ERC-721 contract
  for the active Story network.
- `STORY_LICENSE_TEMPLATE_ADDRESS` should point to the PIL template (public
  deployments are published in Story documentation).
- The private key will sign all workflows; keep it secure.

### ICP configuration

- The canister expects an ECDSA key with the name `lexlink-btc`. On mainnet,
  file a boundary node proposal; locally, run `dfx identity get-principal` and
  enable ECDSA signing in `dfx.json`.
- `ICP_IDENTITY_PEM_PATH` points at the exported PEM on disk. After updating the
  file, run `pnpm encode:icp-identity` to refresh `ICP_IDENTITY_PEM_BASE64` in
  your local `.env`. Add the `--example` flag if you also want to sync
  `.env.example`; otherwise copy the value manually. The runtime only reads the
  base64 env, so serverless deployments never touch the filesystem.

### Constellation configuration

- Provision two IntegrationNet wallets: one signer (source) and one sink. The
  [wallets overview](https://docs.constellationnetwork.io/network-intro/tools/wallets)
  walks through Stargazer installation and exporting the private key.
- Fund the signer through the IntegrationNet faucet (documented in
  [IntegrationNet](https://docs.constellationnetwork.io/network-apis/integrationnet))
  and verify balances in the
  [block explorer](https://docs.constellationnetwork.io/network-apis/block-explorer-apis).
- Keep `CONSTELLATION_ADDRESS` equal to the signer and
  `CONSTELLATION_SINK_ADDRESS` equal to the second address; they must differ or
  dag4 rejects the transaction.
- Reference the dag4 docs when troubleshooting:
  [connecting to the network](https://docs.constellationnetwork.io/network-apis/api-reference/dag4.js/connecting-to-the-network),
  [interacting with wallets](https://docs.constellationnetwork.io/network-apis/api-reference/dag4.js/interacting-with-wallets),
  and
  [sending transactions](https://docs.constellationnetwork.io/network-apis/api-reference/dag4.js/sending-transactions).
- Evidence pulses send 0 DAG with the latest reference. Anchoring failures no
  longer block licensing, but hashes are only persisted when the dag4 call
  returns `status: "ok"`.
- C2PA archives are pinned to IPFS during finalization; the Convex record stores
  the gateway-safe URI, file name, and size instead of base64 blobs.
- `VC_ISSUER_DID` and `VC_PRIVATE_KEY` sign the verifiable credentials that
  accompany each license passport. Use a dedicated Ed25519 key pair for demos.

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

## 5. ICP canister

The Motoko canister that powers ckBTC escrow lives in `icp/`.

```bash
cd icp
# Deploy locally
dfx start --background
dfx deploy btc_escrow
```

The canister exposes three methods:

- `request_deposit_address(orderId: Text) -> Text`
- `settle_ckbtc(orderId: Text)`
- `attestation(orderId: Text) -> Text`

Configure `NEXT_PUBLIC_ICP_ESCROW_CANISTER_ID` with the output of deployment.
The deployed Candid UI is available at:
https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=bqf6p-rqaaa-aaaaa-qc46q-cai.

## 6. Operational flow

1. **Register IP** – The console fetches metadata, hashes its contents, and
   calls `StoryClient.ipAsset.mintAndRegisterIpAssetWithPilTerms`. Convex stores
   the mirrored record.
2. **Create payment request** – `createLicenseOrder` derives an ICRC-1 escrow
   account (owner + subaccount) for ckBTC payments and records the order in
   Convex.
3. **Buyer pays (ckBTC)** – Buyers transfer ckTESTBTC to the escrow account; the
   server verifies the ledger balance before finalizing.
4. **C2PA & VC issuance** – The same action produces a downloadable C2PA bundle
   and a signed Ed25519 verifiable credential. Both are stored in Convex and
   exposed through the dashboard.
5. **Compliance dashboard** – Every completed order shows the Story IP ID,
   settlement reference, Constellation tx hash, attestation hash, compliance
   score, and one-click downloads for the C2PA archive and VC payload.
6. **Raise disputes** – Reporters upload evidence files or cite URLs, the server
   pins everything to IPFS as a single bundle CID, calls Story’s Dispute Module
   (UMA arbitration), anchors the payload to Constellation, and owners monitor
   the status from the dashboard disputes inbox.

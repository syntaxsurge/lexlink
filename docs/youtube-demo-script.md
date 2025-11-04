# LexLink YouTube Demo Script (7–8 minutes)

This script pairs voice‑over lines with on‑screen actions to showcase LexLink’s full MVP: Story Protocol licensing, ICP Bitcoin escrow, Constellation evidence, disputes, and the compliance dashboard. Sample inputs are provided verbatim to type during recording.

—

## Segment 1 — Cold open and value prop (0:00 – 0:30)

1. On‑screen: Land on `/` (home). Slowly pan across the hero and feature cards.
   - Voice‑over: “This is LexLink: a cross‑protocol legaltech app that lets creators register IP on Story, accept Bitcoin via ICP escrow, and anchor the evidence on Constellation.”

—

## Segment 2 — Quick architecture flyover (0:30 – 1:00)

1. On‑screen: Show a simple diagram overlay (lower‑third) or scroll the highlights.
   - Voice‑over: “Under the hood: Story Protocol handles licensing and royalties, an ICP canister issues per‑order Bitcoin deposit addresses and attestations, and Constellation IntegrationNet stores audit hashes. Convex powers the dashboard mirrors.”

—

## Segment 3 — Register an IP on Story (1:00 – 2:30)

1. On‑screen: Click “Open the Console” → `/app`. In the Register IP card, type exactly:
   - Title: `Midnight Marriage`
   - Description: `An AI‑assisted house track; commercial licensing enabled.`
   - Created At: `2025-02-15T12:00:00Z`
   - Cover Image URL: `https://cdn2.suno.ai/image_large_8bcba6bc-3f60-4921-b148-f32a59086a4c.jpeg`
   - Media URL: `https://cdn1.suno.ai/dcd3076f-3aa5-400b-ba5d-87d30f27c311.mp3`
   - Media Type (MIME): `audio/mpeg`
   - License Price (sats): `250000`
   - Royalty (BPS): `1000` (10%)
   - Creator Name: `LexLink Demo`
   - Creator Wallet: `0x1111111111111111111111111111111111111111`
   - IP Metadata URI: `https://ipfs.io/ipfs/QmSamy4zqP91X42k6wS7kLJQVzuYJuW2EN94couPaq82A8`
   - NFT Metadata URI: `https://ipfs.io/ipfs/QmSamy4zqP91X42k6wS7kLJQVzuYJuW2EN94couPaq82A8`
2. Click “Register IP Asset”.
   - Voice‑over: “LexLink mints an SPG NFT, registers it as an IP Asset, attaches PIL terms with a 10% revenue share, and mirrors the record into Convex.”
3. On‑screen: Show the result with IP ID, Token ID, and License Terms ID. Copy the IP ID (you’ll need it later).

—

## Segment 4 — Create a Bitcoin license order (2:30 – 3:15)

1. On‑screen: In the “Generate BTC Invoice” card, select the IP you just registered.
2. Type exactly:
   - Buyer Wallet Address: `0x2222222222222222222222222222222222222222`
3. Click “Generate BTC Invoice”.
   - Voice‑over: “The ICP canister returns a dedicated P2WPKH testnet address bound to this order ID.”
4. On‑screen: Show the Order ID and Bitcoin deposit address. Copy the deposit address.

—

## Segment 5 — Simulate payment and finalize the sale (3:15 – 4:45)

1. On‑screen: Show a testnet wallet sending 0.0025 BTC to the address, or paste a prepared tBTC txid.
   - Example txid placeholder to paste: `a3b5f9c2d1e4f6a7b8c9d0e1f2a3b4c5d6e7f8090a1b2c3d4e5f6789abcdef01`
2. In the “Finalize Sale” card, set:
   - Pending Order: select the new order
   - Bitcoin Transaction Hash: paste the txid above
   - License Receiver: `0x3333333333333333333333333333333333333333`
3. Click “Finalize Sale”.
   - Voice‑over: “The canister verifies the UTXO and emits a signed attestation. LexLink mints a Story License Token to the buyer and anchors a heartbeat on Constellation.”
4. On‑screen: Show the result panel:
   - License Token ID: (copy)
   - Attestation Hash: (copy)
   - Constellation Tx: (copy)

—

## Segment 6 — Compliance dashboard & evidence (4:45 – 5:30)

1. On‑screen: Scroll to “Completed Licenses”. Highlight Story IP ID, Bitcoin txid, attestation hash, and Constellation tx.
   - Voice‑over: “Auditors can correlate license mint, BTC payment attestation, and the Constellation heartbeat in one place.”
2. Optional: Open the Aeneid explorer and paste the IP ID.

—

## Segment 7 — Dispute flow (UMA policy) (5:30 – 6:30)

1. On‑screen: In Dispute card, select the same IP.
2. Type exactly:
   - Dispute Tag: `IMPROPER_USAGE`
   - Evidence CID or URL: `ipfs://bafkreihdwdcej3m2vxxevidencelexlinkdemo`
   - Liveness (seconds): `259200`
   - Bond (WIP smallest units): `0`
3. Click “Raise Dispute”.
   - Voice‑over: “We submit a UMA‑backed dispute on Story. The evidence hash is also logged to Constellation for independent timestamping.”
4. On‑screen: Show the new Dispute History row with IDs and hashes.

—

## Segment 8 — Legal page and playbook (6:30 – 7:15)

1. On‑screen: Open `/legal/pil` and scroll.
   - Voice‑over: “Every IP references a human‑readable PIL URI hosted by the app. The on‑chain template remains authoritative.”
2. On‑screen: Open `/playbook`.
   - Voice‑over: “The Playbook summarizes architecture, flows, and commands for reviewers and collaborators.”

—

## Segment 9 — Wrap‑up (7:15 – 8:00)

1. On‑screen: Return to `/`.
   - Voice‑over: “That’s LexLink—Story licensing, ICP Bitcoin escrow, and Constellation evidence in one workflow. Links to the repo, canister, and testnets are in the description. Thanks for watching.”

—

### Lower‑third callouts (optional)
- “Story (Aeneid), ICP (Playground), Constellation (IntegrationNet)”
- “License Token minted → Evidence anchored”
- “All testnet — no funds required”

### Optional B‑roll ideas
- Constellation IntegrationNet faucet GET request
- Aeneid explorer page of the IP ID
- ICP canister `request_deposit_address` in terminal


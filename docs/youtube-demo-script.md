# LexLink YouTube Demo Script (6 minutes)

This script matches the production build with authentication, shadcn UI, and the new audit trail. Each bullet is a beat: the first line is what to show on screen, the second line is the suggested voice-over.

—

## Segment 1 — Cold open (0:00 – 0:25)
- On-screen: Landing page (`/`). Slowly pan across hero, highlight the "Launch Console" CTA.
- Voice-over: “This is LexLink — Story Protocol licensing, ICP Bitcoin escrow, and Constellation audit trails in one console.”

## Segment 2 — Identity choice (0:25 – 0:55)
- On-screen: Navigate to `/signin`. Highlight the hero copy on the left and the Internet Identity card on the right.
- Voice-over: “LexLink borrows Proofly’s Internet Identity hardening. Operators sign in with a principal, receive a seven-day delegation, and land inside the protected console.”
- On-screen: Click `Sign in with Internet Identity`, approve in the II window, and return to LexLink.
- Voice-over: “The delegation is verified server-side, Convex seeds the operator role, and the AppShell unlocks.”

## Segment 3 — Dashboard tour (0:55 – 1:35)
- On-screen: Overview page shows the new AppShell – sidebar, KPI cards, pending invoices, disputes, and audit log.
- Voice-over: “Everything is gated behind middleware. The overview pulls Story, ICP, Constellation, and Convex mirrors into one place.”
- Call out the “Recent Audit Activity” card – scroll the payload JSON.
- Voice-over: “Every privileged action writes to Convex events so compliance teams can replay the history.”

## Segment 4 — Register IP asset (1:35 – 2:10)
- On-screen: Click `IP Registry` in the sidebar. Fill the form with the sample data below.
  - Title: `Midnight Marriage`
  - Created At: `2025-02-15T12:00:00Z`
  - Description: `An AI-assisted house track; commercial licensing enabled.`
  - Cover Image URL: `https://cdn2.suno.ai/image_large_8bcba6bc-3f60-4921-b148-f32a59086a4c.jpeg`
  - Media URL: `https://cdn1.suno.ai/dcd3076f-3aa5-400b-ba5d-87d30f27c311.mp3`
  - Media Type: `audio/mpeg`
  - License Price: `250000`
  - Royalty BPS: `1000`
  - Creator Name: `LexLink Demo`
  - Creator Wallet: `0x1111111111111111111111111111111111111111`
  - IP Metadata URI: `https://ipfs.io/ipfs/QmSamy4zqP91X42k6wS7kLJQVzuYJuW2EN94couPaq82A8`
  - NFT Metadata URI: `https://ipfs.io/ipfs/QmSamy4zqP91X42k6wS7kLJQVzuYJuW2EN94couPaq82A8`
- Voice-over: “We mint an SPG NFT, attach PIL terms, and mirror the asset into Convex. The audit log now shows `ip_asset.registered`.”
- On-screen: Highlight the success panel with IP ID, token ID, and license terms ID.

## Segment 5 — Allocate Bitcoin invoice (2:10 – 2:45)
- On-screen: Switch to `Licenses`. In “Generate Bitcoin License Order” pick the new IP, set Buyer Wallet `0x2222…2222`.
- Voice-over: “The ICP canister returns a dedicated P2WPKH address per order.”
- On-screen: Show the generated order ID and deposit address. Copy the order ID for the next step.
- Voice-over: “Notice the audit trail entry `license.order_created`.”

## Segment 6 — Finalize sale (2:45 – 3:40)
- On-screen: In “Finalize Sale & Mint License,” choose the pending order. Paste a real or pre-recorded tBTC txid, and set License Receiver `0x3333…3333`.
- Voice-over: “ICP verifies the UTXO, Story mints the license token, Constellation anchors the heartbeat, and we issue a C2PA bundle plus VC.”
- On-screen: Scroll the result panel, download the C2PA and VC files, and open StoryScan + Constellation explorers in new tabs.
- Voice-over: “Compliance jumps to 100. Recent activity shows `license.sale_completed` with payload hashes.”

## Segment 7 — Log training batch (3:40 – 4:10)
- On-screen: Navigate to `Training`. Select the same IP, enter `150` units, click `Record Training Batch`.
- Voice-over: “Each batch emits an IntegrationNet transaction and boosts the compliance score.”
- On-screen: Highlight the table entry and the corresponding audit event `training.batch_recorded`.

## Segment 8 — Raise dispute (4:10 – 4:40)
- On-screen: Go to `Disputes`. Select the IP, choose tag `IMPROPER_USAGE`, set Evidence CID `ipfs://bafkreihdwdcej3m2vxxevidencelexlinkdemo`, Liveness `259200`, Bond `0`.
- Voice-over: “Disputes are routed to Story’s UMA module, and the evidence hash hits Constellation for anchoring.”
- On-screen: Show the ledger row with dispute ID, status, and Constellation tx.

## Segment 9 — Compliance ledger & roles (4:40 – 5:20)
- On-screen: Open `Compliance` to show the full audit trail table. Scroll through a couple of payloads.
- Voice-over: “The compliance tab is the single ledger. Every action includes actor principal, resource ID, and payload JSON.”
- On-screen: Navigate to `Settings`. Point out the current session info and the operators table (if logged in as operator).
- Voice-over: “Roles live in Convex. Operators can promote creators or viewers; viewers authenticate with Internet Identity without a wallet.”

## Segment 10 — Internet Identity cameo (5:20 – 5:45)
- On-screen: Sign out via the header, click `Sign in with Internet Identity`. Complete the II flow (can use Playground tenant).
- Voice-over: “Internet Identity users land with viewer permissions. They can still inspect compliance data without touching operator tooling.”

## Segment 11 — Wrap (5:45 – 6:00)
- On-screen: Return to dashboard, briefly show the KPI cards updating in real time.
- Voice-over: “LexLink unifies Story licensing, ICP Bitcoin escrow, Constellation evidence, and compliance-ready audit trails. All production-ready, no placeholders.”

—

## Appendix: quick-reference URLs
- StoryScan: `https://aeneid.storyscan.io/`
- IntegrationNet Explorer: `https://explorer.mainnet.constellationnetwork.io/`
- Bitcoin testnet explorer: `https://mempool.space/testnet/`
- Internet Identity docs: `https://internetcomputer.org/internet-identity`

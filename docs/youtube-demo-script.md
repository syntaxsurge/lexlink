# LexLink YouTube Demo Script (6 minutes)

This script follows the production build with Internet Identity, shadcn UI, invoice tracking, and the automated licensing worker. Each beat has an on-screen cue and a suggested voice-over.

—

## Segment 1 — Cold open (0:00 – 0:20)
- On-screen: Landing page (`/`). Light pan and highlight “Launch Console”.
- Voice-over: “This is LexLink — Story Protocol licensing, ICP Bitcoin escrow, and Constellation audit trails in one console.”

## Segment 2 — Secure sign-in (0:20 – 0:45)
- On-screen: `/signin`. Emphasise the Internet Identity hero copy and card.
- Voice-over: “Operators authenticate with Internet Identity. We verify the delegation server-side and seed roles in Convex.”
- On-screen: Click “Sign in with Internet Identity”, approve, return to LexLink.
- Voice-over: “The AppShell unlocks as soon as the principal is hydrated.”

## Segment 3 — Overview tour (0:45 – 1:15)
- On-screen: `/app`. Show KPI cards, Pending Invoices widget, Recent Audit Activity.
- Voice-over: “One place for Story, ICP, Constellation, and Convex mirrors. Every privileged action writes to the audit ledger.”
- On-screen: Expand a recent event payload.
- Voice-over: “Compliance teams can replay the full history from here.”

## Segment 4 — Register IP asset (1:15 – 1:55)
- On-screen: `IP Registry`. Fill the form with:
  - Title `Midnight Marriage`
  - Creation timestamp `2025-02-15T12:00`
  - Description `An AI-assisted house track; commercial licensing enabled.`
  - Cover Image `https://cdn2.suno.ai/image_large_8bcba6bc-3f60-4921-b148-f32a59086a4c.jpeg`
  - Media URL `https://cdn1.suno.ai/dcd3076f-3aa5-400b-ba5d-87d30f27c311.mp3`
  - Media Type `audio/mpeg`
  - Price `0.002500 BTC`
  - Royalty `10%`
  - Creator `LexLink Demo / 0x1111…1111`
  - IP metadata + NFT metadata URIs.
- Voice-over: “We mint an SPG NFT, attach PIL terms, mirror to Convex, and log `ip_asset.registered`.”
- On-screen: Highlight the success panel (IP ID, token ID, license terms ID) and open the Story IP Explorer link.

## Segment 5 — Generate ckBTC invoice (1:55 – 2:25)
- On-screen: `Licenses → Generate License Order` with payment mode set to ckBTC. Pick the new IP, buyer `0x21b06cdfeb63b64396f3a7f5f0f4dc8034fb72ca`.
- Voice-over: “The order builder derives a deterministic ckBTC subaccount and stores the ICRC-1 escrow account alongside the share link.”
- On-screen: Submit → Pending Invoices table shows new row (status Pending, ckBTC account string, amount in BTC).
- Voice-over: “Everything lands in Convex instantly so the automation can monitor balances.”

## Segment 6 — Funding & auto-finalise (2:25 – 3:20)
- On-screen: Open `/pay/[orderId]`, click “Pay with ckBTC”, authenticate with Internet Identity, and send ckTESTBTC.
- Voice-over: “Before recording, mint ckTESTBTC for your principal at https://testnet-faucet.ckboost.com/ — no minter polling needed.”
- Show the Pending row flip from Pending → Finalised after the ledger balance updates. Toast notes “License minted”.
- Voice-over: “The worker verifies the ledger balance, mints the Story license, and anchors Constellation evidence automatically.”

## Segment 7 — Evidence bundle & explorers (3:20 – 3:55)
- On-screen: In the Finalised section, click “Story IP Explorer” and “StoryScan (address)”.
- Scroll the result panel with C2PA + VC downloads and Constellation link.
- Voice-over: “Compliance jumps to 100, `license.sale_completed` lands in the audit trail, and downstream artefacts are ready to download.”

## Segment 8 — Log training batch (3:55 – 4:15)
- On-screen: `Training` → record `150` units for the same IP.
- Voice-over: “Every AI batch emits an IntegrationNet transaction and boosts compliance.”
- On-screen: Show the audit event `training.batch_recorded`.

## Segment 9 — Raise dispute (4:15 – 4:40)
- On-screen: `Disputes` → new dispute (`IMPROPER_USAGE`, CID `ipfs://bafkreihdwdcej3m2vxxevidencelexlinkdemo`, liveness `259200`, bond `0`).
- Voice-over: “Disputes route through Story’s UMA integration and the evidence hash anchors on Constellation.”

## Segment 10 — Compliance ledger & roles (4:40 – 5:15)
- On-screen: `Compliance` tab. Scroll JSON payloads.
- Voice-over: “The compliance tab is the ledger of record. Every action includes actor principal, resource ID, and payload JSON.”
- On-screen: `Settings` → current session + operators table.
- Voice-over: “Roles live in Convex. Operators can elevate creators and viewers; viewers authenticate with Internet Identity only.”

## Segment 11 — Viewer cameo (5:15 – 5:35)
- On-screen: Sign out, sign in again as a viewer.
- Voice-over: “Viewers retain read access to audit data without touching operator tooling.”

## Segment 12 — Wrap (5:35 – 6:00)
- On-screen: Return to the dashboard, KPIs update.
- Voice-over: “LexLink unifies Story licensing, ICP escrow, Constellation evidence, and compliance-ready audits. Production-ready, no placeholders.”

—

## Appendix: quick-reference URLs
- Story IP Explorer (Aeneid): `https://aeneid.explorer.story.foundation/`
- StoryScan (Aeneid): `https://aeneid.storyscan.io/`
- IntegrationNet Explorer: `https://explorer.mainnet.constellationnetwork.io/`
- Bitcoin testnet explorer: `https://mempool.space/testnet/`
- ckBTC testnet faucet: `https://testnet-faucet.ckboost.com/`
- Internet Identity docs: `https://internetcomputer.org/internet-identity`

# LexLink YouTube Demo Script (6–8 minutes)

A factual, click-by-click walkthrough of the current LexLink build. Each segment lists the screen and an accurate voice‑over that mirrors the app’s behavior today.

—

## 1) Problem framing (0:00 – 0:30)
- On‑screen: Landing page (`/`), “Real problems we address” section.
- Voice‑over: “Teams struggle to prove rights and provenance, buyers can’t tell if assets are clean, and compliance needs an auditable chain of custody. LexLink unifies Story Protocol licensing, ICP ckBTC settlement, and Constellation evidence so creators can monetize safely and buyers trust what they’re licensing.”

## 2) Secure sign‑in (0:30 – 0:50)
- On‑screen: `/signin` → Sign in with Internet Identity.
- Voice‑over: “Authentication uses Internet Identity. The server verifies the delegation and persists your principal and role in Convex.”

## 3) Dashboard overview (0:50 – 1:20)
- On‑screen: `/dashboard` KPIs, Pending Payments, Recent Audit Activity.
- Voice‑over: “The overview mirrors Story, ckBTC invoices, and audit events. Every privileged action writes a structured event payload with your principal.”

## 4) Create IP via AI Studio (1:20 – 2:10)
- On‑screen: `/dashboard/ai`.
- Voice‑over: “You can register any existing asset from IP Registry, but for this demo we’ll generate one in AI Studio. The studio renders media, computes hashes, mints a Story IP Asset, attaches PIL license terms, and mirrors everything to Convex.”
- On‑screen: Submit a prompt, confirm the generated preview, then watch the registration complete. Click the Story explorer link for the new IP ID.

## 5) List the asset for sale (2:10 – 2:50)
- On‑screen: `/dashboard/licenses` → Generate License Order.
- Voice‑over: “Pick the IP and amount. Every order derives a deterministic ICRC‑1 subaccount for ckBTC settlement and saves a shareable pay link.”
- On‑screen: After submit, the order appears in Pending Payments with status, amount, and the ckBTC escrow target.

## 6) Buyer checkout and wallet capture (2:50 – 3:40)
- On‑screen: open the share link `/pay/[orderId]` as the buyer session.
- Voice‑over: “Buyers authenticate with Internet Identity, set their default license wallet inline, and pay with ckBTC from the browser.”
- On‑screen: Click Pay, send ckTESTBTC. The page auto‑refreshes when the escrow balance increases.
- Voice‑over: “Once funded, the server mints the Story license token and anchors a C2PA archive, a verifiable credential, and a Constellation hash. The buyer’s default wallet is remembered for future purchases.”

## 7) Buyer’s My Licenses (3:40 – 4:05)
- On‑screen: `/dashboard/purchases` (buyer session).
- Voice‑over: “My Licenses lists every claimed order for this principal with one‑click links: Story explorer, Constellation explorer, C2PA archive, and the VC download. The default license wallet is shown at the top.”

## 8) Seller’s license management (4:05 – 4:35)
- On‑screen: switch to the seller/operator session → `/dashboard/licenses`.
- Voice‑over: “The Licenses tab shows pending invoices, manual finalization for native BTC, and a full order history sorted by update time. Each row links to mempool, Story, and Constellation.”

## 9) Public “Report IP” (4:35 – 5:00)
- On‑screen: Header → “Report IP” or the button on the invoice page → `/report`.
- Voice‑over: “Anyone can report misuse. Reporters upload evidence or paste a source URL. LexLink pins the files to IPFS, builds a single evidence bundle CID, and passes that to Story’s Dispute Module.”
- On‑screen: Submit a dispute with tag `IMPROPER_USAGE`. Show the returned Dispute ID and evidence bundle link.

## 10) Owner’s Disputes Inbox (5:00 – 5:30)
- On‑screen: `/dashboard/disputes` (owner/operator session).
- Voice‑over: “The inbox shows disputes against assets you own: reporter principal, tag, evidence bundle, and on‑chain tx. On testnet you can simulate UMA judgement; on mainnet UMA reviewers arbitrate. Once upheld, Story tags the IP and downstream actions respect that tag.”

## 11) Compliance and audit (5:30 – 5:55)
- On‑screen: `/dashboard/compliance`.
- Voice‑over: “A searchable audit trail with actor principal, resource IDs, and payload JSON for registrations, invoices, settlements, disputes, and training batches.”

## 12) Settings (5:55 – 6:10)
- On‑screen: `/dashboard/settings`.
- Voice‑over: “Session details and role‑based controls live here. Sessions auto‑expire; rotate credentials as needed.”

## 13) Gallery and marketplace (6:10 – 6:40)
- On‑screen: `/gallery` then `/marketplace`.
- Voice‑over: “The gallery surfaces registered media and attribution. The marketplace highlights price and royalty splits with direct Story links so buyers can initiate orders safely.”

## 14) How creators earn (6:40 – 7:10)
- On‑screen: Show an IP’s royalty and minting settings (from IP detail cards and Licenses order builder).
- Voice‑over: “Revenue comes from minting fees per license and ongoing royalties on derivatives encoded in PIL terms. Disputes can carry bonds on UMA; upheld claims return bonds plus a portion of the counter‑party bond to the winner.”

—

## Appendix: quick‑reference URLs
- Story IP Explorer (Aeneid): `https://aeneid.explorer.story.foundation/`
- StoryScan (Aeneid): `https://aeneid.storyscan.io/`
- Constellation explorers:
  - IntegrationNet: `https://integrationnet.dagexplorer.io/`
  - Testnet: `https://explorer.testnet.constellationnetwork.io/`
  - Mainnet: `https://explorer.mainnet.constellationnetwork.io/`
- Bitcoin testnet explorer: `https://mempool.space/testnet/`
- ckBTC testnet faucet: `https://testnet-faucet.ckboost.com/`
- Internet Identity: `https://internetcomputer.org/docs/current/concepts/identity/internet-identity/`

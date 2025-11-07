# LexLink YouTube Demo Script (6–8 minutes)

A factual, click-by-click walkthrough of the current LexLink build. Each segment lists the screen, exact demo inputs, and a concise voice‑over.

—

## 1) Problem framing (0:00 – 0:30)
- On‑screen: Landing page (`/`), “Real problems we address” section.
- Demo inputs: No input fields on this page.
- **Voice‑over 1:** Teams struggle to prove rights and provenance, buyers can’t tell if assets are clean, and compliance needs an auditable chain of custody. LexLink unifies Story Protocol licensing, ICP ckBTC settlement, and Constellation evidence so creators can monetize safely and buyers trust what they’re licensing.

## 2) Secure sign‑in (0:30 – 0:50)
- On‑screen: `/signin` → Sign in with Internet Identity.
- Demo inputs:
  - Click “Sign in with Internet Identity” and complete the popup. No text fields.
- **Voice‑over 2:** Authentication uses Internet Identity. The server verifies the delegation and persists your principal and role in Convex.

## 3) Create IP via AI Studio (with Registry preview) (0:50 – 2:10)
- On‑screen (preview only): Open `/dashboard/ip` (IP Registry) briefly to show the page. Do not scroll or interact.
- On‑screen (actual interaction): Navigate to `/dashboard/ai` and fill the form. Click “Generate & Register”.
- AI Studio demo inputs (type exactly):
  - Prompt: Design an album cover featuring neon‑lit architecture reflected on rain‑soaked streets, cyberpunk synthwave aesthetic, 4k, cinematic lighting, vibrant magenta and teal palette.
  - Title: Neon District Suite
  - Description: Futuristic album artwork depicting a neon‑lit cityscape with rain reflections and cinematic lighting; licensed for commercial use with derivatives allowed.
  - License price (BTC): 0.001
  - Royalty share (%): 10
  - Commercial use: checked
  - Derivatives allowed: checked
- On‑screen: Confirm the generated preview, wait for registration, then copy the displayed IP ID. Open the Story explorer link to show the asset.
- **Voice‑over 3:** IP can be registered from existing files—upload a cover image and the primary media, set price, royalties, and metadata. For this demo, I will generate the asset in AI Studio by entering the prompt, title, and description, setting the license price to 0.001 BTC, keeping the royalty share at 10%, and leaving commercial use and derivatives allowed checked; the studio renders media, pins metadata to IPFS, registers the IP on Story with commercial PIL terms, and mirrors everything to Convex.

## 4) List the asset for sale (2:10 – 2:50)
- On‑screen: `/dashboard/licenses` → “Generate ckBTC Invoice”.
- Demo inputs:
  - IP asset: Select “Neon District Suite – 0.001000 ckBTC” from the dropdown.
  - Click “Generate ckBTC invoice”.
- On‑screen: After submission, find the new entry under Pending Payments and click “Open invoice”.
- **Voice‑over 4:** Select the IP to invoice. Each order derives a deterministic ICRC‑1 subaccount for ckBTC escrow and saves a shareable payment link.

## 5) Buyer checkout and wallet capture (2:50 – 3:40)
- On‑screen: Open the shared link `/pay/[orderId]` as the buyer session.
- Demo inputs:
  - License wallet (EVM address): 0x1111111111111111111111111111111111111111
  - Remember this wallet for future purchases: checked
  - Click “Connect Internet Identity”, then click “Pay now”.
  - Amount: pay the shown price (expected 0.00100000 ckTESTBTC on testnet).
- **Voice‑over 5:** Buyers authenticate with Internet Identity, set a license wallet, and pay with ckBTC from the browser; the page auto‑refreshes on ledger updates, and once funded the server mints the Story license token, pins a C2PA bundle and verifiable credential, and anchors Constellation evidence.

## 6) Buyer’s My Licenses (3:40 – 4:05)
- On‑screen: `/dashboard/purchases` (buyer session).
- Demo inputs: No input fields on this page.
- **Voice‑over 6:** Lists each claimed order with quick links to Story, Constellation, the C2PA archive, and the verifiable credential. The saved license wallet is shown.

## 7) Seller’s license management (4:05 – 4:35)
- On‑screen: Switch to the seller/operator session → `/dashboard/licenses`.
- Demo inputs: No input fields on this page.
- **Voice‑over 7:** Shows pending invoices, automatic ckBTC finalization, and a chronological history. Each row links to settlement references and explorers.

## 8) Public “Report IP” (4:35 – 5:00)
- On‑screen: Header → “Report IP” or the button from an invoice → `/report`.
- Demo inputs (type exactly):
  - IP asset (ipId): Use the dropdown to select “Neon District Suite” (autofills ipId). If not listed, paste the copied ipId from AI Studio.
  - Dispute tag: improper usage (IMPROPER_USAGE)
  - Note: Suspected unauthorized repost on social media; link below.
  - Source URL: https://example.com/infringing-post
  - Evidence files: leave empty (URL provided above suffices)
  - Click “Raise dispute”.
- On‑screen: Show the returned Dispute ID and evidence bundle link.
- **Voice‑over 8:** Anyone can report misuse. Evidence is pinned to IPFS as a single bundle and submitted through Story’s Dispute Module.

## 9) Case Manager (5:00 – 5:30)
- On‑screen: `/dashboard/disputes` (owner/operator session).
- Demo inputs: No input fields unless posting counter‑evidence (skip for this demo).
- **Voice‑over 9:** Inbox, Filed, and Watching tabs track disputes. Open the new case to view evidence, liveness, and resolution status. Owners can add counter‑evidence during liveness and settle after UMA finalizes.

## 10) Compliance and audit (5:30 – 5:55)
- On‑screen: `/dashboard/compliance`.
- Demo inputs: No input fields on this page.
- **Voice‑over 10:** A searchable audit ledger with principals, resource IDs, and payload JSON for registrations, invoices, settlements, and disputes.

## 11) Settings (5:55 – 6:10)
- On‑screen: `/dashboard/settings`.
- Demo inputs: No input fields to type for this demo.
- **Voice‑over 11:** Shows the current Internet Identity principal and role. Operators can manage team roles.

## 12) Gallery and marketplace (6:10 – 6:40)
- On‑screen: `/gallery` then `/marketplace`.
- Demo inputs: No input fields on these pages.
- **Voice‑over 12:** The gallery surfaces registered media and attribution. The marketplace highlights price and royalty splits with direct Story links so buyers can initiate orders.

## 13) How creators earn (6:40 – 7:10)
- On‑screen: Show an IP’s royalty and minting settings (from IP detail cards and Licenses order builder).
- **Voice‑over 13:** Revenue comes from per‑license minting and ongoing royalties encoded in PIL terms. Disputes can require bonds; upheld claims reflect across licensing flows.

—

## Appendix: quick‑reference URLs
- Story IP Explorer (Aeneid): `https://aeneid.explorer.story.foundation/`
- StoryScan (Aeneid): `https://aeneid.storyscan.io/`
- Constellation explorers:
  - IntegrationNet: `https://integrationnet.dagexplorer.io/`
  - Testnet: `https://explorer.testnet.constellationnetwork.io/`
  - Mainnet: `https://explorer.mainnet.constellationnetwork.io/`
- ckBTC testnet faucet: `https://testnet-faucet.ckboost.com/`
- Internet Identity: `https://internetcomputer.org/docs/current/concepts/identity/internet-identity/`

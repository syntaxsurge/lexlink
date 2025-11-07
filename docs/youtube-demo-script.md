# LexLink YouTube Demo Script

A factual, click-by-click walkthrough of the current LexLink build. Each segment lists the screen, exact demo inputs, and a concise voice‑over.

—

## 1) Problem framing
- On‑screen: Landing page (`/`), “Real problems we address” section.
- Demo inputs: No input fields on this page.
- **Voice‑over 1:** Teams struggle to prove rights and provenance, buyers can’t tell if assets are clean, and compliance needs an auditable chain of custody. LexLink unifies Story Protocol licensing, ICP ckBTC settlement, and Constellation evidence so creators can monetize safely and buyers trust what they’re licensing.

## 2) Secure sign‑in
- On‑screen: `/signin` → Sign in with Internet Identity.
- Demo inputs:
  - Click “Sign in with Internet Identity” and complete the popup
  - No text fields
- **Voice‑over 2:** Authentication uses Internet Identity. The server verifies the delegation and persists your principal and role in Convex.

## 3) Register IP (manual)
- On‑screen: `/dashboard/ip` → “Register Story IP Asset”.
- Demo inputs:
  - Title: Neon District Theme
  - Description: Original audio track with neon‑lit cityscape cover art; cinematic synthwave ambience; licensed for commercial use with derivatives allowed
  - Created at: leave default
  - Cover image URL: https://cdn2.suno.ai/image_large_8bcba6bc-3f60-4921-b148-f32a59086a4c.jpeg
  - Primary media URL: https://cdn1.suno.ai/dcd3076f-3aa5-400b-ba5d-87d30f27c311.mp3
  - Media type: auto‑detected as audio/mpeg (mp3)
  - License price (BTC): 0.001
  - Royalty share (%): 10
  - Commercial use: checked
  - Derivatives allowed: checked
- On‑screen: Optionally expand “Advanced metadata” to preview Tags, Creators, Lineage, and Attributes, then collapse it and proceed without changes.
- On‑screen: Click “Register IP Asset”; after success, copy the IP ID and open the Story explorer link.
- **Voice‑over 3:** Open the IP Registry page, paste the cover image and primary media URLs, confirm the app auto‑detects the media type as audio/mpeg (mp3), set License price to 0.001 BTC and Royalty to 10%, leave Commercial use and Derivatives allowed checked, click Advanced metadata then collapse without changes for this demo, click Register IP Asset to complete, then click “View on StoryScan” or “View in Story IP Explorer” to verify the asset.

## 4) Create IP via AI Studio
- On‑screen: `/dashboard/ai` → LexLink AI Studio.
- Demo inputs:
  - Prompt: Design an album cover featuring neon‑lit architecture reflected on rain‑soaked streets, cyberpunk synthwave aesthetic, 4k, cinematic lighting, vibrant magenta and teal palette
  - Title: Neon District Suite
  - Description: Futuristic album artwork depicting a neon‑lit cityscape with rain reflections and cinematic lighting; licensed for commercial use with derivatives allowed
  - License price (BTC): 0.001
  - Royalty share (%): 10
  - Commercial use: checked
  - Derivatives allowed: checked
- On‑screen: Click “Generate & Register”, then after completion copy the IP ID and open the Story explorer link.
- **Voice‑over 4:** Open the AI Studio page, enter the prompt, title, and description, set price to 0.001 BTC and royalty to 10%, keep Commercial use and Derivatives allowed checked, then click Generate & Register—here the AI automatically generates the media and registers the IP asset based on your prompt, pins metadata to IPFS, and mirrors it in Convex.

## 5) List the asset for sale
- On‑screen: `/dashboard/licenses` → “Generate ckBTC Invoice”.
- Demo inputs:
  - Select “Neon District Suite – 0.001000 ckBTC” from the dropdown
  - Click “Generate ckBTC invoice”
- On‑screen: After submission, find the new entry under Pending Payments and click “Open invoice”.
- **Voice‑over 5:** Select the IP to invoice; each order derives a deterministic ICRC‑1 subaccount for ckBTC escrow and saves a shareable payment link.

## 6) Buyer checkout and wallet capture
- On‑screen: Open the shared link `/pay/[orderId]` as the buyer session.
- Demo inputs:
  - License wallet (EVM): 0x1111111111111111111111111111111111111111
  - Check “Remember this wallet for future purchases”
  - Click “Connect Internet Identity”
  - Click “Pay now”
  - Amount: pay the shown price (expected 0.00100000 ckTESTBTC on testnet)
- **Voice‑over 6:** Buyers authenticate with Internet Identity, set a license wallet, and pay with ckBTC from the browser; the page auto‑refreshes on ledger updates, and once funded the server mints the Story license token, pins a C2PA bundle and verifiable credential, and anchors Constellation evidence.

## 7) Buyer’s My Licenses
- On‑screen: `/dashboard/purchases` (buyer session).
- Demo inputs: No input fields on this page.
- **Voice‑over 7:** Lists each claimed order with quick links to Story, Constellation, the C2PA archive, and the verifiable credential; the saved license wallet is shown.

## 8) Seller’s license management
- On‑screen: Switch to the seller/operator session → `/dashboard/licenses`.
- Demo inputs: No input fields on this page.
- **Voice‑over 8:** Shows pending invoices, automatic ckBTC finalization, and a chronological history; each row links to settlement references and explorers.

## 9) Public “Report IP”
- On‑screen: Header → “Report IP” or the button from an invoice → `/report`.
- Demo inputs:
  - Select the IP (autofills ipId) or paste the copied ipId
  - Dispute tag: improper usage (IMPROPER_USAGE)
  - Note: Suspected unauthorized repost on social media; link below
  - Source URL: https://example.com/infringing-post
  - Evidence files: leave empty
  - Click “Raise dispute”
- On‑screen: Show the returned Dispute ID and evidence bundle link.
- **Voice‑over 9:** Anyone can report misuse; evidence is pinned to IPFS as a single bundle and submitted through Story’s Dispute Module.

## 10) Case Manager
- On‑screen: `/dashboard/disputes` (owner/operator session).
- Demo inputs: No input fields unless posting counter‑evidence (skip for this demo).
- **Voice‑over 10:** Inbox, Filed, and Watching tabs track disputes; open the new case to view evidence, liveness, and resolution status; owners can add counter‑evidence during liveness and settle after UMA finalizes.

## 11) Compliance and audit
- On‑screen: `/dashboard/compliance`.
- Demo inputs: No input fields on this page.
- **Voice‑over 11:** A searchable audit ledger with principals, resource IDs, and payload JSON for registrations, invoices, settlements, and disputes.

## 12) Settings
- On‑screen: `/dashboard/settings`.
- Demo inputs: No input fields to type for this demo.
- **Voice‑over 12:** Shows the current Internet Identity principal and role; operators can manage team roles.

## 13) Gallery and marketplace
- On‑screen: `/gallery` then `/marketplace`.
- Demo inputs: No input fields on these pages.
- **Voice‑over 13:** The gallery surfaces registered media and attribution; the marketplace highlights price and royalty splits with direct Story links so buyers can initiate orders.

## 14) How creators earn
- On‑screen: Show an IP’s royalty and minting settings (from IP detail cards and Licenses order builder).
- **Voice‑over 14:** Revenue comes from per‑license minting and ongoing royalties encoded in PIL terms; disputes can require bonds and upheld claims reflect across licensing flows.

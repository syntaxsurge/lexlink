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
- **Voice‑over 5:** On the Licenses page, select the IP to invoice; for this demonstration, I will select the recently generated AI IP; each order derives a deterministic ICRC‑1 subaccount for ckBTC escrow and saves a shareable payment link.

## 6) Buyer checkout and wallet capture
- On‑screen: Open the shared link `/pay/[orderId]` as the buyer session.
- Demo inputs:
  - License wallet (EVM): 0x1111111111111111111111111111111111111111
  - Check “Remember this wallet for future purchases”
  - Click “Connect Internet Identity”
  - Click “Pay now”
  - Amount: pay the shown price (expected 0.00100000 ckTESTBTC on testnet)
- **Voice‑over 6:** After copying the shareable payment link from the Licenses page, open it in another browser as a separate buyer using a different Internet Identity account; on the invoice page, authenticate, set a license wallet, and pay with ckBTC from the browser—the page auto‑refreshes on ledger updates; once funded, the verification timeline shows Payment credited and completed and License token minted; click View Contract to inspect contract details and View token on StoryScan to see the PIL token; the Constellation evidence is anchored—click Open Explorer to view the IntegrationNet DAG explorer and View JSON payload to inspect the raw payload; in the audit log, the event is recorded with compliance score, attestation hash, and verifiable credential hash; download the license archive and open the zip to inspect the generated files; verification is complete.

## 7) Buyer’s My Licenses
- On‑screen: `/dashboard/purchases` (buyer session).
- Demo inputs: No input fields on this page.
 - **Voice‑over 7:** From the Dashboard, open the My Licenses page from the sidebar to first see the saved license wallet captured at purchase; the My Licenses section lists each order with the Order ID and License wallet plus a License token link to the Story Protocol license page, a Constellation evidence link to the IntegrationNet transaction details, and a View receipt link to the Verify page showing the overview, settlement proof, evidence and artifacts, and the evidence payload; you can download the C2PA bundle and the verifiable credential (JSON) and open it to view the VC details for the purchased license.

## 8) Seller’s license management
- On‑screen: Switch to the seller/operator session → `/dashboard/licenses`.
- Demo inputs: No input fields on this page.
- **Voice‑over 8:** Back in the seller’s browser session, open the Licenses page to review pending invoices, automatic ckBTC finalization, and the chronological order history.

## 9) Public “Report IP”
- On‑screen: Header → “Report IP” or the button from an invoice → `/report`.
- Demo inputs:
  - Select the IP (autofills ipId) or paste the copied ipId
  - Dispute tag: improper usage (IMPROPER_USAGE)
  - Note: Suspected unauthorized repost on social media
  - Evidence files: upload example files (e.g., screenshot.png, evidence.pdf)
  - Click “Raise dispute”
- On‑screen: Show the returned Dispute ID and evidence bundle link.
- **Voice‑over 9:** On the Report IP page, anyone can report misuse; evidence is pinned to IPFS as a single bundle and submitted through Story’s Dispute Module.

## 10) Case Manager
- On‑screen: `/dashboard/disputes` (owner/operator session).
- Demo inputs:
  - Open the reported case from the Inbox
  - Click “Add counter evidence”
  - Note: Counter‑evidence: Ownership proof and context
  - Evidence files: upload example file (e.g., counter-evidence.png)
  - Click “Submit”
  - Reopen the case and click the response transaction to view the counter submission
  - Click “View on Story” to open the IP asset page and confirm the dispute number and counter‑evidence hash
  - Click “View in UMA” to open the UMA Oracle page for the dispute
- On‑screen: Show the case timeline updated with the counter evidence and the response transaction details.
- **Voice‑over 10:** Navigate as the IP owner to the Case Manager page, open the reported case, add counter evidence by entering a brief note and uploading an example file, submit it, then reopen the case and click the response transaction; use “View on Story” to confirm the dispute number and counter‑evidence hash on the IP page, and “View in UMA” to jump to the UMA Oracle entry; liveness and resolution status remain visible throughout.

## 11) Compliance and audit
- On‑screen: `/dashboard/compliance`.
- Demo inputs: No input fields on this page.
- **Voice‑over 11:** On the Compliance page, a searchable audit ledger lists principals, resource IDs, and payload JSON for registrations, invoices, settlements, and disputes.

## 12) Settings
- On‑screen: `/dashboard/settings`.
- Demo inputs: No input fields to type for this demo.
- **Voice‑over 12:** On the Settings page, see the current Internet Identity principal and role; operators can manage team roles.

## 13) Gallery and marketplace
- On‑screen: `/gallery` then `/marketplace`.
- Demo inputs: No input fields on these pages.
- **Voice‑over 13:** On the Gallery and Marketplace pages, the gallery surfaces registered media and attribution; the marketplace highlights price and royalty splits with direct Story links so buyers can initiate orders.

## 14) How creators earn
- On‑screen: Show an IP’s royalty and minting settings (from IP detail cards and Licenses order builder).
- **Voice‑over 14:** From the IP details and Licenses builder, revenue comes from per‑license minting and ongoing royalties encoded in PIL terms; disputes can require bonds and upheld claims reflect across licensing flows.

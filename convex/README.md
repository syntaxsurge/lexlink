# Convex Backend (LexLink)

LexLink uses Convex to mirror Story/ICP/Constellation state for fast dashboard
queries. The schema defines two tables:

- `ips` – catalog of registered IP assets keyed by `ipId`.
- `licenses` – license orders with Bitcoin settlement metadata.

Functions:

- `ipAssets.ts`
  - `list` – fetch all IP assets (newest first).
  - `getById` – fetch a single IP asset by `ipId`.
  - `insert` – insert a new IP asset record after Story registration.
- `licenses.ts`
  - `list` – fetch all license orders.
  - `get` – fetch a license order by `orderId`.
  - `insert` – insert a pending order with an allocated BTC address.
  - `markCompleted` – update a license with the BTC txid, attestation hash,
    Constellation transaction hash, and minted Story token ID.

The Next.js server actions call these functions via `ConvexHttpClient`; no code
generation is required.

export const dynamic = 'force-static'

export default function PilPage() {
  return (
    <main className="prose prose-neutral max-w-3xl px-6 py-12 dark:prose-invert">
      <h1>LexLink Programmable IP License (PIL) Terms</h1>
      <p>
        This page provides a human‑readable reference URI for the Programmable
        IP License (PIL) terms attached to IP Assets registered via LexLink on
        Story Protocol Aeneid. The binding on‑chain parameters are encoded in
        the attached license terms and the referenced license template contract.
        In any mismatch between this page and the chain state, the chain state
        controls.
      </p>

      <h2>Template</h2>
      <ul>
        <li>
          License Template: Story PIL (<a
            href="https://docs.story.foundation/concepts/programmable-ip-license/overview"
            target="_blank"
          >
            overview
          </a>
          )
        </li>
        <li>
          Template Contract (Aeneid):
          0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316
        </li>
      </ul>

      <h2>Parameters (as used by LexLink defaults)</h2>
      <ul>
        <li>Transferable: true</li>
        <li>Commercial Use: true</li>
        <li>Commercial Attribution: true (attribution to licensor required)</li>
        <li>Derivatives Allowed: true</li>
        <li>Derivatives Attribution: true</li>
        <li>Derivatives Approval: false</li>
        <li>Derivatives Reciprocal: false</li>
        <li>Minting Fee: 0 (handled off‑chain via BTC escrow)</li>
        <li>Expiration: 0 (no expiration)</li>
        <li>
          Royalty Currency: WIP (Aeneid testnet). Payments and royalties are
          routed on Story’s Royalty Module and reflected in IP Royalty Vaults.
        </li>
        <li>
          Commercial Revenue Share (%): defined per IP on‑chain via
          <code>commercialRevShare</code>. LexLink sets this according to the
          creator’s chosen percentage at registration time.
        </li>
      </ul>

      <h2>Attribution</h2>
      <p>
        Licensees must provide reasonable attribution to the licensor (IP Asset
        owner) in any public use or distribution of the licensed work or its
        derivatives. Acceptable forms include a link to the IP Asset’s explorer
        page or the licensor’s preferred credit string.
      </p>

      <h2>Scope &amp; Restrictions</h2>
      <ul>
        <li>
          Any derivative IP registered on Story must honor inherited terms from
          the parent IP(s).
        </li>
        <li>
          Royalty obligations for commercial uses of derivatives are determined
          by the on‑chain license terms and the selected royalty policy.
        </li>
        <li>
          Existing third‑party rights are not waived by this license; the
          licensee is responsible for complying with applicable laws.
        </li>
      </ul>

      <h2>Evidence &amp; Disputes</h2>
      <ul>
        <li>
          Payments and license issuance events may be attested off‑chain and
          anchored to Constellation IntegrationNet for auditability.
        </li>
        <li>
          Disputes may be raised on Story via the Dispute Module (UMA
          Arbitration Policy). Tags applied through successful disputes can
          restrict minting, linking, and royalty claims.
        </li>
      </ul>

      <h2>Precedence</h2>
      <p>
        This summary is informative. The authoritative state is the on‑chain
        license template and the encoded terms (including
        <code>commercialRevShare</code>, currency, and any LicensingConfig
        overrides). For exact values, inspect the IP Asset on the Aeneid
        explorer.
      </p>

      <h2>Version</h2>
      <p>
        Document: LexLink PIL Summary v1.0 • Network: Aeneid Testnet • Last
        updated: 2025‑01‑01
      </p>
    </main>
  )
}


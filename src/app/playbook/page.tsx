export const dynamic = 'force-static'

export default function PlaybookPage() {
  return (
    <main className='prose prose-neutral max-w-3xl px-6 py-12 dark:prose-invert'>
      <h1>LexLink Playbook</h1>
      <p>
        This playbook summarizes the architecture, conventions, and flows that
        drive LexLink across Story Protocol, ICP (Bitcoin escrow), and
        Constellation IntegrationNet. It mirrors the in‑repo README and build
        comments and will stay focused on actionable details.
      </p>

      <h2>Architecture</h2>
      <ul>
        <li>Frontend: Next.js App Router, shadcn/ui, Convex</li>
        <li>Story: Aeneid testnet, SPG workflows, PIL terms</li>
        <li>ICP: Motoko canister derives P2WPKH tBTC addresses, verifies UTXOs, emits attestations</li>
        <li>Constellation: IntegrationNet heartbeat on license completion</li>
      </ul>

      <h2>Core Flows</h2>
      <ol>
        <li>Register IP → SPG mints NFT + registers IP + attaches license terms</li>
        <li>Create license order → ICP canister returns a tBTC deposit address</li>
        <li>Buyer pays BTC → canister verifies → Story mints License Token</li>
        <li>Evidence hash logged to Constellation for auditability</li>
        <li>Optional: raise UMA dispute; sync status in dashboard</li>
      </ol>

      <h2>Developer Commands</h2>
      <pre>
{`pnpm dev            # start Next.js
pnpm spg:create     # create an SPG collection; copy address to env
pnpm convex:dev     # start local Convex (optional)

# ICP canister (playground)
cd icp && dfx deploy --playground btc_escrow
dfx canister id btc_escrow --playground`}
      </pre>

      <h2>References</h2>
      <ul>
        <li><a href='https://docs.story.foundation' target='_blank'>Story Protocol Docs</a></li>
        <li><a href='https://internetcomputer.org/docs/current/references/bitcoin-integration' target='_blank'>ICP Bitcoin Integration</a></li>
        <li><a href='https://docs.constellationnetwork.io' target='_blank'>Constellation Docs</a></li>
      </ul>
    </main>
  )
}


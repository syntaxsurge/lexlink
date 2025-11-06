import { createHash } from 'node:crypto'

import { dag4 } from '@stardust-collective/dag4'

import { env } from '@/lib/env'

export const runtime = 'nodejs'

export type ConstellationNetwork = 'integrationnet' | 'testnet' | 'mainnet'

type ConstellationConfig = {
  beUrl: string
  l0Url: string
  l1Url: string
  explorerUrl: string
}

const CONSTELLATION_EXPLORERS: Record<ConstellationNetwork, string> = {
  integrationnet: 'https://integrationnet.dagexplorer.io',
  testnet: 'https://explorer.testnet.constellationnetwork.io',
  mainnet: 'https://explorer.mainnet.constellationnetwork.io'
}

const MIN_SEND_AMOUNT = 1e-8
const POLL_INTERVAL_MS = 1500
const FINALITY_TIMEOUT_MS = 120_000

export type EvidenceResult =
  | { status: 'disabled'; reason: string }
  | { status: 'skipped'; reason: string }
  | { status: 'ok'; txHash: string; explorerUrl: string }
  | { status: 'error'; message: string }

function resolveConfig(): ConstellationConfig {
  const network = env.CONSTELLATION_NETWORK as ConstellationNetwork
  const explorerUrl = CONSTELLATION_EXPLORERS[network]
  return {
    beUrl: env.CONSTELLATION_BE_URL,
    l0Url: env.CONSTELLATION_L0_URL,
    l1Url: env.CONSTELLATION_L1_URL,
    explorerUrl
  }
}

function serializeEvidence(evidence: unknown): {
  orderId?: string
  payload: string
} {
  if (typeof evidence === 'string') {
    return { payload: evidence.trim() }
  }
  if (!evidence) {
    return { payload: '' }
  }
  if (typeof evidence === 'object') {
    const orderId =
      'orderId' in evidence && typeof (evidence as any).orderId === 'string'
        ? (evidence as any).orderId
        : undefined
    return { orderId, payload: JSON.stringify(evidence) }
  }
  return { payload: String(evidence) }
}

async function encodeMemo(
  payload: string,
  orderId: string | undefined,
  maxBytes: number
): Promise<string> {
  if (!payload || !payload.trim()) {
    return ''
  }
  const initial = payload.trim()
  if (Buffer.byteLength(initial, 'utf8') <= maxBytes) {
    return initial
  }

  const { brotliCompressSync, constants } = await import('node:zlib')
  const compressed = brotliCompressSync(Buffer.from(initial, 'utf8'), {
    params: { [constants.BROTLI_PARAM_QUALITY]: 4 }
  })
  const brotliPayload = `br:${compressed.toString('base64url')}`
  if (Buffer.byteLength(brotliPayload, 'utf8') <= maxBytes) {
    return brotliPayload
  }

  const digest = createHash('sha256').update(initial).digest('hex')
  const prefix = orderId ? `lexlink:${orderId}` : 'lexlink'
  return `${prefix}:${digest.slice(0, 16)}`
}

async function waitForFinality(txHash: string) {
  const deadline = Date.now() + FINALITY_TIMEOUT_MS
  while (Date.now() < deadline) {
    try {
      const pending = await dag4.network.getPendingTransaction(txHash)
      if (!pending) {
        const confirmed = await dag4.network.getTransaction(txHash)
        if (confirmed) {
          return confirmed
        }
      }
    } catch {
      // Swallow polling errors; retry until timeout.
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  return null
}

export async function publishEvidence(
  evidence: unknown
): Promise<EvidenceResult> {
  if (!env.CONSTELLATION_ENABLED) {
    return { status: 'disabled', reason: 'constellation_disabled' }
  }

  const sinkAddress = env.CONSTELLATION_SINK_ADDRESS
  const sourceAddress = env.CONSTELLATION_ADDRESS
  const privateKey = env.CONSTELLATION_PRIVATE_KEY

  if (!sinkAddress || !sourceAddress || !privateKey) {
    return { status: 'skipped', reason: 'missing_configuration' }
  }

  if (sinkAddress === sourceAddress) {
    console.warn(
      '[Constellation] Skipping: sink address matches source address.'
    )
    return { status: 'skipped', reason: 'sink_equals_source' }
  }

  const config = resolveConfig()
  const { orderId, payload } = serializeEvidence(evidence)
  const memoMax = env.CONSTELLATION_MEMO_MAX ?? 512
  const memo = await encodeMemo(payload, orderId, memoMax)

  if (!memo) {
    return { status: 'skipped', reason: 'empty_payload' }
  }

  const sendAmount = env.CONSTELLATION_TX_AMOUNT_DAG ?? 0.00000002
  if (!(sendAmount > MIN_SEND_AMOUNT)) {
    return {
      status: 'error',
      message: 'CONSTELLATION_TX_AMOUNT_DAG must be greater than 1e-8'
    }
  }

  dag4.network.config({
    id: env.CONSTELLATION_NETWORK,
    beUrl: config.beUrl,
    l0Url: config.l0Url,
    l1Url: config.l1Url,
    networkVersion: '2.0'
  })
  dag4.account.connect(
    {
      networkVersion: '2.0',
      beUrl: config.beUrl,
      l0Url: config.l0Url,
      l1Url: config.l1Url
    },
    env.CONSTELLATION_NETWORK !== 'mainnet'
  )

  dag4.account.loginPrivateKey(privateKey.replace(/^0x/, ''))

  const derivedSource = dag4.account.address
  if (derivedSource !== sourceAddress) {
    console.warn(
      `[Constellation] Address mismatch. Derived ${derivedSource}, expected ${sourceAddress}.`
    )
  }

  try {
    const memoBytes = Buffer.byteLength(memo, 'utf8')
    console.log(
      `[Constellation] Sending memo to ${sinkAddress} (${memoBytes} bytes)...`
    )
    const lastRef =
      await dag4.network.getAddressLastAcceptedTransactionRef(derivedSource)
    const { transaction, hash } =
      await dag4.account.generateSignedTransactionWithHash(
        sinkAddress,
        sendAmount,
        0,
        lastRef
      )

    const payloadWithMemo = {
      ...transaction,
      data: memo
    }

    await dag4.network.postTransaction(payloadWithMemo as any, { data: memo })

    const confirmed = await waitForFinality(hash)
    if (!confirmed) {
      return {
        status: 'error',
        message: `Timed out waiting for DAG transaction ${hash} to finalize`
      }
    }

    const explorerUrl = `${config.explorerUrl}/transactions/${hash}`
    console.log(`[Constellation] ✅ Evidence anchored: ${hash}`)
    return { status: 'ok', txHash: hash, explorerUrl }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? 'unknown_error')
    console.error('[Constellation] ❌ Publishing failed:', error)
    if (message.toLowerCase().includes('nonce')) {
      console.error(
        '[Constellation] Nonce error encountered when anchoring evidence.'
      )
    }
    return { status: 'error', message }
  }
}

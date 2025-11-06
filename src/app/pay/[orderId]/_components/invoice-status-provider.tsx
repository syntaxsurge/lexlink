'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

export type InvoiceSnapshot = {
  orderId: string
  ipId: string
  ipTitle: string
  amountSats?: number
  btcAddress: string
  buyer?: string
  buyerPrincipal?: string | null
  mintTo?: string | null
  status: string
  ckbtcSubaccount?: string
  ckbtcMintedSats?: number
  ckbtcBlockIndex?: number
  btcTxId?: string
  attestationHash?: string
  constellationTx?: string
  constellationExplorerUrl?: string | null
  constellationAnchoredAt?: number | null
  constellationStatus?: string | null
  constellationError?: string | null
  tokenOnChainId?: string
  licenseTermsId?: string
  createdAt: number
  updatedAt?: number
  network?: string
  fundedAt?: number
  finalizedAt?: number
  c2paArchiveUri?: string | null
  c2paArchiveFileName?: string | null
  c2paArchiveSize?: number | null
  c2paArchiveUrl?: string | null
  vcHash?: string
  complianceScore?: number
}

type InvoiceStatusContextValue = {
  invoice: InvoiceSnapshot
  refresh: () => Promise<InvoiceSnapshot | null>
  pollFinalization: () => Promise<InvoiceSnapshot | null>
  isRefreshing: boolean
  isFinalizing: boolean
}

const InvoiceStatusContext = createContext<InvoiceStatusContextValue | null>(
  null
)

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function InvoiceStatusProvider({
  orderId,
  initialInvoice,
  children
}: {
  orderId: string
  initialInvoice: InvoiceSnapshot
  children: ReactNode
}) {
  const [invoice, setInvoice] = useState<InvoiceSnapshot>(initialInvoice)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const pollTimer = useRef<NodeJS.Timeout | null>(null)

  const fetchInvoice = useCallback(async () => {
    const response = await fetch(`/api/orders/${orderId}`, {
      cache: 'no-store'
    })
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const message = await response
        .json()
        .catch(() => ({ error: 'Failed to load invoice' }))
      throw new Error(
        typeof message?.error === 'string'
          ? message.error
          : 'Failed to load invoice'
      )
    }
    const data = (await response.json()) as InvoiceSnapshot
    return data
  }, [orderId])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const snapshot = await fetchInvoice()
      if (snapshot) {
        setInvoice(snapshot)
      }
      return snapshot
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchInvoice])

  const pollFinalization = useCallback(async () => {
    if (isFinalizing) {
      return invoice
    }
    setIsFinalizing(true)
    try {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await fetch(`/api/orders/${orderId}/refresh`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          cache: 'no-store'
        })
        const payload = (await response.json().catch(() => ({}))) as {
          status: string
          [key: string]: unknown
        }
        if (!response.ok) {
          await sleep(4000)
          continue
        }
        if (payload.status === 'finalized') {
          return await refresh()
        }
        await sleep(4000)
      }
      return await refresh()
    } finally {
      setIsFinalizing(false)
    }
  }, [orderId, refresh, isFinalizing, invoice])

  useEffect(() => {
    if (invoice.status === 'finalized') {
      if (pollTimer.current) {
        clearInterval(pollTimer.current)
        pollTimer.current = null
      }
      return
    }
    if (pollTimer.current) {
      return
    }
    pollTimer.current = setInterval(() => {
      void refresh().catch(() => {
        // Ignore polling errors; next tick will retry.
      })
    }, 6000)
    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current)
        pollTimer.current = null
      }
    }
  }, [invoice.status, refresh])

  const value = useMemo(
    () => ({
      invoice,
      refresh,
      pollFinalization,
      isRefreshing,
      isFinalizing
    }),
    [invoice, refresh, pollFinalization, isRefreshing, isFinalizing]
  )

  return (
    <InvoiceStatusContext.Provider value={value}>
      {children}
    </InvoiceStatusContext.Provider>
  )
}

export function useInvoiceStatus() {
  const context = useContext(InvoiceStatusContext)
  if (!context) {
    throw new Error(
      'useInvoiceStatus must be used within an InvoiceStatusProvider'
    )
  }
  return context
}

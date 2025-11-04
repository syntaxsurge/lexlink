import { SiweMessage } from 'siwe'

import { env } from '@/lib/env'

type VerifyArgs = {
  message: string
  signature: string
}

export async function verifySiwe({ message, signature }: VerifyArgs) {
  let siweMessage: SiweMessage

  try {
    siweMessage = new SiweMessage(message)
  } catch {
    const parsed = JSON.parse(message) as Record<string, unknown>
    siweMessage = new SiweMessage(parsed)
  }
  const { success } = await siweMessage.verify({
    domain: env.NEXT_PUBLIC_SITE_DOMAIN,
    signature,
    nonce: siweMessage.nonce
  })

  if (!success) {
    return null
  }

  return {
    address: siweMessage.address.toLowerCase() as `0x${string}`,
    chainId: Number(siweMessage.chainId)
  }
}

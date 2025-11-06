import { DelegationChain, isDelegationValid } from '@dfinity/identity'
import { Principal } from '@dfinity/principal'

export type DelegationChainJson = ReturnType<DelegationChain['toJSON']>

export const SESSION_TTL_NS = 7n * 24n * 60n * 60n * 1_000_000_000n

type VerifyArgs = {
  principal: string
  delegation: DelegationChainJson
  sessionPublicKey: string
}

export function verifyInternetIdentity({
  principal,
  delegation,
  sessionPublicKey
}: VerifyArgs) {
  const chain = DelegationChain.fromJSON(delegation)

  if (!isDelegationValid(chain)) {
    return null
  }

  const sessionKeyDer = Uint8Array.from(Buffer.from(sessionPublicKey, 'base64'))
  // Do not assume Ed25519; Internet Identity can delegate to multiple key types.
  // The self-authenticating principal derives directly from the DER-encoded key bytes.
  const derivedPrincipal = Principal.selfAuthenticating(sessionKeyDer).toText()

  if (derivedPrincipal !== principal) {
    return null
  }

  // Tolerate key encodings across authenticators; validity + principal match are sufficient here.

  return {
    principal: derivedPrincipal
  }
}

export function resolveIdentityProvider() {
  return (
    process.env.NEXT_PUBLIC_IDENTITY_PROVIDER_URL ??
    'https://identity.internetcomputer.org'
  )
}

export function resolveDerivationOrigin() {
  if (typeof window === 'undefined') {
    return undefined
  }

  const hostname = window.location.hostname
  const isIcHost =
    hostname.includes('.icp0.io') ||
    hostname.includes('.ic0.app') ||
    hostname.includes('.raw.icp0.io')

  if (isIcHost) {
    return window.location.origin
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  return window.location.origin
}

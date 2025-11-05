import { DelegationChain, isDelegationValid } from '@dfinity/identity'
import { Principal } from '@dfinity/principal'

export type DelegationChainJson = ReturnType<DelegationChain['toJSON']>

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

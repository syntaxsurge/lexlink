import {
  DelegationChain,
  Ed25519PublicKey,
  isDelegationValid
} from '@dfinity/identity'
import { Principal } from '@dfinity/principal'

export type DelegationChainJson = ReturnType<DelegationChain['toJSON']>

type VerifyArgs = {
  principal: string
  delegation: DelegationChainJson
  sessionPublicKey: string
}

function buffersEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
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
  const sessionKey = Ed25519PublicKey.fromDer(sessionKeyDer)
  const derivedPrincipal = Principal.selfAuthenticating(
    sessionKey.toDer()
  ).toText()

  if (derivedPrincipal !== principal) {
    return null
  }

  const tail = chain.delegations.at(-1)
  if (!tail || !buffersEqual(tail.delegation.pubkey, sessionKey.toDer())) {
    return null
  }

  return {
    principal: derivedPrincipal
  }
}

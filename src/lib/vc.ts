import { signAsync } from '@noble/ed25519'

import { env } from '@/lib/env'
import { bufferFromHex, sha256Hex } from '@/lib/hash'

type LicenseCredentialInput = {
  subjectId: string
  storyLicenseId: string
  btcTxId: string
  constellationTx: string
  contentHash: string
  attestationHash: string
}

export type LicenseCredential = {
  document: Record<string, unknown>
  hash: `0x${string}`
}

export async function generateLicenseCredential(
  input: LicenseCredentialInput
): Promise<LicenseCredential> {
  const issuanceDate = new Date().toISOString()
  const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'LexLinkLicenseCredential'],
    issuer: env.VC_ISSUER_DID,
    issuanceDate,
    credentialSubject: {
      id: input.subjectId,
      storyLicenseId: input.storyLicenseId,
      btcTxId: input.btcTxId,
      constellationTx: input.constellationTx,
      contentHash: input.contentHash,
      attestationHash: input.attestationHash
    }
  }

  const payload = new TextEncoder().encode(JSON.stringify(credential))
  const privateKey = bufferFromHex(env.VC_PRIVATE_KEY)
  if (privateKey.length !== 32) {
    throw new Error('VC_PRIVATE_KEY must be 32 bytes')
  }

  const signature = await signAsync(payload, privateKey)
  const proofValue = Buffer.from(signature).toString('base64url')

  const proof = {
    type: 'Ed25519Signature2020',
    created: issuanceDate,
    proofPurpose: 'assertionMethod',
    verificationMethod: `${env.VC_ISSUER_DID}#keys-1`,
    proofValue
  }

  const document = {
    ...credential,
    proof
  }

  return {
    document,
    hash: sha256Hex(JSON.stringify(document))
  }
}

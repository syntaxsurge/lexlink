import path from 'node:path'

import JSZip from 'jszip'

import { sha256Hex } from '@/lib/hash'

type C2paArchiveInput = {
  assetBuffer: Buffer
  assetFileName: string
  storyLicenseId: string
  btcTxId: string
  constellationTx: string
  attestationHash: string
  contentHash: string
  licenseTokenId: string
}

export type C2paArchive = {
  archiveBase64: string
  archiveHash: `0x${string}`
  manifest: Record<string, unknown>
  suggestedFileName: string
}

export async function createLicenseArchive({
  assetBuffer,
  assetFileName,
  storyLicenseId,
  btcTxId,
  constellationTx,
  attestationHash,
  contentHash,
  licenseTokenId
}: C2paArchiveInput): Promise<C2paArchive> {
  const manifest = {
    '@context': [
      'https://schema.org',
      'https://specification.contentauthenticity.org/contexts/C2PA_manifest_context.json'
    ],
    type: ['CreativeWork', 'DigitalDocument'],
    claimGenerator: 'LexLink Attestation Service',
    claimDescription:
      'This work is licensed through LexLink with verifiable Bitcoin settlement, Story Protocol license token, and Constellation timestamp evidence.',
    assertions: [
      {
        label: 'org.lexlink.license',
        data: {
          storyLicenseId,
          licenseTokenId,
          btcTxId,
          constellationTx,
          attestationHash,
          contentHash
        }
      }
    ],
    producedWith: {
      agent: 'LexLink 1.0',
      homePage: 'https://lexlink.app'
    }
  }

  const archive = new JSZip()
  archive.file('manifest.c2pa.json', JSON.stringify(manifest, null, 2), {
    createFolders: false
  })
  archive.file(path.basename(assetFileName), assetBuffer, {
    binary: true,
    createFolders: false
  })

  const archiveBuffer = await archive.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  })

  return {
    archiveBase64: archiveBuffer.toString('base64'),
    archiveHash: sha256Hex(archiveBuffer),
    manifest,
    suggestedFileName: `lexlink-license-${Date.now()}.zip`
  }
}

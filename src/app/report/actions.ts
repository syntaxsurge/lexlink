'use server'

import { revalidatePath } from 'next/cache'

import { DisputeTargetTag } from '@story-protocol/core-sdk'

import { raiseDispute } from '@/app/dashboard/actions'
import { createDisputeEvidenceBundle } from '@/lib/disputes'

type SubmitDisputeResult =
  | {
      ok: true
      disputeId: string
      txHash: string
      evidenceCid: string
      evidenceUri: string
      ipId: string
    }
  | {
      ok: false
      error: string
    }

const VALID_TAGS = new Set(Object.values(DisputeTargetTag) as readonly string[])

export async function submitDisputeAction(
  formData: FormData
): Promise<SubmitDisputeResult> {
  try {
    const ipId = String(formData.get('ipId') ?? '').trim()
    const tagValue = String(formData.get('tag') ?? '').trim()
    const note = (formData.get('note') as string | null) ?? null
    const url = (formData.get('url') as string | null) ?? null
    const files = formData
      .getAll('files')
      .filter((value): value is File => value instanceof File)

    if (!ipId || !/^0x[0-9a-fA-F]{40}$/.test(ipId)) {
      return { ok: false, error: 'Provide a valid IP asset ID.' }
    }

    if (!VALID_TAGS.has(tagValue)) {
      return {
        ok: false,
        error: 'Select a valid dispute tag.'
      }
    }

    const bundle = await createDisputeEvidenceBundle({
      files,
      url,
      note
    })
    const evidenceCid = bundle.bundleCid

    const response = await raiseDispute({
      ipId,
      targetTag: tagValue as DisputeTargetTag,
      evidenceCid,
      evidenceUri: bundle.bundleUri,
      evidenceNote: bundle.note ?? null,
      evidenceAttachments: bundle.attachments
    })

    revalidatePath('/dashboard/disputes')
    revalidatePath('/dashboard')

    return {
      ok: true,
      disputeId: response.disputeId,
      txHash: response.txHash,
      evidenceCid,
      evidenceUri: bundle.bundleUri,
      ipId
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected dispute error.'
    return {
      ok: false,
      error: message
    }
  }
}

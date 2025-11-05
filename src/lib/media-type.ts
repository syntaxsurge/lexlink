export async function detectMimeFromUrl(url: string) {
  const response = await fetch('/api/mime', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ url })
  })

  if (!response.ok) {
    return 'application/octet-stream'
  }

  const data = (await response.json()) as { mime?: string }
  if (data?.mime && typeof data.mime === 'string') {
    return data.mime
  }

  return 'application/octet-stream'
}

'use client'

import { useState } from 'react'

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${window.location.origin}${path}`
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}

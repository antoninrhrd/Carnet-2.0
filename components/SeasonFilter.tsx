'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SAISONS } from '@/lib/constants'

export default function SeasonFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('saison') || ''

  function setSaison(s: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (s === current) {
      params.delete('saison')
    } else {
      params.set('saison', s)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="season-filter">
      {SAISONS.map(s => (
        <button
          key={s}
          className={`season-btn${current === s ? ' active' : ''}`}
          onClick={() => setSaison(s)}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

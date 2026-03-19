import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://antonin-sigma.vercel.app/recettes', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const html = await res.text()

    // Extract all recipe hrefs
    const linkRegex = /href="\/recettes\/([^"]+)"/g
    const slugs = new Set<string>()
    let match

    while ((match = linkRegex.exec(html)) !== null) {
      const slug = match[1]
      if (slug !== 'new' && !slug.includes('/modifier') && !slug.includes('/recettes')) {
        slugs.add(decodeURIComponent(slug))
      }
    }

    return NextResponse.json({ slugs: Array.from(slugs) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


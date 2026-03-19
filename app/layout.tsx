import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'
import { createServerClient } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Mes Fiches',
  description: 'Mon carnet de recettes, plats et fiches produits',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data } = await supabase.from('fiches').select('type, categorie')

  const counts: Record<string, number> = {}
  for (const row of data || []) {
    const key = `${row.type}_${row.categorie}`
    counts[key] = (counts[key] || 0) + 1
  }

  return (
    <html lang="fr">
      <body>
        <ClientLayout counts={counts}>{children}</ClientLayout>
      </body>
    </html>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LINHAS_RJ } from '@/lib/linhas'
import Navbar from '@/components/Navbar'

export default function LinhasPage() {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [minhasLinhas, setMinhasLinhas] = useState<{linha: string, count: number}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data } = await supabase
        .from('viagens')
        .select('linha')
        .eq('user_id', user.id)
      if (data) {
        const freq: Record<string, number> = {}
        for (const v of data) freq[v.linha] = (freq[v.linha] || 0) + 1
        const sorted = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .map(([linha, count]) => ({ linha, count }))
        setMinhasLinhas(sorted)
      }
      setLoading(false)
    })
  }, [])

  const resultados = search.length > 1
    ? LINHAS_RJ.filter(l => l.toLowerCase().includes(search.toLowerCase())).slice(0, 30)
    : []

  const slug = (linha: string) => encodeURIComponent(linha)

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#e8eaf2' }}>Linhas</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7394' }}>Rastreie ônibus em tempo real no mapa</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input
            className="input pl-10 text-base py-3.5"
            placeholder="Pesquisar qualquer linha do Rio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#4a5068' }}>🔍</span>
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg"
              style={{ color: '#4a5068' }}>×</button>
          )}
        </div>

        {/* Resultados de busca */}
        {search.length > 1 && (
          <div className="mb-6">
            {resultados.length === 0
              ? <div className="text-sm" style={{ color: '#6b7394' }}>Nenhuma linha encontrada</div>
              : (
                <div className="card overflow-hidden">
                  {resultados.map((l, i) => {
                    const usada = minhasLinhas.find(m => m.linha === l)
                    return (
                      <button key={l} onClick={() => router.push(`/linhas/${slug(l)}`)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors"
                        style={{ borderBottom: i < resultados.length - 1 ? '1px solid #1e2235' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1c2030')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span className="text-xl">🚌</span>
                        <span className="flex-1 text-sm font-medium" style={{ color: '#e8eaf2' }}>{l}</span>
                        {usada && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,59,59,0.1)', color: '#ff6b6b' }}>
                            {usada.count}x
                          </span>
                        )}
                        <span style={{ color: '#4a5068' }}>→</span>
                      </button>
                    )
                  })}
                </div>
              )
            }
          </div>
        )}

        {/* Minhas linhas */}
        {!search && (
          <>
            <div className="section-label">Suas linhas mais usadas</div>
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1,2,3].map(i => <div key={i} className="rounded-xl h-14 animate-pulse" style={{ background: '#14171f' }} />)}
              </div>
            ) : minhasLinhas.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-sm" style={{ color: '#6b7394' }}>Você ainda não tem viagens registradas.</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                {minhasLinhas.slice(0, 15).map((item, i) => (
                  <button key={item.linha} onClick={() => router.push(`/linhas/${slug(item.linha)}`)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors"
                    style={{ borderBottom: i < Math.min(minhasLinhas.length, 15) - 1 ? '1px solid #1e2235' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1c2030')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ background: 'rgba(255,59,59,0.12)', color: '#ff6b6b' }}>
                      {i + 1}
                    </div>
                    <span className="flex-1 text-sm font-medium" style={{ color: '#e8eaf2' }}>{item.linha}</span>
                    <span className="text-xs font-mono" style={{ color: '#6b7394' }}>{item.count}x</span>
                    <span style={{ color: '#4a5068' }}>→</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/lib/types'

const TABS = [
  { label: 'Atividade', icon: '📡', href: '/atividade' },
  { label: 'Nova Viagem', icon: '＋', href: '/nova-viagem' },
  { label: 'Diário', icon: '📓', href: '/diario' },
  { label: 'Linhas', icon: '🗺️', href: '/linhas' },
  { label: 'Notificações', icon: '🔔', href: '/notificacoes' },
  { label: 'Relatórios', icon: '📊', href: '/relatorios' },
  { label: 'Perfil', icon: '👤', href: '/perfil' },
]

export default function Navbar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    if (!searchTerm.trim()) { setSearchResults([]); return }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(5)
      setSearchResults(data || [])
      setShowSearch(true)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  return (
    <div className="sticky top-0 z-50" style={{ background: 'rgba(8,10,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1e2235' }}>
      <div className="max-w-3xl mx-auto px-5">
        {/* Header row */}
        <div className="flex items-center justify-between py-4">
          <button onClick={() => router.push('/atividade')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #ff3b3b, #ff6b3b)' }}>
              🚌
            </div>
            <span className="text-lg font-bold" style={{ color: '#e8eaf2' }}>BusLog</span>
          </button>

          {/* Search */}
          <div className="relative">
            <input
              className="input text-sm py-2 pl-9 w-44 md:w-56"
              placeholder="Buscar busólogo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 150)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#4a5068' }}>🔍</span>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-64 card overflow-hidden shadow-2xl z-50"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                {searchResults.map(p => (
                  <button key={p.id}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors"
                    style={{ borderBottom: '1px solid #1e2235' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1c2030')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onMouseDown={() => { router.push(`/perfil/${p.username}`); setSearchTerm(''); setShowSearch(false) }}>
                    <span className="text-xl w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{ background: '#1c2030' }}>{p.avatar}</span>
                    <div>
                      <div className="font-semibold" style={{ color: '#e8eaf2' }}>{p.display_name}</div>
                      <div className="text-xs" style={{ color: '#6b7394' }}>@{p.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const isActive = pathname === tab.href
            const label = tab.href === '/notificacoes' && unreadCount > 0
              ? `Notificações (${unreadCount})` : tab.label
            return (
              <button key={tab.href} onClick={() => router.push(tab.href)}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm whitespace-nowrap transition-all ${isActive ? 'tab-active' : 'tab-inactive'}`}>
                <span className="text-base">{tab.icon}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

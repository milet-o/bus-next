'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Notificacao } from '@/lib/types'
import Navbar from '@/components/Navbar'

export default function NotificacoesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [notifs, setNotifs] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('notificacoes')
        .select('*, from_profile:from_user_id(id, username, display_name, avatar)')
        .eq('target_user_id', user.id).order('created_at', { ascending: false })
      setNotifs(data || [])
      await supabase.from('notificacoes').update({ read: true }).eq('target_user_id', user.id).eq('read', false)
      setLoading(false)
    })
  }, [])

  const formatDate = (ts: string) => {
    const d = new Date(ts)
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#e8eaf2' }}>Notificações</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7394' }}>{notifs.filter(n => !n.read).length} não lidas</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: '#14171f' }} />)}
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6" style={{ background: '#1c2030' }}>🔔</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#e8eaf2' }}>Tudo limpo</h2>
            <p className="text-sm" style={{ color: '#6b7394' }}>Quando alguém te seguir, vai aparecer aqui.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifs.map(n => {
              const fp = n.from_profile as any
              return (
                <div key={n.id} className="card p-4 flex items-center gap-4 fade-up"
                  style={!n.read ? { borderColor: 'rgba(255,59,59,0.2)', background: 'rgba(255,59,59,0.03)' } : {}}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: !n.read ? '#ff3b3b' : '#2a2f4a' }} />
                  <button onClick={() => router.push(`/perfil/${fp?.username}`)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: '#1c2030' }}>{fp?.avatar || '👤'}</button>
                  <div className="flex-1">
                    <button onClick={() => router.push(`/perfil/${fp?.username}`)}
                      className="font-semibold text-sm hover:underline" style={{ color: '#e8eaf2' }}>
                      {fp?.display_name || fp?.username}
                    </button>
                    <span className="text-sm" style={{ color: '#a0a8c0' }}> começou a te seguir.</span>
                    <div className="text-xs font-mono mt-0.5" style={{ color: '#4a5068' }}>{formatDate(n.created_at)}</div>
                  </div>
                  <button onClick={() => router.push(`/perfil/${fp?.username}`)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ background: '#1c2030', color: '#a0a8c0' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#242840'; e.currentTarget.style.color = '#e8eaf2' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1c2030'; e.currentTarget.style.color = '#a0a8c0' }}>
                    Ver →
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

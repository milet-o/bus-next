'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile, Viagem } from '@/lib/types'
import { agruparViagensFeed } from '@/lib/gamificacao'
import Navbar from '@/components/Navbar'

export default function AtividadePage() {
  const router = useRouter()
  const supabase = createClient()
  const [feedItems, setFeedItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: seguindo } = await supabase.from('social').select('following_id').eq('follower_id', user.id)
      const ids = (seguindo || []).map((s: any) => s.following_id)
      const { count } = await supabase.from('notificacoes').select('*', { count: 'exact', head: true }).eq('target_user_id', user.id).eq('read', false)
      setUnreadCount(count || 0)
      if (!ids.length) { setLoading(false); return }
      const { data: viagens } = await supabase.from('viagens').select('*, profiles(*)').in('user_id', ids).order('data', { ascending: false }).order('hora', { ascending: false }).limit(200)
      const items = agruparViagensFeed(viagens || [])
      const enriched = items.map(item => ({ ...item, perfil: (viagens || []).find((v: any) => v.user_id === item.usuario)?.profiles }))
      setFeedItems(enriched)
      setLoading(false)
    })
  }, [])

  const formatTime = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`

  return (
    <div className="min-h-screen">
      <Navbar unreadCount={unreadCount} />
      <div className="max-w-3xl mx-auto px-5 py-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse" style={{ background: '#14171f' }} />)}
          </div>
        ) : feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6"
              style={{ background: '#1c2030' }}>🚏</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#e8eaf2' }}>Feed vazio</h2>
            <p className="text-sm mb-6" style={{ color: '#6b7394' }}>Siga amigos para ver as viagens deles aqui!</p>
            <button onClick={() => router.push('/perfil')} className="btn-primary w-auto px-8">Ver perfis</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {feedItems.map((item, idx) => (
              <div key={idx} className="card p-4 fade-up" style={{ animationDelay: `${idx * 30}ms` }}>
                <div className="flex items-center gap-3 mb-3">
                  <button onClick={() => router.push(`/perfil/${item.perfil?.username}`)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: '#1c2030' }}>{item.perfil?.avatar || '👤'}</div>
                    <span className="font-semibold text-sm" style={{ color: '#e8eaf2' }}>{item.perfil?.display_name || item.usuario}</span>
                  </button>
                  <span className="text-xs ml-auto font-mono" style={{ color: '#4a5068' }}>{formatTime(item.datetime_ref)}</span>
                </div>
                {item.viagens.length > 1 ? (
                  <details className="group">
                    <summary className="text-sm cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-xl list-none transition-colors"
                      style={{ background: '#1c2030', color: '#a0a8c0' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#242840')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#1c2030')}>
                      <span className="text-base group-open:rotate-90 transition-transform inline-block" style={{ color: '#4a5068' }}>▶</span>
                      <span>🚌</span>
                      <span>{item.viagens.length} ônibus · Integração</span>
                    </summary>
                    <div className="mt-2 pl-2 flex flex-col gap-1.5">
                      {item.viagens.map((v: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-xs w-10 flex-shrink-0" style={{ color: '#4a5068' }}>{v.hora.slice(0,5)}</span>
                          <span style={{ color: '#e8eaf2' }}>{v.linha}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : (
                  <div className="pl-1">
                    <div className="font-semibold text-sm" style={{ color: '#e8eaf2' }}>{item.viagens[0].linha}</div>
                    {item.viagens[0].obs && <div className="text-xs mt-0.5" style={{ color: '#6b7394' }}>📝 {item.viagens[0].obs}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

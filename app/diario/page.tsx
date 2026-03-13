'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Viagem } from '@/lib/types'
import { MESES_PT } from '@/lib/gamificacao'
import JournalCard from '@/components/JournalCard'
import Navbar from '@/components/Navbar'

type Filtro = 'Tudo' | '7 Dias' | '30 Dias' | 'Este Ano'
const FILTROS: Filtro[] = ['Tudo', '7 Dias', '30 Dias', 'Este Ano']

export default function DiarioPage() {
  const router = useRouter()
  const supabase = createClient()
  const [viagens, setViagens] = useState<Viagem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('Tudo')
  const [limite, setLimite] = useState(30)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('viagens').select('*').eq('user_id', user.id)
        .order('data', { ascending: false }).order('hora', { ascending: false })
      setViagens(data || [])
      setLoading(false)
    })
  }, [])

  const handleDelete = async (id: string) => {
    await supabase.from('viagens').delete().eq('id', id)
    setViagens(prev => prev.filter(v => v.id !== id))
  }

  const filtrarViagens = () => {
    const agora = new Date()
    if (filtro === '7 Dias') { const l = new Date(agora); l.setDate(agora.getDate()-7); return viagens.filter(v => new Date(v.data) >= l) }
    if (filtro === '30 Dias') { const l = new Date(agora); l.setDate(agora.getDate()-30); return viagens.filter(v => new Date(v.data) >= l) }
    if (filtro === 'Este Ano') return viagens.filter(v => new Date(v.data).getFullYear() === agora.getFullYear())
    return viagens
  }

  const viagensFiltradas = filtrarViagens()
  const viagensVisiveis = viagensFiltradas.slice(0, limite)
  const grupos: Record<string, Viagem[]> = {}
  for (const v of viagensVisiveis) {
    const d = new Date(v.data)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(v)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#e8eaf2' }}>Meu Diário</h1>
            <p className="text-sm mt-1" style={{ color: '#6b7394' }}>{viagensFiltradas.length} viagens registradas</p>
          </div>
          <button onClick={() => router.push('/nova-viagem')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #ff3b3b, #ff6b3b)', color: '#fff', boxShadow: '0 4px 16px rgba(255,59,59,0.25)' }}>
            + Nova
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {FILTROS.map(f => (
            <button key={f} onClick={() => { setFiltro(f); setLimite(30) }}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={filtro === f
                ? { background: 'rgba(255,59,59,0.15)', border: '1px solid rgba(255,59,59,0.4)', color: '#ff6b6b' }
                : { background: '#14171f', border: '1px solid #1e2235', color: '#6b7394' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3,4].map(i => <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: '#14171f' }} />)}
          </div>
        ) : viagensFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6" style={{ background: '#1c2030' }}>📓</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#e8eaf2' }}>Nenhuma viagem</h2>
            <p className="text-sm mb-6" style={{ color: '#6b7394' }}>Registre sua primeira viagem!</p>
            <button onClick={() => router.push('/nova-viagem')} className="btn-primary w-auto px-8">Nova Viagem</button>
          </div>
        ) : (
          <>
            {Object.entries(grupos).map(([key, viagensGrupo]) => {
              const [year, month] = key.split('-').map(Number)
              return (
                <div key={key} className="mb-6">
                  <div className="section-label mb-3">{MESES_PT[month]} {year}</div>
                  {viagensGrupo.map(v => <JournalCard key={v.id} viagem={v} showDelete onDelete={handleDelete} />)}
                </div>
              )
            })}
            {viagensFiltradas.length > limite && (
              <button onClick={() => setLimite(prev => prev+30)} className="btn-secondary mt-2">
                Carregar mais ({viagensFiltradas.length - limite} restantes)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

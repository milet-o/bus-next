'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/lib/types'
import { LINHAS_RJ } from '@/lib/linhas'
import Navbar from '@/components/Navbar'

export default function NovaViagemPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const today = new Date()
  const [data, setData] = useState(today.toISOString().split('T')[0])
  const [hora, setHora] = useState('00:00')
  const [linha, setLinha] = useState('')
  const [obs, setObs] = useState('')
  const [linhaSearch, setLinhaSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const linhasFiltradas = linhaSearch.length > 0
    ? LINHAS_RJ.filter(l => l.toLowerCase().includes(linhaSearch.toLowerCase())).slice(0, 25)
    : LINHAS_RJ.slice(0, 25)

  const horas = Array.from({ length: 24 * 4 }, (_, i) => {
    const h = Math.floor(i / 4).toString().padStart(2, '0')
    const m = ((i % 4) * 15).toString().padStart(2, '0')
    return `${h}:${m}`
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linha || !profile) return
    setLoading(true)
    await supabase.from('viagens').insert({ user_id: profile.id, linha, data, hora, obs: obs || null, timestamp: new Date().toISOString() })
    setSuccess(true)
    setLinha(''); setLinhaSearch(''); setObs('')
    setTimeout(() => setSuccess(false), 3000)
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#e8eaf2' }}>Nova Viagem</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7394' }}>Registre sua viagem de ônibus</p>
        </div>

        {success && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 fade-up"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
            <span className="text-lg">✓</span>
            <span className="font-medium text-sm">Viagem salva com sucesso!</span>
          </div>
        )}

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7394' }}>Data</label>
                <input type="date" className="input" value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7394' }}>Hora</label>
                <select className="input" value={hora} onChange={e => setHora(e.target.value)}>
                  {horas.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7394' }}>Linha</label>
              <div className="relative" ref={dropdownRef}>
                <input className="input" placeholder="Buscar linha..."
                  value={linha || linhaSearch}
                  onChange={e => { setLinhaSearch(e.target.value); setLinha(''); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)} />
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl overflow-y-auto max-h-52 shadow-2xl"
                    style={{ background: '#14171f', border: '1px solid #2a2f4a', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                    {linhasFiltradas.length === 0
                      ? <div className="px-4 py-3 text-sm" style={{ color: '#6b7394' }}>Nenhuma linha encontrada</div>
                      : linhasFiltradas.map(l => (
                        <button key={l} type="button"
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                          style={{ color: '#e8eaf2', borderBottom: '1px solid #1e2235' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#1c2030')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          onMouseDown={() => { setLinha(l); setLinhaSearch(''); setShowDropdown(false) }}>
                          {l}
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
              {linha && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.2)' }}>
                  <span style={{ color: '#ff3b3b' }}>✓</span>
                  <span className="text-xs font-medium flex-1" style={{ color: '#e8eaf2' }}>{linha}</span>
                  <button type="button" onClick={() => { setLinha(''); setLinhaSearch('') }} className="text-xs" style={{ color: '#6b7394' }}>trocar</button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7394' }}>
                Observação <span style={{ color: '#4a5068', textTransform: 'none' }}>(opcional · público)</span>
              </label>
              <textarea className="input resize-none" rows={3} maxLength={50} placeholder="Ex: indo pra central..."
                value={obs} onChange={e => setObs(e.target.value)} />
              <div className="text-right text-xs mt-1" style={{ color: '#4a5068' }}>{obs.length}/50</div>
            </div>

            <button type="submit" className="btn-primary mt-1" disabled={loading || !linha}>
              {loading ? 'Salvando...' : 'Salvar Viagem'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

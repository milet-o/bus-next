'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile, Viagem } from '@/lib/types'
import Navbar from '@/components/Navbar'

const PERIODOS = [
  { label: 'Últimos 7 dias', value: 7 },
  { label: 'Últimos 30 dias', value: 30 },
  { label: 'Últimos 180 dias', value: 180 },
  { label: 'Último ano', value: 365 },
]
const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function RelatoriosPage() {
  const router = useRouter()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [viagens, setViagens] = useState<Viagem[]>([])
  const [periodo, setPeriodo] = useState(180)
  const [loading, setLoading] = useState(false)
  const [cardUrl, setCardUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data } = await supabase.from('viagens').select('*').eq('user_id', user.id).order('data', { ascending: false })
      setViagens(data || [])
    })
  }, [])

  const gerarCard = () => {
    if (!profile || !canvasRef.current) return
    setLoading(true)
    const dataLimite = new Date(); dataLimite.setDate(dataLimite.getDate() - periodo)
    const vf = viagens.filter(v => new Date(v.data) >= dataLimite)
    if (!vf.length) { setLoading(false); return }

    const topLinhas: Record<string, number> = {}
    const porDia: Record<string, number> = { Dom:0,Seg:0,Ter:0,Qua:0,Qui:0,Sex:0,'Sáb':0 }
    for (const v of vf) {
      topLinhas[v.linha] = (topLinhas[v.linha] || 0) + 1
      porDia[DIAS_PT[new Date(v.data).getDay()]]++
    }
    const linhasSorted = Object.entries(topLinhas).sort((a, b) => b[1]-a[1]).slice(0, 5)
    const maxDia = Math.max(...Object.values(porDia))

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = 800; canvas.height = 800

    // Fundo
    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, 800, 800)
    ctx.strokeStyle = '#2a2f4a'; ctx.lineWidth = 2
    ctx.strokeRect(1, 1, 798, 798)

    // Header
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px system-ui, sans-serif'
    ctx.fillText('buslog.app', 48, 68)
    ctx.fillStyle = '#6b7394'; ctx.font = '15px system-ui, sans-serif'
    ctx.fillText(`@${profile.username} · Últimos ${periodo} dias`, 48, 96)
    ctx.strokeStyle = '#1e2235'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(48, 116); ctx.lineTo(752, 116); ctx.stroke()

    // Total
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 88px system-ui, sans-serif'
    ctx.fillText(String(vf.length), 48, 236)
    ctx.fillStyle = '#6b7394'; ctx.font = '13px system-ui, sans-serif'
    ctx.fillText('VIAGENS NO PERÍODO', 48, 262)

    // Top linhas
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 17px system-ui, sans-serif'
    ctx.fillText('TOP LINHAS', 48, 312)
    let y = 344; ctx.font = '14px system-ui, sans-serif'
    for (const [linha, count] of linhasSorted) {
      const truncated = linha.length > 36 ? linha.slice(0, 36) + '…' : linha
      ctx.fillStyle = '#e8eaf2'; ctx.fillText(truncated, 48, y)
      ctx.fillStyle = '#6b7394'; ctx.font = 'bold 14px system-ui, sans-serif'
      ctx.fillText(`${count}x`, 705, y)
      ctx.font = '14px system-ui, sans-serif'; y += 30
    }

    // Por dia
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 17px system-ui, sans-serif'
    ctx.fillText('POR DIA DA SEMANA', 48, 570)
    const barW = 60, barMaxH = 140, baseY = 756, startX = 48
    Object.entries(porDia).forEach(([dia, count], i) => {
      const barH = maxDia > 0 ? (count / maxDia) * barMaxH : 0
      const x = startX + i * (barW + 14)
      const grad = ctx.createLinearGradient(0, baseY - barH, 0, baseY)
      grad.addColorStop(0, '#ff3b3b'); grad.addColorStop(1, '#ff6b3b')
      ctx.fillStyle = grad; ctx.fillRect(x, baseY - barH, barW, barH)
      ctx.fillStyle = '#6b7394'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(dia, x + barW/2, baseY + 16)
      if (count > 0) { ctx.fillStyle = '#e8eaf2'; ctx.font = 'bold 12px system-ui, sans-serif'; ctx.fillText(String(count), x + barW/2, baseY - barH - 6) }
    })
    ctx.textAlign = 'left'

    setCardUrl(canvas.toDataURL('image/png'))
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#e8eaf2' }}>Relatórios</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7394' }}>Gere um card para compartilhar nas redes sociais</p>
        </div>

        <div className="card p-6">
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7394' }}>Período</label>
            <div className="grid grid-cols-2 gap-2">
              {PERIODOS.map(p => (
                <button key={p.value} onClick={() => { setPeriodo(p.value); setCardUrl(null) }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                  style={periodo === p.value
                    ? { background: 'rgba(255,59,59,0.12)', border: '1px solid rgba(255,59,59,0.35)', color: '#ff6b6b' }
                    : { background: '#1c2030', border: '1px solid #2a2f4a', color: '#a0a8c0' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={gerarCard} className="btn-primary" disabled={loading}>
            {loading ? 'Gerando...' : '✦ Gerar Card'}
          </button>
          <canvas ref={canvasRef} className="hidden" />

          {cardUrl && (
            <div className="mt-6 fade-up">
              <img src={cardUrl} alt="Card BusLog" className="w-full rounded-2xl" style={{ border: '1px solid #1e2235' }} />
              <button onClick={() => { const a = document.createElement('a'); a.href = cardUrl; a.download = `buslog_${profile?.username}.png`; a.click() }}
                className="btn-secondary mt-3">
                ⬇️ Baixar PNG
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Veiculo {
  ordem: string
  linha: string
  latitude: number
  longitude: number
  velocidade: number
  datahora: string
}

export default function LinhaPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const linhaNome = decodeURIComponent(params.id as string)
  // Extrai número/código da linha para buscar na API (ex: "232 - Barra da Tijuca" → "232")
  const linhaCode = linhaNome.split(/[\s\-–]/)[0].trim()

  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [totalViagens, setTotalViagens] = useState(0)
  const [meuCount, setMeuCount] = useState(0)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }

      // Quantas vezes EU peguei essa linha
      const { count: meu } = await supabase
        .from('viagens').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('linha', linhaNome)
      setMeuCount(meu || 0)

      // Total de viagens de todos na linha
      const { count: total } = await supabase
        .from('viagens').select('*', { count: 'exact', head: true })
        .eq('linha', linhaNome)
      setTotalViagens(total || 0)
    })
  }, [linhaNome])

  // Inicializa mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Carrega Leaflet dinamicamente
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = (window as any).L
      const map = L.map(mapRef.current, {
        center: [-22.9068, -43.1729],
        zoom: 12,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
      buscarGPS()
    }
    document.head.appendChild(script)
  }, [])

  const buscarGPS = async () => {
    setLoading(true)
    setErro(false)
    try {
      const res = await fetch(
        `https://dados.mobilidade.rio/gps/sppo?linha=${encodeURIComponent(linhaCode)}&dataInicial=${getDataHoje()}&dataFinal=${getDataHoje()}`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      const vs: Veiculo[] = (data.veiculos || []).filter((v: any) => v.latitude && v.longitude)
      setVeiculos(vs)
      setUltimaAtualizacao(new Date())
      atualizarMarcadores(vs)
    } catch {
      setErro(true)
    }
    setLoading(false)
  }

  const atualizarMarcadores = (vs: Veiculo[]) => {
    const L = (window as any).L
    if (!L || !mapInstanceRef.current) return

    // Remove marcadores antigos
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (vs.length === 0) return

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:28px;height:28px;background:linear-gradient(135deg,#ff3b3b,#ff6b3b);
        border-radius:50%;border:2px solid #fff;display:flex;align-items:center;
        justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(255,59,59,0.5)
      ">🚌</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    const bounds: [number, number][] = []
    vs.forEach(v => {
      const marker = L.marker([v.latitude, v.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="font-family:sans-serif;padding:4px">
            <div style="font-weight:bold;color:#ff3b3b">${v.ordem}</div>
            <div style="font-size:12px;color:#666">${v.velocidade} km/h</div>
            <div style="font-size:11px;color:#999">${new Date(v.datahora).toLocaleTimeString('pt-BR')}</div>
          </div>
        `)
      markersRef.current.push(marker)
      bounds.push([v.latitude, v.longitude])
    })

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] })
    }
  }

  const getDataHoje = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} 00:00:00`
  }

  const velocidadeMedia = veiculos.length > 0
    ? Math.round(veiculos.reduce((s, v) => s + v.velocidade, 0) / veiculos.length)
    : 0

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-6">

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <button onClick={() => router.push('/linhas')}
            className="mt-1 text-sm px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ background: '#1c2030', color: '#a0a8c0' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#242840')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1c2030')}>
            ← Voltar
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight" style={{ color: '#e8eaf2' }}>{linhaNome}</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6b7394' }}>Monitoramento em tempo real</p>
          </div>
          <button onClick={buscarGPS}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,59,59,0.12)', color: '#ff6b6b', border: '1px solid rgba(255,59,59,0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,59,59,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,59,59,0.12)')}>
            ↻ Atualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Ônibus ativos', value: loading ? '...' : veiculos.length },
            { label: 'Vel. média', value: loading ? '...' : `${velocidadeMedia} km/h` },
            { label: 'Suas viagens', value: meuCount },
            { label: 'Total busólogos', value: totalViagens },
          ].map((s, i) => (
            <div key={i} className="stat-box">
              <div className="text-xs mb-1" style={{ color: '#6b7394' }}>{s.label}</div>
              <div className="text-lg font-bold" style={{ color: i < 2 ? '#ff6b6b' : '#e8eaf2' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Mapa */}
        <div className="card overflow-hidden mb-4" style={{ height: '420px', position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{ background: 'rgba(8,10,15,0.85)' }}>
              <div className="text-4xl mb-3 animate-bounce">🚌</div>
              <div className="text-sm font-medium" style={{ color: '#a0a8c0' }}>Buscando ônibus...</div>
            </div>
          )}

          {/* Sem veículos */}
          {!loading && !erro && veiculos.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{ background: 'rgba(8,10,15,0.85)' }}>
              <div className="text-4xl mb-3">🚏</div>
              <div className="text-sm font-medium mb-1" style={{ color: '#e8eaf2' }}>Nenhum ônibus ativo agora</div>
              <div className="text-xs" style={{ color: '#6b7394' }}>A linha pode não estar operando no momento</div>
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{ background: 'rgba(8,10,15,0.85)' }}>
              <div className="text-4xl mb-3">📡</div>
              <div className="text-sm font-medium mb-1" style={{ color: '#e8eaf2' }}>Dados indisponíveis</div>
              <div className="text-xs mb-3" style={{ color: '#6b7394' }}>Linha intermunicipal ou API fora do ar</div>
              <button onClick={buscarGPS} className="text-xs px-4 py-2 rounded-lg"
                style={{ background: '#1c2030', color: '#a0a8c0' }}>Tentar novamente</button>
            </div>
          )}
        </div>

        {/* Última atualização */}
        {ultimaAtualizacao && (
          <div className="text-xs text-center mb-5" style={{ color: '#4a5068' }}>
            Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR')} · Dados: SMTR Rio
          </div>
        )}

        {/* Lista de veículos */}
        {veiculos.length > 0 && (
          <div>
            <div className="section-label">Veículos ativos ({veiculos.length})</div>
            <div className="card overflow-hidden">
              {veiculos.slice(0, 20).map((v, i) => (
                <div key={v.ordem}
                  className="flex items-center gap-4 px-4 py-3"
                  style={{ borderBottom: i < veiculos.length - 1 ? '1px solid #1e2235' : 'none' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,59,59,0.1)' }}>
                    <span style={{ color: '#ff6b6b', fontSize: '14px' }}>🚌</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-mono font-semibold" style={{ color: '#e8eaf2' }}>{v.ordem}</div>
                    <div className="text-xs" style={{ color: '#6b7394' }}>
                      {new Date(v.datahora).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: v.velocidade > 0 ? '#4ade80' : '#6b7394' }}>
                      {v.velocidade} km/h
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

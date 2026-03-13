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
  const intervalRef = useRef<any>(null)

  const linhaNome = decodeURIComponent(params.id as string)
  const linhaCode = linhaNome.split(/[\s\-–]/)[0].trim()

  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [totalViagens, setTotalViagens] = useState(0)
  const [meuCount, setMeuCount] = useState(0)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const [{ count: meu }, { count: total }] = await Promise.all([
        supabase.from('viagens').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('linha', linhaNome),
        supabase.from('viagens').select('*', { count: 'exact', head: true }).eq('linha', linhaNome),
      ])
      setMeuCount(meu || 0)
      setTotalViagens(total || 0)
    })
  }, [linhaNome])

  // Inicializa mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

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
      setMapReady(true)
    }
    document.head.appendChild(script)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  // Busca GPS quando mapa estiver pronto
  useEffect(() => {
    if (!mapReady) return
    buscarGPS()
  }, [mapReady])

  // Auto-refresh a cada 30s
  useEffect(() => {
    if (!mapReady) return
    if (autoRefresh) {
      setCountdown(30)
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { buscarGPS(); return 30 }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [mapReady, autoRefresh])

  const buscarGPS = async () => {
    setLoading(true)
    setErro(false)
    try {
      const res = await fetch(`/api/gps?linha=${encodeURIComponent(linhaCode)}`)
      const data = await res.json()
      if (data.erro) { setErro(true); setLoading(false); return }
      setVeiculos(data.veiculos || [])
      setUltimaAtualizacao(new Date())
      atualizarMarcadores(data.veiculos || [])
    } catch {
      setErro(true)
    }
    setLoading(false)
  }

  const atualizarMarcadores = (vs: Veiculo[]) => {
    const L = (window as any).L
    if (!L || !mapInstanceRef.current) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (vs.length === 0) return

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:32px;height:32px;
        background:linear-gradient(135deg,#ff3b3b,#ff6b3b);
        border-radius:50%;border:2px solid rgba(255,255,255,0.8);
        display:flex;align-items:center;justify-content:center;
        font-size:16px;box-shadow:0 2px 12px rgba(255,59,59,0.6);
        cursor:pointer;
      ">🚌</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    const bounds: [number, number][] = []
    vs.forEach(v => {
      const vel = v.velocidade > 0
        ? `<span style="color:#4ade80">${v.velocidade} km/h</span>`
        : `<span style="color:#6b7394">parado</span>`
      const marker = L.marker([v.latitude, v.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:120px">
            <div style="font-weight:700;font-size:14px;color:#ff3b3b;margin-bottom:4px">${v.ordem}</div>
            <div style="font-size:12px;margin-bottom:2px">${vel}</div>
            <div style="font-size:11px;color:#999">${new Date(v.datahora).toLocaleTimeString('pt-BR')}</div>
          </div>
        `, { maxWidth: 180 })
      markersRef.current.push(marker)
      bounds.push([v.latitude, v.longitude])
    })

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }

  const velocidadeMedia = veiculos.length > 0
    ? Math.round(veiculos.reduce((s, v) => s + v.velocidade, 0) / veiculos.length)
    : 0

  const emMovimento = veiculos.filter(v => v.velocidade > 0).length

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-6">

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <button onClick={() => router.push('/linhas')}
            className="mt-1 text-sm px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
            style={{ background: '#1c2030', color: '#a0a8c0' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#242840')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1c2030')}>
            ← Voltar
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight" style={{ color: '#e8eaf2' }}>{linhaNome}</h1>
            <div className="flex items-center gap-2 mt-1">
              {!loading && !erro && (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#4ade80' }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#4ade80', animation: 'pulse-dot 2s infinite' }} />
                  Ao vivo
                </span>
              )}
              {ultimaAtualizacao && (
                <span className="text-xs" style={{ color: '#4a5068' }}>
                  · {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={autoRefresh
                ? { background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
                : { background: '#1c2030', color: '#6b7394', border: '1px solid #2a2f4a' }}>
              {autoRefresh ? `↻ ${countdown}s` : '↻ Pausado'}
            </button>
            <button onClick={() => { buscarGPS(); setCountdown(30) }}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(255,59,59,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,59,59,0.2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,59,59,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,59,59,0.1)')}>
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Ônibus ativos', value: loading ? '...' : veiculos.length, accent: true },
            { label: 'Em movimento', value: loading ? '...' : emMovimento, accent: true },
            { label: 'Vel. média', value: loading ? '...' : `${velocidadeMedia} km/h`, accent: true },
            { label: 'Suas viagens', value: meuCount, accent: false },
          ].map((s, i) => (
            <div key={i} className="stat-box">
              <div className="text-xs mb-1" style={{ color: '#6b7394' }}>{s.label}</div>
              <div className="font-bold" style={{ color: s.accent ? '#ff6b6b' : '#e8eaf2', fontSize: i === 2 ? '13px' : '1.1rem' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Mapa */}
        <div className="mb-4 overflow-hidden" style={{ borderRadius: '16px', border: '1px solid #1e2235', height: '420px', position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{ background: 'rgba(8,10,15,0.9)', backdropFilter: 'blur(4px)' }}>
              <div className="text-4xl mb-3" style={{ animation: 'pulse-dot 1s infinite' }}>🚌</div>
              <div className="text-sm font-medium" style={{ color: '#a0a8c0' }}>Buscando ônibus em tempo real...</div>
              <div className="text-xs mt-1" style={{ color: '#4a5068' }}>Linha {linhaCode}</div>
            </div>
          )}

          {!loading && !erro && veiculos.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{ background: 'rgba(8,10,15,0.85)' }}>
              <div className="text-4xl mb-3">🚏</div>
              <div className="text-sm font-medium mb-1" style={{ color: '#e8eaf2' }}>Nenhum ônibus ativo agora</div>
              <div className="text-xs" style={{ color: '#6b7394' }}>A linha pode não estar operando no momento</div>
            </div>
          )}

          {erro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{ background: 'rgba(8,10,15,0.85)' }}>
              <div className="text-4xl mb-3">📡</div>
              <div className="text-sm font-medium mb-1" style={{ color: '#e8eaf2' }}>Dados indisponíveis</div>
              <div className="text-xs mb-3" style={{ color: '#6b7394' }}>Linha intermunicipal ou fora da cobertura SMTR</div>
              <button onClick={buscarGPS} className="text-xs px-4 py-2 rounded-lg"
                style={{ background: '#1c2030', color: '#a0a8c0' }}>Tentar novamente</button>
            </div>
          )}
        </div>

        {/* Lista de veículos */}
        {veiculos.length > 0 && (
          <div>
            <div className="section-label">Veículos rastreados ({veiculos.length})</div>
            <div className="card overflow-hidden">
              {veiculos.slice(0, 25).map((v, i) => (
                <div key={v.ordem} className="flex items-center gap-4 px-4 py-3"
                  style={{ borderBottom: i < veiculos.length - 1 ? '1px solid #1e2235' : 'none' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: 'rgba(255,59,59,0.1)' }}>🚌</div>
                  <div className="flex-1">
                    <div className="text-sm font-mono font-semibold" style={{ color: '#e8eaf2' }}>{v.ordem}</div>
                    <div className="text-xs" style={{ color: '#4a5068' }}>
                      {new Date(v.datahora).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{ background: v.velocidade > 0 ? '#4ade80' : '#4a5068' }} />
                    <span className="text-sm font-semibold"
                      style={{ color: v.velocidade > 0 ? '#4ade80' : '#6b7394' }}>
                      {v.velocidade} km/h
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {veiculos.length > 25 && (
              <p className="text-xs text-center mt-2" style={{ color: '#4a5068' }}>
                Mostrando 25 de {veiculos.length} veículos
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

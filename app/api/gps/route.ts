import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const preferredRegion = 'gru1' // São Paulo

export async function GET(request: NextRequest) {
  const linha = request.nextUrl.searchParams.get('linha')
  if (!linha) return NextResponse.json({ error: 'linha required' }, { status: 400 })

  const agora = new Date()
  // Horário de Brasília (UTC-3)
  const agoraBRT = new Date(agora.getTime() - 3 * 60 * 60 * 1000)
  const inicioBRT = new Date(agoraBRT.getTime() - 30 * 60 * 1000)

  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`

  const dataInicial = fmt(inicioBRT)
  const dataFinal = fmt(agoraBRT)
  const codigos = [linha, linha.padStart(4, '0')].filter((v, i, a) => a.indexOf(v) === i)

  for (const codigo of codigos) {
    try {
      const url = `https://dados.mobilidade.rio/gps/sppo?linha=${encodeURIComponent(codigo)}&dataInicial=${encodeURIComponent(dataInicial)}&dataFinal=${encodeURIComponent(dataFinal)}`
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
      if (!res.ok) continue

      const data = await res.json()
      if (!data.veiculos?.length) continue

      const map: Record<string, any> = {}
      for (const v of data.veiculos) {
        if (!map[v.ordem] || v.datahora > map[v.ordem].datahora) map[v.ordem] = v
      }

      const veiculos = Object.values(map).filter(
        (v: any) => v.latitude && v.longitude && v.latitude !== 0 && v.longitude !== 0
      )

      return NextResponse.json({ veiculos, total: veiculos.length, codigo_usado: codigo, atualizado: agora.toISOString() })
    } catch { continue }
  }

  return NextResponse.json({ veiculos: [], total: 0, dataInicial, dataFinal, atualizado: agora.toISOString() })
}

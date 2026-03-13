import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const linha = request.nextUrl.searchParams.get('linha')
  if (!linha) return NextResponse.json({ error: 'linha required' }, { status: 400 })

  const agora = new Date()
  // Pega só últimos 5 minutos — API só tem dados do momento atual
  const inicio = new Date(agora.getTime() - 5 * 60 * 1000)

  const pad = (n: number) => String(n).padStart(2, '0')
  const fmtData = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

  // Tenta diferentes formatos do código da linha
  const codigos = [
    linha,
    linha.padStart(4, '0'),   // ex: 638 → 0638
    linha.toUpperCase(),
  ].filter((v, i, a) => a.indexOf(v) === i) // remove duplicatas

  for (const codigo of codigos) {
    try {
      const url = `https://dados.mobilidade.rio/gps/sppo?linha=${encodeURIComponent(codigo)}&dataInicial=${encodeURIComponent(fmtData(inicio))}&dataFinal=${encodeURIComponent(fmtData(agora))}`

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      })

      if (!res.ok) continue

      const data = await res.json()
      const veiculosRaw = data.veiculos || []

      if (veiculosRaw.length === 0) continue

      // Pega posição mais recente por veículo
      const map: Record<string, any> = {}
      for (const v of veiculosRaw) {
        if (!map[v.ordem] || v.datahora > map[v.ordem].datahora) {
          map[v.ordem] = v
        }
      }

      const veiculos = Object.values(map).filter(
        (v: any) => v.latitude && v.longitude && v.latitude !== 0 && v.longitude !== 0
      )

      return NextResponse.json({
        veiculos,
        total: veiculos.length,
        codigo_usado: codigo,
        atualizado: agora.toISOString()
      })
    } catch {
      continue
    }
  }

  // Nenhum formato funcionou
  return NextResponse.json({ veiculos: [], total: 0, atualizado: agora.toISOString() })
}

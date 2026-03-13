import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const linha = request.nextUrl.searchParams.get('linha')
  if (!linha) return NextResponse.json({ error: 'linha required' }, { status: 400 })

  const agora = new Date()
  // Volta 2 horas pra garantir dados
  const inicio = new Date(agora.getTime() - 2 * 60 * 60 * 1000)

  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const dataInicial = fmt(inicio)
  const dataFinal = fmt(agora)

  try {
    const url = `https://dados.mobilidade.rio/gps/sppo?linha=${encodeURIComponent(linha)}&dataInicial=${encodeURIComponent(dataInicial)}&dataFinal=${encodeURIComponent(dataFinal)}`
    
    console.log('Buscando SMTR:', url)
    
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'BusLog/1.0' },
      cache: 'no-store'
    })

    console.log('Status SMTR:', res.status)
    
    if (!res.ok) {
      const text = await res.text()
      console.log('Erro SMTR body:', text.slice(0, 200))
      throw new Error(`SMTR ${res.status}`)
    }

    const data = await res.json()
    console.log('Total bruto:', data.veiculos?.length)

    // Pega posição mais recente por veículo
    const veiculosMap: Record<string, any> = {}
    for (const v of (data.veiculos || [])) {
      if (!veiculosMap[v.ordem] || v.datahora > veiculosMap[v.ordem].datahora) {
        veiculosMap[v.ordem] = v
      }
    }

    const veiculos = Object.values(veiculosMap).filter(
      (v: any) => v.latitude && v.longitude && v.latitude !== 0 && v.longitude !== 0
    )

    console.log('Veículos filtrados:', veiculos.length)

    return NextResponse.json({ veiculos, total: veiculos.length, atualizado: agora.toISOString() })
  } catch (err: any) {
    console.error('Erro GPS:', err.message)
    return NextResponse.json({ veiculos: [], total: 0, erro: true, msg: err.message }, { status: 200 })
  }
}

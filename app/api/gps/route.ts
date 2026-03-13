import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const linha = request.nextUrl.searchParams.get('linha')
  if (!linha) return NextResponse.json({ error: 'linha required' }, { status: 400 })

  const agora = new Date()
  const dataHoje = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`
  
  // Tenta últimos 10 minutos pra pegar dados frescos
  const inicio = new Date(agora.getTime() - 10 * 60 * 1000)
  const dataInicial = `${dataHoje} ${String(inicio.getHours()).padStart(2,'0')}:${String(inicio.getMinutes()).padStart(2,'0')}:00`
  const dataFinal = `${dataHoje} ${String(agora.getHours()).padStart(2,'0')}:${String(agora.getMinutes()).padStart(2,'0')}:59`

  try {
    const url = `https://dados.mobilidade.rio/gps/sppo?linha=${encodeURIComponent(linha)}&dataInicial=${encodeURIComponent(dataInicial)}&dataFinal=${encodeURIComponent(dataFinal)}`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 }
    })
    
    if (!res.ok) throw new Error(`SMTR API error: ${res.status}`)
    
    const data = await res.json()
    
    // Pega posição mais recente por veículo
    const veiculosMap: Record<string, any> = {}
    for (const v of (data.veiculos || [])) {
      if (!veiculosMap[v.ordem] || v.datahora > veiculosMap[v.ordem].datahora) {
        veiculosMap[v.ordem] = v
      }
    }
    
    const veiculos = Object.values(veiculosMap)
      .filter((v: any) => v.latitude && v.longitude && v.latitude !== 0 && v.longitude !== 0)
    
    return NextResponse.json({ veiculos, total: veiculos.length, atualizado: agora.toISOString() })
  } catch (err) {
    return NextResponse.json({ veiculos: [], total: 0, erro: true }, { status: 200 })
  }
}

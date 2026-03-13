import { Viagem, GamificacaoStats, Badge } from './types'
import { TOTAL_LINHAS } from './linhas'

export function calcularGamificacao(viagens: Viagem[]): GamificacaoStats {
  if (!viagens || viagens.length === 0) {
    return {
      nivel: 1, xp_total: 0, xp_prox: 100, progresso_nivel: 0,
      linhas_unicas: 0, total_linhas: TOTAL_LINHAS, badges: []
    }
  }

  const totalViagens = viagens.length
  const linhasUnicas = new Set(viagens.map(v => v.linha))
  const qtdLinhasUnicas = linhasUnicas.size

  const xp = (totalViagens * 10) + (qtdLinhasUnicas * 20)
  const nivel = Math.floor(xp / 100) + 1
  const xpProxNivel = nivel * 100
  const progressoNivel = (xp % 100) / 100

  const badges: Badge[] = []

  if (totalViagens >= 50) badges.push({ emoji: '🚌', label: 'Veterano', slug: 'veterano' })
  if (qtdLinhasUnicas >= 10) badges.push({ emoji: '🌍', label: 'Explorador', slug: 'explorador' })

  const madrugada = viagens.filter(v => {
    const hora = parseInt(v.hora.split(':')[0])
    return hora >= 0 && hora <= 4
  })
  if (madrugada.length > 0) badges.push({ emoji: '🦉', label: 'Corujão', slug: 'corujao' })

  const ferroviario = viagens.filter(v =>
    /trem|ramal|metrô|metro|vlt/i.test(v.linha)
  )
  if (ferroviario.length > 0) badges.push({ emoji: '🚆', label: 'Ferroviário', slug: 'ferroviario' })

  const brt = viagens.filter(v => /brt/i.test(v.linha))
  if (brt.length > 0) badges.push({ emoji: '🚄', label: 'Expresso', slug: 'expresso' })

  const barca = viagens.filter(v => /barca/i.test(v.linha))
  if (barca.length > 0) badges.push({ emoji: '⚓', label: 'Marujo', slug: 'marujo' })

  return {
    nivel, xp_total: xp, xp_prox: xpProxNivel,
    progresso_nivel: progressoNivel,
    linhas_unicas: qtdLinhasUnicas,
    total_linhas: TOTAL_LINHAS,
    badges
  }
}

export const MESES_PT: Record<number, string> = {
  0: 'JANEIRO', 1: 'FEVEREIRO', 2: 'MARÇO', 3: 'ABRIL',
  4: 'MAIO', 5: 'JUNHO', 6: 'JULHO', 7: 'AGOSTO',
  8: 'SETEMBRO', 9: 'OUTUBRO', 10: 'NOVEMBRO', 11: 'DEZEMBRO'
}

export function agruparViagensFeed(viagens: Viagem[]) {
  if (!viagens.length) return []

  const porUsuario: Record<string, Viagem[]> = {}
  for (const v of viagens) {
    if (!porUsuario[v.user_id]) porUsuario[v.user_id] = []
    porUsuario[v.user_id].push(v)
  }

  const feedItems: { usuario: string; datetime_ref: Date; viagens: Viagem[] }[] = []

  for (const [userId, viagensUser] of Object.entries(porUsuario)) {
    const sorted = [...viagensUser].sort((a, b) =>
      new Date(`${a.data} ${a.hora}`).getTime() - new Date(`${b.data} ${b.hora}`).getTime()
    )

    const clusters: Viagem[][] = []
    let clusterAtual: Viagem[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const atual = new Date(`${sorted[i].data} ${sorted[i].hora}`)
      const anterior = new Date(`${clusterAtual[clusterAtual.length - 1].data} ${clusterAtual[clusterAtual.length - 1].hora}`)
      const diffHoras = (atual.getTime() - anterior.getTime()) / (1000 * 60 * 60)
      if (diffHoras <= 2) {
        clusterAtual.push(sorted[i])
      } else {
        clusters.push(clusterAtual)
        clusterAtual = [sorted[i]]
      }
    }
    clusters.push(clusterAtual)

    for (const cluster of clusters) {
      const ref = new Date(`${cluster[cluster.length - 1].data} ${cluster[cluster.length - 1].hora}`)
      feedItems.push({
        usuario: userId,
        datetime_ref: ref,
        viagens: [...cluster].reverse()
      })
    }
  }

  return feedItems.sort((a, b) => b.datetime_ref.getTime() - a.datetime_ref.getTime())
}

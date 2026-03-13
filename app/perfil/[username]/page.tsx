'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile, Viagem } from '@/lib/types'
import { calcularGamificacao } from '@/lib/gamificacao'
import ProfileCard from '@/components/ProfileCard'
import JournalCard from '@/components/JournalCard'
import Navbar from '@/components/Navbar'

export default function PerfilVisitantePage({ params }: { params: { username: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [visitedProfile, setVisitedProfile] = useState<Profile | null>(null)
  const [viagens, setViagens] = useState<Viagem[]>([])
  const [seguidores, setSeguidores] = useState<string[]>([])
  const [seguindo, setSeguindo] = useState<string[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followsYou, setFollowsYou] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }

      const { data: myProf } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(myProf)

      // Buscar perfil visitado
      const { data: visited } = await supabase
        .from('profiles').select('*').eq('username', params.username).single()

      if (!visited) { router.push('/atividade'); return }
      setVisitedProfile(visited)

      const [{ data: viags }, { data: segs }, { data: seg }] = await Promise.all([
        supabase.from('viagens').select('*').eq('user_id', visited.id).order('data', { ascending: false }).order('hora', { ascending: false }).limit(10),
        supabase.from('social').select('follower_id').eq('following_id', visited.id),
        supabase.from('social').select('following_id').eq('follower_id', visited.id),
      ])

      setViagens(viags || [])
      const segsIds = (segs || []).map((s: any) => s.follower_id)
      const segIds = (seg || []).map((s: any) => s.following_id)
      setSeguidores(segsIds)
      setSeguindo(segIds)
      setIsFollowing(segsIds.includes(user.id))
      setFollowsYou(segIds.includes(user.id))
      setLoading(false)
    })
  }, [params.username])

  const handleFollow = async () => {
    if (!myProfile || !visitedProfile) return
    await supabase.from('social').insert({ follower_id: myProfile.id, following_id: visitedProfile.id })
    await supabase.from('notificacoes').insert({
      target_user_id: visitedProfile.id,
      from_user_id: myProfile.id,
      tipo: 'follow',
      read: false
    })
    setIsFollowing(true)
    setSeguidores(prev => [...prev, myProfile.id])
  }

  const handleUnfollow = async () => {
    if (!myProfile || !visitedProfile) return
    await supabase.from('social').delete()
      .eq('follower_id', myProfile.id)
      .eq('following_id', visitedProfile.id)
    setIsFollowing(false)
    setSeguidores(prev => prev.filter(id => id !== myProfile.id))
  }

  const linhaFavorita = viagens.length > 0
    ? Object.entries(viagens.reduce((acc, v) => { acc[v.linha] = (acc[v.linha] || 0) + 1; return acc }, {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null
    : null

  const stats = calcularGamificacao(viagens)

  if (loading || !visitedProfile) return <div className="min-h-screen"><Navbar /></div>

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-4">
        <ProfileCard
          profile={visitedProfile}
          stats={stats}
          totalViagens={viagens.length}
          linhaFavorita={linhaFavorita}
          seguidores={seguidores.length}
          seguindo={seguindo.length}
          isOwnProfile={false}
          isFollowing={isFollowing}
          followsYou={followsYou}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
        />

        {/* Diário público */}
        <h3 className="text-muted text-xs uppercase tracking-widest mb-3">📓 Diário Público</h3>
        {viagens.length === 0 ? (
          <div className="text-muted text-sm text-center py-6">Sem viagens registradas.</div>
        ) : (
          viagens.map(v => <JournalCard key={v.id} viagem={v} />)
        )}
      </div>
    </div>
  )
}

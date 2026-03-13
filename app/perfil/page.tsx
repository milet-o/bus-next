'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile, Viagem } from '@/lib/types'
import { calcularGamificacao } from '@/lib/gamificacao'
import ProfileCard from '@/components/ProfileCard'
import JournalCard from '@/components/JournalCard'
import Navbar from '@/components/Navbar'

const AVATARS = ['👤','🚌','🚍','🚏','🎫','😎','🤠','👽','👾','🤖','🐱','🐶','🦊','🐸','🐧','🦁','🐺','🦝']

export default function MeuPerfilPage() {
  const router = useRouter()
  const supabase = createClient()
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [viagens, setViagens] = useState<Viagem[]>([])
  const [seguidores, setSeguidores] = useState<string[]>([])
  const [seguindo, setSeguindo] = useState<string[]>([])
  const [editMode, setEditMode] = useState(false)
  const [listMode, setListMode] = useState<'seguidores'|'seguindo'|null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatar, setEditAvatar] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const [{ data: prof }, { data: viags }, { data: segs }, { data: seg }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('viagens').select('*').eq('user_id', user.id).order('data', { ascending: false }).order('hora', { ascending: false }),
        supabase.from('social').select('follower_id').eq('following_id', user.id),
        supabase.from('social').select('following_id').eq('follower_id', user.id),
      ])
      setMyProfile(prof); setViagens(viags || [])
      setSeguidores((segs||[]).map((s:any) => s.follower_id))
      setSeguindo((seg||[]).map((s:any) => s.following_id))
      if (prof) { setEditName(prof.display_name); setEditBio(prof.bio||''); setEditAvatar(prof.avatar||'👤') }
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    if (!myProfile) return; setSaving(true)
    await supabase.from('profiles').update({ display_name: editName, bio: editBio, avatar: editAvatar }).eq('id', myProfile.id)
    setMyProfile(prev => prev ? { ...prev, display_name: editName, bio: editBio, avatar: editAvatar } : prev)
    setEditMode(false); setSaving(false)
  }

  const linhaFavorita = viagens.length > 0
    ? Object.entries(viagens.reduce((acc, v) => { acc[v.linha]=(acc[v.linha]||0)+1; return acc }, {} as Record<string,number>)).sort((a,b)=>b[1]-a[1])[0]?.[0]||null
    : null
  const stats = calcularGamificacao(viagens)

  if (loading) return <div className="min-h-screen"><Navbar /></div>

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 py-6">
        {!editMode ? (
          <>
            <ProfileCard profile={myProfile!} stats={stats} totalViagens={viagens.length} linhaFavorita={linhaFavorita}
              seguidores={seguidores.length} seguindo={seguindo.length} isOwnProfile isFollowing={false} followsYou={false}
              onEdit={() => setEditMode(true)} onShowFollowers={() => setListMode('seguidores')} onShowFollowing={() => setListMode('seguindo')} />

            {listMode && (
              <div className="card p-5 mb-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold" style={{ color: '#e8eaf2' }}>{listMode === 'seguidores' ? 'Seguidores' : 'Seguindo'}</h3>
                  <button onClick={() => setListMode(null)} className="text-sm" style={{ color: '#6b7394' }}>Fechar ✕</button>
                </div>
                <UserList ids={listMode === 'seguidores' ? seguidores : seguindo} onNavigate={u => router.push(`/perfil/${u}`)} />
              </div>
            )}

            {viagens.length > 0 && (
              <div>
                <div className="section-label">Últimas viagens</div>
                {viagens.slice(0, 10).map(v => <JournalCard key={v.id} viagem={v} />)}
                {viagens.length > 10 && (
                  <button onClick={() => router.push('/diario')} className="btn-secondary mt-3 text-sm">
                    Ver todas no Diário →
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: '#e8eaf2' }}>Editar Perfil</h2>
              <button onClick={() => setEditMode(false)} style={{ color: '#6b7394' }}>✕</button>
            </div>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7394' }}>Nome de exibição</label>
                <input className="input" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7394' }}>Bio <span style={{ textTransform: 'none', color: '#4a5068' }}>(máx. 100)</span></label>
                <textarea className="input resize-none" rows={2} maxLength={100} value={editBio} onChange={e => setEditBio(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6b7394' }}>Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map(av => (
                    <button key={av} type="button" onClick={() => setEditAvatar(av)}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all"
                      style={editAvatar === av
                        ? { background: 'rgba(255,59,59,0.15)', border: '2px solid rgba(255,59,59,0.5)' }
                        : { background: '#1c2030', border: '2px solid transparent' }}>
                      {av}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button onClick={handleSave} className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={() => setEditMode(false)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function UserList({ ids, onNavigate }: { ids: string[], onNavigate: (u: string) => void }) {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  useEffect(() => {
    if (!ids.length) return
    supabase.from('profiles').select('*').in('id', ids).then(({ data }) => setProfiles(data || []))
  }, [ids])
  if (!profiles.length) return <div className="text-sm" style={{ color: '#6b7394' }}>Nenhum usuário.</div>
  return (
    <div className="flex flex-col gap-1">
      {profiles.map(p => (
        <button key={p.id} onClick={() => onNavigate(p.username)}
          className="flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
          onMouseEnter={e => (e.currentTarget.style.background = '#1c2030')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#1c2030' }}>{p.avatar}</div>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#e8eaf2' }}>{p.display_name}</div>
            <div className="text-xs" style={{ color: '#6b7394' }}>@{p.username}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

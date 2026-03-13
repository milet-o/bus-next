'use client'
import { Profile, GamificacaoStats } from '@/lib/types'
import { TOTAL_LINHAS } from '@/lib/linhas'

interface ProfileCardProps {
  profile: Profile
  stats: GamificacaoStats
  totalViagens: number
  linhaFavorita: string | null
  seguidores: number
  seguindo: number
  isOwnProfile: boolean
  isFollowing: boolean
  followsYou: boolean
  onFollow?: () => void
  onUnfollow?: () => void
  onEdit?: () => void
  onShowFollowers?: () => void
  onShowFollowing?: () => void
}

export default function ProfileCard({ profile, stats, totalViagens, linhaFavorita, seguidores, seguindo, isOwnProfile, isFollowing, followsYou, onFollow, onUnfollow, onEdit, onShowFollowers, onShowFollowing }: ProfileCardProps) {
  return (
    <div className="card p-6 mb-5 relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-0 left-0 right-0 h-32 opacity-5 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% -20%, #ff3b3b, transparent)' }} />

      {followsYou && !isOwnProfile && (
        <div className="absolute top-4 left-4 text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: '#1c2030', color: '#6b7394', border: '1px solid #2a2f4a' }}>
          Segue você
        </div>
      )}

      {/* Avatar + nome */}
      <div className="text-center pt-2 pb-5 relative z-10">
        <div className="inline-flex w-20 h-20 rounded-3xl items-center justify-center text-4xl mb-3"
          style={{ background: '#1c2030', border: '2px solid #2a2f4a' }}>
          {profile.avatar}
        </div>
        <div className="text-2xl font-bold" style={{ color: '#e8eaf2' }}>{profile.display_name}</div>
        <div className="text-sm mt-0.5" style={{ color: '#6b7394' }}>@{profile.username}</div>
        {profile.bio && <div className="text-sm italic mt-2" style={{ color: '#a0a8c0' }}>"{profile.bio}"</div>}
      </div>

      {/* XP bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="font-semibold" style={{ color: '#e8eaf2' }}>Nível {stats.nivel}</span>
          <span style={{ color: '#6b7394' }}>{stats.xp_total} XP</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: '#1c2030' }}>
          <div className="h-2 rounded-full transition-all"
            style={{ width: `${stats.progresso_nivel * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} />
        </div>
      </div>

      {/* Badges */}
      {stats.badges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {stats.badges.map(b => <span key={b.slug} className="badge">{b.emoji} {b.label}</span>)}
        </div>
      )}

      {/* Busodex */}
      <div className="mb-5 px-1">
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: '#6b7394' }}>Busodex</span>
          <span style={{ color: '#a0a8c0' }}>{stats.linhas_unicas} / {TOTAL_LINHAS}</span>
        </div>
        <div className="w-full rounded-full h-1.5" style={{ background: '#1c2030' }}>
          <div className="h-1.5 rounded-full" style={{ width: `${(stats.linhas_unicas / TOTAL_LINHAS) * 100}%`, background: 'linear-gradient(90deg, #ff3b3b, #ff6b3b)' }} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Seguidores', value: seguidores, onClick: onShowFollowers },
          { label: 'Seguindo', value: seguindo, onClick: onShowFollowing },
          { label: 'Viagens', value: totalViagens, onClick: undefined },
          { label: 'Linha fav.', value: linhaFavorita || '–', onClick: undefined, small: true },
        ].map((s, i) => (
          <button key={i} onClick={s.onClick} disabled={!s.onClick}
            className="stat-box transition-colors"
            style={{ cursor: s.onClick ? 'pointer' : 'default' }}
            onMouseEnter={e => s.onClick && (e.currentTarget.style.background = '#242840')}
            onMouseLeave={e => s.onClick && (e.currentTarget.style.background = '#1c2030')}>
            <div className="text-xs mb-1" style={{ color: '#6b7394' }}>{s.label}</div>
            <div className={s.small ? 'text-xs font-bold leading-tight' : 'text-lg font-bold'} style={{ color: '#e8eaf2' }}>{s.value}</div>
          </button>
        ))}
      </div>

      {/* Ação */}
      {isOwnProfile
        ? <button onClick={onEdit} className="btn-secondary">Editar Perfil</button>
        : isFollowing
        ? <button onClick={onUnfollow} className="btn-secondary">Deixar de Seguir</button>
        : <button onClick={onFollow} className="btn-primary">Seguir</button>
      }
    </div>
  )
}

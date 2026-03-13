export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string
  avatar: string
  created_at: string
}

export interface Viagem {
  id: string
  user_id: string
  linha: string
  data: string
  hora: string
  obs: string | null
  timestamp: string
  profiles?: Profile
}

export interface Social {
  follower_id: string
  following_id: string
}

export interface Notificacao {
  id: string
  target_user_id: string
  from_user_id: string
  tipo: string
  read: boolean
  created_at: string
  from_profile?: Profile
}

export interface FeedItem {
  usuario: Profile
  datetime_ref: Date
  viagens: Viagem[]
}

export interface GamificacaoStats {
  nivel: number
  xp_total: number
  xp_prox: number
  progresso_nivel: number
  linhas_unicas: number
  total_linhas: number
  badges: Badge[]
}

export interface Badge {
  emoji: string
  label: string
  slug: string
}

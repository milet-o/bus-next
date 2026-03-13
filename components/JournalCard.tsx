'use client'
import { Viagem } from '@/lib/types'

interface JournalCardProps {
  viagem: Viagem
  onDelete?: (id: string) => void
  showDelete?: boolean
}

export default function JournalCard({ viagem, onDelete, showDelete }: JournalCardProps) {
  const dia = new Date(`${viagem.data}T12:00:00`).getDate()

  return (
    <div className="journal-card group">
      <div className="strip" />
      <div className="w-14 flex items-center justify-center font-bold flex-shrink-0 font-mono"
        style={{ color: '#e8eaf2', fontSize: '1.2rem' }}>
        {String(dia).padStart(2, '0')}
      </div>
      <div className="flex-1 px-4 py-3.5 flex flex-col justify-center min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: '#e8eaf2' }}>{viagem.linha}</div>
        <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: '#6b7394' }}>
          <span className="font-mono">{viagem.hora.slice(0, 5)}</span>
          {viagem.obs && <><span>·</span><span className="truncate">{viagem.obs}</span></>}
        </div>
      </div>
      {showDelete && onDelete && (
        <button onClick={() => onDelete(viagem.id)}
          className="px-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg"
          style={{ color: '#4a5068' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff3b3b')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a5068')}>
          ×
        </button>
      )}
    </div>
  )
}

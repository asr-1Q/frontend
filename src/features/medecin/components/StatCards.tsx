import { FiUsers, FiCheckCircle, FiClock, FiShield } from 'react-icons/fi'

interface Stats {
  aujourd_hui: number
  termines:    number
  en_attente:  number
  aumt_actifs: number
}

interface Props {
  stats:   Stats | null
  loading: boolean
}

const CARDS = [
  { label: 'Patients du jour',    key: 'aujourd_hui' as const, icon: <FiUsers size={16} />,       bg: 'bg-blue-50',   color: 'text-blue-700'   },
  { label: 'Consultations finies',key: 'termines'    as const, icon: <FiCheckCircle size={16} />, bg: 'bg-green-50',  color: 'text-green-700'  },
  { label: 'En attente',          key: 'en_attente'  as const, icon: <FiClock size={16} />,       bg: 'bg-orange-50', color: 'text-orange-700' },
  { label: 'AUMT actifs',         key: 'aumt_actifs' as const, icon: <FiShield size={16} />,      bg: 'bg-red-50',    color: 'text-red-700'    },
]

const Skeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
    <div className="h-3 w-24 bg-zinc-100 rounded mb-3" />
    <div className="h-7 w-12 bg-zinc-100 rounded" />
  </div>
)

export const StatCards = ({ stats, loading }: Props) => {
  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map((_, i) => <Skeleton key={i} />)}
    </div>
  )

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map(card => (
        <div key={card.label} className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-zinc-500">{card.label}</p>
            <span className={`${card.bg} ${card.color} p-1.5 rounded-lg`}>{card.icon}</span>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>
            {stats?.[card.key] ?? 0}
          </p>
        </div>
      ))}
    </div>
  )
}
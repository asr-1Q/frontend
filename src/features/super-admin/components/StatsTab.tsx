// features/super-admin/components/StatsTab.tsx
import { FiHome, FiUsers, FiActivity, FiHeart, FiShield } from 'react-icons/fi'
import type { StatsGlobales, StatParRole, StatParHopital, Maladie } from '../types'
import { ROLE_LABEL } from '../types'

const fmt = (n: number | undefined | null) =>
  new Intl.NumberFormat('fr-FR').format(Number(n ?? 0))

const StatCard = ({
  label, value, icon, color,
}: {
  label: string; value: string | number
  icon: React.ReactNode; color: string
}) => (
  <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-start gap-3">
    <div className={`p-2.5 rounded-lg flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-zinc-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-zinc-800">{value}</p>
    </div>
  </div>
)

interface Props {
  stats:          StatsGlobales | null
  statsByRole:    StatParRole[]
  statsByHopital: StatParHopital[]
  maladies:       Maladie[]
}

export default function StatsTab({ stats, statsByRole, statsByHopital, maladies }: Props) {
  if (!stats) return <div className="text-center py-12 text-zinc-400 text-sm">Aucune donnée.</div>

  const maxMaladie = Number(maladies[0]?.nombre ?? 1)

  return (
    <div className="space-y-5">

      {/* ── Cartes stats globales ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Hôpitaux actifs"
          value={fmt(stats.hopitaux_actifs)}
          icon={<FiHome size={18}/>}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Admins IT"
          value={fmt(stats.admins_it)}         // ← champ corrigé
          icon={<FiShield size={18}/>}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Personnel total"
          value={fmt(stats.total_personnel)}
          icon={<FiUsers size={18}/>}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Patients total"
          value={fmt(stats.total_patients)}
          icon={<FiHeart size={18}/>}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Visites aujourd'hui"
          value={fmt(stats.visites_aujourd_hui)}
          icon={<FiActivity size={18}/>}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Personnel par rôle ────────────────────────────── */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Personnel par rôle (global)</h3>
          {statsByRole.length === 0
            ? <p className="text-xs text-zinc-400 text-center py-4">Aucune donnée.</p>
            : (
              <div className="space-y-2">
                {statsByRole.map(r => {
                  const total    = Number(stats.total_personnel) || 1
                  const pct      = Math.round((Number(r.total) / total) * 100)
                  return (
                    <div key={r.role} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 w-28 flex-shrink-0 truncate">
                        {ROLE_LABEL[r.role] ?? r.role}
                      </span>
                      <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: '#1D9E75' }}
                        />
                      </div>
                      <span className="text-xs font-bold text-zinc-600 w-6 text-right">
                        {r.total}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>

        {/* ── Top diagnostics ───────────────────────────────── */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">
            Top diagnostics — 30 derniers jours
          </h3>
          {maladies.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-zinc-400">
                <FiShield size={22} className="opacity-30" />
                <p className="text-xs text-center">
                  Les diagnostics sont chiffrés (C2).<br/>
                  Statistiques non disponibles à ce niveau.
                </p>
              </div>
            )
            : (
              <div className="space-y-2">
                {maladies.slice(0, 10).map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className="text-xs text-zinc-500 truncate flex-shrink-0"
                      style={{ width: 130 }}
                      title={m.diagnostic}
                    >
                      {m.diagnostic.length > 22 ? m.diagnostic.slice(0, 22) + '…' : m.diagnostic}
                    </span>
                    <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${(Number(m.nombre) / maxMaladie) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-600 w-6 text-right">{m.nombre}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* ── Détail par hôpital ────────────────────────────── */}
      {statsByHopital.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-700">Détail par hôpital</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  {['Hôpital', 'Type', 'Région', 'Médecins', 'Infirmiers', 'Patients', 'Actifs'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-zinc-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statsByHopital.map(h => (
                  <tr key={h.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-3 py-2.5 font-medium text-zinc-700">{h.hopital_nom}</td>
                    <td className="px-3 py-2.5 text-zinc-500 capitalize">{h.hopital_type ?? '—'}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{h.hopital_region ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center">{h.medecins ?? 0}</td>
                    <td className="px-3 py-2.5 text-center">{h.infirmiers ?? 0}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-zinc-700">{h.total_patients ?? 0}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                        {h.total_actifs ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
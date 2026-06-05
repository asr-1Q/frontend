// features/super-admin/pages/SuperAdminPage.tsx
import { useState, useCallback } from 'react'
import {
  FiBarChart2, FiHome, FiUsers, FiEye, FiRefreshCw,
} from 'react-icons/fi'
import { useSuperAdmin }  from '../hooks/useSuperAdmin'
import StatsTab           from '../components/StatsTab'
import HopitauxTab        from '../components/HopitauxTab'
import AdminsITTab        from '../components/AdminsITTab'
import LogsTab            from '../components/LogsTab'
import type { SuperAdminOnglet } from '../types'

const ONGLETS: { id: SuperAdminOnglet; label: string; icon: React.ReactNode }[] = [
  { id: 'stats',     label: 'Vue globale',  icon: <FiBarChart2 size={15}/> },
  { id: 'hopitaux',  label: 'Hôpitaux',     icon: <FiHome size={15}/>     },
  { id: 'admins_it', label: 'Admins IT',    icon: <FiUsers size={15}/>    },
  { id: 'logs',      label: 'Logs globaux', icon: <FiEye size={15}/>      },
]

export default function SuperAdminPage() {
  const [onglet,     setOnglet]     = useState<SuperAdminOnglet>('stats')
  const [refreshKey, setRefreshKey] = useState(0)
  const [logParams,  setLogParams]  = useState<{
    hopital_id?: number
    action?: string
    date_debut?: string
    date_fin?: string
  }>({})

  const {
    stats, statsByRole, statsByHopital, maladies,
    hopitaux, adminsIT, logs,
    loading, error, reload,
  } = useSuperAdmin({ onglet, logParams, refreshKey })

  const handleLogParams = useCallback((p: typeof logParams) => {
    setLogParams(p)
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <div className="space-y-4">

      {/* ── Onglets ───────────────────────────────────── */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {ONGLETS.map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
              onglet === o.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {o.icon}
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        ))}

        <button
          onClick={() => { setRefreshKey(k => k + 1); reload() }}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-white transition"
          title="Actualiser"
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Erreur ────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Spinner ───────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <FiRefreshCw className="animate-spin text-blue-500" size={20} />
        </div>
      )}

      {/* ── Contenu ───────────────────────────────────── */}
      {!loading && (
        <>
          {onglet === 'stats' && (
            <StatsTab
              stats={stats}
              statsByRole={statsByRole}
              statsByHopital={statsByHopital}
              maladies={maladies}
            />
          )}
          {onglet === 'hopitaux' && (
            <HopitauxTab hopitaux={hopitaux} onReload={reload} />
          )}
          {onglet === 'admins_it' && (
            <AdminsITTab
              adminsIT={adminsIT}
              hopitaux={hopitaux}
              onReload={reload}
            />
          )}
          {onglet === 'logs' && (
            <LogsTab
              logs={logs}
              hopitaux={hopitaux}
              onParamsChange={handleLogParams}
            />
          )}
        </>
      )}
    </div>
  )
}
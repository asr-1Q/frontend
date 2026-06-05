// features/admin/pages/AdminPage.tsx
import { useState, useCallback } from 'react'
import { FiGrid, FiUsers, FiEye, FiDatabase, FiRefreshCw } from 'react-icons/fi'
import { useAdmin } from '../hooks/useAdmin'
import DashboardTab  from '../components/DashboardTab'
import PersonnelTab  from '../components/PersonnelTab'
import AuditTab      from '../components/AuditTab'
import SauvegardeTab from '../components/SauvegardeTab'
import type { AdminOnglet } from '../types'

const ONGLETS: { id: AdminOnglet; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'Tableau de bord',   icon: <FiGrid     size={15} /> },
  { id: 'personnel',  label: 'Personnel',          icon: <FiUsers    size={15} /> },
  { id: 'audit',      label: "Journal d'audit",    icon: <FiEye      size={15} /> },
  { id: 'sauvegarde', label: 'Sauvegarde',         icon: <FiDatabase size={15} /> },
]

export default function AdminPage() {
  const [onglet,      setOnglet]      = useState<AdminOnglet>('dashboard')
  const [refreshKey,  setRefreshKey]  = useState(0)
  const [auditParams, setAuditParams] = useState<{
    action?: string; date_debut?: string; date_fin?: string
  }>({})

  const { dashboard, utilisateurs, auditLogs, statistiques, loading, error, reload } =
    useAdmin({ onglet, auditParams, refreshKey })

  const handleAuditParams = useCallback((p: typeof auditParams) => {
    setAuditParams(p)
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <div className="space-y-4">

      {/* Onglets */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {ONGLETS.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
              onglet === o.id ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}>
            {o.icon}
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        ))}
        <button onClick={() => { setRefreshKey(k => k + 1); reload() }}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-white transition"
          title="Actualiser">
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <FiRefreshCw className="animate-spin text-blue-500" size={20} />
        </div>
      )}

      {/* Contenu */}
      {!loading && (
        <>
          {onglet === 'dashboard'  && <DashboardTab data={dashboard} />}
          {onglet === 'personnel'  && <PersonnelTab utilisateurs={utilisateurs} onReload={reload} />}
          {onglet === 'audit'      && <AuditTab logs={auditLogs} onParamsChange={handleAuditParams} />}
          {onglet === 'sauvegarde' && <SauvegardeTab statistiques={statistiques} />}
        </>
      )}
    </div>
  )
}
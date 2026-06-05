import React from 'react'
import { FiUsers, FiCheckCircle, FiLock, FiClock } from 'react-icons/fi'
import type { DashboardResponse } from '../types'

const ROLE_LABEL: Record<string, string> = {
  medecin: 'Médecin', infirmier: 'Infirmier', accueil: 'Accueil',
  admin_it: 'Admin IT', super_admin: 'Super Admin',
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const StatCard = ({ label, value, icon, color }: {
  label: string; value: number; icon: React.ReactNode; color: string
}) => (
  <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-start gap-3">
    <div className={`p-2.5 rounded-lg flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-zinc-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-zinc-800">{value}</p>
    </div>
  </div>
)

interface Props { data: DashboardResponse | null }

export default function DashboardTab({ data }: Props) {
  if (!data) return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 text-sm text-zinc-500">
      Chargement du tableau de bord...
    </div>
  )

  const { stats, personnel_recent, personnel_par_role } = data

  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Personnel total"      value={Number(stats.total_personnel)}       icon={<FiUsers size={18} />}       color="bg-blue-50 text-blue-600"   />
        <StatCard label="Comptes actifs"       value={Number(stats.comptes_actifs)}        icon={<FiCheckCircle size={18} />} color="bg-green-50 text-green-600" />
        <StatCard label="Comptes bloqués"      value={Number(stats.comptes_bloques)}       icon={<FiLock size={18} />}        color="bg-red-50 text-red-600"     />
        <StatCard label="1er login en attente" value={Number(stats.premier_login_attente)} icon={<FiClock size={18} />}       color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Répartition par rôle */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Répartition personnel</h3>
          <div className="grid grid-cols-2 gap-2">
            {personnel_par_role.map(r => (
              <div key={r.role} className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2">
                <span className="text-xs text-zinc-600">{ROLE_LABEL[r.role] ?? r.role}</span>
                <span className="text-xs font-bold text-zinc-700">{r.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Personnel récent */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Derniers comptes créés</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {personnel_recent.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50">
                <div className="size-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                     style={{ background: '#1D9E75' }}>
                  {u.prenom?.[0]}{u.nom?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-700 truncate">{u.prenom} {u.nom}</p>
                  <p className="text-xs text-zinc-400 truncate">{u.telephone ?? '—'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                  <p className="text-xs text-zinc-300 mt-0.5">{fmtDate(u.created_at)}</p>
                </div>
                {u.compte_bloque && (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Bloqué</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
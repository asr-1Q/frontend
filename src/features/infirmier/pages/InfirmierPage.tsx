import { useState, useEffect, useCallback } from 'react'
import { getDashboard } from '../api/infirmierApi'
import type { PatientAttente, StatsDashboard } from '../types'
import ListePatientsAttente from '../components/ListePatientsAttente'
import SaisieConstantes     from '../components/SaisieConstantes'

export default function InfirmierPage() {
  const [patients,  setPatients]  = useState<PatientAttente[]>([])
  const [stats,     setStats]     = useState<StatsDashboard>({ en_attente: 0, traites_aujourd_hui: 0, total_jour: 0 })
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [patientSelec, setPatientSelec] = useState<PatientAttente | null>(null)
  const [derniereMaj, setDerniereMaj]   = useState<Date | null>(null)

  const chargerDashboard = useCallback(async (manuel = false) => {
    if (manuel) setRefreshing(true)
    else        setLoading(true)
    try {
      const data = await getDashboard()
      setPatients(data.patients_attente)
      setStats(data.stats)
      setError(null)
      setDerniereMaj(new Date())
    } catch {
      setError("Impossible de charger la file d'attente.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    chargerDashboard()
    const interval = setInterval(() => chargerDashboard(), 30_000)
    return () => clearInterval(interval)
  }, [chargerDashboard])

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Espace Infirmier</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Triage et constantes vitales</p>
        </div>
        <div className="flex items-center gap-3">
          {derniereMaj && !refreshing && (
            <span className="text-xs text-zinc-400 hidden sm:block">
              Mis à jour à {derniereMaj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={() => chargerDashboard(true)} disabled={refreshing || loading}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 border border-zinc-200 rounded-xl px-4 py-2 transition-colors disabled:opacity-40 bg-white">
            <span className={refreshing ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'En attente',         value: stats.en_attente,          color: 'bg-orange-50 text-orange-700' },
          { label: 'Traités aujourd\'hui', value: stats.traites_aujourd_hui, color: 'bg-green-50 text-green-700'  },
          { label: 'Total du jour',       value: stats.total_jour,          color: 'bg-blue-50 text-blue-700'    },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between gap-2">
          <span>⚠️ {error}</span>
          <button onClick={() => chargerDashboard(true)} className="text-xs underline">Réessayer</button>
        </div>
      )}

      {/* File d'attente */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-800">File d'attente — Tri infirmier</h2>
          {patients.length > 0 && (
            <span className="text-xs font-semibold bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full">
              {patients.length} patient{patients.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <ListePatientsAttente
          patients={patients}
          onPrendreConstantes={setPatientSelec}
          loading={loading}
        />
      </div>

      {/* Modal constantes */}
      {patientSelec && (
        <SaisieConstantes
          patient={patientSelec}
          onClose={() => setPatientSelec(null)}
          onSuccess={() => chargerDashboard(true)}
        />
      )}
    </div>
  )
}
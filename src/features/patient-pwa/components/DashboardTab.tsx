import { useEffect } from 'react'
import { Activity, ShieldCheck, ChevronRight, LogOut, Clock } from 'lucide-react'
import { usePatientAuthStore } from '@/store/patientAuthStore'
import { useNavigate } from 'react-router-dom'
import type { TabPatient } from '../types'
import type { usePatientData } from '../hooks/usePatientData'

type Props = ReturnType<typeof usePatientData> & {
  onTabChange: (tab: TabPatient) => void
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export const DashboardTab = ({ patient, data, loading, loadConstantes, onTabChange }: Props) => {
  const logout   = usePatientAuthStore(s => s.logout)
  const navigate = useNavigate()

  useEffect(() => { loadConstantes() }, [])

  const handleLogout = () => { logout(); navigate('/patient/login') }

  const derniereConstante = data.constantes?.[0] ?? null

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
            {patient?.prenom?.[0]}{patient?.nom?.[0]}
          </div>
          <div>
            <p className="text-xs text-zinc-400">Bonjour,</p>
            <p className="font-bold text-zinc-800">{patient?.prenom} {patient?.nom}</p>
            <p className="text-xs text-zinc-400 font-mono">{patient?.cpu}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

{/* Données C0 urgence */}
{(patient?.allergies_texte || patient?.groupe_sanguin) && (
  <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
    <p className="text-xs font-bold text-red-700 uppercase mb-1">Données d'urgence (C0)</p>
    {patient?.groupe_sanguin && (
      <p className="text-sm text-red-800">Groupe : <strong>{patient.groupe_sanguin}</strong></p>
    )}
    {patient?.allergies_texte && (
      <p className="text-sm text-red-800">⚠ Allergies : {patient.allergies_texte}</p>
    )}
  </div>
)}
      {/* Dernières constantes */}
      {derniereConstante && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Dernières constantes</p>
            <button onClick={() => onTabChange('constantes')}
              className="text-xs text-teal-600 hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Temp.',   value: derniereConstante.temperature       ? `${derniereConstante.temperature}°C`                                           : '—' },
              { label: 'SpO2',    value: derniereConstante.spo2              ? `${derniereConstante.spo2}%`                                                    : '—' },
              { label: 'Tension', value: derniereConstante.tension_systolique ? `${derniereConstante.tension_systolique}/${derniereConstante.tension_diastolique}` : '—' },
              { label: 'Pouls',   value: derniereConstante.frequence_cardiaque ? `${derniereConstante.frequence_cardiaque} bpm`                               : '—' },
              { label: 'Poids',   value: derniereConstante.poids             ? `${derniereConstante.poids} kg`                                                 : '—' },
              { label: 'Score',   value: derniereConstante.score_urgence     ? `${derniereConstante.score_urgence}/10`                                         : '—' },
            ].map(c => (
              <div key={c.label} className="bg-zinc-50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-zinc-400">{c.label}</p>
                <p className="text-sm font-bold text-zinc-700">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dernières visites */}
      {data.dernieresVisites?.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Dernières visites</p>
          <div className="space-y-2">
            {data.dernieresVisites.slice(0, 3).map((v: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-100 last:border-0">
                <div className="p-2 rounded-lg bg-zinc-50 flex-shrink-0">
                  <Clock className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{v.motif_visite || 'Consultation'}</p>
                  <p className="text-xs text-zinc-400">{fmtDate(v.created_at)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  v.statut === 'termine' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>{v.statut}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accès AUMT récents */}
      {data.acces_aumt?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-700 uppercase mb-2">Accès d'urgence récents (AUMT)</p>
          {data.acces_aumt.slice(0, 2).map((a: any, i: number) => (
            <div key={i} className="text-xs text-amber-800 mb-1">
              {a.declencheur_prenom} {a.declencheur_nom} — {fmtDate(a.created_at)}
            </div>
          ))}
        </div>
      )}

      {/* Sécurité */}
      <button onClick={() => onTabChange('securite')}
        className="w-full bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover:bg-teal-100 transition">
        <div className="p-2 rounded-xl bg-white">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-teal-800">Sécurité de mon dossier</p>
          <p className="text-xs text-teal-600">Voir qui a consulté votre dossier médical</p>
        </div>
        <ChevronRight className="w-4 h-4 text-teal-500 flex-shrink-0" />
      </button>

      {/* Constantes raccourci */}
      <button onClick={() => onTabChange('constantes')}
        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover:bg-zinc-50 transition">
        <div className="p-2 rounded-xl bg-blue-50">
          <Activity className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-800">Mes constantes vitales</p>
          <p className="text-xs text-zinc-400">Historique des mesures</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
      </button>
    </div>
  )
}
import type { PatientAttente, Priorite } from '../types'

interface Props {
  patients:            PatientAttente[]
  onPrendreConstantes: (patient: PatientAttente) => void
  loading:             boolean
}

const dureeAttente = (createdAt: string): string => {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  if (diff < 60) return `${diff} min`
  return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? String(diff % 60).padStart(2, '0') : ''}`
}

const heureArrivee = (createdAt: string): string =>
  new Date(createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const PRIORITE_BADGE: Record<Priorite, string> = {
  CRITIQUE: 'bg-red-600 text-white',
  URGENT:   'bg-orange-500 text-white',
  NORMAL:   'bg-emerald-500 text-white',
}

const ROW_BG: Record<Priorite, string> = {
  CRITIQUE: 'bg-red-50 hover:bg-red-100',
  URGENT:   'bg-orange-50/50 hover:bg-orange-50',
  NORMAL:   'hover:bg-zinc-50',
}

export default function ListePatientsAttente({ patients, onPrendreConstantes, loading }: Props) {
  if (loading) return (
    <div className="flex items-center justify-center py-20 text-zinc-400 text-sm gap-2">
      <span className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
      Chargement de la file d'attente…
    </div>
  )

  if (patients.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-2">
      <span className="text-4xl">✓</span>
      <p className="text-sm font-medium">Aucun patient en attente de tri</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100">
            {["Heure d'arrivée", 'Patient', 'Code CPU', 'Motif', 'Priorité', 'Action'].map(col => (
              <th key={col} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {patients.map(patient => (
            <tr key={patient.visite_id} className={`transition-colors ${ROW_BG[patient.priorite]}`}>

              {/* Heure */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2 text-zinc-600">
                  <span className="text-zinc-400">🕐</span>
                  <span className="font-medium">{heureArrivee(patient.created_at)}</span>
                  <span className="text-xs text-zinc-400">({dureeAttente(patient.created_at)})</span>
                </div>
              </td>

              {/* Nom complet — C0 visible pour l'infirmier */}
              <td className="px-4 py-3">
                <span className="font-semibold text-zinc-800">
                  {patient.prenom_masque} {patient.nom_masque}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {patient.age && <span className="text-xs text-zinc-400">{patient.age} ans</span>}
                  {patient.groupe_sanguin && (
                    <span className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">{patient.groupe_sanguin}</span>
                  )}
                  {patient.allergies_texte && (
                    <span className="text-xs text-red-600 font-medium">⚠ Allergies</span>
                  )}
                </div>
              </td>

              {/* CPU */}
              <td className="px-4 py-3">
                <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-lg">
                  {patient.cpu}
                </span>
              </td>

              {/* Motif */}
              <td className="px-4 py-3 text-zinc-600 max-w-[200px] truncate">
                {patient.motif_visite || '—'}
              </td>

              {/* Priorité */}
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${PRIORITE_BADGE[patient.priorite]}`}>
                    {patient.priorite}
                  </span>
                  {patient.urgence && (
                    <span className="block text-xs text-red-600 font-medium">🚨 Urgence</span>
                  )}
                </div>
              </td>

              {/* Action */}
              <td className="px-4 py-3">
                <button onClick={() => onPrendreConstantes(patient)}
                  className="text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                  style={{ background: '#1D9E75' }}>
                  Prendre en charge →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
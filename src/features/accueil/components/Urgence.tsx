import { useState, useEffect } from 'react'
import { FiCheck } from 'react-icons/fi'
import { creerUrgence, getMedecins } from '../api/accueilApi'
import type { UrgencePayload, MedecinDispo } from '../types'

interface Props { onSuccess: () => void }

export default function Urgence({ onSuccess }: Props) {
  const [form, setForm] = useState<UrgencePayload>({
    nom: '', prenom: '', sexe: '', telephone: '', motif: '', medecin_id: undefined,
  })
  const [medecins, setMedecins] = useState<MedecinDispo[]>([])
  const [loading,  setLoading]  = useState(false)
  const [succes,   setSucces]   = useState<{ cpu: string; ticket: number } | null>(null)
  const [erreur,   setErreur]   = useState<string | null>(null)

  useEffect(() => {
    getMedecins().then(m => setMedecins(m.filter(med => med.statut_presence !== 'absent'))).catch(() => {})
  }, [])

  const set = (k: keyof UrgencePayload, v: string | number | undefined) =>
    setForm(f => ({ ...f, [k]: v }))

  const soumettre = async () => {
    if (!form.motif.trim()) return
    setLoading(true)
    setErreur(null)
    try {
      const data = await creerUrgence(form)
      setSucces({ cpu: data.cpu, ticket: data.ticket_numero ?? 0 })
      setTimeout(onSuccess, 3000)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setErreur(err.response?.data?.message ?? 'Erreur serveur')
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400'

  if (succes) return (
    <div className="text-center py-10">
      <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-green-100">
        <FiCheck size={28} className="text-green-600" />
      </div>
      <p className="font-semibold text-zinc-800 text-lg">Dossier urgence créé</p>
      <p className="text-zinc-500 mt-1">CPU : <strong className="font-mono">{succes.cpu}</strong></p>
      {succes.ticket > 0 && <p className="text-zinc-500">Ticket N° <strong>{succes.ticket}</strong></p>}
      <p className="text-xs text-zinc-400 mt-2">Redirection dans 3 secondes…</p>
    </div>
  )

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <p className="text-red-700 font-semibold text-sm">🚨 Mode urgence — Priorité absolue</p>
        <p className="text-red-500 text-xs mt-0.5">Seul le motif est obligatoire.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Nom (optionnel)</label>
          <input type="text" value={form.nom ?? ''} onChange={e => set('nom', e.target.value)}
            placeholder="INCONNU" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Prénom (optionnel)</label>
          <input type="text" value={form.prenom ?? ''} onChange={e => set('prenom', e.target.value)}
            placeholder="PATIENT" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Sexe</label>
          <select value={form.sexe} onChange={e => set('sexe', e.target.value)} className={inputCls}>
            <option value="">Inconnu</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Téléphone</label>
          <input type="tel" value={form.telephone ?? ''} onChange={e => set('telephone', e.target.value)}
            placeholder="+237…" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1">Motif d'urgence *</label>
        <textarea value={form.motif} onChange={e => set('motif', e.target.value)}
          rows={3} placeholder="Décrivez la situation d'urgence…"
          className={`${inputCls} resize-none`} />
      </div>

      {/* Médecins disponibles uniquement */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1">Médecin disponible</label>
        <div className="space-y-2">
          {medecins.length === 0 && (
            <p className="text-xs text-zinc-400">Aucun médecin disponible actuellement</p>
          )}
          {medecins.map(m => (
            <button key={m.id}
              onClick={() => set('medecin_id', form.medecin_id === m.id ? undefined : m.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition ${
                form.medecin_id === m.id
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}>
              <span>Dr. {m.prenom} {m.nom}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                m.statut_presence === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {m.patients_en_attente} patients
              </span>
            </button>
          ))}
        </div>
      </div>

      {erreur && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erreur}</p>}

      <button onClick={soumettre} disabled={loading || !form.motif.trim()}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
        {loading ? 'Enregistrement…' : '🚨 Créer le dossier urgence'}
      </button>
    </div>
  )
}
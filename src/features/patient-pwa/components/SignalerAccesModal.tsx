import { useState } from 'react'
import { ShieldAlert, X, CheckCircle2 } from 'lucide-react'
import { signalerAcces } from '../api/patientApi'
import type { AccesDossier, TypeAcces } from '../types'

interface Props {
  acces: AccesDossier
  onClose: () => void
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })

export const SignalerAccesModal = ({ acces, onClose }: Props) => {
  const [motif, setMotif]         = useState('')
  const [typeAcces, setTypeAcces] = useState<TypeAcces>('C1')
  const [envoi, setEnvoi]         = useState(false)
  const [succes, setSucces]       = useState(false)
  const [erreur, setErreur]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (motif.trim().length < 10) {
      setErreur('Le motif doit contenir au moins 10 caractères.')
      return
    }
    setEnvoi(true)
    setErreur(null)
    try {
      await signalerAcces({
        motif:      motif.trim(),
        type_acces: typeAcces,
        medecin_id: null,
      })
      setSucces(true)
    } catch (err: any) {
      setErreur(err?.response?.data?.message ?? 'Erreur lors du signalement.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Signaler un accès</h3>
              <p className="text-xs text-zinc-500">Vous ne reconnaissez pas cet accès ?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Succès */}
        {succes && (
          <div className="px-5 py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-sm font-medium text-zinc-800">
              Signalement enregistré.
            </p>
            <p className="text-xs text-zinc-500">
              L'administration a été alertée et reviendra vers vous.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Formulaire */}
        {!succes && (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {/* Détail accès */}
            <div className="bg-zinc-50 rounded-xl p-3 text-xs text-zinc-600">
              <p>
                <span className="font-medium text-zinc-800">Dr</span>{' '}
                {acces.prenom ?? ''} {acces.nom ?? ''}
              </p>
              {acces.hopital_nom && (
                <p className="text-zinc-500">{acces.hopital_nom}</p>
              )}
              <p className="text-zinc-400 mt-0.5">{fmtDate(acces.created_at)}</p>
            </div>

            {/* Type d'accès */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Type de données consultées
              </label>
              <select
                value={typeAcces}
                onChange={(e) => setTypeAcces(e.target.value as TypeAcces)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl bg-white"
              >
                <option value="C1">Constantes vitales / Ordonnances (C1)</option>
                <option value="C2">Diagnostic / Notes cliniques (C2)</option>
                <option value="AUMT">Accès d'urgence (AUMT)</option>
              </select>
            </div>

            {/* Motif */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Motif du signalement <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Décrivez pourquoi vous ne reconnaissez pas cet accès…"
                rows={4}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                {motif.trim().length}/10 caractères minimum
              </p>
            </div>

            {erreur && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {erreur}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={envoi || motif.trim().length < 10}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl disabled:opacity-50"
              >
                {envoi ? 'Envoi…' : 'Confirmer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// features/medecin/components/AllergyAlert.tsx
// =============================================================================
import { useState } from 'react'
import { FiAlertOctagon, FiX, FiShield, FiAlertTriangle } from 'react-icons/fi'
import type { AllergieDetectee } from '../types'

interface Props {
  allergie: AllergieDetectee
  medicament: string
  onAnnuler: () => void
  onConfirmer: (justification: string) => void
  loading: boolean
}

const GRAVITE_STYLE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  legere:   { label: 'Légère',   bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200' },
  moderee:  { label: 'Modérée',  bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200' },
  severe:   { label: 'Sévère',   bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200'    },
}

const JUSTIFICATION_MIN = 50

export const AllergyAlert = ({ allergie, medicament, onAnnuler, onConfirmer, loading }: Props) => {
  const [etape, setEtape]               = useState<'alerte' | 'justification'>('alerte')
  const [justification, setJustification] = useState('')

  const gravite = GRAVITE_STYLE[allergie.gravite] ?? GRAVITE_STYLE.severe
  const nbChars = justification.trim().length
  const valide  = nbChars >= JUSTIFICATION_MIN

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 bg-red-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-100 rounded-lg">
              <FiAlertOctagon size={18} className="text-red-600" />
            </span>
            <div>
              <p className="text-sm font-bold text-red-700">Allergie détectée !</p>
              <p className="text-xs text-red-500">Prescription bloquée</p>
            </div>
          </div>
          <button
            onClick={onAnnuler}
            disabled={loading}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 transition"
          >
            <FiX size={16} />
          </button>
        </div>

        {etape === 'alerte' && (
          <>
            {/* ── Corps alerte ── */}
            <div className="px-5 py-5 space-y-4">
              {/* Info médicament bloqué */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <p className="text-xs text-zinc-500 mb-0.5">Médicament prescrit</p>
                <p className="text-sm font-semibold text-zinc-800">{medicament}</p>
              </div>

              {/* Info allergie */}
              <div className={`p-3 rounded-xl border ${gravite.bg} ${gravite.border}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-zinc-500">Substance allergène</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gravite.bg} ${gravite.text} border ${gravite.border}`}>
                    {gravite.label}
                  </span>
                </div>
                <p className={`text-sm font-bold ${gravite.text}`}>{allergie.substance}</p>
              </div>

              {/* Avertissement */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <FiAlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Prescrire ce médicament malgré l'allergie nécessite une justification
                  clinique d'au moins {JUSTIFICATION_MIN} caractères. L'action sera tracée dans l'audit.
                </p>
              </div>
            </div>

            {/* ── Actions alerte ── */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={onAnnuler}
                className="flex-1 text-sm font-medium px-4 py-2.5 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <FiX size={14} />
                  Annuler
                </span>
              </button>
              <button
                onClick={() => setEtape('justification')}
                className="flex-1 text-sm font-semibold px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <FiShield size={14} />
                  Prescrire quand même
                </span>
              </button>
            </div>
          </>
        )}

        {etape === 'justification' && (
          <>
            {/* ── Corps justification ── */}
            <div className="px-5 py-5 space-y-3">
              <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl">
                <FiShield size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600 font-medium">
                  Override allergie — {allergie.gravite} — {allergie.substance}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-600 mb-1.5">
                  Justification clinique <span className="text-red-500">*</span>
                </p>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={5}
                  placeholder="Expliquez pourquoi cette prescription est nécessaire malgré l'allergie connue (bénéfice/risque, absence d'alternative, consentement éclairé…)"
                  className="w-full text-sm px-3 py-2.5 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-400 bg-zinc-50 leading-relaxed"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-zinc-400">
                    Cette justification sera enregistrée dans l'audit
                  </p>
                  <p className={`text-[10px] font-semibold ${valide ? 'text-green-600' : 'text-zinc-400'}`}>
                    {nbChars} / {JUSTIFICATION_MIN} min
                  </p>
                </div>
              </div>
            </div>

            {/* ── Actions justification ── */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setEtape('alerte')}
                disabled={loading}
                className="flex-1 text-sm font-medium px-4 py-2.5 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition"
              >
                Retour
              </button>
              <button
                onClick={() => onConfirmer(justification.trim())}
                disabled={!valide || loading}
                className="flex-1 text-sm font-semibold px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <FiShield size={14} />
                    Confirmer et prescrire
                  </>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
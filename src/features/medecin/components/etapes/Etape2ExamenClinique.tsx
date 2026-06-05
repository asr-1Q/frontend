// =============================================================================
// features/medecin/components/etapes/Etape2ExamenClinique.tsx
// =============================================================================
import { FiSave } from 'react-icons/fi'
import type { EtapeExamenClinique } from '../../types'

interface Props {
  valeurs: EtapeExamenClinique
  onChange: (v: EtapeExamenClinique) => void
  onSauvegarder: () => void
  onSuivant: () => void
  onPrecedent: () => void
  loading: boolean
}

const CHAMPS: { key: keyof EtapeExamenClinique; label: string; placeholder: string }[] = [
  { key: 'auscultation', label: 'Auscultation',        placeholder: 'Bruits cardiaques, murmures vésiculaires…' },
  { key: 'palpation',    label: 'Palpation',            placeholder: 'Douleur à la palpation, organomégalie…' },
  { key: 'inspection',   label: 'Inspection',           placeholder: 'État général, coloration cutanée, œdèmes…' },
  { key: 'neurologique', label: 'Examen neurologique',  placeholder: 'Conscience, réflexes, signes méningés…' },
  { key: 'autres',       label: 'Autres observations',  placeholder: 'Tout autre signe clinique pertinent…' },
]

export const Etape2ExamenClinique = ({
  valeurs,
  onChange,
  onSauvegarder,
  onSuivant,
  onPrecedent,
  loading,
}: Props) => {
  const setChamp = (key: keyof EtapeExamenClinique, val: string) =>
    onChange({ ...valeurs, [key]: val })

  return (
    <div className="flex flex-col gap-4">
      {CHAMPS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
            {label}
            <span className="ml-1 text-zinc-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            value={valeurs[key]}
            onChange={(e) => setChamp(key, e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="w-full text-sm px-3 py-2.5 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-zinc-50 leading-relaxed"
          />
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onPrecedent}
          className="text-xs px-3 py-2 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition"
        >
          ← Précédent
        </button>
        <button
          onClick={onSauvegarder}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-2 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition disabled:opacity-40"
        >
          <FiSave size={13} />
          Sauvegarder
        </button>
        <button
          onClick={onSuivant}
          disabled={loading}
          className="ml-auto text-sm font-semibold px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-40"
        >
          Suivant →
        </button>
      </div>
    </div>
  )
}
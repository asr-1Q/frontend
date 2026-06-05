// =============================================================================
// features/medecin/components/etapes/Etape1Anamnese.tsx
// =============================================================================
import { FiSave, FiAlertCircle } from 'react-icons/fi'
import type { EtapeAnamnese } from '../../types'

interface Props {
  valeurs: EtapeAnamnese
  onChange: (v: EtapeAnamnese) => void
  onSauvegarder: () => void
  onSuivant: () => void
  loading: boolean
  erreur: string | null
  motifVisite: string | null
}

const MIN_CHARS = 20

export const Etape1Anamnese = ({
  valeurs,
  onChange,
  onSauvegarder,
  onSuivant,
  loading,
  erreur,
  motifVisite,
}: Props) => {
  const nbChars = valeurs.anamnese.trim().length
  const valide  = nbChars >= MIN_CHARS

  return (
    <div className="flex flex-col gap-4">
      {/* Motif pré-rempli si RDV */}
      {motifVisite && (
        <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <span className="text-indigo-400 mt-0.5 text-xs font-bold">RDV</span>
          <p className="text-xs text-indigo-700">
            Motif déclaré : <span className="font-semibold">{motifVisite}</span>
          </p>
        </div>
      )}

      {/* Champ anamnèse */}
      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
          Anamnèse <span className="text-red-500">*</span>
        </label>
        <textarea
          value={valeurs.anamnese}
          onChange={(e) => onChange({ anamnese: e.target.value })}
          rows={8}
          placeholder="Motif de consultation, histoire de la maladie, symptômes, durée, évolution…"
          className="w-full text-sm px-3 py-2.5 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-zinc-50 leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1">
          {erreur && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <FiAlertCircle size={12} />
              {erreur}
            </div>
          )}
          <p className={`text-[10px] ml-auto ${valide ? 'text-green-600' : 'text-zinc-400'}`}>
            {nbChars} / {MIN_CHARS} min
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
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
          disabled={!valide || loading}
          className="ml-auto text-sm font-semibold px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Suivant →
        </button>
      </div>
    </div>
  )
}
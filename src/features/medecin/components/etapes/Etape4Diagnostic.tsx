import { useState } from 'react'
import { FiAlertCircle, FiX, FiLoader, FiPlus } from 'react-icons/fi'
import type { EtapeDiagnostic } from '../../types'

interface Props {
  valeurs:       EtapeDiagnostic
  onChange:      (v: EtapeDiagnostic) => void
  onEnregistrer: () => void
  onPrecedent:   () => void
  loading:       boolean
  erreur:        string | null
}

export const Etape4Diagnostic = ({ valeurs, onChange, onEnregistrer, onPrecedent, loading, erreur }: Props) => {
  const [inputDiff, setInputDiff] = useState('')

  const set = <K extends keyof EtapeDiagnostic>(k: K, v: EtapeDiagnostic[K]) =>
    onChange({ ...valeurs, [k]: v })

  const ajouterDiff = () => {
    const val = inputDiff.trim()
    if (!val || valeurs.diagnostics_differentiels.includes(val)) return
    set('diagnostics_differentiels', [...valeurs.diagnostics_differentiels, val])
    setInputDiff('')
  }

  const supprimerDiff = (i: number) =>
    set('diagnostics_differentiels', valeurs.diagnostics_differentiels.filter((_, idx) => idx !== i))

  const valide = valeurs.diagnostic_principal.trim().length > 0

  return (
    <div className="flex flex-col gap-5">

      {/* Diagnostic principal */}
      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
          Diagnostic principal <span className="text-red-500">*</span>
        </label>
        <textarea value={valeurs.diagnostic_principal}
          onChange={e => set('diagnostic_principal', e.target.value)}
          rows={4} placeholder="Ex : Paludisme simple à Plasmodium falciparum…"
          className="w-full text-sm px-3 py-2.5 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-zinc-50 leading-relaxed" />
      </div>

      {/* Code CIM-10 */}
      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
          Code CIM-10 <span className="ml-1 font-normal text-zinc-400">(optionnel)</span>
        </label>
        <input type="text" value={valeurs.code_cim10}
          onChange={e => set('code_cim10', e.target.value.toUpperCase())}
          placeholder="Ex : B54, J18.9…"
          className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-zinc-50 font-mono" />
      </div>

      {/* Diagnostics différentiels */}
      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
          Diagnostics différentiels <span className="ml-1 font-normal text-zinc-400">(optionnel)</span>
        </label>
        {valeurs.diagnostics_differentiels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {valeurs.diagnostics_differentiels.map((d, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200">
                {d}
                <button onClick={() => supprimerDiff(i)} className="text-zinc-400 hover:text-red-500 transition">
                  <FiX size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input type="text" value={inputDiff}
            onChange={e => setInputDiff(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); ajouterDiff() } }}
            placeholder="Saisir + Entrée"
            className="flex-1 text-sm px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-zinc-50" />
          <button onClick={ajouterDiff} disabled={!inputDiff.trim()}
            className="p-2 border border-zinc-200 rounded-xl text-zinc-500 hover:border-[#1D9E75] transition disabled:opacity-40">
            <FiPlus size={14} />
          </button>
        </div>
      </div>

      {erreur && (
        <div className="flex items-center gap-1.5 text-xs text-red-500">
          <FiAlertCircle size={12} /> {erreur}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onPrecedent}
          className="text-xs px-3 py-2 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition">
          ← Précédent
        </button>
        <button onClick={onEnregistrer} disabled={!valide || loading}
          className="ml-auto text-sm font-semibold px-5 py-2 rounded-xl text-white transition disabled:opacity-40 flex items-center gap-2"
          style={{ background: '#1D9E75' }}>
          {loading
            ? <><FiLoader size={13} className="animate-spin" />Enregistrement…</>
            : 'Enregistrer →'
          }
        </button>
      </div>
    </div>
  )
}
import { FiHome, FiCalendar, FiAlertCircle, FiCheckCircle, FiClipboard, FiActivity } from 'react-icons/fi'
import type { EtapeDecision, DecisionFinale } from '../../types'

interface Props {
  valeurs:     EtapeDecision
  onChange:    (v: EtapeDecision) => void
  onTerminer:  () => void
  onPrecedent: () => void
  loading:     boolean
  erreur:      string | null
}

const OPTIONS: {
  valeur:       DecisionFinale
  label:        string
  description:  string
  icon:         React.ReactNode
  couleurActif: string
}[] = [
  {
    valeur:       'sortie',
    label:        'Sortie',
    description:  'Le patient peut rentrer chez lui',
    icon:         <FiHome size={18} />,
    couleurActif: 'border-green-400 bg-green-50 text-green-700',
  },
  {
    valeur:       'rendez_vous',
    label:        'Rendez-vous de suivi',
    description:  'Le patient doit revenir pour un suivi',
    icon:         <FiCalendar size={18} />,
    couleurActif: 'border-blue-400 bg-blue-50 text-blue-700',
  },
]

export const Etape6Decision = ({
  valeurs, onChange, onTerminer, onPrecedent, loading, erreur
}: Props) => {
  const set = <K extends keyof EtapeDecision>(k: K, v: EtapeDecision[K]) =>
    onChange({ ...valeurs, [k]: v })

  const valide = valeurs.decision !== ''

  return (
    <div className="flex flex-col gap-5">

      {/* ── Décision finale ───────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-zinc-600 mb-2">
          Décision finale <span className="text-red-500">*</span>
        </p>
        <div className="space-y-2">
          {OPTIONS.map(opt => {
            const actif = valeurs.decision === opt.valeur
            return (
              <button key={opt.valeur}
                onClick={() => onChange({ ...valeurs, decision: opt.valeur })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                  actif ? opt.couleurActif : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}>
                <span className={`flex-shrink-0 ${actif ? '' : 'text-zinc-400'}`}>{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{opt.description}</p>
                </div>
                {actif && <FiCheckCircle size={16} className="flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Date du rendez-vous (si rendez_vous) ──────── */}
      {valeurs.decision === 'rendez_vous' && (
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
            <FiCalendar className="inline mr-1" size={11} />
            Date du rendez-vous
            <span className="ml-1 font-normal text-zinc-400">(visible du patient)</span>
          </label>
          <input
            type="date"
            value={valeurs.date_rdv ?? ''}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => set('date_rdv', e.target.value)}
            className="w-full text-sm px-3 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-zinc-50"
          />
        </div>
      )}

      {/* ── Ordonnance médicaments ────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
          <FiClipboard className="inline mr-1" size={11} />
          Ordonnance / Médicaments prescrits
          <span className="ml-1 font-normal text-zinc-400">(visible du patient)</span>
        </label>
        <textarea
          value={valeurs.ordonnance_texte ?? ''}
          onChange={e => set('ordonnance_texte', e.target.value)}
          rows={3}
          placeholder="Ex : Quinine 500mg — 3x/jour pendant 7 jours&#10;Paracétamol 1g — si fièvre > 38.5°C"
          className="w-full text-sm px-3 py-2.5 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-zinc-50"
        />
      </div>

      {/* ── Examens complémentaires ───────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
          <FiActivity className="inline mr-1" size={11} />
          Examens complémentaires prescrits
          <span className="ml-1 font-normal text-zinc-400">(visible du patient)</span>
        </label>
        <textarea
          value={valeurs.examens_prescrits ?? ''}
          onChange={e => set('examens_prescrits', e.target.value)}
          rows={2}
          placeholder="Ex : Radiologie pulmonaire&#10;NFS + CRP + glycémie"
          className="w-full text-sm px-3 py-2.5 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-zinc-50"
        />
      </div>

      {/* ── Notes privées (non visibles du patient) ───── */}
      <div>
        <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
          Notes de clôture
          <span className="ml-1 font-normal text-zinc-400">(non visibles du patient — chiffrées C2)</span>
        </label>
        <textarea
          value={valeurs.notes_privees}
          onChange={e => set('notes_privees', e.target.value)}
          rows={3}
          placeholder="Observations confidentielles, remarques cliniques…"
          className="w-full text-sm px-3 py-2.5 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-zinc-50"
        />
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
        <button onClick={onTerminer} disabled={!valide || loading}
          className="ml-auto text-sm font-semibold px-5 py-2 rounded-xl text-white transition disabled:opacity-40 flex items-center gap-2"
          style={{ background: '#1D9E75' }}>
          {loading
            ? <><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Finalisation…</>
            : <><FiCheckCircle size={14} />Terminer la consultation</>}
        </button>
      </div>
    </div>
  )
}
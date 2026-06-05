import { useState } from 'react'
import { FiPause, FiX, FiAlertTriangle } from 'react-icons/fi'

interface Props {
  onConfirmer: (raison: string) => void
  onAnnuler:   () => void
  loading:     boolean
}

const MOTIFS = ['Pause déjeuner', 'Urgence médicale', 'Réunion de service', 'Problème technique']

export const PauseModal = ({ onConfirmer, onAnnuler, loading }: Props) => {
  const [raison, setRaison] = useState('')
  const valide = raison.trim().length >= 5

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 rounded-lg"><FiPause size={16} className="text-amber-600" /></span>
            <div>
              <p className="text-sm font-semibold text-zinc-800">Mettre en pause</p>
              <p className="text-xs text-zinc-400">La consultation sera sauvegardée</p>
            </div>
          </div>
          <button onClick={onAnnuler} disabled={loading} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition">
            <FiX size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <FiAlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">Un motif est obligatoire avant de changer de patient.</p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2">Motifs rapides</p>
            <div className="flex flex-wrap gap-1.5">
              {MOTIFS.map(m => (
                <button key={m} onClick={() => setRaison(m)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    raison === m ? 'text-white border-amber-500 bg-amber-500' : 'border-zinc-200 text-zinc-600 hover:border-amber-400'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1.5">Motif personnalisé</p>
            <textarea value={raison} onChange={e => setRaison(e.target.value)}
              rows={3} placeholder="Motif de la pause…"
              className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 bg-zinc-50" />
            <p className={`text-[10px] mt-1 text-right ${valide ? 'text-green-500' : 'text-zinc-400'}`}>
              {raison.trim().length} / 5 min
            </p>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onAnnuler} disabled={loading}
            className="flex-1 text-sm font-medium px-4 py-2.5 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition">
            Annuler
          </button>
          <button onClick={() => valide && !loading && onConfirmer(raison.trim())}
            disabled={!valide || loading}
            className="flex-1 text-sm font-semibold px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition disabled:opacity-40 flex items-center justify-center gap-2">
            {loading
              ? <><span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Pause…</>
              : <><FiPause size={14} />Confirmer</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
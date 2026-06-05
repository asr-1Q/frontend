import { FiClock, FiAlertCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'
import type { PatientAttente, NiveauUrgence, StatutVisite } from '../types'
import type { FiltresFile } from '../hooks/useMedecin'

interface Props {
  visites:         PatientAttente[]
  loading:         boolean
  erreur:          string | null
  filtres:         FiltresFile
  onSetFiltre:     <K extends keyof FiltresFile>(k: K, v: FiltresFile[K]) => void
  onReinitFiltres: () => void
  medecinId:       number
  visiteActiveId:  number | null
  onOuvrir:        (visite: PatientAttente) => void
  onReprendre:     (visite: PatientAttente) => void
  onRefresh:       () => void
}

const URGENCE_STYLE: Record<NiveauUrgence, { dot: string; badge: string; label: string }> = {
  critique:   { dot: 'bg-red-500 animate-pulse',    badge: 'bg-red-100 text-red-700',    label: 'Critique'   },
  urgent:     { dot: 'bg-orange-500',               badge: 'bg-orange-100 text-orange-700', label: 'Urgent'  },
  semi_urgent:{ dot: 'bg-yellow-500',               badge: 'bg-yellow-100 text-yellow-700', label: 'Semi-urgent' },
  normal:     { dot: 'bg-green-500',                badge: 'bg-green-100 text-green-700', label: 'Normal'    },
}

const STATUT_BADGE: Partial<Record<StatutVisite, { label: string; cls: string }>> = {
  en_attente_medecin: { label: 'En attente',      cls: 'bg-zinc-100 text-zinc-600'    },
  en_consultation:    { label: 'En consultation', cls: 'bg-blue-100 text-blue-700'    },
  en_pause:           { label: 'En pause',        cls: 'bg-zinc-200 text-zinc-500'    },
  termine:            { label: 'Terminé',         cls: 'bg-green-100 text-green-700'  },
}

const formatHeure = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const CartePatient = ({
  visite, estActive, onOuvrir, onReprendre,
}: {
  visite: PatientAttente; estActive: boolean
  onOuvrir: () => void;   onReprendre: () => void
}) => {
  const urgence = URGENCE_STYLE[visite.niveau_urgence] ?? URGENCE_STYLE.normal
  const badge   = STATUT_BADGE[visite.statut]

  const peutOuvrir    = visite.statut === 'en_attente_medecin'
  const peutReprendre = visite.statut === 'en_pause' || visite.statut === 'en_consultation'

  return (
    <div className={`bg-white rounded-xl border transition-all shadow-sm ${
      estActive ? 'border-[#1D9E75] shadow-md shadow-green-100' : 'border-zinc-200'
    } ${visite.urgence ? 'ring-1 ring-red-400' : ''}`}>
      <div className="p-3">

        {/* Ligne 1 — ticket + urgence + statut */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-400">
              #{String(visite.ticket_numero).padStart(3, '0')}
            </span>
            <span className={`size-2 rounded-full ${urgence.dot}`} />
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${urgence.badge}`}>
              {urgence.label}
            </span>
          </div>
          {badge && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Ligne 2 — nom masqué */}
        <p className="text-sm font-semibold text-zinc-800 truncate">
          {visite.prenom_masque} {visite.nom_masque}
          {visite.urgence && <span className="ml-1 text-red-500 text-xs">🚨</span>}
        </p>
        <p className="text-xs text-zinc-400 font-mono">{visite.cpu}</p>

        {/* Ligne 3 — constantes */}
        {(visite.temperature || visite.tension_systolique || visite.spo2 || visite.score_urgence) && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {visite.temperature        && <span className="text-[10px] text-zinc-500">🌡 {visite.temperature}°C</span>}
            {visite.tension_systolique && <span className="text-[10px] text-zinc-500">💉 {visite.tension_systolique}/{visite.tension_diastolique}</span>}
            {visite.spo2               && <span className="text-[10px] text-zinc-500">O₂ {visite.spo2}%</span>}
            {visite.score_urgence      && <span className="text-[10px] font-semibold text-orange-600">Score {visite.score_urgence}/10</span>}
          </div>
        )}

        {visite.allergies_texte && (
          <p className="text-[10px] text-red-600 font-medium mt-1">⚠ {visite.allergies_texte}</p>
        )}

        {visite.motif_detaille && (
          <p className="text-[10px] text-zinc-500 mt-1 truncate italic">"{visite.motif_detaille}"</p>
        )}

        {/* Ligne 4 — heure + actions */}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1 text-[10px] text-zinc-400">
            <FiClock size={10} />
            <span>{formatHeure(visite.created_at)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {peutOuvrir && (
              <button onClick={onOuvrir}
                className="text-xs font-semibold px-3 py-1 rounded-lg text-white transition"
                style={{ background: '#1D9E75' }}>
                Ouvrir
              </button>
            )}
            {peutReprendre && (
              <button onClick={onReprendre}
                className="text-xs font-semibold px-3 py-1 rounded-lg text-white bg-amber-500 hover:bg-amber-600 transition">
                Reprendre
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const ListePatientsAttente = ({
  visites, loading, erreur, filtres, onSetFiltre, onReinitFiltres,
  medecinId: _medecinId, visiteActiveId, onOuvrir, onReprendre, onRefresh,
}: Props) => {
  const hasFiltres = filtres.urgence !== '' || filtres.statut !== ''

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-zinc-700">
          File d'attente
          <span className="ml-2 text-xs font-normal text-zinc-400">({visites.length})</span>
        </p>
        <button onClick={onRefresh} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 transition">
          <FiRefreshCw size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        <input type="text" value={filtres.recherche}
          onChange={e => onSetFiltre('recherche', e.target.value)}
          placeholder="CPU, ticket…"
          className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-zinc-50" />
        <div className="flex gap-2">
          <select value={filtres.urgence}
            onChange={e => onSetFiltre('urgence', e.target.value as FiltresFile['urgence'])}
            className="flex-1 text-xs px-2 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50 focus:outline-none">
            <option value="">Urgence</option>
            <option value="critique">Critique</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>
          <select value={filtres.statut}
            onChange={e => onSetFiltre('statut', e.target.value as FiltresFile['statut'])}
            className="flex-1 text-xs px-2 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50 focus:outline-none">
            <option value="">Statut</option>
            <option value="en_attente_medecin">En attente</option>
            <option value="en_consultation">En consultation</option>
            <option value="en_pause">En pause</option>
          </select>
          {hasFiltres && (
            <button onClick={onReinitFiltres} className="text-xs text-zinc-400 hover:text-red-500 px-1">✕</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading && [...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-100 p-3 animate-pulse">
            <div className="h-3 w-24 bg-zinc-100 rounded mb-2" />
            <div className="h-4 w-36 bg-zinc-100 rounded mb-1" />
            <div className="h-3 w-28 bg-zinc-100 rounded" />
          </div>
        ))}

        {!loading && erreur && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <FiAlertCircle size={24} className="text-red-400" />
            <p className="text-xs text-red-500">{erreur}</p>
            <button onClick={onRefresh} className="text-xs text-blue-600 hover:underline">Réessayer</button>
          </div>
        )}

        {!loading && !erreur && visites.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <FiCheckCircle size={24} className="text-zinc-300" />
            <p className="text-xs text-zinc-400">
              {hasFiltres ? 'Aucun résultat pour ces filtres' : 'Aucun patient en attente'}
            </p>
          </div>
        )}

        {!loading && !erreur && visites.map(v => (
          <CartePatient key={v.visite_id} visite={v}
            estActive={v.visite_id === visiteActiveId}
            onOuvrir={() => onOuvrir(v)}
            onReprendre={() => onReprendre(v)}
          />
        ))}
      </div>
    </div>
  )
}
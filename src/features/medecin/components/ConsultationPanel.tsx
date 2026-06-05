/**
 * ConsultationPanel.tsx
 * Panneau droit médecin — 3 onglets :
 * 1. Consultation (stepper 4 étapes)
 * 2. Historique (visites précédentes)
 * 3. Dossier C0 (infos patient)
 */
import { useState } from 'react'
import {
  FiUser, FiPhone, FiAlertTriangle, FiChevronDown, FiChevronUp,
  FiCheckCircle, FiActivity, FiPause, FiClock, FiFileText, FiHeart
} from 'react-icons/fi'
import type { ConsultationHookReturn } from '../hooks/useConsultation'
import { Etape1Anamnese }       from './etapes/Etape1Anamnese'
import { Etape2ExamenClinique } from './etapes/Etape2ExamenClinique'
import { Etape4Diagnostic }     from './etapes/Etape4Diagnostic'
import { Etape6Decision }       from './etapes/Etape6Decision'
import { PauseModal }           from './PauseModal'

interface Props { hook: ConsultationHookReturn }

type Onglet = 'consultation' | 'historique' | 'dossier'

// ─── Stepper ──────────────────────────────────────────────
const ETAPES = ['Anamnèse', 'Examen', 'Diagnostic', 'Décision']

const StepperHeader = ({ etapeCourante, etapesValidees, onAllerEtape }: {
  etapeCourante: number; etapesValidees: number[]; onAllerEtape: (n: number) => void
}) => (
  <div className="flex items-center gap-1 overflow-x-auto pb-1">
    {ETAPES.map((label, i) => {
      const num    = i + 1
      const actif  = etapeCourante === num
      const valide = etapesValidees.includes(num)
      return (
        <button key={num} onClick={() => onAllerEtape(num)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition flex-shrink-0 ${
            actif  ? 'bg-blue-600 text-white' :
            valide ? 'bg-green-50 text-green-700 border border-green-200' :
                     'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
          }`}>
          {valide && !actif
            ? <FiCheckCircle size={10} />
            : <span className={`size-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                actif ? 'bg-white/20' : 'bg-zinc-300/50'
              }`}>{num}</span>
          }
          <span>{label}</span>
        </button>
      )
    })}
  </div>
)

// ─── En-tête patient ──────────────────────────────────────
const EnTetePatient = ({ hook, onPause }: { hook: ConsultationHookReturn; onPause: () => void }) => {
  const { dossier } = hook
  if (!dossier) return null
  const { patient, constantes } = dossier
  const [open, setOpen] = useState(false)

  const age = patient.date_naissance
    ? Math.floor((Date.now() - new Date(patient.date_naissance).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  return (
    <div className="border-b border-zinc-200 bg-white flex-shrink-0">
      {patient.allergies && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-600">
          <FiAlertTriangle size={14} className="text-white flex-shrink-0" />
          <p className="text-xs font-bold text-white">ALLERGIES : {patient.allergies}</p>
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {patient.prenom?.[0]}{patient.nom?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-800 truncate">{patient.prenom} {patient.nom}</p>
              <p className="text-[10px] text-zinc-500">
                {patient.cpu}
                {age ? ` · ${age} ans` : ''}
                {patient.sexe === 'M' ? ' · Homme' : patient.sexe === 'F' ? ' · Femme' : ''}
                {patient.groupe_sanguin ? ` · ${patient.groupe_sanguin}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={onPause}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition">
              <FiPause size={12} />
              <span className="hidden sm:inline">Pause</span>
            </button>
            {patient.telephone && (
              <a href={`tel:${patient.telephone}`}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-green-600 hover:bg-green-50 transition">
                <FiPhone size={15} />
              </a>
            )}
            <button onClick={() => setOpen(v => !v)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition">
              {open ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Constantes C1 */}
        {constantes && (
          <div className="flex flex-wrap gap-2 mt-2">
            {constantes.temperature         && <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600">🌡 {constantes.temperature}°C</span>}
            {constantes.tension_systolique  && <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600">💉 {constantes.tension_systolique}/{constantes.tension_diastolique}</span>}
            {constantes.spo2                && <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600">O₂ {constantes.spo2}%</span>}
            {constantes.frequence_cardiaque && <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600"><FiActivity size={9} className="inline mr-0.5" />{constantes.frequence_cardiaque} bpm</span>}
            {constantes.score_urgence       && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">Score {constantes.score_urgence}/10</span>}
            {constantes.motif_detaille      && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full truncate max-w-[180px]">{constantes.motif_detaille}</span>}
          </div>
        )}

        {/* Accordéon pathologies */}
        {open && patient.pathologies && (
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">Pathologies chroniques</p>
            <p className="text-xs text-zinc-700">{patient.pathologies}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Onglet Historique ────────────────────────────────────
const OngletHistorique = ({ hook }: { hook: ConsultationHookReturn }) => {
  const { dossier } = hook
  if (!dossier) return null
  const { historique_visites } = dossier

  if (!historique_visites || historique_visites.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FiClock size={28} className="text-zinc-200 mb-3" />
      <p className="text-sm text-zinc-400 font-medium">Aucun antécédent</p>
      <p className="text-xs text-zinc-300 mt-1">C'est la première visite de ce patient</p>
    </div>
  )

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
        {historique_visites.length} visite(s) précédente(s)
      </p>
      {historique_visites.map(v => (
        <div key={v.id} className="border border-zinc-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-50">
            <p className="text-xs font-semibold text-zinc-700">
              {new Date(v.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </p>
            <span className="text-[10px] bg-white border border-zinc-200 px-2 py-0.5 rounded-full text-zinc-500">
              {v.type_visite}
            </span>
          </div>
          <div className="px-3 py-2 space-y-1.5 bg-white">
            {v.motif_visite && (
              <p className="text-xs text-zinc-600">
                <span className="font-medium text-zinc-500">Motif :</span> {v.motif_visite}
              </p>
            )}
            {v.diagnostic_principal && (
              <div className="bg-blue-50 rounded-lg px-2 py-1.5">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Diagnostic</p>
                <p className="text-xs text-blue-800">{v.diagnostic_principal}</p>
                {v.code_cim10 && <p className="text-[10px] text-blue-400 font-mono mt-0.5">{v.code_cim10}</p>}
              </div>
            )}
            {v.decision_finale && (
              <p className="text-xs text-zinc-600">
                <span className="font-medium text-zinc-500">Décision :</span>{' '}
                {v.decision_finale === 'sortie' ? '🏠 Sortie' : '📅 Rendez-vous de suivi'}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Onglet Dossier C0 ───────────────────────────────────
const OngletDossierC0 = ({ hook }: { hook: ConsultationHookReturn }) => {
  const { dossier } = hook
  if (!dossier) return null
  const { patient } = dossier

  const age = patient.date_naissance
    ? Math.floor((Date.now() - new Date(patient.date_naissance).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  const InfoRow = ({ label, value, danger }: { label: string; value: string | null; danger?: boolean }) => (
    <div className="flex items-start justify-between py-2 border-b border-zinc-50 last:border-0">
      <span className="text-xs text-zinc-400 font-medium flex-shrink-0 w-32">{label}</span>
      <span className={`text-xs font-semibold text-right ${danger ? 'text-red-600' : 'text-zinc-700'}`}>
        {value || '—'}
      </span>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Identité */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2 flex items-center gap-1">
          <FiUser size={10} /> Identité — C0
        </p>
        <div className="bg-zinc-50 rounded-xl px-3">
          <InfoRow label="Nom complet"    value={`${patient.prenom} ${patient.nom}`} />
          <InfoRow label="CPU"            value={patient.cpu} />
          <InfoRow label="Date naissance" value={patient.date_naissance
            ? `${new Date(patient.date_naissance).toLocaleDateString('fr-FR')}${age ? ` (${age} ans)` : ''}`
            : null} />
          <InfoRow label="Sexe"           value={patient.sexe === 'M' ? 'Masculin' : patient.sexe === 'F' ? 'Féminin' : null} />
          <InfoRow label="Téléphone"      value={patient.telephone} />
        </div>
      </div>

      {/* Urgence */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2 flex items-center gap-1">
          <FiHeart size={10} /> Informations d'urgence — C0
        </p>
        <div className="bg-zinc-50 rounded-xl px-3">
          <InfoRow label="Groupe sanguin" value={patient.groupe_sanguin} />
          <InfoRow label="Allergies"      value={patient.allergies} danger={!!patient.allergies} />
          <InfoRow label="Pathologies"    value={patient.pathologies} />
          <InfoRow label="Contact urg."   value={patient.contact_urgence_nom
            ? `${patient.contact_urgence_nom}${patient.contact_urgence_telephone ? ` — ${patient.contact_urgence_telephone}` : ''}`
            : null} />
        </div>
      </div>
    </div>
  )
}

// ─── Modal confirmation fin ───────────────────────────────
const ModalConfirmFin = ({ onConfirmer, onAnnuler, loading }: {
  onConfirmer: () => void; onAnnuler: () => void; loading: boolean
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="p-2.5 bg-green-100 rounded-xl">
          <FiCheckCircle size={20} className="text-green-600" />
        </span>
        <div>
          <p className="text-sm font-bold text-zinc-800">Terminer la consultation ?</p>
          <p className="text-xs text-zinc-400">Cette action est irréversible</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onAnnuler} disabled={loading}
          className="flex-1 text-sm font-medium px-4 py-2.5 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition">
          Annuler
        </button>
        <button onClick={onConfirmer} disabled={loading}
          className="flex-1 text-sm font-semibold px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
          {loading
            ? <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <FiCheckCircle size={14} />
          }
          Confirmer
        </button>
      </div>
    </div>
  </div>
)

// ─── Composant principal ──────────────────────────────────
export const ConsultationPanel = ({ hook }: Props) => {
  const [showPause,    setShowPause]    = useState(false)
  const [onglet,       setOnglet]       = useState<Onglet>('consultation')

  if (!hook.dossier) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
      <div className="size-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
        <FiUser size={28} className="text-zinc-300" />
      </div>
      <p className="text-sm font-semibold text-zinc-500">Aucun dossier ouvert</p>
      <p className="text-xs text-zinc-400 max-w-xs">
        Sélectionnez un patient dans la file d'attente pour démarrer une consultation
      </p>
    </div>
  )

  const {
    dossier, etapeCourante, etapesValidees, allerEtape, validerEtapeActuelle,
    anamnese, setAnamnese, examenClinique, setExamenClinique,
    diagnostic, setDiagnostic, decision, setDecision,
    loadingAction, erreurAction, showConfirmFin, setShowConfirmFin,
    sauvegarder, pauserConsultation, enregistrerDiag, terminer,
  } = hook

  const ONGLETS_CONFIG: { id: Onglet; label: string; icon: React.ReactNode }[] = [
    { id: 'consultation', label: 'Consultation', icon: <FiFileText size={12} /> },
    { id: 'historique',   label: `Historique (${dossier.historique_visites?.length ?? 0})`, icon: <FiClock size={12} /> },
    { id: 'dossier',      label: 'Dossier C0',  icon: <FiUser size={12} /> },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* En-tête patient */}
      <EnTetePatient hook={hook} onPause={() => setShowPause(true)} />

      {/* Onglets */}
      <div className="flex border-b border-zinc-200 bg-white flex-shrink-0 px-3 pt-2">
        {ONGLETS_CONFIG.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition mr-1 ${
              onglet === o.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}>
            {o.icon} {o.label}
          </button>
        ))}
      </div>

      {/* Stepper — affiché uniquement dans l'onglet consultation */}
      {onglet === 'consultation' && (
        <div className="px-4 pt-3 pb-2 border-b border-zinc-100 bg-white flex-shrink-0">
          <StepperHeader
            etapeCourante={etapeCourante}
            etapesValidees={etapesValidees}
            onAllerEtape={allerEtape}
          />
        </div>
      )}

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ── Onglet Consultation ── */}
        {onglet === 'consultation' && (
          <>
            {etapeCourante === 1 && (
              <Etape1Anamnese
                valeurs={anamnese} onChange={setAnamnese}
                onSauvegarder={sauvegarder} onSuivant={validerEtapeActuelle}
                loading={loadingAction} erreur={erreurAction}
                motifVisite={dossier.consultation.notes_privees ?? null}
              />
            )}
            {etapeCourante === 2 && (
              <Etape2ExamenClinique
                valeurs={examenClinique} onChange={setExamenClinique}
                onSauvegarder={sauvegarder} onSuivant={validerEtapeActuelle}
                onPrecedent={() => allerEtape(1)} loading={loadingAction}
              />
            )}
            {etapeCourante === 3 && (
              <Etape4Diagnostic
                valeurs={diagnostic} onChange={setDiagnostic}
                onEnregistrer={enregistrerDiag} onPrecedent={() => allerEtape(2)}
                loading={loadingAction} erreur={erreurAction}
              />
            )}
            {etapeCourante === 4 && (
              <Etape6Decision
                valeurs={decision} onChange={setDecision}
                onTerminer={() => setShowConfirmFin(true)}
                onPrecedent={() => allerEtape(3)}
                loading={loadingAction} erreur={erreurAction}
              />
            )}
          </>
        )}

        {/* ── Onglet Historique ── */}
        {onglet === 'historique' && <OngletHistorique hook={hook} />}

        {/* ── Onglet Dossier C0 ── */}
        {onglet === 'dossier' && <OngletDossierC0 hook={hook} />}
      </div>

      {/* Modals */}
      {showPause && (
        <PauseModal
          onConfirmer={async (raison) => { await pauserConsultation(raison); setShowPause(false) }}
          onAnnuler={() => setShowPause(false)}
          loading={loadingAction}
        />
      )}
      {showConfirmFin && (
        <ModalConfirmFin
          onConfirmer={terminer}
          onAnnuler={() => setShowConfirmFin(false)}
          loading={loadingAction}
        />
      )}
    </div>
  )
}
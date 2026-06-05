/**
 * AccueilAumtTab.tsx
 * Onglet AUMT de l'agent d'accueil.
 * Flux :
 *  1. Recherche un patient
 *  2. Choisit un soignant (médecin ou infirmier)
 *  3. Sélectionne le motif (liste prédéfinie ou "Autre")
 *  4. Confirmation avec avertissement juridique
 *  5. Succès — log immuable créé
 *
 * Règle : 1 seul accès AUMT par dossier patient par journée.
 */

import { useState, useEffect } from 'react'
import {
  FiSearch, FiUser, FiShield, FiAlertTriangle, FiCheck, FiChevronRight
} from 'react-icons/fi'
import api from '@/lib/axios'

// ─── Motifs prédéfinis ────────────────────────────────────────
const MOTIFS_PREDEFINIS = [
  {
    id:    'accident',
    emoji: '',
    label: 'Accident / Traumatisme',
    texte: "Patient victime d'un accident ou traumatisme nécessitant un accès immédiat aux antécédents médicaux pour éviter toute erreur de traitement.",
  },
  {
    id:    'inconscient',
    emoji: '',
    label: 'Patient inconscient / Non communicant',
    texte: "Patient inconscient ou dans l'incapacité de communiquer ses antécédents. Accès nécessaire pour une prise en charge sécurisée.",
  },
  {
    id:    'allergie',
    emoji: '',
    label: 'Risque allergique inconnu',
    texte: 'Prescription imminente d\'un traitement avec risque allergique potentiel. Accès aux antécédents requis avant administration.',
  },
  {
    id:    'chirurgie',
    emoji: '🔬',
    label: 'Intervention chirurgicale urgente',
    texte: "Intervention chirurgicale d'urgence nécessitant la consultation complète du dossier médical avant anesthésie.",
  },
  {
    id:    'transfert',
    emoji: '',
    label: 'Transfert inter-établissement',
    texte: "Patient transféré d'un autre établissement sans dossier physique. Accès requis pour assurer la continuité des soins.",
  },
  {
    id:    'autre',
    emoji: '',
    label: 'Autre motif',
    texte: '',
  },
]

// ─── Types locaux ─────────────────────────────────────────────
interface PatientResult {
  id:              number
  cpu:             string
  nom:             string
  prenom:          string
  groupe_sanguin:  string | null
  allergies_texte: string | null
  telephone:       string | null
}

interface Personnel {
  id:              number
  nom:             string
  prenom:          string
  role:            'medecin' | 'infirmier'
  statut_presence: string
}

type Etape = 'recherche' | 'personnel' | 'motif' | 'confirmation' | 'succes'

// ─── Helpers ──────────────────────────────────────────────────
const roleBadge = (role: string) =>
  role === 'medecin' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'

const roleLabel = (role: string) =>
  role === 'medecin' ? 'Médecin' : 'Infirmier'

const statutDot = (s: string) => {
  if (s === 'disponible') return 'bg-green-400'
  if (s === 'occupe')     return 'bg-orange-400'
  return 'bg-zinc-300'
}

// ══════════════════════════════════════════════════════════════
export default function AccueilAumtTab() {
  const [etape,            setEtape]            = useState<Etape>('recherche')
  const [query,            setQuery]            = useState('')
  const [patients,         setPatients]         = useState<PatientResult[]>([])
  const [searching,        setSearching]        = useState(false)
  const [patientSelec,     setPatientSelec]     = useState<PatientResult | null>(null)
  const [personnel,        setPersonnel]        = useState<Personnel[]>([])
  const [loadPersonnel,    setLoadPersonnel]    = useState(false)
  const [soignantSelec,    setSoignantSelec]    = useState<Personnel | null>(null)
  const [motif,            setMotif]            = useState('')
  const [motifSelectionne, setMotifSelectionne] = useState<string | null>(null)
  const [loading,          setLoading]          = useState(false)
  const [erreur,           setErreur]           = useState<string | null>(null)
  const [resultat,         setResultat]         = useState<{ aumt_id: number; expire_min: number } | null>(null)

  const inputCls = 'w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent'
  const etapes   = ['Patient', 'Personnel', 'Motif', 'Confirmation']
  const etapeIdx = { recherche: 0, personnel: 1, motif: 2, confirmation: 3, succes: 4 }[etape]

  // ── Recherche patient avec debounce ────────────────────────
  useEffect(() => {
    if (query.length < 2) { setPatients([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get('/accueil/patients/recherche', { params: { q: query } })
        setPatients(data.patients ?? [])
      } catch { setPatients([]) }
      finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  // ── Charger le personnel ───────────────────────────────────
  const chargerPersonnel = async () => {
    setLoadPersonnel(true)
    try {
      const { data } = await api.get('/aumt/personnel')
      setPersonnel(data.personnel ?? [])
    } catch { setPersonnel([]) }
    finally { setLoadPersonnel(false) }
  }

  const selectionnerPatient = (p: PatientResult) => {
    setPatientSelec(p)
    setEtape('personnel')
    chargerPersonnel()
  }

  const selectionnerSoignant = (s: Personnel) => {
    setSoignantSelec(s)
    setEtape('motif')
  }

  // ── Valider motif → confirmation ───────────────────────────
  const handleValider = () => {
    if (!motifSelectionne) {
      setErreur('Veuillez sélectionner un motif')
      return
    }
    if (motifSelectionne === 'autre' && motif.trim().length < 20) {
      setErreur(`Motif trop court — ${motif.trim().length}/20 caractères minimum`)
      return
    }
    setErreur(null)
    setEtape('confirmation')
  }

  // ── Confirmer → appel API ──────────────────────────────────
  const handleConfirmer = async () => {
    if (!patientSelec || !soignantSelec) return
    setLoading(true)
    setErreur(null)
    try {
      const { data } = await api.post('/aumt/attribuer', {
        patient_cpu:   patientSelec.cpu,
        soignant_id:   soignantSelec.id,
        motif_urgence: motif,
      })
      setResultat({ aumt_id: data.aumt_id, expire_min: data.expire_dans_min })
      setEtape('succes')
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } }
      const msg = err.response?.data?.message ?? 'Erreur serveur'
      setErreur(msg)
      // Doublon journée → retour étape motif avec message visible
      if (err.response?.status === 409) {
        setEtape('motif')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Reset complet ──────────────────────────────────────────
  const reset = () => {
    setEtape('recherche')
    setQuery('')
    setPatients([])
    setPatientSelec(null)
    setSoignantSelec(null)
    setMotif('')
    setMotifSelectionne(null)
    setErreur(null)
    setResultat(null)
  }

  // ════════════════════════════════════════════════════════════
  // ÉTAPE : SUCCÈS
  // ════════════════════════════════════════════════════════════
  if (etape === 'succes' && resultat) return (
    <div className="max-w-lg mx-auto space-y-5 py-4">
      <div className="text-center space-y-3">
        <div className="size-16 rounded-full mx-auto flex items-center justify-center" style={{ background: '#E1F5EE' }}>
          <FiCheck size={30} style={{ color: '#1D9E75' }} />
        </div>
        <p className="text-lg font-bold text-zinc-800">Accès AUMT attribué</p>
        <p className="text-sm text-zinc-500">
          Référence : <strong className="font-mono text-zinc-700">AUMT #{resultat.aumt_id}</strong>
        </p>
      </div>

      <div className="rounded-xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
        <Row label="Patient"     value={`${patientSelec?.prenom} ${patientSelec?.nom} — ${patientSelec?.cpu}`} />
        <Row label="Soignant"    value={`${roleLabel(soignantSelec?.role ?? '')} ${soignantSelec?.prenom} ${soignantSelec?.nom}`} />
        <Row label="Expire dans" value={`${resultat.expire_min} minutes`} />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <FiAlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm font-bold text-amber-800">Avertissement — Traçabilité permanente</p>
        </div>
        <p className="text-xs text-amber-700 leading-relaxed">
          Cet accès est <strong>enregistré définitivement</strong> dans les journaux immuables du système.
          Le patient a été notifié par SMS. Si les informations médicales sont utilisées à mauvais escient,
          le soignant et l'établissement s'exposent à des <strong>poursuites judiciaires</strong> conformément
          à la loi N°2010/012 sur la cybersécurité au Cameroun.
        </p>
        <p className="text-xs text-amber-600 font-semibold">
          ✓ Patient notifié · ✓ Admin IT alerté · ✓ Log immuable créé
        </p>
      </div>

      <button onClick={reset}
        className="w-full py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition">
        Nouvel accès AUMT
      </button>
    </div>
  )

  // ════════════════════════════════════════════════════════════
  // ÉTAPE : CONFIRMATION
  // ════════════════════════════════════════════════════════════
  if (etape === 'confirmation') return (
    <div className="max-w-lg mx-auto space-y-5 py-4">
      <StepBar etapes={etapes} actif={etapeIdx} />

      <div className="flex items-center gap-3 pb-2 border-b border-zinc-100">
        <div className="size-10 rounded-full flex items-center justify-center" style={{ background: '#FEF3C7' }}>
          <FiAlertTriangle size={18} className="text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-zinc-800">Confirmer l'attribution AUMT</p>
          <p className="text-xs text-zinc-400">Cette action sera tracée de façon permanente</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
        <Row label="Patient"
          value={`${patientSelec?.prenom} ${patientSelec?.nom}`}
          sub={patientSelec?.cpu} />
        {patientSelec?.allergies_texte && (
          <Row label="⚠ Allergies" value={patientSelec.allergies_texte} danger />
        )}
        <Row label="Soignant désigné"
          value={`${soignantSelec?.prenom} ${soignantSelec?.nom}`}
          sub={roleLabel(soignantSelec?.role ?? '')} />
        <Row label="Motif d'urgence" value={motif} />
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
        <p className="text-xs font-bold text-red-700 uppercase tracking-wide">⚠ Conséquences légales</p>
        <p className="text-xs text-red-600 leading-relaxed">
          En confirmant, vous déclarez agir dans le cadre d'une <strong>urgence médicale réelle</strong>.
          Le patient sera notifié immédiatement par SMS. Tout usage abusif des informations médicales
          constitue une violation du secret médical et engage votre responsabilité pénale.
          Cet accès est <strong>journalisé de façon immuable</strong> et ne peut être effacé.
        </p>
      </div>

      {erreur && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <FiAlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{erreur}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setEtape('motif')} disabled={loading}
          className="flex-1 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition disabled:opacity-50">
          ← Modifier
        </button>
        <button onClick={handleConfirmer} disabled={loading}
          className="flex-1 py-2.5 rounded-lg text-white font-semibold transition disabled:opacity-50"
          style={{ background: '#DC2626' }}>
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Attribution…
              </span>
            : "Confirmer l'attribution"
          }
        </button>
      </div>
    </div>
  )

  // ════════════════════════════════════════════════════════════
  // ÉTAPE : MOTIF
  // ════════════════════════════════════════════════════════════
  if (etape === 'motif') return (
    <div className="max-w-lg mx-auto space-y-5 py-4">
      <StepBar etapes={etapes} actif={etapeIdx} />
      <button onClick={() => setEtape('personnel')} className="text-sm text-zinc-400 hover:text-zinc-600">← Retour</button>

      <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <FiUser size={13} className="text-zinc-400" />
          <span className="font-semibold text-zinc-700">{patientSelec?.prenom} {patientSelec?.nom}</span>
          <span className="font-mono text-xs text-zinc-400">{patientSelec?.cpu}</span>
        </div>
        {patientSelec?.allergies_texte && (
          <p className="text-xs text-red-600 font-medium">⚠ Allergies : {patientSelec.allergies_texte}</p>
        )}
        <div className="flex items-center gap-2 text-sm border-t border-zinc-200 pt-2 mt-2">
          <FiShield size={13} className="text-blue-500" />
          <span className="text-zinc-600">
            {roleLabel(soignantSelec?.role ?? '')} — {soignantSelec?.prenom} {soignantSelec?.nom}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-2">
          Motif d'urgence médicale *
        </label>
        <div className="space-y-2">
          {MOTIFS_PREDEFINIS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                if (m.id === 'autre') {
                  setMotifSelectionne('autre')
                  setMotif('')
                } else {
                  setMotifSelectionne(m.id)
                  setMotif(m.texte)
                }
                setErreur(null)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                motifSelectionne === m.id
                  ? 'border-[#1D9E75] bg-[#E1F5EE] text-[#0F6E56]'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <span className="text-lg flex-shrink-0">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{m.label}</p>
                {m.id !== 'autre' && (
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{m.texte}</p>
                )}
              </div>
              {motifSelectionne === m.id && (
                <span className="size-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1D9E75' }}>
                  <FiCheck size={11} color="white" />
                </span>
              )}
            </button>
          ))}
        </div>

        {motifSelectionne === 'autre' && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Précisez le motif *
              <span className={`ml-2 font-mono ${motif.trim().length >= 20 ? 'text-green-600' : 'text-red-500'}`}>
                {motif.trim().length}/20 min
              </span>
            </label>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              rows={3}
              placeholder="Décrivez précisément la situation d'urgence…"
              className={`${inputCls} resize-none`}
              autoFocus
            />
          </div>
        )}

        <p className="text-xs text-zinc-400 mt-2">
          Ce motif sera enregistré définitivement dans les journaux d'audit.
        </p>
      </div>

      {erreur && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <FiAlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{erreur}</p>
        </div>
      )}

      <button
        onClick={handleValider}
        disabled={!motifSelectionne || (motifSelectionne === 'autre' && motif.trim().length < 20)}
        className="w-full py-2.5 rounded-lg text-white font-semibold transition disabled:opacity-50"
        style={{ background: '#1D9E75' }}>
        Vérifier et confirmer →
      </button>
    </div>
  )

  // ════════════════════════════════════════════════════════════
  // ÉTAPE : CHOIX DU PERSONNEL
  // ════════════════════════════════════════════════════════════
  if (etape === 'personnel') return (
    <div className="max-w-lg mx-auto space-y-4 py-4">
      <StepBar etapes={etapes} actif={etapeIdx} />
      <button onClick={() => setEtape('recherche')} className="text-sm text-zinc-400 hover:text-zinc-600">← Retour</button>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
        <div className="size-10 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
             style={{ background: '#1D9E75' }}>
          {patientSelec?.prenom?.[0]}{patientSelec?.nom?.[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-zinc-800 text-sm">{patientSelec?.prenom} {patientSelec?.nom}</p>
          <p className="text-xs text-zinc-400 font-mono">{patientSelec?.cpu}</p>
          {patientSelec?.allergies_texte && (
            <p className="text-xs text-red-500 font-medium">⚠ {patientSelec.allergies_texte}</p>
          )}
        </div>
        {patientSelec?.groupe_sanguin && (
          <span className="ml-auto text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded-full">
            {patientSelec.groupe_sanguin}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-zinc-700">Choisir le personnel autorisé</p>

      {loadPersonnel && <p className="text-sm text-zinc-400 text-center py-4">Chargement du personnel…</p>}
      {!loadPersonnel && personnel.length === 0 && (
        <p className="text-sm text-zinc-400 text-center py-4">Aucun personnel disponible</p>
      )}
      {!loadPersonnel && personnel.length > 0 && (
        <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100">
          {personnel.map(p => (
            <button key={p.id} onClick={() => selectionnerSoignant(p)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 text-left transition">
              <div className="size-9 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                   style={{ background: p.role === 'medecin' ? '#2980b9' : '#7c3aed' }}>
                {p.prenom?.[0]}{p.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-800 text-sm">
                  {p.role === 'medecin' ? 'Dr. ' : ''}{p.prenom} {p.nom}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`size-1.5 rounded-full ${statutDot(p.statut_presence)}`} />
                  <span className="text-xs text-zinc-400 capitalize">{p.statut_presence}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(p.role)}`}>
                {roleLabel(p.role)}
              </span>
              <FiChevronRight size={14} className="text-zinc-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ════════════════════════════════════════════════════════════
  // ÉTAPE : RECHERCHE PATIENT (initiale)
  // ════════════════════════════════════════════════════════════
  return (
    <div className="max-w-lg mx-auto space-y-4 py-4">
      <StepBar etapes={etapes} actif={etapeIdx} />

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex gap-3">
        <FiShield size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Accès Urgence Médical Tracé (AUMT)</p>
          <p className="text-xs text-blue-600 mt-1 leading-relaxed">
            Permet à un soignant d'accéder au dossier complet d'un patient en urgence.
            Chaque accès est tracé, le patient est notifié et le log est immuable.
            <strong> Un seul accès AUMT par dossier est autorisé par journée.</strong>
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1">Rechercher le patient</label>
        <div className="relative">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="CPU, nom, prénom ou téléphone…"
            className={`${inputCls} pl-9`}
          />
        </div>
      </div>

      {searching && <p className="text-sm text-zinc-400">Recherche…</p>}

      {patients.length > 0 && (
        <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100">
          {patients.map(p => (
            <button key={p.id} onClick={() => selectionnerPatient(p)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 text-left transition">
              <div className="size-9 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                   style={{ background: '#DC2626' }}>
                {p.prenom?.[0]}{p.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-800 text-sm">{p.prenom} {p.nom}</p>
                <p className="text-xs text-zinc-400 font-mono">{p.cpu}</p>
                {p.allergies_texte && (
                  <p className="text-xs text-red-500 font-medium">⚠ {p.allergies_texte}</p>
                )}
              </div>
              {p.groupe_sanguin && (
                <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full">{p.groupe_sanguin}</span>
              )}
              <FiChevronRight size={14} className="text-zinc-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !searching && patients.length === 0 && (
        <p className="text-sm text-zinc-400 text-center py-4">Aucun patient trouvé pour "{query}"</p>
      )}
    </div>
  )
}

// ─── StepBar ──────────────────────────────────────────────────
function StepBar({ etapes, actif }: { etapes: string[]; actif: number }) {
  return (
    <div className="flex items-center gap-1 mb-2">
      {etapes.map((e, i) => (
        <div key={e} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className={`flex items-center justify-center size-6 rounded-full text-xs font-bold flex-shrink-0 transition-all ${
            i < actif   ? 'bg-green-500 text-white' :
            i === actif ? 'text-white' : 'bg-zinc-200 text-zinc-400'
          }`} style={i === actif ? { background: '#1D9E75' } : {}}>
            {i < actif ? <FiCheck size={11} /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:block ${i === actif ? 'font-semibold text-zinc-700' : 'text-zinc-400'}`}>
            {e}
          </span>
          {i < etapes.length - 1 && (
            <div className={`flex-1 h-px mx-1 ${i < actif ? 'bg-green-400' : 'bg-zinc-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Row récapitulatif ────────────────────────────────────────
function Row({ label, value, sub, danger }: {
  label: string; value: string; sub?: string; danger?: boolean
}) {
  return (
    <div className="flex items-start justify-between px-4 py-2.5 bg-white gap-4">
      <span className="text-xs text-zinc-500 font-medium flex-shrink-0">{label}</span>
      <div className="text-right">
        <span className={`text-xs font-semibold ${danger ? 'text-red-600' : 'text-zinc-800'}`}>{value}</span>
        {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
/**
 * NouvelleVisite.tsx
 * Flux unifié :
 *  1. Recherche patient existant → formulaire visite (même UI pour tous les types)
 *  2. Nouveau patient (C0) + photo → même formulaire
 *  3. Confirmation
 *  4. Carte CSI téléchargeable (nouveau patient uniquement)
 *
 * Règles métier :
 * - Médecin référent : assigné à la création, permanent, affiché pour tous les types
 * - Rendez-vous      → statut en_attente_medecin (médecin référent requis)
 * - Prise constantes → statut en_attente_tri (infirmier)
 * - Urgence          → statut en_attente_tri + flag urgence (prioritaire)
 * - L'accueil peut changer le médecin depuis la file → audité
 */

import { useState, useEffect, useRef } from 'react'
import {
  FiSearch, FiPlus, FiUser, FiCheck,
  FiCamera, FiX, FiActivity, FiCalendar, FiAlertTriangle
} from 'react-icons/fi'
import {
  rechercherPatients, creerPatient, creerVisite,
  getMedecins, getMedecinReferent
} from '../api/accueilApi'
import type { PatientRecherche, MedecinDispo, NouveauPatientPayload } from '../types'
import CarteAccueil from './CarteAccueil'
import type { PatientCarteData } from './CarteAccueil'

interface Props {
  onVisiteCreee: () => void
}

const GROUPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Inconnu']

type Etape      = 'recherche' | 'nouveau' | 'visite' | 'confirmation' | 'carte'
type TypeVisite = 'rendez_vous' | 'prise_constantes' | 'urgence'

const TYPES_VISITE: { id: TypeVisite; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    id:    'rendez_vous',
    label: 'Rendez-vous',
    desc:  'Consultation avec le médecin référent → file médecin directement',
    icon:  <FiCalendar size={18} />,
    color: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  {
    id:    'prise_constantes',
    label: 'Prise de constantes',
    desc:  'Mesures infirmier → l\'infirmier décidera de la suite',
    icon:  <FiActivity size={18} />,
    color: 'border-green-200 bg-green-50 text-green-700',
  },
  {
    id:    'urgence',
    label: 'Urgence',
    desc:  'Prise en charge prioritaire → tri infirmier immédiat',
    icon:  <FiAlertTriangle size={18} />,
    color: 'border-red-200 bg-red-50 text-red-700',
  },
]

export default function NouvelleVisite({ onVisiteCreee }: Props) {
  const [etape,        setEtape]        = useState<Etape>('recherche')
  const [query,        setQuery]        = useState('')
  const [resultats,    setResultats]    = useState<PatientRecherche[]>([])
  const [searching,    setSearching]    = useState(false)
  const [patientSelec, setPatientSelec] = useState<PatientRecherche | null>(null)
  const [medecins,     setMedecins]     = useState<MedecinDispo[]>([])
  const [loading,      setLoading]      = useState(false)
  const [erreur,       setErreur]       = useState<string | null>(null)
  const [patientCarte, setPatientCarte] = useState<PatientCarteData | null>(null)
  const [ticketNumero, setTicketNumero] = useState(0)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef                    = useRef<HTMLInputElement>(null)
  const [referentLoading, setReferentLoading] = useState(false)

  // ── Formulaire nouveau patient ─────────────────────────────
  const [form, setForm] = useState<NouveauPatientPayload>({
    nom: '', prenom: '', sexe: 'M', telephone: '',
    date_naissance: '', numero_cni: '', groupe_sanguin: 'Inconnu',
    allergies_texte: '', pathologies_chroniques: '',
    contact_urgence_nom: '', contact_urgence_telephone: '',
    notifications_actives: true,
    medecin_id: 0,
    motif_visite: '', type_visite: 'prise_constantes',
  })

  // ── Formulaire visite patient existant ────────────────────
  const [visiteForm, setVisiteForm] = useState({
    medecin_id:    0,
    motif_visite:  '',
    type_visite:   'prise_constantes' as TypeVisite,
    notes_accueil: '',
  })

  useEffect(() => {
    getMedecins().then(setMedecins).catch(() => {})
  }, [])

  // Recherche avec debounce
  useEffect(() => {
    if (query.length < 2) { setResultats([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try   { setResultats(await rechercherPatients(query)) }
      catch { setResultats([]) }
      finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  // Sélection patient existant → charger son médecin référent
  const selectionnerPatient = async (p: PatientRecherche) => {
    setPatientSelec(p)
    setEtape('visite')
    setReferentLoading(true)
    setVisiteForm(f => ({ ...f, medecin_id: 0, type_visite: 'prise_constantes' }))
    try {
      const ref = await getMedecinReferent(p.cpu)
      if (ref) {
        setVisiteForm(f => ({ ...f, medecin_id: ref.id }))
      }
    } catch { /* silencieux */ }
    finally { setReferentLoading(false) }
  }

  const set = (k: keyof NouveauPatientPayload, v: string | boolean | number) =>
    setForm(f => ({ ...f, [k]: v }))

  // ── Photo ──────────────────────────────────────────────────
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result
      if (typeof result === 'string') setPhotoPreview(result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Valider → confirmation ─────────────────────────────────
  const handleValider = () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      setErreur('Nom et prénom sont obligatoires')
      return
    }
    setErreur(null)
    setEtape('confirmation')
  }

  // ── Confirmer nouveau patient ──────────────────────────────
  const handleConfirmer = async () => {
    setLoading(true)
    setErreur(null)
    try {
      const data   = await creerPatient(form)
      const ticket = data.visite?.ticket_numero ?? 0
      setPatientCarte({
        cpu:                       data.cpu,
        nom:                       form.nom,
        prenom:                    form.prenom,
        date_naissance:            form.date_naissance || null,
        sexe:                      form.sexe ?? null,
        telephone:                 form.telephone || null,
        groupe_sanguin:            form.groupe_sanguin || null,
        allergies_texte:           form.allergies_texte || null,
        pathologies_chroniques:    form.pathologies_chroniques || null,
        contact_urgence_nom:       form.contact_urgence_nom || null,
        contact_urgence_telephone: form.contact_urgence_telephone || null,
        photoPreview,
      })
      setTicketNumero(ticket)
      setEtape('carte')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setErreur(err.response?.data?.message ?? 'Erreur serveur')
      setEtape('nouveau')
    } finally {
      setLoading(false)
    }
  }

  // ── Créer visite patient existant → retour direct file ────
  const handleCreerVisite = async () => {
    if (!patientSelec) return
    setLoading(true)
    setErreur(null)
    try {
      await creerVisite({
        patient_cpu:   patientSelec.cpu,
        medecin_id:    visiteForm.medecin_id || undefined,
        motif_visite:  visiteForm.motif_visite,
        type_visite:   visiteForm.type_visite,
        notes_accueil: visiteForm.notes_accueil,
      })
      onVisiteCreee()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setErreur(err.response?.data?.message ?? 'Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent'
  const labelCls = 'block text-xs font-medium text-zinc-700 mb-1'

  // ════════════════════════════════════════════════════════════
  // CARTE CSI
  // ════════════════════════════════════════════════════════════
  if (etape === 'carte' && patientCarte) {
    return <CarteAccueil patient={patientCarte} ticket={ticketNumero} onTermine={onVisiteCreee} />
  }

  // ════════════════════════════════════════════════════════════
  // CONFIRMATION (nouveau patient)
  // ════════════════════════════════════════════════════════════
  if (etape === 'confirmation') {
    const medecinChoisi = medecins.find(m => m.id === Number(form.medecin_id))
    const typeLabel     = TYPES_VISITE.find(t => t.id === form.type_visite)?.label ?? '—'
    return (
      <div className="max-w-lg space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
          <div className="size-10 rounded-full flex items-center justify-center" style={{ background: '#E1F5EE' }}>
            <FiCheck size={18} style={{ color: '#1D9E75' }} />
          </div>
          <div>
            <p className="font-semibold text-zinc-800">Confirmer l'enregistrement</p>
            <p className="text-xs text-zinc-400">Vérifiez les informations avant de valider</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
          <Row label="Nom complet"    value={`${form.prenom} ${form.nom}`} />
          <Row label="Date naissance" value={form.date_naissance ? new Date(form.date_naissance).toLocaleDateString('fr-FR') : '—'} />
          <Row label="Sexe"           value={form.sexe === 'M' ? 'Masculin' : 'Féminin'} />
          <Row label="Téléphone"      value={form.telephone || '—'} />
        </div>

        <div className="rounded-xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
          <Row label="Groupe sanguin"   value={form.groupe_sanguin || '—'} highlight />
          <Row label="Allergies"        value={form.allergies_texte || 'Aucune'} danger={!!form.allergies_texte} />
          <Row label="Pathologies chr." value={form.pathologies_chroniques || 'Aucune'} />
          <Row label="Contact urgence"
               value={form.contact_urgence_nom
                 ? `${form.contact_urgence_nom} — ${form.contact_urgence_telephone}`
                 : '—'} />
        </div>

        <div className="rounded-xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
          <Row label="Type de visite" value={typeLabel} />
          <Row label="Motif"          value={form.motif_visite || '—'} />
          <Row label="Médecin référent"
               value={medecinChoisi
                 ? `Dr. ${medecinChoisi.prenom} ${medecinChoisi.nom}`
                 : 'Non assigné'} />
        </div>

        {photoPreview && (
          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <img src={photoPreview} alt="Photo patient"
              className="size-12 rounded-lg object-cover border border-zinc-200" />
            <p className="text-xs text-zinc-500">Photo jointe à la carte</p>
          </div>
        )}

        {erreur && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erreur}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={() => setEtape('nouveau')} disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition disabled:opacity-50">
            ← Modifier
          </button>
          <button onClick={handleConfirmer} disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-white font-semibold transition disabled:opacity-50"
            style={{ background: '#1D9E75' }}>
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement…
                </span>
              : "Confirmer l'enregistrement"
            }
          </button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // RECHERCHE
  // ════════════════════════════════════════════════════════════
  if (etape === 'recherche') return (
    <div className="max-w-lg space-y-4">
      <p className="text-sm text-zinc-500">Rechercher un patient existant ou créer un nouveau dossier.</p>

      <div className="relative">
        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input type="text" value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="CPU, nom, prénom ou téléphone…"
          className={`${inputCls} pl-9`} />
      </div>

      {searching && <p className="text-sm text-zinc-400">Recherche…</p>}

      {resultats.length > 0 && (
        <div className="border border-zinc-200 rounded-xl overflow-hidden">
          {resultats.map(p => (
            <button key={p.id} onClick={() => selectionnerPatient(p)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 border-b border-zinc-100 last:border-0 text-left transition">
              <div className="size-9 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                   style={{ background: '#1D9E75' }}>
                {p.prenom?.[0]}{p.nom?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-800 text-sm">{p.prenom} {p.nom}</p>
                <p className="text-xs text-zinc-400 font-mono">{p.cpu}</p>
                {/* Afficher le médecin référent s'il existe */}
                {(p as PatientRecherche & { referent_nom?: string; referent_prenom?: string }).referent_nom && (
                  <p className="text-xs text-zinc-500">
                    Réf : Dr. {(p as PatientRecherche & { referent_prenom?: string }).referent_prenom}{' '}
                    {(p as PatientRecherche & { referent_nom?: string }).referent_nom}
                  </p>
                )}
              </div>
              <div className="text-right text-xs text-zinc-400">
                {p.groupe_sanguin && (
                  <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full">{p.groupe_sanguin}</span>
                )}
                {p.telephone && <p className="mt-0.5">{p.telephone}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !searching && resultats.length === 0 && (
        <p className="text-sm text-zinc-400 text-center py-4">Aucun patient trouvé pour "{query}"</p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-200" />
        <span className="text-xs text-zinc-400">ou</span>
        <div className="flex-1 h-px bg-zinc-200" />
      </div>

      <button onClick={() => setEtape('nouveau')}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-zinc-300 text-sm font-medium text-zinc-600 hover:border-[#1D9E75] hover:text-[#1D9E75] transition">
        <FiPlus size={16} /> Nouveau patient
      </button>
    </div>
  )

  // ════════════════════════════════════════════════════════════
  // VISITE PATIENT EXISTANT
  // ════════════════════════════════════════════════════════════
  if (etape === 'visite' && patientSelec) return (
    <div className="max-w-lg space-y-4">
      <button onClick={() => { setPatientSelec(null); setEtape('recherche') }}
        className="text-sm text-zinc-400 hover:text-zinc-600">← Retour</button>

      {/* Identité patient */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50">
        <div className="size-10 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
             style={{ background: '#1D9E75' }}>
          {patientSelec.prenom?.[0]}{patientSelec.nom?.[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-zinc-800 text-sm">{patientSelec.prenom} {patientSelec.nom}</p>
          <p className="text-xs text-zinc-400 font-mono">{patientSelec.cpu}</p>
          {patientSelec.allergies_texte && (
            <p className="text-xs text-red-500 font-medium">⚠ {patientSelec.allergies_texte}</p>
          )}
        </div>
        {patientSelec.groupe_sanguin && (
          <span className="ml-auto text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded-full text-zinc-600">
            {patientSelec.groupe_sanguin}
          </span>
        )}
      </div>

      {/* Type de visite */}
      <div>
        <label className={labelCls}>Type de visite *</label>
        <div className="space-y-2">
          {TYPES_VISITE.map(t => (
            <button key={t.id} type="button"
              onClick={() => setVisiteForm(f => ({ ...f, type_visite: t.id }))}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                visiteForm.type_visite === t.id
                  ? t.color + ' ring-2 ring-offset-1 ring-current'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              }`}>
              <span className="flex-shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{t.desc}</p>
              </div>
              {visiteForm.type_visite === t.id && <FiCheck size={16} className="flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Médecin référent — toujours visible */}
      <div>
        <label className={labelCls}>
          Médecin référent
          {referentLoading && <span className="ml-2 text-zinc-400 font-normal">(chargement…)</span>}
        </label>
        <select value={visiteForm.medecin_id}
          onChange={e => setVisiteForm(f => ({ ...f, medecin_id: Number(e.target.value) }))}
          className={inputCls}
          disabled={referentLoading}>
          <option value={0}>Sans assignation</option>
          {medecins.map(m => (
            <option key={m.id} value={m.id}>
              Dr. {m.prenom} {m.nom}
              {m.statut_presence === 'disponible' ? ' ✓' : m.statut_presence === 'absent' ? ' (absent)' : ' (occupé)'}
              {` — ${m.patients_en_attente} en attente`}
            </option>
          ))}
        </select>
        {visiteForm.medecin_id > 0 && (
          <p className="text-xs text-zinc-400 mt-1">
            {visiteForm.type_visite === 'rendez_vous'
              ? '✓ Ce médecin recevra le patient directement dans sa file'
              : '✓ Médecin référent enregistré — le patient passera d\'abord par l\'infirmier'
            }
          </p>
        )}
      </div>

      {/* Motif */}
      <div>
        <label className={labelCls}>Motif de la visite</label>
        <input type="text" value={visiteForm.motif_visite}
          onChange={e => setVisiteForm(f => ({ ...f, motif_visite: e.target.value }))}
          placeholder="Mal au dos, suivi diabète…" className={inputCls} />
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes accueil (optionnel)</label>
        <input type="text" value={visiteForm.notes_accueil}
          onChange={e => setVisiteForm(f => ({ ...f, notes_accueil: e.target.value }))}
          placeholder="Notes internes…" className={inputCls} />
      </div>

      {erreur && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erreur}</p>}

      <button onClick={handleCreerVisite} disabled={loading}
        className="w-full py-2.5 rounded-lg text-white font-semibold transition disabled:opacity-50"
        style={{ background: '#1D9E75' }}>
        {loading ? 'Création…' : 'Créer la visite'}
      </button>
    </div>
  )

  // ════════════════════════════════════════════════════════════
  // NOUVEAU PATIENT (C0) — formulaire unifié
  // ════════════════════════════════════════════════════════════
  return (
    <div className="max-w-2xl space-y-5">
      <button onClick={() => setEtape('recherche')}
        className="text-sm text-zinc-400 hover:text-zinc-600">← Retour</button>

      {/* Identité */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FiUser size={14} style={{ color: '#1D9E75' }} />
          <h3 className="text-sm font-semibold text-zinc-700">Identité</h3>
          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: '#1D9E75' }}>C0 — Public</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nom *</label>
            <input type="text" value={form.nom}
              onChange={e => set('nom', e.target.value.toUpperCase())}
              placeholder="MBALLA" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Prénom *</label>
            <input type="text" value={form.prenom}
              onChange={e => set('prenom', e.target.value)}
              placeholder="Jean" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Date de naissance</label>
            <input type="date" value={form.date_naissance}
              onChange={e => set('date_naissance', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Sexe</label>
            <select value={form.sexe} onChange={e => set('sexe', e.target.value)} className={inputCls}>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Téléphone</label>
            <input type="tel" value={form.telephone}
              onChange={e => set('telephone', e.target.value)}
              placeholder="+237 6XX XXX XXX" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>N° CNI (optionnel)</label>
            <input type="text" value={form.numero_cni}
              onChange={e => set('numero_cni', e.target.value)}
              placeholder="Laisser vide si non disponible" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Photo */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FiCamera size={14} style={{ color: '#1D9E75' }} />
          <h3 className="text-sm font-semibold text-zinc-700">
            Photo <span className="text-zinc-400 font-normal">(optionnelle)</span>
          </h3>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
          onChange={handlePhoto} style={{ display: 'none' }} />
        {photoPreview ? (
          <div className="flex items-center gap-3">
            <img src={photoPreview} alt="Aperçu"
              className="size-20 rounded-xl object-cover border border-zinc-200 shadow-sm" />
            <div className="flex flex-col gap-2">
              <button onClick={() => fileInputRef.current?.click()}
                className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition">
                Changer la photo
              </button>
              <button onClick={() => setPhotoPreview(null)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition">
                <FiX size={12} /> Supprimer
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-zinc-300 text-sm text-zinc-500 hover:border-[#1D9E75] hover:text-[#1D9E75] transition">
            <FiCamera size={16} /> Ajouter une photo (optionnel)
          </button>
        )}
      </div>

      {/* Informations d'urgence C0 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-zinc-700">Informations d'urgence</h3>
          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: '#1D9E75' }}>C0 — Public</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Groupe sanguin</label>
            <select value={form.groupe_sanguin}
              onChange={e => set('groupe_sanguin', e.target.value)} className={inputCls}>
              {GROUPES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Allergies connues</label>
            <input type="text" value={form.allergies_texte}
              onChange={e => set('allergies_texte', e.target.value)}
              placeholder="Pénicilline, Aspirine… (vide si aucune)" className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Pathologies chroniques</label>
            <input type="text" value={form.pathologies_chroniques}
              onChange={e => set('pathologies_chroniques', e.target.value)}
              placeholder="Diabète type 2, HTA… (vide si aucune)" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Contact urgence — Nom</label>
            <input type="text" value={form.contact_urgence_nom}
              onChange={e => set('contact_urgence_nom', e.target.value)}
              placeholder="Nom du contact" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Contact urgence — Téléphone</label>
            <input type="tel" value={form.contact_urgence_telephone}
              onChange={e => set('contact_urgence_telephone', e.target.value)}
              placeholder="+237 6XX XXX XXX" className={inputCls} />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input type="checkbox" id="notif" checked={form.notifications_actives}
            onChange={e => set('notifications_actives', e.target.checked)} className="rounded" />
          <label htmlFor="notif" className="text-xs text-zinc-600">
            Activer les notifications SMS pour ce patient
          </label>
        </div>
      </div>

      {/* Type de visite */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">Type de visite *</h3>
        <div className="space-y-2">
          {TYPES_VISITE.map(t => (
            <button key={t.id} type="button"
              onClick={() => set('type_visite', t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                form.type_visite === t.id
                  ? t.color + ' ring-2 ring-offset-1 ring-current'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              }`}>
              <span className="flex-shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{t.desc}</p>
              </div>
              {form.type_visite === t.id && <FiCheck size={16} className="flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Médecin référent — TOUJOURS visible */}
      <div>
        <label className={labelCls}>Médecin référent permanent</label>
        <select value={Number(form.medecin_id) || 0}
          onChange={e => set('medecin_id', Number(e.target.value))} className={inputCls}>
          <option value={0}>Sans assignation</option>
          {medecins.map(m => (
            <option key={m.id} value={m.id}>
              Dr. {m.prenom} {m.nom}
              {m.statut_presence === 'disponible' ? ' ✓' : m.statut_presence === 'absent' ? ' (absent)' : ''}
              {` — ${m.patients_en_attente} en attente`}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-400 mt-1">
          {Number(form.medecin_id) > 0
            ? form.type_visite === 'rendez_vous'
              ? '✓ Ce médecin recevra le patient directement dans sa file'
              : '✓ Médecin référent enregistré — le patient passera d\'abord par l\'infirmier'
            : 'Le médecin référent peut être assigné plus tard depuis la file d\'attente'
          }
        </p>
      </div>

      {/* Motif */}
      <div>
        <label className={labelCls}>Motif de la visite</label>
        <input type="text" value={form.motif_visite}
          onChange={e => set('motif_visite', e.target.value)}
          placeholder="Mal au dos, contrôle annuel…" className={inputCls} />
      </div>

      <div className="p-3 rounded-lg text-xs" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
        Un CPU sera généré automatiquement. La carte QR d'urgence sera disponible après confirmation.
      </div>

      {erreur && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erreur}</p>}

      <div className="flex gap-3">
        <button onClick={() => setEtape('recherche')}
          className="flex-1 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition">
          Annuler
        </button>
        <button onClick={handleValider}
          disabled={!form.nom.trim() || !form.prenom.trim()}
          className="flex-1 py-2.5 rounded-lg text-white font-semibold transition disabled:opacity-50"
          style={{ background: '#1D9E75' }}>
          Vérifier et confirmer →
        </button>
      </div>
    </div>
  )
}

// ─── Row récapitulatif ────────────────────────────────────────
function Row({ label, value, highlight, danger }: {
  label: string; value: string; highlight?: boolean; danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white">
      <span className="text-xs text-zinc-500 font-medium">{label}</span>
      <span className={`text-xs font-semibold ${
        danger ? 'text-red-600' : highlight ? 'text-blue-700' : 'text-zinc-800'
      }`}>
        {value}
      </span>
    </div>
  )
}
import { useState, useEffect } from 'react'
import {
  FiAlertTriangle, FiAlertCircle, FiCheckCircle,
  FiX, FiThermometer, FiHeart, FiActivity, FiWind, FiDroplet,
  FiUserCheck, FiXCircle, FiPrinter, FiPlus
} from 'react-icons/fi'
import type { PatientAttente } from '../types'
import { saisirConstantes } from '../api/infirmierApi'
import api from '@/lib/axios'

interface Props {
  patient:   PatientAttente
  onClose:   () => void
  onSuccess: () => void
}

const SEUILS: Record<string, {
  critique_min?: number; critique_max?: number
  urgent_min?:   number; urgent_max?:   number
  msg_critique_bas?:  string; msg_critique_haut?: string
  msg_urgent_bas?:    string; msg_urgent_haut?:   string
}> = {
  temperature:            { critique_min: 35, critique_max: 39.5, urgent_min: 36, urgent_max: 38.5, msg_critique_bas: 'Hypothermie sévère — risque vital', msg_urgent_bas: 'Hypothermie modérée', msg_critique_haut: 'Hyperthermie sévère — risque vital', msg_urgent_haut: 'Fièvre élevée' },
  tension_systolique:     { critique_min: 80, critique_max: 180,  urgent_min: 90, urgent_max: 160,  msg_critique_bas: 'Hypotension sévère — choc possible', msg_urgent_bas: 'Hypotension', msg_critique_haut: 'Hypertension sévère — risque AVC', msg_urgent_haut: 'Hypertension' },
  spo2:                   { critique_min: 90, urgent_min: 95, msg_critique_bas: 'Désaturation critique — O₂ immédiat', msg_urgent_bas: 'Désaturation — surveiller' },
  glycemie:               { critique_min: 0.5, critique_max: 2.5, urgent_min: 0.7, urgent_max: 1.8, msg_critique_bas: 'Hypoglycémie sévère — risque coma', msg_urgent_bas: 'Hypoglycémie', msg_critique_haut: 'Hyperglycémie sévère — risque cétose', msg_urgent_haut: 'Hyperglycémie' },
  frequence_cardiaque:    { critique_min: 40, critique_max: 150, urgent_min: 50, urgent_max: 120, msg_critique_bas: 'Bradycardie sévère', msg_urgent_bas: 'Bradycardie', msg_critique_haut: 'Tachycardie sévère', msg_urgent_haut: 'Tachycardie' },
  frequence_respiratoire: { critique_min: 8, critique_max: 30, urgent_min: 10, urgent_max: 25, msg_critique_bas: 'Bradypnée sévère — risque apnée', msg_urgent_bas: 'Bradypnée', msg_critique_haut: 'Tachypnée sévère', msg_urgent_haut: 'Tachypnée' },
}

const getAlerteChamp = (key: string, valStr: string) => {
  const s = SEUILS[key]
  if (!s || !valStr) return { niveau: null as null, message: '' }
  const val = parseFloat(valStr)
  if (isNaN(val)) return { niveau: null as null, message: '' }
  if (s.critique_min !== undefined && val < s.critique_min) return { niveau: 'critique' as const, message: s.msg_critique_bas ?? '' }
  if (s.critique_max !== undefined && val > s.critique_max) return { niveau: 'critique' as const, message: s.msg_critique_haut ?? '' }
  if (s.urgent_min   !== undefined && val < s.urgent_min)   return { niveau: 'urgent'   as const, message: s.msg_urgent_bas ?? '' }
  if (s.urgent_max   !== undefined && val > s.urgent_max)   return { niveau: 'urgent'   as const, message: s.msg_urgent_haut ?? '' }
  return { niveau: 'normal' as const, message: 'Normal' }
}

const calculerNiveauGlobal = (form: Record<string, string>, eva: number) => {
  for (const key of Object.keys(SEUILS)) {
    if (getAlerteChamp(key, form[key] ?? '').niveau === 'critique') return 'critique'
  }
  if (eva >= 8) return 'critique'
  for (const key of Object.keys(SEUILS)) {
    if (getAlerteChamp(key, form[key] ?? '').niveau === 'urgent') return 'urgent'
  }
  if (eva >= 5) return 'urgent'
  return 'normal'
}

const NIVEAU_BADGE = {
  critique:    'bg-red-100 text-red-700 border-red-300',
  urgent:      'bg-orange-100 text-orange-700 border-orange-300',
  semi_urgent: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  normal:      'bg-emerald-100 text-emerald-700 border-emerald-300',
}

const ALERTE_CHAMP = { critique: 'border-red-400 bg-red-50', urgent: 'border-orange-400 bg-orange-50', normal: 'border-emerald-300' }
const ALERTE_MSG   = { critique: 'bg-red-50 text-red-700 border-red-200', urgent: 'bg-orange-50 text-orange-700 border-orange-200', normal: 'bg-emerald-50 text-emerald-700 border-emerald-200' }

const EVA_COLOR  = (v: number) => v <= 2 ? 'bg-emerald-500' : v <= 4 ? 'bg-yellow-400' : v <= 6 ? 'bg-orange-400' : 'bg-red-600'
const EVA_LABELS: Record<number, string> = { 0: 'Aucune', 1: 'Minime', 2: 'Légère', 3: 'Modérée', 4: 'Modérée+', 5: 'Moyenne', 6: 'Intense', 7: 'Intense+', 8: 'Très intense', 9: 'Sévère', 10: 'Insupportable' }

const ICONE: Record<string, React.ReactNode> = {
  temperature:            <FiThermometer size={13} />,
  tension_systolique:     <FiActivity size={13} />,
  tension_diastolique:    <FiActivity size={13} />,
  frequence_cardiaque:    <FiHeart size={13} />,
  frequence_respiratoire: <FiWind size={13} />,
  spo2:                   <FiDroplet size={13} />,
  glycemie:               <FiDroplet size={13} />,
}

const CHAMPS = [
  { key: 'temperature',            label: 'Température',         unite: '°C',   step: '0.1',  placeholder: '37.0' },
  { key: 'tension_systolique',     label: 'Tension systolique',  unite: 'mmHg', step: '1',    placeholder: '120'  },
  { key: 'tension_diastolique',    label: 'Tension diastolique', unite: 'mmHg', step: '1',    placeholder: '80'   },
  { key: 'frequence_cardiaque',    label: 'Fréq. cardiaque',     unite: 'bpm',  step: '1',    placeholder: '75'   },
  { key: 'frequence_respiratoire', label: 'Fréq. respiratoire',  unite: '/min', step: '1',    placeholder: '16'   },
  { key: 'spo2',                   label: 'SpO2',                unite: '%',    step: '0.1',  placeholder: '98'   },
  { key: 'poids',                  label: 'Poids',               unite: 'kg',   step: '0.1',  placeholder: '70'   },
  { key: 'taille',                 label: 'Taille',              unite: 'cm',   step: '1',    placeholder: '170'  },
  { key: 'glycemie',               label: 'Glycémie',            unite: 'g/L',  step: '0.01', placeholder: '1.00' },
] as const

// ─── Impression via iframe — design moderne HMC ────────────────
const imprimerFiche = (
  patient: PatientAttente,
  form: Record<string, string>,
  evaVal: number,
  motif: string,
  niveau: string,
  score: number
) => {
  const now       = new Date().toLocaleString('fr-FR')
  const niveauBg  = niveau === 'critique' ? '#fee2e2' : niveau === 'urgent' ? '#ffedd5' : '#d1fae5'
  const niveauFg  = niveau === 'critique' ? '#b91c1c' : niveau === 'urgent' ? '#c2410c' : '#065f46'

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Constantes — ${patient.cpu}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #fff; color: #1e1e1e; }
  .header { background: #1D9E75; color: white; padding: 16px 24px 12px; }
  .header-brand { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
  .header-sub { font-size: 11px; opacity: 0.85; }
  .header-date { font-size: 10px; opacity: 0.7; margin-top: 2px; }
  .header-band { background: #E1F5EE; padding: 5px 24px; }
  .header-band-text { font-size: 9px; font-weight: 700; color: #1D9E75; text-transform: uppercase; letter-spacing: 0.08em; }
  .content { padding: 20px 24px; }
  .section-title { font-size: 9px; font-weight: 700; color: #1D9E75; text-transform: uppercase; letter-spacing: 0.08em; background: #E1F5EE; padding: 4px 10px; border-radius: 4px; margin: 14px 0 8px; display: inline-block; }
  .patient-name { font-size: 16px; font-weight: 700; color: #1e1e1e; margin-bottom: 2px; }
  .patient-info { font-size: 11px; color: #666; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #1D9E75; color: white; text-align: left; padding: 7px 12px; font-size: 11px; font-weight: 600; }
  td { padding: 6px 12px; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
  tr:nth-child(even) td { background: #F5FAF8; }
  td:first-child { font-weight: 600; color: #444; width: 55%; }
  td:last-child { color: #1e1e1e; }
  .niveau-badge { display: inline-block; padding: 4px 14px; border-radius: 99px; font-weight: 700; font-size: 12px; background: ${niveauBg}; color: ${niveauFg}; margin-top: 12px; }
  .obs { background: #F8F9FA; border-left: 3px solid #1D9E75; padding: 10px 14px; margin-top: 14px; border-radius: 0 4px 4px 0; }
  .obs-label { font-size: 9px; font-weight: 700; color: #1D9E75; text-transform: uppercase; margin-bottom: 4px; }
  .obs-text { font-size: 11px; color: #444; line-height: 1.5; }
  .footer { margin-top: 24px; border-top: 1px solid #eee; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; }
  .footer-text { font-size: 9px; color: #aaa; }
  .footer-badge { font-size: 9px; background: #E1F5EE; color: #1D9E75; padding: 2px 8px; border-radius: 99px; font-weight: 600; }
</style>
</head><body>

<div class="header">
  <div class="header-brand">Health Mboa Connect</div>
  <div class="header-sub">Fiche de constantes vitales — Données C1</div>
  <div class="header-date">Imprimé le ${now}</div>
</div>
<div class="header-band">
  <span class="header-band-text">Document interne — Usage médical uniquement</span>
</div>

<div class="content">
  <div class="section-title">Informations patient</div>
  <div class="patient-name">${patient.prenom_masque} ${patient.nom_masque}</div>
  <div class="patient-info">CPU : <strong>${patient.cpu}</strong> &nbsp;·&nbsp; Ticket N°${patient.ticket_numero}</div>

  <div class="section-title">Constantes vitales</div>
  <table>
    <tr><th>Paramètre</th><th>Valeur mesurée</th></tr>
    ${form.temperature            ? `<tr><td>Température</td><td>${form.temperature} °C</td></tr>` : ''}
    ${form.tension_systolique     ? `<tr><td>Tension artérielle</td><td>${form.tension_systolique}/${form.tension_diastolique || '—'} mmHg</td></tr>` : ''}
    ${form.frequence_cardiaque    ? `<tr><td>Fréquence cardiaque</td><td>${form.frequence_cardiaque} bpm</td></tr>` : ''}
    ${form.frequence_respiratoire ? `<tr><td>Fréquence respiratoire</td><td>${form.frequence_respiratoire} /min</td></tr>` : ''}
    ${form.spo2                   ? `<tr><td>Saturation SpO2</td><td>${form.spo2} %</td></tr>` : ''}
    ${form.poids                  ? `<tr><td>Poids</td><td>${form.poids} kg</td></tr>` : ''}
    ${form.taille                 ? `<tr><td>Taille</td><td>${form.taille} cm</td></tr>` : ''}
    ${form.glycemie               ? `<tr><td>Glycémie</td><td>${form.glycemie} g/L</td></tr>` : ''}
    <tr><td>Douleur (échelle EVA)</td><td>${evaVal} / 10</td></tr>
  </table>

  <div>
    <span class="niveau-badge">Score ${score}/10 — ${niveau.toUpperCase()}</span>
  </div>

  ${motif ? `
  <div class="obs">
    <div class="obs-label">Observations infirmier</div>
    <div class="obs-text">${motif}</div>
  </div>` : ''}

  <div class="footer">
    <span class="footer-text">Health Mboa Connect &nbsp;·&nbsp; Données C1 — confidentielles</span>
    <span class="footer-badge">Usage interne</span>
  </div>
</div>

</body></html>`

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top      = '-9999px'
  iframe.style.left     = '-9999px'
  iframe.style.width    = '0'
  iframe.style.height   = '0'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }
  doc.open(); doc.write(html); doc.close()
  setTimeout(() => {
    try { iframe.contentWindow?.print() } catch { /* silencieux */ }
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 2000)
  }, 500)
}

// ─── Modal sélection médecin ──────────────────────────────────
interface Medecin {
  id: number; nom: string; prenom: string
  specialite?: string; statut_presence: string; patients_en_attente: number
}

function ModalChoisirMedecin({ visiteId, onSuccess, onClose }: {
  visiteId: number; onSuccess: () => void; onClose: () => void
}) {
  const [medecins,   setMedecins]   = useState<Medecin[]>([])
  const [referentId, setReferentId] = useState<number | null>(null)
  const [medecinId,  setMedecinId]  = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [loadingMed, setLoadingMed] = useState(true)
  const [erreur,     setErreur]     = useState('')

  useEffect(() => {
    api.get('/infirmier/medecins', { params: { visite_id: visiteId } })
      .then(r => {
        const liste: Medecin[]   = r.data.medecins   ?? []
        const ref: number | null = r.data.referent_id ?? null
        setMedecins(liste)
        setReferentId(ref)
        if (ref && liste.some(m => m.id === ref)) setMedecinId(ref)
      })
      .catch(() => {})
      .finally(() => setLoadingMed(false))
  }, [visiteId])

  const handleConfirmer = async () => {
    if (!medecinId) { setErreur('Sélectionnez un médecin'); return }
    setLoading(true)
    try {
      await api.patch(`/infirmier/visites/${visiteId}/orienter`, { medecin_id: medecinId })
      onSuccess()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setErreur(err.response?.data?.message ?? 'Erreur serveur')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-zinc-800 mb-1">Orienter vers un médecin</h2>
        <p className="text-xs text-zinc-400 mb-4">
          {referentId
            ? 'Le médecin référent est pré-sélectionné. Vous pouvez choisir un autre si nécessaire.'
            : 'Le médecin choisi deviendra le médecin référent du patient.'}
        </p>
        {loadingMed ? (
          <div className="flex items-center justify-center py-6 gap-2 text-zinc-400 text-sm">
            <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            Chargement…
          </div>
        ) : medecins.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">Aucun médecin disponible</p>
        ) : (
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {medecins.map(m => (
              <button key={m.id} onClick={() => setMedecinId(m.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition ${
                  medecinId === m.id ? 'border-[#1D9E75] bg-green-50' : 'border-zinc-200 hover:border-zinc-300'
                }`}>
                <div className="text-left">
                  <p className="font-medium text-zinc-800 flex items-center gap-1.5">
                    Dr. {m.prenom} {m.nom}
                    {m.id === referentId && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-semibold">Référent</span>
                    )}
                  </p>
                  {m.specialite && <p className="text-xs text-zinc-400">{m.specialite}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  m.statut_presence === 'disponible' ? 'bg-green-100 text-green-700' :
                  m.statut_presence === 'absent'     ? 'bg-red-100   text-red-600'   :
                                                       'bg-amber-100 text-amber-700'
                }`}>
                  {m.statut_presence === 'absent' ? 'Absent' : `${m.patients_en_attente} patients`}
                </span>
              </button>
            ))}
          </div>
        )}
        {erreur && <p className="text-sm text-red-600 mb-3">{erreur}</p>}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">
            Annuler
          </button>
          <button onClick={handleConfirmer} disabled={loading || !medecinId || loadingMed}
            className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: '#1D9E75' }}>
            {loading ? 'Orientation…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT GESTION ALLERGIES — tags ajout/suppression
// ═══════════════════════════════════════════════════════════════
function GestionAllergies({
  allergies,
  onChange,
}: {
  allergies: string[]
  onChange: (liste: string[]) => void
}) {
  const [saisie, setSaisie] = useState('')

  const ajouterAllergie = () => {
    const val = saisie.trim()
    if (!val) return
    // Pas de doublon (insensible à la casse)
    if (allergies.some(a => a.toLowerCase() === val.toLowerCase())) {
      setSaisie('')
      return
    }
    onChange([...allergies, val])
    setSaisie('')
  }

  const supprimerAllergie = (index: number) => {
    onChange(allergies.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); ajouterAllergie() }
  }

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">
        <FiAlertTriangle size={13} className="text-red-500" />
        Allergies
        <span className="normal-case font-normal text-zinc-400 ml-1">
          — modifiable à chaque visite · non visible sur la carte imprimée
        </span>
      </label>

      {/* Tags allergies existantes */}
      {allergies.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-2">
          {allergies.map((a, i) => (
            <span key={i}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
              {a}
              <button
                type="button"
                onClick={() => supprimerAllergie(i)}
                className="hover:text-red-900 transition-colors ml-0.5"
                title="Supprimer cette allergie">
                <FiX size={11} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-400 italic mb-2">Aucune allergie enregistrée</p>
      )}

      {/* Champ ajout */}
      <div className="flex gap-2">
        <input
          type="text"
          value={saisie}
          onChange={e => setSaisie(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ex: Pénicilline, Arachides, Latex…"
          className="flex-1 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-300"
        />
        <button
          type="button"
          onClick={ajouterAllergie}
          disabled={!saisie.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition"
          style={{ background: '#e53e3e' }}>
          <FiPlus size={14} /> Ajouter
        </button>
      </div>
      <p className="text-xs text-zinc-400 mt-1.5">
        Appuyez sur <kbd className="px-1 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 font-mono text-[10px]">Entrée</kbd> pour ajouter rapidement
      </p>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────
export default function SaisieConstantes({ patient, onClose, onSuccess }: Props) {
  const [form,       setForm]       = useState<Record<string, string>>({})
  const [evaVal,     setEvaVal]     = useState(0)
  const [motif,      setMotif]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showModalMedecin, setShowModalMedecin] = useState(false)

  // ── État allergies ────────────────────────────────────────────
  const [allergies, setAllergies] = useState<string[]>(() => {
    if (!patient.allergies_texte) return []
    return patient.allergies_texte
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)
  })

  // ── État groupe sanguin ───────────────────────────────────────
  // Lecture seule si déjà renseigné ; modifiable sinon.
  const groupeSanguinExistant = patient.groupe_sanguin?.trim() || null
  const [groupeSanguin, setGroupeSanguin] = useState<string>(groupeSanguinExistant ?? '')

  const [resultat, setResultat] = useState<{
    niveau: string; score: number; alerte: boolean
    formSnapshot: Record<string, string>; evaSnapshot: number; motifSnapshot: string
  } | null>(null)

  const niveauGlobal     = calculerNiveauGlobal(form, evaVal)
  const alertesCritiques = CHAMPS.filter(c => getAlerteChamp(c.key, form[c.key] ?? '').niveau === 'critique')
  const alertesUrgentes  = CHAMPS.filter(c => getAlerteChamp(c.key, form[c.key] ?? '').niveau === 'urgent')

  const handleChange = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!form.temperature && !form.tension_systolique) {
      setError('Saisissez au minimum la température et la tension artérielle.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const payload = {
        visite_id:              patient.visite_id,
        temperature:            form.temperature            || '',
        tension_systolique:     form.tension_systolique     || '',
        tension_diastolique:    form.tension_diastolique    || '',
        frequence_cardiaque:    form.frequence_cardiaque    || '',
        frequence_respiratoire: form.frequence_respiratoire || '',
        spo2:                   form.spo2                   || '',
        poids:                  form.poids                  || '',
        taille:                 form.taille                 || '',
        glycemie:               form.glycemie               || '',
        eva_douleur:            String(evaVal),
        motif_detaille:         motif,
        // ── Allergies envoyées uniquement si modifiées ──────
        // Le backend ne met à jour que si ce tableau est présent.
        allergies,
        // ── Groupe sanguin — envoyé seulement si nouvellement saisi ──
        ...(!groupeSanguinExistant && groupeSanguin ? { groupe_sanguin: groupeSanguin } : {}),
      }
      const res = await saisirConstantes(payload)
      setResultat({
        niveau:        res.niveau_urgence,
        score:         res.score_urgence,
        alerte:        res.alerte,
        formSnapshot:  { ...form },
        evaSnapshot:   evaVal,
        motifSnapshot: motif,
      })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Erreur serveur')
    } finally { setLoading(false) }
  }

  const handleTerminer = async () => {
    setActionLoading(true)
    try {
      await api.patch(`/infirmier/visites/${patient.visite_id}/fermer`, {})
      onSuccess(); onClose()
    } catch { /* silencieux */ }
    finally { setActionLoading(false) }
  }

  // ════════════════════════════════════════════════════════════
  // ÉCRAN RÉSULTAT — 3 actions
  // ════════════════════════════════════════════════════════════
  if (resultat) return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border mb-4 ${
              NIVEAU_BADGE[resultat.niveau as keyof typeof NIVEAU_BADGE] ?? NIVEAU_BADGE.normal
            }`}>
              {resultat.niveau === 'critique' && <FiAlertTriangle size={14} />}
              {resultat.niveau === 'urgent'   && <FiAlertCircle size={14} />}
              {resultat.niveau === 'normal'   && <FiCheckCircle size={14} />}
              Score {resultat.score}/10 — {resultat.niveau.toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-zinc-800 mb-1">Constantes enregistrées</h2>
            <p className="text-zinc-500 text-sm">
              {patient.prenom_masque} {patient.nom_masque}
              {' · '}<span className="font-mono text-xs">{patient.cpu}</span>
            </p>
          </div>

          {resultat.alerte && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-red-700 text-sm font-medium flex items-start gap-2">
              <FiAlertTriangle className="flex-shrink-0 mt-0.5" size={15} />
              <span>Niveau <strong>{resultat.niveau}</strong> — Score {resultat.score}/10. Alerter le médecin.</span>
            </div>
          )}

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Que faire maintenant ?</p>
          <div className="space-y-3">
            <button onClick={() => setShowModalMedecin(true)}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition hover:border-[#1D9E75] hover:bg-green-50 border-zinc-200">
              <div className="size-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E1F5EE' }}>
                <FiUserCheck size={18} style={{ color: '#1D9E75' }} />
              </div>
              <div>
                <p className="font-semibold text-zinc-800 text-sm">Orienter vers un médecin</p>
                <p className="text-xs text-zinc-400 mt-0.5">Le patient rejoint la file du médecin choisi</p>
              </div>
            </button>

            <button onClick={() => imprimerFiche(patient, resultat.formSnapshot, resultat.evaSnapshot, resultat.motifSnapshot, resultat.niveau, resultat.score)}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition hover:border-blue-400 hover:bg-blue-50 border-zinc-200">
              <div className="size-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50">
                <FiPrinter size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-800 text-sm">Imprimer la fiche</p>
                <p className="text-xs text-zinc-400 mt-0.5">Fiche de constantes format A4 — données C1</p>
              </div>
            </button>

            <button onClick={handleTerminer} disabled={actionLoading}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition hover:border-zinc-400 hover:bg-zinc-50 border-zinc-200 disabled:opacity-50">
              <div className="size-10 rounded-full flex items-center justify-center flex-shrink-0 bg-zinc-100">
                <FiXCircle size={18} className="text-zinc-500" />
              </div>
              <div>
                <p className="font-semibold text-zinc-800 text-sm">
                  {actionLoading ? 'Fermeture…' : 'Terminer la visite'}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Le patient rentre chez lui — dossier fermé</p>
              </div>
            </button>
          </div>

          <button onClick={() => { onSuccess(); onClose() }}
            className="w-full mt-4 text-xs text-zinc-400 hover:text-zinc-600 transition py-2">
            Retour à la file d'attente sans action supplémentaire
          </button>
        </div>
      </div>

      {showModalMedecin && (
        <ModalChoisirMedecin
          visiteId={patient.visite_id}
          onSuccess={() => { setShowModalMedecin(false); onSuccess(); onClose() }}
          onClose={() => setShowModalMedecin(false)}
        />
      )}
    </>
  )

  // ════════════════════════════════════════════════════════════
  // FORMULAIRE SAISIE
  // ════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* En-tête */}
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-start justify-between rounded-t-2xl z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-zinc-900">Saisie des constantes</h2>
              <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: '#378ADD' }}>C1 — Interne</span>
            </div>
            <p className="text-sm text-zinc-500">
              {patient.prenom_masque} {patient.nom_masque}
              {' · '}<span className="font-mono">{patient.cpu}</span>
              {patient.age ? ` · ${patient.age} ans` : ''}
              {' · '}Ticket {patient.ticket_numero}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors mt-1">
            <FiX size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Données C0 */}
          <div className="bg-zinc-50 rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Données C0 — Urgence</p>
            <p className="text-sm text-zinc-700">
              <span className="font-medium">Motif :</span> {patient.motif_visite || '—'}
            </p>
            {/* Groupe sanguin — lecture seule si déjà renseigné, dropdown sinon */}
            {groupeSanguinExistant ? (
              <p className="text-sm text-zinc-700">
                <span className="font-medium">Groupe sanguin :</span> {groupeSanguinExistant}
              </p>
            ) : (
              <div className="flex items-center gap-3 pt-1">
                <label className="text-sm font-medium text-zinc-700 whitespace-nowrap">
                  Groupe sanguin :
                </label>
                <select
                  value={groupeSanguin}
                  onChange={e => setGroupeSanguin(e.target.value)}
                  className="border border-blue-300 bg-blue-50 text-zinc-800 text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  <option value="">— Non renseigné —</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <span className="text-xs text-blue-600 font-medium">Non renseigné — à compléter</span>
              </div>
            )}
            {/* Allergies actuelles affichées en lecture seule dans la section C0 */}
            {allergies.length > 0 && (
              <p className="text-sm text-red-600 font-medium">
                ⚠ Allergies connues : {allergies.join(', ')}
              </p>
            )}
          </div>

          {/* Niveau global */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${NIVEAU_BADGE[niveauGlobal]}`}>
            {niveauGlobal === 'critique' && <FiAlertTriangle size={15} />}
            {niveauGlobal === 'urgent'   && <FiAlertCircle size={15} />}
            {niveauGlobal === 'normal'   && <FiCheckCircle size={15} />}
            Niveau estimé : {niveauGlobal.toUpperCase()}
            <span className="font-normal text-xs ml-1 opacity-70">(mis à jour en temps réel)</span>
          </div>

          {/* Alertes */}
          {alertesCritiques.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <FiAlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={15} />
              <div className="text-sm text-red-700">
                <p className="font-bold mb-1">Valeur(s) critique(s) détectée(s)</p>
                {alertesCritiques.map(c => (
                  <p key={c.key} className="text-xs">· {c.label} : {getAlerteChamp(c.key, form[c.key] ?? '').message}</p>
                ))}
              </div>
            </div>
          )}
          {alertesUrgentes.length > 0 && alertesCritiques.length === 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={15} />
              <div className="text-sm text-orange-700">
                <p className="font-bold mb-1">Valeur(s) hors norme</p>
                {alertesUrgentes.map(c => (
                  <p key={c.key} className="text-xs">· {c.label} : {getAlerteChamp(c.key, form[c.key] ?? '').message}</p>
                ))}
              </div>
            </div>
          )}

          {/* Grille constantes */}
          <div className="grid grid-cols-2 gap-4">
            {CHAMPS.map(({ key, label, unite, step, placeholder }) => {
              const alerte   = getAlerteChamp(key, form[key] ?? '')
              const hasSeuil = !!SEUILS[key]
              return (
                <div key={key}>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                    {ICONE[key]} {label}
                  </label>
                  <div className={`flex items-center border rounded-xl overflow-hidden transition-all focus-within:ring-1 focus-within:ring-zinc-300 ${
                    alerte.niveau === 'critique' ? ALERTE_CHAMP.critique :
                    alerte.niveau === 'urgent'   ? ALERTE_CHAMP.urgent   :
                    alerte.niveau === 'normal'   ? 'border-emerald-300'  : 'border-zinc-200'
                  }`}>
                    <input type="number" step={step} placeholder={placeholder}
                      value={form[key] || ''}
                      onChange={e => handleChange(key, e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none text-zinc-800" />
                    <span className="px-3 text-xs text-zinc-400 bg-zinc-50 border-l border-zinc-200 py-2.5 font-mono">{unite}</span>
                  </div>
                  {hasSeuil && alerte.niveau && alerte.niveau !== 'normal' && form[key] && (
                    <div className={`flex items-center gap-1 mt-1 text-xs px-2 py-1 rounded-lg border ${ALERTE_MSG[alerte.niveau]}`}>
                      {alerte.niveau === 'critique' ? <FiAlertTriangle size={11} /> : <FiAlertCircle size={11} />}
                      {alerte.message}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* EVA */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">
              <FiActivity size={13} />
              Douleur (EVA) — {evaVal}/10 : {EVA_LABELS[evaVal]}
              {evaVal >= 8 && <span className="ml-1 text-red-600 flex items-center gap-1"><FiAlertTriangle size={11} />Critique</span>}
              {evaVal >= 5 && evaVal < 8 && <span className="ml-1 text-orange-500 flex items-center gap-1"><FiAlertCircle size={11} />Urgent</span>}
            </label>
            <input type="range" min={0} max={10} value={evaVal}
              onChange={e => setEvaVal(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
              <span>0 – Aucune</span><span>10 – Insupportable</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${EVA_COLOR(evaVal)}`} style={{ width: `${evaVal * 10}%` }} />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION ALLERGIES
              Séparateur visuel pour bien distinguer de l'EVA
          ══════════════════════════════════════════════════════ */}
          <div className="border border-red-100 rounded-xl px-4 py-4 bg-red-50/30">
            <GestionAllergies
              allergies={allergies}
              onChange={setAllergies}
            />
          </div>

          {/* Observations */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide block">
              Observations infirmier
            </label>
            <textarea value={motif} onChange={e => setMotif(e.target.value)}
              rows={2} placeholder="Décrivez les symptômes observés, contexte clinique…"
              className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-300 resize-none" />
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <FiAlertTriangle size={15} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={loading}
              className="flex-1 border border-zinc-200 text-zinc-700 rounded-xl py-3 font-semibold hover:bg-zinc-50 transition-colors disabled:opacity-50">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className={`flex-1 text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                niveauGlobal === 'critique' ? 'bg-red-600 hover:bg-red-700' :
                niveauGlobal === 'urgent'   ? 'bg-orange-500 hover:bg-orange-600' : ''
              }`}
              style={niveauGlobal === 'normal' ? { background: '#1D9E75' } : {}}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enregistrement…</>
                : 'Valider les constantes →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
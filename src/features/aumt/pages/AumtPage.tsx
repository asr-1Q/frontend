/**
 * AumtPage.tsx
 * Corrections :
 * 1. Bouton "Annuler" sur attribution pre_autorise
 * 2. declencherAUMT envoie maintenant aumt_id (pas patient_cpu)
 * 3. Règle 1 AUMT par patient (pas par soignant)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FiShield, FiAlertTriangle, FiClock, FiEye,
  FiEyeOff, FiX, FiUser, FiActivity,
  FiChevronDown, FiChevronUp, FiXCircle
} from 'react-icons/fi'
import api from '@/lib/axios'

interface Attribution {
  id:                number
  patient_cpu:       string
  patient_nom:       string
  patient_prenom:    string
  groupe_sanguin:    string | null
  allergies_texte:   string | null
  motif:             string
  created_at:        string
  expire_at:         string
  statut:            'pre_autorise' | 'actif'
  minutes_restantes: number
  notifie_patient:   boolean
}

interface DossierPatient {
  cpu:                       string
  nom:                       string
  prenom:                    string
  date_naissance:            string | null
  sexe:                      string | null
  telephone:                 string | null
  groupe_sanguin:            string | null
  allergies_texte:           string | null
  pathologies_chroniques:    string | null
  contact_urgence_nom:       string | null
  contact_urgence_telephone: string | null
}

interface VisiteHistorique {
  id:                   number
  created_at:           string
  motif_visite:         string | null
  type_visite:          string
  statut:               string
  diagnostic_principal: string | null
  decision_finale:      string | null
  anamnese:             string | null
  notes_privees:        string | null
  temperature:          number | null
  tension_systolique:   number | null
  tension_diastolique:  number | null
  frequence_cardiaque:  number | null
  spo2:                 number | null
  niveau_urgence:       string | null
  score_urgence:        number | null
}

interface DossierAumt {
  aumt_id:            number
  expire_at:          string
  duree_min:          number
  avertissement:      string
  dossier_patient:    DossierPatient
  historique_visites: VisiteHistorique[]
}

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric'
})

export default function AumtPage() {
  const [attributions,   setAttributions]   = useState<Attribution[]>([])
  const [loading,        setLoading]        = useState(true)
  const [attrSelec,      setAttrSelec]      = useState<Attribution | null>(null)
  const [showDeclencher, setShowDeclencher] = useState(false)
  const [dossier,        setDossier]        = useState<DossierAumt | null>(null)
  const [timerSec,       setTimerSec]       = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const charger = useCallback(async () => {
    try {
      const { data } = await api.get('/aumt/mes-attributions')
      setAttributions(data.attributions ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { charger() }, [charger])
  useEffect(() => {
    const t = setInterval(charger, 30000)
    return () => clearInterval(t)
  }, [charger])

  // Timer dégressif
  useEffect(() => {
    if (!dossier) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    const calcSec = () =>
      Math.max(0, Math.floor((new Date(dossier.expire_at).getTime() - Date.now()) / 1000))
    setTimerSec(calcSec())
    timerRef.current = setInterval(() => {
      const restant = calcSec()
      setTimerSec(restant)
      if (restant <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        setDossier(null)
        charger()
      }
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [dossier, charger])

  const fmtTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Annuler une attribution pre_autorise
  const handleAnnuler = async (attr: Attribution) => {
    if (!window.confirm(`Annuler l'accès AUMT pour ${attr.patient_prenom} ${attr.patient_nom} ?`)) return
    try {
      await api.post(`/aumt/annuler/${attr.id}`, {})
      charger()
    } catch { /* silent */ }
  }

  // Révoquer un accès actif
  const handleRevoquer = async () => {
    if (!dossier) return
    if (!window.confirm('Confirmer la révocation de cet accès ?')) return
    try {
      await api.post(`/aumt/revoquer/${dossier.aumt_id}`, {})
      setDossier(null)
      charger()
    } catch { /* silent */ }
  }

  // Vue dossier actif
  if (dossier) return (
    <DossierView
      dossier={dossier}
      timerSec={timerSec}
      fmtTimer={fmtTimer}
      onRevoquer={handleRevoquer}
    />
  )

  // Modal déclenchement
  if (showDeclencher && attrSelec) return (
    <DeclencherModal
      attribution={attrSelec}
      onSuccess={(d) => { setDossier(d); setShowDeclencher(false); charger() }}
      onClose={() => { setShowDeclencher(false); setAttrSelec(null) }}
    />
  )

  // Liste attributions
  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-zinc-100 shadow-sm">
        <div className="size-10 rounded-full flex items-center justify-center flex-shrink-0"
             style={{ background: '#E1F5EE' }}>
          <FiShield size={20} style={{ color: '#1D9E75' }} />
        </div>
        <div>
          <p className="font-semibold text-zinc-800">Accès Urgence Médical Tracé</p>
          <p className="text-xs text-zinc-400">
            Accès exceptionnels attribués par l'accueil — chaque action est tracée de façon permanente
          </p>
        </div>
      </div>

      {/* Bannière légale */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <FiAlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
        <p className="text-sm text-amber-800">
          <strong>Rappel légal :</strong> Toute utilisation des données médicales à des fins autres
          que le traitement d'urgence constitue une violation du secret médical. Le patient est notifié
          à chaque accès. Les logs sont immuables et peuvent être produits en justice.
        </p>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-400 gap-2">
          <span className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          Chargement…
        </div>
      ) : attributions.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-100 p-12 text-center">
          <FiShield size={32} className="text-zinc-200 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Aucun accès AUMT attribué</p>
          <p className="text-zinc-300 text-xs mt-1">Les accès sont attribués par l'accueil en cas d'urgence</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attributions.map(attr => (
            <div key={attr.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                attr.statut === 'actif' ? 'border-green-300' : 'border-zinc-200'
              }`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Avatar + identité */}
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full text-white flex items-center justify-center text-sm font-bold flex-shrink-0"
                         style={{ background: '#1D9E75' }}>
                      {attr.patient_prenom?.[0]}{attr.patient_nom?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-800">
                        {attr.patient_prenom} {attr.patient_nom}
                      </p>
                      <p className="text-xs font-mono text-zinc-400">{attr.patient_cpu}</p>
                      {attr.groupe_sanguin && (
                        <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600">
                          {attr.groupe_sanguin}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Statut + timer */}
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      attr.statut === 'actif'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {attr.statut === 'actif' ? 'Actif' : 'En attente confirmation'}
                    </span>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center justify-end gap-1">
                      <FiClock size={10} />
                      {Math.round(attr.minutes_restantes)} min restantes
                    </p>
                  </div>
                </div>

                {/* Motif */}
                <div className="mt-3 text-xs text-zinc-500 bg-zinc-50 rounded-lg px-3 py-2">
                  {attr.motif}
                </div>

                {/* Allergies */}
                {attr.allergies_texte && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 font-medium">
                    ⚠ Allergies : {attr.allergies_texte}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  {attr.statut === 'pre_autorise' && (
                    <>
                      {/* Confirmer et accéder */}
                      <button onClick={() => { setAttrSelec(attr); setShowDeclencher(true) }}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition"
                        style={{ background: '#1D9E75' }}>
                        Confirmer et accéder au dossier
                      </button>
                      {/* Annuler l'attribution */}
                      <button onClick={() => handleAnnuler(attr)}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition">
                        <FiXCircle size={14} /> Annuler
                      </button>
                    </>
                  )}

                  {attr.statut === 'actif' && (
                    <button onClick={() => { setAttrSelec(attr); setShowDeclencher(true) }}
                      className="flex-1 py-2.5 rounded-xl border-2 border-green-400 text-green-700 text-sm font-semibold hover:bg-green-50 transition">
                      Accéder au dossier (réauth requise)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// MODAL DÉCLENCHEMENT
// ════════════════════════════════════════════════════════════
function DeclencherModal({ attribution, onSuccess, onClose }: {
  attribution: Attribution
  onSuccess:   (d: DossierAumt) => void
  onClose:     () => void
}) {
  const [motDePasse,  setMotDePasse]  = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [duree,       setDuree]       = useState(60)
  const [loading,     setLoading]     = useState(false)
  const [erreur,      setErreur]      = useState('')

  const handleSubmit = async () => {
    if (!motDePasse) { setErreur('Mot de passe obligatoire'); return }
    setLoading(true)
    setErreur('')
    try {
      const { data } = await api.post('/aumt/declencher', {
        aumt_id:           attribution.id,  // On envoie l'ID de l'attribution
        mot_de_passe:      motDePasse,
        duree_demandee_min: duree,
      })
      onSuccess({
        aumt_id:            data.aumt_id,
        expire_at:          data.expire_at,
        duree_min:          data.duree_min,
        avertissement:      data.avertissement,
        dossier_patient:    data.dossier_patient,
        historique_visites: data.historique_visites,
      })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setErreur(err.response?.data?.message ?? 'Erreur serveur')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-5">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">Confirmer votre identité</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <FiX size={18} />
          </button>
        </div>

        {/* Avertissement */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <FiAlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Accès tracé · Patient notifié · Log immuable · Responsabilité pénale engagée en cas d'abus
          </p>
        </div>

        {/* Patient */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
          <div className="size-9 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
               style={{ background: '#1D9E75' }}>
            {attribution.patient_prenom?.[0]}{attribution.patient_nom?.[0]}
          </div>
          <div>
            <p className="font-semibold text-zinc-800 text-sm">
              {attribution.patient_prenom} {attribution.patient_nom}
            </p>
            <p className="text-xs font-mono text-zinc-400">{attribution.patient_cpu}</p>
          </div>
        </div>

        {/* Durée */}
        <div>
          <p className="text-sm font-medium text-zinc-700 mb-2">Durée d'accès demandée</p>
          <div className="grid grid-cols-3 gap-2">
            {[30, 60, 120].map(d => (
              <button key={d} onClick={() => setDuree(d)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
                  duree === d
                    ? 'text-white border-transparent'
                    : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                }`}
                style={duree === d ? { background: '#1D9E75' } : {}}>
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <label className="text-sm font-medium text-zinc-700 block mb-1.5">
            Votre mot de passe — réauthentification obligatoire
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] pr-10"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>
        </div>

        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <FiAlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            {erreur}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition disabled:opacity-50">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading || !motDePasse}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition bg-red-600 hover:bg-red-700">
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Vérification…
                </span>
              : 'Accéder au dossier'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// VUE DOSSIER (accès actif)
// ════════════════════════════════════════════════════════════
function DossierView({ dossier, timerSec, fmtTimer, onRevoquer }: {
  dossier:    DossierAumt
  timerSec:   number
  fmtTimer:   (s: number) => string
  onRevoquer: () => void
}) {
  const p         = dossier.dossier_patient
  const dureeTotal = dossier.duree_min * 60
  const timerPct  = Math.round((timerSec / dureeTotal) * 100)
  const critique  = timerSec < 300 // moins de 5 min

  return (
    <div className="space-y-4 pb-10">
      {/* Timer + avertissement sticky */}
      <div className={`sticky top-0 z-20 rounded-xl border p-4 space-y-2 ${
        critique ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FiClock size={16} className={critique ? 'text-red-600' : 'text-amber-600'} />
            <p className={`font-bold text-lg font-mono ${critique ? 'text-red-700' : 'text-amber-700'}`}>
              {fmtTimer(timerSec)}
            </p>
            <p className="text-xs text-zinc-500">restantes</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">AUMT #{dossier.aumt_id}</span>
            <button onClick={onRevoquer}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition font-medium">
              Terminer l'accès
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${critique ? 'bg-red-500' : 'bg-amber-400'}`}
               style={{ width: `${timerPct}%` }} />
        </div>
        <p className="text-xs text-zinc-500">
          ⚠ Accès enregistré · Patient notifié · Toute utilisation abusive engage votre responsabilité pénale
        </p>
      </div>

      {/* Identité C0 */}
      <Section icon={<FiUser size={14} />} titre="Identité — C0" badge="Public">
        <Grid>
          <Cell label="Nom complet"    value={`${p.prenom} ${p.nom}`} />
          <Cell label="CPU"            value={p.cpu} mono />
          <Cell label="Date naissance" value={p.date_naissance ? fmt(p.date_naissance) : '—'} />
          <Cell label="Sexe"           value={p.sexe === 'M' ? 'Masculin' : p.sexe === 'F' ? 'Féminin' : '—'} />
          <Cell label="Téléphone"      value={p.telephone ?? '—'} />
          <Cell label="Groupe sanguin" value={p.groupe_sanguin ?? '—'} highlight />
        </Grid>
        {p.allergies_texte && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs font-bold text-red-700">⚠ Allergies connues</p>
            <p className="text-sm text-red-800 mt-1">{p.allergies_texte}</p>
          </div>
        )}
        {p.pathologies_chroniques && (
          <div className="mt-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <p className="text-xs font-bold text-orange-700">Pathologies chroniques</p>
            <p className="text-sm text-orange-800 mt-1">{p.pathologies_chroniques}</p>
          </div>
        )}
        {p.contact_urgence_nom && (
          <div className="mt-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
            <p className="text-xs font-bold text-zinc-600">Contact d'urgence</p>
            <p className="text-sm text-zinc-700 mt-1">
              {p.contact_urgence_nom} — {p.contact_urgence_telephone}
            </p>
          </div>
        )}
      </Section>

      {/* Historique */}
      <Section icon={<FiActivity size={14} />} titre="Historique médical complet — C1 + C2" badge="Confidentiel">
        {dossier.historique_visites.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">Aucun antécédent enregistré</p>
        ) : (
          <div className="space-y-3">
            {dossier.historique_visites.map((v, i) => (
              <VisiteCard key={v.id} visite={v} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function VisiteCard({ visite: v, defaultOpen }: { visite: VisiteHistorique; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-zinc-50 transition text-left">
        <div className="flex items-center gap-3">
          <span className={`size-2 rounded-full flex-shrink-0 ${
            v.niveau_urgence === 'critique' ? 'bg-red-500' :
            v.niveau_urgence === 'urgent'   ? 'bg-orange-400' : 'bg-green-400'
          }`} />
          <div>
            <p className="text-sm font-semibold text-zinc-800">
              {fmt(v.created_at)} à {new Date(v.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-zinc-400">{v.motif_visite || 'Sans motif'} · {v.statut}</p>
          </div>
        </div>
        {open ? <FiChevronUp size={14} className="text-zinc-400" /> : <FiChevronDown size={14} className="text-zinc-400" />}
      </button>

      {open && (
        <div className="border-t border-zinc-100 p-4 space-y-3 bg-white">
          {(v.temperature || v.tension_systolique || v.frequence_cardiaque || v.spo2) && (
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Constantes C1</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {v.temperature         && <Constante label="Température" value={`${v.temperature}°C`} />}
                {v.tension_systolique  && <Constante label="Tension" value={`${v.tension_systolique}/${v.tension_diastolique} mmHg`} />}
                {v.frequence_cardiaque && <Constante label="FC" value={`${v.frequence_cardiaque} bpm`} />}
                {v.spo2                && <Constante label="SpO2" value={`${v.spo2}%`} />}
                {v.score_urgence       && <Constante label="Score urgence" value={`${v.score_urgence}/10`} />}
              </div>
            </div>
          )}
          {v.diagnostic_principal && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs font-bold text-blue-700 mb-1">Diagnostic — C2</p>
              <p className="text-sm text-blue-900">{v.diagnostic_principal}</p>
            </div>
          )}
          {v.anamnese && (
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
              <p className="text-xs font-bold text-zinc-600 mb-1">Anamnèse</p>
              <p className="text-sm text-zinc-700">{v.anamnese}</p>
            </div>
          )}
          {v.decision_finale && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-xs font-bold text-green-700 mb-1">Décision finale</p>
              <p className="text-sm text-green-900">{v.decision_finale}</p>
            </div>
          )}
          {v.notes_privees && (
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-xs font-bold text-purple-700 mb-1">Notes privées médecin</p>
              <p className="text-sm text-purple-900">{v.notes_privees}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const Section = ({ icon, titre, badge, children }: {
  icon: React.ReactNode; titre: string; badge?: string; children: React.ReactNode
}) => (
  <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
      <span style={{ color: '#1D9E75' }}>{icon}</span>
      <p className="text-sm font-semibold text-zinc-700">{titre}</p>
      {badge && (
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
          {badge}
        </span>
      )}
    </div>
    <div className="p-4">{children}</div>
  </div>
)

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
)

const Cell = ({ label, value, mono, highlight }: {
  label: string; value: string; mono?: boolean; highlight?: boolean
}) => (
  <div>
    <p className="text-xs text-zinc-400 font-medium">{label}</p>
    <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-blue-700' : 'text-zinc-800'} ${mono ? 'font-mono' : ''}`}>
      {value}
    </p>
  </div>
)

const Constante = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2 text-center">
    <p className="text-xs text-zinc-400">{label}</p>
    <p className="text-sm font-bold text-zinc-800">{value}</p>
  </div>
)
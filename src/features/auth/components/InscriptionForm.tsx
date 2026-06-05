import { useReducer, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle,
  Phone, User, Heart, Shield, ChevronRight, X
} from 'lucide-react'
import logo from '@/assets/logo.png'
import medBg from '@/assets/patient.png'

const GREEN = '#10b981'

const inputS: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 12, color: '#1e293b', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
}
const labelS: React.CSSProperties = {
  color: '#64748b', fontSize: 12,
  fontWeight: 600, marginBottom: 6, display: 'block',
}
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid #e2e8f0',
    borderRadius: 20, padding: 20,
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    ...style,
  }}>{children}</div>
)

const GROUPES_SANGUINS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

type Etape = 'tel' | 'otp' | 'avertissement' | 'infos' | 'succes'

interface State {
  etape:         Etape
  telephone:     string; otp: string; sessionToken: string
  nom:           string; prenom: string
  dateNaissance: string; sexe: string; hopitalId: string
  groupeSanguin: string; allergies: string; pathologies: string
  contactNom:    string; contactTel: string
  motDePasse:    string; confirmMdp: string
  certifie:      boolean; cpu: string; hopitalNom: string
  loading:       boolean; error: string | null; codeDev: string; telMasque: string
}

type Action =
  | { type: 'SET'; k: keyof State; v: any }
  | { type: 'SET_ETAPE'; etape: Etape }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'OTP_ENVOYE'; telMasque: string; codeDev: string }
  | { type: 'OTP_VERIFIE'; sessionToken: string }
  | { type: 'SUCCES'; cpu: string; hopitalNom: string }

const init: State = {
  etape: 'tel', telephone: '', otp: '', sessionToken: '',
  nom: '', prenom: '', dateNaissance: '', sexe: '',
  hopitalId: '', groupeSanguin: '', allergies: '', pathologies: '',
  contactNom: '', contactTel: '', motDePasse: '', confirmMdp: '',
  certifie: false, cpu: '', hopitalNom: '',
  loading: false, error: null, codeDev: '', telMasque: '',
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'SET':        return { ...s, [a.k]: a.v }
    case 'SET_ETAPE':  return { ...s, etape: a.etape, error: null, loading: false }
    case 'SET_ERROR':  return { ...s, error: a.error, loading: false }
    case 'OTP_ENVOYE': return { ...s, etape: 'otp', telMasque: a.telMasque, codeDev: a.codeDev, loading: false, error: null }
    case 'OTP_VERIFIE':return { ...s, etape: 'avertissement', sessionToken: a.sessionToken, loading: false, error: null }
    case 'SUCCES':     return { ...s, etape: 'succes', cpu: a.cpu, hopitalNom: a.hopitalNom, loading: false, error: null }
    default: return s
  }
}

const formatTel = (d: string) => `+237${d.replace(/\D/g,'').slice(0,9)}`

const F = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label style={labelS}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
    {children}
  </div>
)

const Input = (props: any) => (
  <input {...props} style={{ ...inputS, ...(props.style || {}) }}
    onFocus={e => (e.target as HTMLInputElement).style.borderColor = GREEN}
    onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'}
  />
)

const Select = ({ value, onChange, children }: { value: string; onChange: any; children: React.ReactNode }) => (
  <select value={value} onChange={onChange} style={{ ...inputS, cursor: 'pointer' }}>
    {children}
  </select>
)

export default function InscriptionForm({ onRetour }: { onRetour: () => void }) {
  const [s, dispatch]   = useReducer(reducer, init)
  const [hopitaux, setHopitaux] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/inscription/hopitaux').then(r => setHopitaux(r.data.hopitaux)).catch(() => {})
  }, [])

  const Err = ({ msg }: { msg: string | null }) => msg ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
      background: '#fff1f2', border: '1px solid #fecdd3',
      borderRadius: 12, color: '#dc2626', fontSize: 13 }}>
      <AlertTriangle size={15} /> {msg}
    </div>
  ) : null

  const handleDemOtp = async () => {
    const tel = formatTel(s.telephone)
    if (s.telephone.replace(/\D/g,'').length !== 9)
      return dispatch({ type: 'SET_ERROR', error: 'Numéro invalide — 9 chiffres requis' })
    dispatch({ type: 'SET', k: 'loading', v: true })
    dispatch({ type: 'SET_ERROR', error: null })
    try {
      const { data } = await api.post('/inscription/demander-otp', { telephone: tel })
      dispatch({ type: 'OTP_ENVOYE', telMasque: data.telephone_masque, codeDev: data.code_dev ?? '' })
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e?.response?.data?.message ?? 'Erreur' })
    }
  }

  const handleVerifOtp = async () => {
    if (s.otp.length < 6) return dispatch({ type: 'SET_ERROR', error: 'Code à 6 chiffres requis' })
    dispatch({ type: 'SET', k: 'loading', v: true })
    try {
      const { data } = await api.post('/inscription/verifier-otp', {
        telephone: formatTel(s.telephone), code: s.otp,
      })
      dispatch({ type: 'OTP_VERIFIE', sessionToken: data.session_token })
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e?.response?.data?.message ?? 'Code incorrect' })
    }
  }

  const handleCreer = async () => {
    if (!s.nom || !s.prenom || !s.dateNaissance || !s.sexe || !s.hopitalId)
      return dispatch({ type: 'SET_ERROR', error: 'Tous les champs obligatoires (*) doivent être remplis' })
    if (s.motDePasse.length < 8)
      return dispatch({ type: 'SET_ERROR', error: 'Mot de passe minimum 8 caractères' })
    if (s.motDePasse !== s.confirmMdp)
      return dispatch({ type: 'SET_ERROR', error: 'Les mots de passe ne correspondent pas' })
    dispatch({ type: 'SET', k: 'loading', v: true })
    try {
      const { data } = await api.post('/inscription/creer', {
        session_token:             s.sessionToken,
        telephone:                 formatTel(s.telephone),
        nom:                       s.nom,
        prenom:                    s.prenom,
        date_naissance:            s.dateNaissance,
        sexe:                      s.sexe,
        hopital_id:                s.hopitalId,
        groupe_sanguin:            s.groupeSanguin || null,
        allergies_texte:           s.allergies || null,
        pathologies_chroniques:    s.pathologies || null,
        contact_urgence_nom:       s.contactNom || null,
        contact_urgence_telephone: s.contactTel ? formatTel(s.contactTel) : null,
        mot_de_passe:              s.motDePasse,
      })
      dispatch({ type: 'SUCCES', cpu: data.cpu, hopitalNom: data.hopital_nom })
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e?.response?.data?.message ?? 'Erreur lors de la création' })
    }
  }

  const renderEtape = () => {

    // ── Étape 1 : Téléphone ──
    if (s.etape === 'tel') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#d1fae5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Phone size={24} color={GREEN} />
          </div>
          <p style={{ color: '#1e293b', fontWeight: 800, fontSize: 20, margin: '0 0 6px' }}>Créer mon compte HMC</p>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Entrez votre numéro pour commencer</p>
        </div>

        <F label="Numéro de téléphone" required>
          <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>
            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🇨🇲</span>
              <span style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>+237</span>
            </div>
            <input type="tel" inputMode="numeric" placeholder="6XX XXX XXX" maxLength={9}
              value={s.telephone} onChange={e => dispatch({ type: 'SET', k: 'telephone', v: e.target.value.replace(/\D/g,'').slice(0,9) })}
              style={{ flex: 1, padding: '12px 14px', background: 'transparent', border: 'none', color: '#1e293b', fontSize: 14, outline: 'none' }}
            />
          </div>
        </F>

        <Err msg={s.error} />

        <button onClick={handleDemOtp} disabled={!!s.loading || s.telephone.replace(/\D/g,'').length !== 9}
          style={{ padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#fff', background: `linear-gradient(135deg, ${GREEN}, #059669)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: s.loading || s.telephone.replace(/\D/g,'').length !== 9 ? 0.5 : 1 }}>
          {s.loading ? <><RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Envoi…</> : <>Recevoir un code SMS <ChevronRight size={16} /></>}
        </button>
      </div>
    )

    // ── Étape 2 : OTP ──
    if (s.etape === 'otp') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#1e293b', fontWeight: 800, fontSize: 20, margin: '0 0 6px' }}>Vérification</p>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Code envoyé au <strong style={{ color: GREEN }}>{s.telMasque}</strong>
          </p>
          {s.codeDev && <p style={{ color: '#d97706', fontSize: 12, margin: '6px 0 0' }}>Dev : {s.codeDev}</p>}
        </div>

        <F label="Code OTP (6 chiffres)" required>
          <Input type="text" inputMode="numeric" placeholder="000000" maxLength={6}
            value={s.otp} onChange={(e: any) => dispatch({ type: 'SET', k: 'otp', v: e.target.value.replace(/\D/g,'') })}
            style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: 22, fontFamily: 'monospace' }}
          />
        </F>

        <Err msg={s.error} />

        <button onClick={handleVerifOtp} disabled={!!s.loading || s.otp.length < 6}
          style={{ padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#fff', background: `linear-gradient(135deg, ${GREEN}, #059669)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: s.loading || s.otp.length < 6 ? 0.5 : 1 }}>
          {s.loading ? <><RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Vérification…</> : <>Valider le code <ChevronRight size={16} /></>}
        </button>

        <button onClick={() => dispatch({ type: 'SET_ETAPE', etape: 'tel' })} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ArrowLeft size={14} /> Retour
        </button>
      </div>
    )

    // ── Étape 3 : Avertissement ──
    if (s.etape === 'avertissement') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 99, background: '#fff1f2', border: '2px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <AlertTriangle size={28} color="#ef4444" />
          </div>
          <p style={{ color: '#1e293b', fontWeight: 800, fontSize: 20, margin: '0 0 6px' }}>⚠️ Information importante</p>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Lisez attentivement avant de continuer</p>
        </div>

        <div style={{ padding: '16px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 16 }}>
          <p style={{ color: '#b91c1c', fontWeight: 700, fontSize: 15, margin: '0 0 10px' }}>Ces informations peuvent sauver votre vie</p>
          <p style={{ color: '#dc2626', fontSize: 13, lineHeight: 1.6, margin: '0 0 10px' }}>
            En cas d'urgence, les soignants accèdent à votre <strong>groupe sanguin</strong> et vos <strong>allergies</strong> pour vous soigner immédiatement.
          </p>
          <p style={{ color: '#b91c1c', fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            🩸 Une erreur sur votre groupe sanguin = risque vital lors d'une transfusion.<br />
            💊 Une erreur sur vos allergies = risque d'anaphylaxie mortelle.
          </p>
        </div>

        <div style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16 }}>
          <p style={{ color: '#15803d', fontWeight: 700, fontSize: 13, margin: '0 0 8px' }}>🏥 Vous n'êtes pas sûr de vos informations médicales ?</p>
          <p style={{ color: '#16a34a', fontSize: 12, margin: '0 0 10px', lineHeight: 1.5 }}>
            Rendez-vous dans un hôpital du réseau HMC pour effectuer un bilan et renseigner vos informations avec un professionnel de santé.
          </p>
          <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>Vous pourrez toujours vous inscrire en ligne après votre consultation.</p>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px', background: '#fff', borderRadius: 14, border: `1px solid ${s.certifie ? '#a7f3d0' : '#e2e8f0'}` }}>
          <input type="checkbox" checked={s.certifie}
            onChange={e => dispatch({ type: 'SET', k: 'certifie', v: e.target.checked })}
            style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0, accentColor: GREEN, cursor: 'pointer' }}
          />
          <p style={{ color: '#1e293b', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Je certifie que les informations médicales que je vais saisir sont <strong>exactes et vérifiées</strong>. Je comprends qu'une erreur peut engager ma vie en cas d'urgence médicale.
          </p>
        </label>

        <Err msg={s.error} />

        <button onClick={() => {
          if (!s.certifie) return dispatch({ type: 'SET_ERROR', error: "Vous devez certifier l'exactitude de vos informations" })
          dispatch({ type: 'SET_ETAPE', etape: 'infos' })
        }} disabled={!s.certifie}
          style={{ padding: '13px', borderRadius: 14, border: 'none', cursor: s.certifie ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14, color: '#fff', background: s.certifie ? `linear-gradient(135deg, ${GREEN}, #059669)` : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: s.certifie ? 1 : 0.6 }}>
          Je comprends, continuer <ChevronRight size={16} />
        </button>
      </div>
    )

    // ── Étape 4 : Infos ──
    if (s.etape === 'infos') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#1e293b', fontWeight: 800, fontSize: 20, margin: '0 0 4px' }}>Mes informations</p>
          <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>Les champs * sont obligatoires</p>
        </div>

        <Card>
          <p style={{ color: GREEN, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={13} /> Identité
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <F label="Nom" required><Input placeholder="DUPONT" value={s.nom} onChange={(e: any) => dispatch({ type: 'SET', k: 'nom', v: e.target.value })} /></F>
              <F label="Prénom" required><Input placeholder="Jean" value={s.prenom} onChange={(e: any) => dispatch({ type: 'SET', k: 'prenom', v: e.target.value })} /></F>
            </div>
            <F label="Date de naissance" required>
              <Input type="date" value={s.dateNaissance} onChange={(e: any) => dispatch({ type: 'SET', k: 'dateNaissance', v: e.target.value })} />
            </F>
            <F label="Sexe" required>
              <Select value={s.sexe} onChange={(e: any) => dispatch({ type: 'SET', k: 'sexe', v: e.target.value })}>
                <option value="">-- Sélectionner --</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </Select>
            </F>
            <F label="Hôpital d'inscription" required>
              <Select value={s.hopitalId} onChange={(e: any) => dispatch({ type: 'SET', k: 'hopitalId', v: e.target.value })}>
                <option value="">-- Choisir un hôpital HMC --</option>
                {hopitaux.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.nom} — {h.ville}</option>
                ))}
              </Select>
            </F>
          </div>
        </Card>

        <Card>
          <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Heart size={13} /> Données médicales d'urgence
          </p>
          <p style={{ color: '#94a3b8', fontSize: 11, margin: '0 0 14px' }}>Visibles par les soignants en urgence — soyez précis</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <F label="Groupe sanguin">
              <Select value={s.groupeSanguin} onChange={(e: any) => dispatch({ type: 'SET', k: 'groupeSanguin', v: e.target.value })}>
                <option value="">-- Inconnu / Non renseigné --</option>
                {GROUPES_SANGUINS.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
            </F>
            <F label="Allergies connues">
              <textarea value={s.allergies} onChange={(e: any) => dispatch({ type: 'SET', k: 'allergies', v: e.target.value })}
                placeholder="Ex: Pénicilline, Aspirine, latex..." rows={2}
                style={{ ...inputS, resize: 'none', fontFamily: 'inherit' }} />
            </F>
            <F label="Pathologies chroniques">
              <textarea value={s.pathologies} onChange={(e: any) => dispatch({ type: 'SET', k: 'pathologies', v: e.target.value })}
                placeholder="Ex: Diabète type 2, Hypertension..." rows={2}
                style={{ ...inputS, resize: 'none', fontFamily: 'inherit' }} />
            </F>
          </div>
        </Card>

        <Card>
          <p style={{ color: '#d97706', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Phone size={13} /> Contact d'urgence
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <F label="Nom du contact"><Input placeholder="Marie Dupont" value={s.contactNom} onChange={(e: any) => dispatch({ type: 'SET', k: 'contactNom', v: e.target.value })} /></F>
            <F label="Téléphone du contact"><Input type="tel" placeholder="6XXXXXXXX" value={s.contactTel} onChange={(e: any) => dispatch({ type: 'SET', k: 'contactTel', v: e.target.value.replace(/\D/g,'').slice(0,9) })} /></F>
          </div>
        </Card>

        <Card>
          <p style={{ color: '#64748b', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={13} /> Mot de passe portail
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <F label="Mot de passe" required><Input type="password" placeholder="Minimum 8 caractères" value={s.motDePasse} onChange={(e: any) => dispatch({ type: 'SET', k: 'motDePasse', v: e.target.value })} /></F>
            <F label="Confirmer" required><Input type="password" placeholder="Répéter le mot de passe" value={s.confirmMdp} onChange={(e: any) => dispatch({ type: 'SET', k: 'confirmMdp', v: e.target.value })} /></F>
          </div>
        </Card>

        <Err msg={s.error} />

        <button onClick={handleCreer} disabled={!!s.loading}
          style={{ padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: '#fff', background: `linear-gradient(135deg, ${GREEN}, #059669)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: s.loading ? 0.6 : 1, boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}>
          {s.loading ? <><RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Création du compte…</> : <>Créer mon compte HMC <ChevronRight size={16} /></>}
        </button>
      </div>
    )

    // ── Étape 5 : Succès ──
    if (s.etape === 'succes') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 99, background: '#d1fae5', border: '2px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <CheckCircle2 size={36} color={GREEN} />
          </div>
          <p style={{ color: '#1e293b', fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>Compte créé ! 🎉</p>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Bienvenue dans le réseau HMC</p>
        </div>

        <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Votre Code Patient Unique (CPU)</p>
          <p style={{ color: GREEN, fontWeight: 900, fontSize: 20, fontFamily: 'monospace', margin: '0 0 6px', letterSpacing: '0.05em' }}>{s.cpu}</p>
          <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>
            Conservez ce code précieusement — il vous identifie dans tout le réseau HMC.<br />
            Un SMS de confirmation vous a été envoyé.
          </p>
        </div>

        <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14 }}>
          <p style={{ color: '#92400e', fontSize: 13, fontWeight: 600, margin: 0 }}>
            🏥 Hôpital d'inscription : <strong style={{ color: '#1e293b' }}>{s.hopitalNom}</strong>
          </p>
        </div>

        <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', margin: 0 }}>
          Rendez-vous à l'accueil de <strong style={{ color: '#1e293b' }}>{s.hopitalNom}</strong> pour générer votre carte CSI avec photo et QR code.
        </p>

        <button onClick={() => navigate('/login')}
          style={{ padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#fff', background: `linear-gradient(135deg, ${GREEN}, #059669)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Se connecter à mon espace patient
        </button>

        <button onClick={onRetour} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 12, color: '#94a3b8', fontSize: 13, padding: '10px', cursor: 'pointer' }}>
          Retour à l'accueil
        </button>
      </div>
    )

    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${medBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      position: 'relative',
    }}>
      {/* Overlay blanc transparent */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.82)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="HMC" style={{ height: 32, borderRadius: 8 }} />
            <div>
              <p style={{ color: '#1e293b', fontWeight: 700, fontSize: 13, margin: 0 }}>Health <span style={{ color: GREEN }}>Mboa</span> Connect</p>
              <p style={{ color: '#94a3b8', fontSize: 10, margin: 0 }}>Inscription patient</p>
            </div>
          </div>
          <button onClick={onRetour} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 99, padding: '6px 12px', color: '#64748b', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={13} /> Annuler
          </button>
        </div>
      </header>

      {/* Contenu */}
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto', padding: '20px 16px 40px' }}>
        {renderEtape()}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #cbd5e1; }
        select option { background: #fff; color: #1e293b; }
      `}</style>
    </div>
  )
}
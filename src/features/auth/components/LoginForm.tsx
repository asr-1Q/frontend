import { useEffect, useReducer, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPasswordRequest, resetPasswordConfirm } from '../api/authApi'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { usePatientAuthStore } from '@/store/patientAuthStore'
import {
  Lock, ArrowLeft, RefreshCw, CheckCircle2,
  Eye, EyeOff, AlertTriangle, Phone,
  ChevronLeft, ChevronRight, X, UserPlus,
} from 'lucide-react'
import logo from '@/assets/logo.png'
import img1 from '@/assets/img.png'
import img2 from '@/assets/img2.png'
import img3 from '@/assets/img3.png'
import { FiLogIn } from 'react-icons/fi'

const SLIDES = [
  {
    image: img1,
    titre: "Accédez rapidement aux dossiers médicaux en cas d'urgence,",
    gras:  "sauvons d'avantage de vies.",
    sous:  'Une plateforme sécurisée pour des soins de qualité centrés sur le patient.',
  },
  {
    image: img2,
    titre: 'Grâce à votre carte',
    gras:  "bénéficiez d'une prise en charge rapide et sécurisée, réduisant ainsi les risques d'erreurs médicales",
    sous:  'Architecture AES-256-GCM conforme aux normes ISO/IEC 27001:2022.',
  },
  {
    image: img3,
    titre: "Accès d'urgence tracé et sécurisé,",
    gras:  'le mécanisme AUMT break-the-glass.',
    sous:  'Réauthentification, motif clinique, timer automatique et SMS patient.',
  },
]

const formatForBackend = (digits9: string) => `+237${digits9}`
const sanitizeDigits   = (raw: string) => raw.replace(/\D/g, '').slice(0, 9)
const validateTel      = (d: string): string | null => {
  if (d.length !== 9) return 'Le numéro doit contenir 9 chiffres'
  if (d[0] !== '6')   return 'Le numéro doit commencer par 6'
  return null
}
const redirectByRole = (role: string) => ({
  accueil: '/accueil', infirmier: '/infirmier', medecin: '/medecin',
  admin_it: '/admin', super_admin: '/super-admin', patient: '/patient',
}[role] ?? '/parametres')

type Vue = 'login' | 'otp' | 'forgot_tel' | 'forgot_otp' | 'forgot_mdp' | 'forgot_succes'
type TypeCompte = 'personnel' | 'patient' | null

interface State {
  telephone: string; password: string; otp: string; vue: Vue
  typeCompte: TypeCompte; userId: number | null; cpu: string
  telMasque: string; codeDev: string
  forgotTel: string; forgotOtp: string
  forgotUserId: number | null; forgotCpu: string | null
  forgotTypeCompte: 'personnel' | 'patient' | null
  forgotTelMasque: string; forgotCodeDev: string
  nouveauMdp: string; confirmMdp: string
  loading: boolean; error: string | null
}

type Action =
  | { type: 'SET'; k: keyof State; v: string | number | null | boolean }
  | { type: 'SET_VUE'; vue: Vue }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'LOGIN_OK'; typeCompte: TypeCompte; userId?: number; cpu?: string; telMasque: string; codeDev: string }
  | { type: 'OTP_ENVOYE'; userId?: number; cpu?: string; typeCompte: 'personnel' | 'patient'; telMasque: string; codeDev: string }
  | { type: 'RESET_FORGOT' }

const init: State = {
  telephone: '', password: '', otp: '', vue: 'login',
  typeCompte: null, userId: null, cpu: '', telMasque: '', codeDev: '',
  forgotTel: '', forgotOtp: '',
  forgotUserId: null, forgotCpu: null, forgotTypeCompte: null,
  forgotTelMasque: '', forgotCodeDev: '',
  nouveauMdp: '', confirmMdp: '',
  loading: false, error: null,
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'SET':       return { ...s, [a.k]: a.v }
    case 'SET_VUE':   return { ...s, vue: a.vue, error: null, loading: false }
    case 'SET_ERROR': return { ...s, error: a.error, loading: false }
    case 'LOGIN_OK':  return {
      ...s, vue: 'otp', typeCompte: a.typeCompte,
      userId: a.userId ?? null, cpu: a.cpu ?? '',
      telMasque: a.telMasque, codeDev: a.codeDev,
      loading: false, error: null,
    }
    case 'OTP_ENVOYE': return {
      ...s, vue: 'forgot_otp',
      forgotUserId:     a.userId ?? null,
      forgotCpu:        a.cpu ?? null,
      forgotTypeCompte: a.typeCompte,
      forgotTelMasque:  a.telMasque,
      forgotCodeDev:    a.codeDev,
      loading: false, error: null,
    }
    case 'RESET_FORGOT': return {
      ...s, vue: 'login',
      forgotTel: '', forgotOtp: '',
      forgotUserId: null, forgotCpu: null, forgotTypeCompte: null,
      forgotTelMasque: '', forgotCodeDev: '',
      nouveauMdp: '', confirmMdp: '', error: null,
    }
    default: return s
  }
}

const GREEN    = '#1D9E75'
const inputCls = 'w-full rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all'
const inputSty = { background: '#f8fafc', border: '1px solid #e2e8f0' } as React.CSSProperties

const ErreurMsg = ({ msg }: { msg: string | null }) =>
  msg ? (
    <div className="flex items-start gap-2 text-red-600 px-3 py-2 rounded-xl text-sm"
         style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  ) : null

const TelInput = ({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled?: boolean
}) => (
  <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0', background: '#f8fafc' }}>
    <div className="flex items-center px-3 gap-1.5 min-w-fit"
         style={{ borderRight: '1px solid #e2e8f0', background: '#f0f4f8' }}>
      <span className="text-sm">🇨🇲</span>
      <span className="text-xs font-bold text-gray-500">+237</span>
    </div>
    <input type="tel" inputMode="numeric" value={value} disabled={disabled}
      maxLength={9} placeholder="6XX XXX XXX"
      onChange={e => onChange(sanitizeDigits(e.target.value))}
      className="flex-1 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
      style={{ background: '#f8fafc' }} />
  </div>
)

export default function LoginForm() {
  const [s, dispatch]         = useReducer(reducer, init)
  const [slide, setSlide]     = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [showPwd, setShowPwd]     = useState(false)
  const [showNouv, setShowNouv]   = useState(false)
  const [showConf, setShowConf]   = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [slideDir, setSlideDir]   = useState<'in'|'out'>('in')

  const navigate       = useNavigate()
  const setAuth        = useAuthStore(st => st.setAuth)
  const setPatientAuth = usePatientAuthStore(st => st.setAuth)

  const goSlide = useCallback((next: number) => {
    setSlideDir('out')
    setTimeout(() => { setSlide(next); setSlideDir('in') }, 400)
  }, [])

  useEffect(() => {
    const t = setInterval(() => goSlide((slide + 1) % SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [slide, goSlide])

  // ── Login ────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateTel(s.telephone)
    if (err) { dispatch({ type: 'SET_ERROR', error: err }); return }
    if (!s.password) { dispatch({ type: 'SET_ERROR', error: 'Mot de passe requis' }); return }
    dispatch({ type: 'SET', k: 'loading', v: true })
    dispatch({ type: 'SET_ERROR', error: null })
    try {
      const { data } = await api.post('/auth/login-unifie', {
        telephone: formatForBackend(s.telephone),
        password:  s.password,
      })
      dispatch({
        type: 'LOGIN_OK',
        typeCompte: data.typeCompte,
        userId:     data.user_id,
        cpu:        data.cpu,
        telMasque:  data.telephone_masque,
        codeDev:    data.code_dev ?? '',
      })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      dispatch({ type: 'SET_ERROR', error: e?.response?.data?.message ?? 'Identifiants incorrects' })
    }
  }

  // ── OTP connexion ────────────────────────────────────
  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'SET', k: 'loading', v: true })
    dispatch({ type: 'SET_ERROR', error: null })
    try {
      if (s.typeCompte === 'patient') {
        const { data } = await api.post('/patient/verify-otp', {
          telephone: formatForBackend(s.telephone),
          code:      s.otp,
        })
        if (data.token && data.patient) {
          setPatientAuth(
            data.patient.cpu ?? '',
            data.patient.nom ?? '',
            data.patient.prenom ?? '',
            data.token
          )
          navigate('/patient')
        }
      } else {
        const { data } = await api.post('/auth/login/otp', {
          user_id: s.userId,
          code:    s.otp,
        })
        if (data.token && data.utilisateur) {
          setAuth(data.utilisateur, data.token)
          navigate(redirectByRole(data.utilisateur.role))
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      dispatch({ type: 'SET_ERROR', error: e?.response?.data?.message ?? 'Code OTP incorrect' })
    } finally {
      dispatch({ type: 'SET', k: 'loading', v: false })
    }
  }

  // ── Renvoyer OTP ─────────────────────────────────────
  const handleResend = async () => {
    setResending(true)
    try {
      if (s.typeCompte === 'patient') {
        await api.post('/patient/renvoyer-otp', { telephone: formatForBackend(s.telephone) })
      } else {
        await api.post('/auth/resend-otp', { user_id: s.userId })
      }
      setResendMsg('Code renvoyé !')
      setTimeout(() => setResendMsg(''), 4000)
    } catch { setResendMsg("Erreur lors de l'envoi") }
    finally { setResending(false) }
  }

  // ── Reset MDP — étape 1 ──────────────────────────────
  const handleForgotTel = async () => {
    const err = validateTel(s.forgotTel)
    if (err) { dispatch({ type: 'SET_ERROR', error: err }); return }
    dispatch({ type: 'SET', k: 'loading', v: true })
    dispatch({ type: 'SET_ERROR', error: null })
    try {
      const data = await resetPasswordRequest(formatForBackend(s.forgotTel))
      dispatch({
        type:       'OTP_ENVOYE',
        userId:     data.user_id,
        cpu:        data.cpu,
        typeCompte: data.typeCompte ?? 'personnel',
        telMasque:  data.telephone_masque ?? formatForBackend(s.forgotTel),
        codeDev:    data.code_dev ?? '',
      })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      dispatch({ type: 'SET_ERROR', error: e?.response?.data?.message ?? 'Numéro non trouvé' })
    }
  }

  // ── Reset MDP — étape 2 ──────────────────────────────
  const handleForgotOtp = () => {
    if (s.forgotOtp.length < 6) {
      dispatch({ type: 'SET_ERROR', error: 'Code à 6 chiffres requis' })
      return
    }
    dispatch({ type: 'SET_VUE', vue: 'forgot_mdp' })
  }

  // ── Reset MDP — étape 3 ──────────────────────────────
  const handleResetPassword = async () => {
    if (s.nouveauMdp.length < 8) {
      dispatch({ type: 'SET_ERROR', error: 'Minimum 8 caractères' }); return
    }
    if (s.nouveauMdp !== s.confirmMdp) {
      dispatch({ type: 'SET_ERROR', error: 'Les mots de passe ne correspondent pas' }); return
    }
    dispatch({ type: 'SET', k: 'loading', v: true })
    dispatch({ type: 'SET_ERROR', error: null })
    try {
      await resetPasswordConfirm(
        s.forgotTypeCompte === 'patient'
          ? { cpu: s.forgotCpu!, code_otp: s.forgotOtp, nouveau_password: s.nouveauMdp }
          : { user_id: s.forgotUserId!, code_otp: s.forgotOtp, nouveau_password: s.nouveauMdp }
      )
      dispatch({ type: 'SET_VUE', vue: 'forgot_succes' })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      dispatch({ type: 'SET_ERROR', error: e?.response?.data?.message ?? 'Erreur lors de la modification' })
    }
  }

  const renderPanelContent = () => {

    // ── VUE : Login ──────────────────────────────────────
    if (s.vue === 'login') return (
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-0.5">Connexion</p>
          <p className="text-xs text-gray-400 mb-3">Personnel soignant et patients</p>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Numéro de téléphone</label>
          <TelInput value={s.telephone}
            onChange={v => dispatch({ type: 'SET', k: 'telephone', v })}
            disabled={!!s.loading} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type={showPwd ? 'text' : 'password'} value={s.password}
              placeholder="••••••••" autoComplete="current-password"
              onChange={e => dispatch({ type: 'SET', k: 'password', v: e.target.value })}
              className={`${inputCls} pl-10 pr-10`} style={inputSty} />
            <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => dispatch({ type: 'SET_VUE', vue: 'forgot_tel' })}
            className="text-xs font-semibold" style={{ color: GREEN }}>
            Mot de passe oublié ?
          </button>
        </div>
        <ErreurMsg msg={s.error} />
        <button type="submit" disabled={!!s.loading || s.telephone.length !== 9 || !s.password}
          className="w-full text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: GREEN }}>
          {s.loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Vérification…</> : 'Se connecter'}
        </button>

        {/* ── Séparateur ── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* ── Bouton inscription patient ── */}
        <button type="button"
          onClick={() => { setPanelOpen(false); navigate('/inscription') }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-105"
          style={{ border: `1px solid ${GREEN}`, color: GREEN, background: 'rgba(29,158,117,0.05)' }}>
          <UserPlus className="w-4 h-4" />
          Créer mon compte patient
        </button>

        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <Phone className="w-3 h-3" />
          Un code SMS vous sera envoyé pour confirmer
        </p>
      </form>
    )

    // ── VUE : OTP ────────────────────────────────────────
    if (s.vue === 'otp') return (
      <form onSubmit={handleOtp} className="space-y-4">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Code SMS</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {s.typeCompte === 'patient' ? 'Espace patient' : 'Espace professionnel'}
          </p>
        </div>
        <div className="text-sm rounded-xl px-4 py-3 text-blue-700"
             style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
          Code envoyé au <strong>{s.telMasque}</strong>
          {s.codeDev && <span className="block text-xs text-gray-400 mt-1">Dev : {s.codeDev}</span>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Code OTP (6 chiffres)</label>
          <input type="text" inputMode="numeric" value={s.otp}
            maxLength={6} placeholder="000000" autoFocus autoComplete="one-time-code"
            onChange={e => dispatch({ type: 'SET', k: 'otp', v: e.target.value.replace(/\D/g, '') })}
            className={`${inputCls} text-center tracking-[0.5em] text-xl font-mono`} style={inputSty} />
        </div>
        <ErreurMsg msg={s.error} />
        <button type="submit" disabled={!!s.loading || s.otp.length < 6}
          className="w-full text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: GREEN }}>
          {s.loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Vérification…</> : 'Valider le code'}
        </button>
        <div className="text-center space-y-1">
          <button type="button" onClick={handleResend} disabled={resending}
            className="text-xs text-gray-500 hover:underline flex items-center gap-1 mx-auto">
            {resending ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
            Renvoyer le code par SMS
          </button>
          {resendMsg && <p className="text-xs text-green-600">{resendMsg}</p>}
        </div>
        <button type="button" onClick={() => dispatch({ type: 'SET_VUE', vue: 'login' })}
          className="w-full text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Retour
        </button>
      </form>
    )

    // ── VUE : Forgot tel ─────────────────────────────────
    if (s.vue === 'forgot_tel') return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Réinitialisation</h1>
          <p className="text-xs text-gray-400 mt-0.5">Entrez votre numéro pour recevoir un code</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Numéro de téléphone</label>
          <TelInput value={s.forgotTel}
            onChange={v => dispatch({ type: 'SET', k: 'forgotTel', v })}
            disabled={!!s.loading} />
        </div>
        <ErreurMsg msg={s.error} />
        <button onClick={handleForgotTel} disabled={!!s.loading || s.forgotTel.length !== 9}
          className="w-full text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: GREEN }}>
          {s.loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Envoi…</> : 'Envoyer le code SMS'}
        </button>
        <button onClick={() => dispatch({ type: 'RESET_FORGOT' })}
          className="w-full text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Retour à la connexion
        </button>
      </div>
    )

    // ── VUE : Forgot OTP ─────────────────────────────────
    if (s.vue === 'forgot_otp') return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-gray-900">Code reçu ?</h1>
        </div>
        <div className="text-sm rounded-xl px-4 py-3 text-blue-700"
             style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
          Code envoyé au <strong>{s.forgotTelMasque}</strong>
          {s.forgotCodeDev && <span className="block text-xs text-gray-400 mt-1">Dev : {s.forgotCodeDev}</span>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Code OTP (6 chiffres)</label>
          <input type="text" value={s.forgotOtp} maxLength={6} inputMode="numeric"
            placeholder="000000" autoFocus
            onChange={e => dispatch({ type: 'SET', k: 'forgotOtp', v: e.target.value.replace(/\D/g, '') })}
            className={`${inputCls} text-center tracking-[0.5em] text-xl font-mono`} style={inputSty} />
        </div>
        <ErreurMsg msg={s.error} />
        <button onClick={handleForgotOtp} disabled={s.forgotOtp.length < 6}
          className="w-full text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40"
          style={{ background: GREEN }}>
          Vérifier le code
        </button>
        <button onClick={() => dispatch({ type: 'SET_VUE', vue: 'forgot_tel' })}
          className="w-full text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Retour
        </button>
      </div>
    )

    // ── VUE : Nouveau MDP ────────────────────────────────
    if (s.vue === 'forgot_mdp') return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-gray-900">Nouveau mot de passe</h1>
          <p className="text-xs text-gray-400">Minimum 8 caractères</p>
        </div>
        {[
          { label: 'Nouveau mot de passe', val: s.nouveauMdp, key: 'nouveauMdp' as const, show: showNouv, setShow: setShowNouv },
          { label: 'Confirmer',            val: s.confirmMdp, key: 'confirmMdp' as const, show: showConf, setShow: setShowConf },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{f.label}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type={f.show ? 'text' : 'password'} value={f.val} placeholder="••••••••"
                onChange={e => dispatch({ type: 'SET', k: f.key, v: e.target.value })}
                className={`${inputCls} pl-10 pr-10`} style={inputSty} />
              <button type="button" tabIndex={-1} onClick={() => f.setShow(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
        <ErreurMsg msg={s.error} />
        <button onClick={handleResetPassword} disabled={!!s.loading}
          className="w-full text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: GREEN }}>
          {s.loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Modification…</> : 'Modifier le mot de passe'}
        </button>
      </div>
    )

    // ── VUE : Succès reset ───────────────────────────────
    if (s.vue === 'forgot_succes') return (
      <div className="text-center space-y-4 py-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
             style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.3)' }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: GREEN }} />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">Mot de passe modifié !</p>
          <p className="text-sm text-gray-500 mt-1">Vous pouvez maintenant vous connecter.</p>
        </div>
        <button onClick={() => dispatch({ type: 'RESET_FORGOT' })}
          className="w-full text-white font-semibold py-3 rounded-xl text-sm"
          style={{ background: GREEN }}>
          Se connecter
        </button>
      </div>
    )

    return null
  }

  const currentSlide = SLIDES[slide]

  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Diaporama */}
      <div className="absolute inset-0">
        {SLIDES.map((sl, i) => (
          <div key={i} className="absolute inset-0 transition-opacity duration-700"
               style={{ opacity: i === slide ? 1 : 0, zIndex: i === slide ? 1 : 0 }}>
            <img src={sl.image} alt={`Slide ${i+1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0"
                 style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%)' }} />
          </div>
        ))}
      </div>

      {/* Contenu */}
      <div className="relative z-10 min-h-screen flex">
        <div className="flex flex-col justify-between p-6 lg:p-8 pt-4 flex-1">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="HMC" className="h-13 w-13 object-contain rounded-full"
                 style={{ background: 'rgba(255,255,255,0.15)', padding: 4 }} />
            <div>
              <p className="text-white font-bold text-lg leading-tight">
                Health <span style={{ color: '#48d9aa' }}>Mboa</span> Connect
              </p>
              <p className="text-white/50 text-xs">Système d'Information Hospitalier Sécurisé</p>
            </div>
          </div>

          {/* Texte slide */}
          <div className="max-w-lg">
            <p key={`t-${slide}`} className="text-white/80 text-2xl lg:text-3xl font-normal leading-snug mb-2"
               style={{ animation: `${slideDir === 'in' ? 'fadeSlideIn' : 'fadeSlideOut'} 0.5s ease` }}>
              {currentSlide.titre}
            </p>
            <p key={`g-${slide}`} className="text-white text-3xl lg:text-4xl font-bold leading-snug"
               style={{ animation: `${slideDir === 'in' ? 'fadeSlideIn' : 'fadeSlideOut'} 0.5s ease 0.1s both` }}>
              {currentSlide.gras}
            </p>
            <p key={`s-${slide}`} className="text-white/60 text-sm mt-3 leading-relaxed"
               style={{ animation: `${slideDir === 'in' ? 'fadeSlideIn' : 'fadeSlideOut'} 0.5s ease 0.2s both` }}>
              {currentSlide.sous}
            </p>
            <div className="flex items-center gap-4 mt-6">
              <button onClick={() => goSlide((slide - 1 + SLIDES.length) % SLIDES.length)}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {SLIDES.map((_, i) => (
                  <button key={i} onClick={() => goSlide(i)}
                    className="rounded-full transition-all duration-300"
                    style={{ width: i === slide ? 24 : 8, height: 8,
                      background: i === slide ? '#1D9E75' : 'rgba(255,255,255,0.4)' }} />
                ))}
              </div>
              <button onClick={() => goSlide((slide + 1) % SLIDES.length)}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-white/30 text-xs">
            <span>© 2026 Health Mboa Connect. Tous droits réservés.</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>

      {/* Bouton connexion */}
      <button onClick={() => setPanelOpen(true)}
        className="fixed top-5 right-6 z-30 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
        style={{ background: GREEN }}>
        <FiLogIn className="w-4 h-4" />
        Connexion
      </button>

      {/* Modal */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
             onClick={e => { if (e.target === e.currentTarget) setPanelOpen(false) }}>

          <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
               style={{ animation: 'modalIn 0.25s ease' }}>

            <div className="flex flex-col items-center pt-7 pb-4 px-8"
                 style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #16c98d 100%)' }}>
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg mb-3">
                <img src={logo} alt="HMC" className="h-10 w-10 object-contain" />
              </div>
              <h2 className="text-white font-bold text-xl">Bienvenue</h2>
              <p className="text-white/70 text-xs mt-0.5">Connectez-vous à votre espace</p>
            </div>

            <div className="px-8 py-6" style={{ background: '#ffffff' }}>
              <button onClick={() => setPanelOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition">
                <X className="w-4 h-4" />
              </button>
              {renderPanelContent()}
              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-center">
                <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Français ▾</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeSlideOut { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(-8px); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
      `}</style>
    </div>
  )
}
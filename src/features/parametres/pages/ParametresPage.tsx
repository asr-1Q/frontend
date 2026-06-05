/**
 * ParametresPage.tsx
 * Page de paramètres accessible à tous les rôles.
 * Permet de changer son mot de passe avec vérification de l'ancien.
 */

import { useState } from 'react'
import { FiKey, FiEye, FiEyeOff, FiCheck, FiAlertTriangle } from 'react-icons/fi'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'

export default function ParametresPage() {
  const { user } = useAuthStore()

  const [form, setForm] = useState({
    ancien_password:   '',
    nouveau_password:  '',
    confirmer_password: '',
  })
  const [showAncien,   setShowAncien]   = useState(false)
  const [showNouveau,  setShowNouveau]  = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [succes,       setSucces]       = useState(false)
  const [erreur,       setErreur]       = useState<string | null>(null)

  const inputCls = 'w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent pr-10'
  const labelCls = 'block text-xs font-medium text-zinc-700 mb-1'

  const force = (() => {
    const p = form.nouveau_password
    if (!p) return 0
    let score = 0
    if (p.length >= 8)  score++
    if (p.length >= 12) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  })()

  const forceLabel = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'][force] ?? ''
  const forceColor = [
    '', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-600'
  ][force] ?? ''

  const handleSubmit = async () => {
    setErreur(null)
    setSucces(false)

    if (!form.ancien_password || !form.nouveau_password || !form.confirmer_password) {
      setErreur('Tous les champs sont obligatoires')
      return
    }
    if (form.nouveau_password.length < 8) {
      setErreur('Nouveau mot de passe minimum 8 caractères')
      return
    }
    if (form.nouveau_password !== form.confirmer_password) {
      setErreur('Les nouveaux mots de passe ne correspondent pas')
      return
    }
    if (form.ancien_password === form.nouveau_password) {
      setErreur('Le nouveau mot de passe doit être différent de l\'ancien')
      return
    }

    setLoading(true)
    try {
      await api.post('/accueil/changer-mot-de-passe', {
        ancien_password:  form.ancien_password,
        nouveau_password: form.nouveau_password,
      })
      setSucces(true)
      setForm({ ancien_password: '', nouveau_password: '', confirmer_password: '' })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setErreur(err.response?.data?.message ?? 'Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  const PwdInput = ({
    label, value, show, onToggle, onChange, placeholder
  }: {
    label: string; value: string; show: boolean
    onToggle: () => void; onChange: (v: string) => void; placeholder?: string
  }) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className={inputCls}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
          {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-800">Paramètres</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {user?.prenom} {user?.nom} · {user?.role?.replace('_', ' ')}
        </p>
      </div>

      {/* Carte changement de mot de passe */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
          <div className="size-10 rounded-full flex items-center justify-center" style={{ background: '#E1F5EE' }}>
            <FiKey size={18} style={{ color: '#1D9E75' }} />
          </div>
          <div>
            <p className="font-semibold text-zinc-800 text-sm">Changer le mot de passe</p>
            <p className="text-xs text-zinc-400">Utilisez un mot de passe fort d'au moins 8 caractères</p>
          </div>
        </div>

        {/* Succès */}
        {succes && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
            <FiCheck size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">Mot de passe modifié avec succès !</p>
          </div>
        )}

        <PwdInput
          label="Ancien mot de passe *"
          value={form.ancien_password}
          show={showAncien}
          onToggle={() => setShowAncien(v => !v)}
          onChange={v => setForm(f => ({ ...f, ancien_password: v }))}
        />

        <PwdInput
          label="Nouveau mot de passe *"
          value={form.nouveau_password}
          show={showNouveau}
          onToggle={() => setShowNouveau(v => !v)}
          onChange={v => setForm(f => ({ ...f, nouveau_password: v }))}
        />

        {/* Indicateur de force */}
        {form.nouveau_password && (
          <div className="space-y-1 -mt-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                  i <= force ? forceColor : 'bg-zinc-200'
                }`} />
              ))}
            </div>
            <p className="text-xs text-zinc-400">{forceLabel}</p>
          </div>
        )}

        <PwdInput
          label="Confirmer le nouveau mot de passe *"
          value={form.confirmer_password}
          show={showConfirm}
          onToggle={() => setShowConfirm(v => !v)}
          onChange={v => setForm(f => ({ ...f, confirmer_password: v }))}
        />

        {/* Vérification correspondance */}
        {form.confirmer_password && form.nouveau_password && (
          <p className={`text-xs -mt-2 ${
            form.nouveau_password === form.confirmer_password
              ? 'text-green-600'
              : 'text-red-500'
          }`}>
            {form.nouveau_password === form.confirmer_password
              ? '✓ Les mots de passe correspondent'
              : '✗ Les mots de passe ne correspondent pas'
            }
          </p>
        )}

        {/* Erreur */}
        {erreur && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <FiAlertTriangle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{erreur}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !form.ancien_password || !form.nouveau_password || !form.confirmer_password}
          className="w-full py-2.5 rounded-lg text-white font-semibold transition disabled:opacity-50"
          style={{ background: '#1D9E75' }}>
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Modification…
              </span>
            : 'Modifier le mot de passe'
          }
        </button>

        <p className="text-xs text-zinc-400 text-center">
          Après modification, votre session reste active. Reconnectez-vous si nécessaire.
        </p>
      </div>

      {/* Infos compte */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5 space-y-3">
        <p className="text-sm font-semibold text-zinc-700">Informations du compte</p>
        <div className="grid grid-cols-2 gap-3">
          <Info label="Nom"        value={`${user?.prenom ?? ''} ${user?.nom ?? ''}`} />
          <Info label="Rôle"       value={user?.role?.replace('_', ' ') ?? '—'} />
          <Info label="Hôpital"    value={user?.hopital_nom ?? '—'} />
          <Info label="Téléphone"  value={user?.telephone ?? '—'} />
        </div>
      </div>

    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-zinc-700 mt-0.5 capitalize">{value}</p>
    </div>
  )
}
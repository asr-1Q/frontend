import { useEffect, useState } from 'react'
import { ShieldCheck, Eye, AlertCircle, RefreshCw } from 'lucide-react'
import { getHistoriqueAcces } from '../api/patientApi'
import type { AccesDossier } from '../types'
import { SignalerAccesModal } from './SignalerAccesModal'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })

const niveauAcces = (action: string | null): { label: string; classe: string } => {
  const a = (action ?? '').toUpperCase()
  if (a.includes('AUMT'))                           return { label: 'Urgence (AUMT)', classe: 'bg-red-50 text-red-700 border-red-200' }
  if (a.includes('DIAGNOSTIC') || a.includes('C2')) return { label: 'C2 — Diagnostic',  classe: 'bg-amber-50 text-amber-700 border-amber-200' }
  return                                                  { label: 'C1 — Soin',        classe: 'bg-teal-50 text-teal-700 border-teal-200' }
}

export const SecuriteTab = () => {
  const [historique, setHistorique]   = useState<AccesDossier[]>([])
  const [loading, setLoading]         = useState(true)
  const [erreur, setErreur]           = useState<string | null>(null)
  const [signalement, setSignalement] = useState<AccesDossier | null>(null)

  const charger = async () => {
    setLoading(true)
    setErreur(null)
    try {
      const data = await getHistoriqueAcces()
      setHistorique(data)
    } catch (err: any) {
      setErreur(err?.response?.data?.message ?? "Erreur lors du chargement de l'historique.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">Sécurité</h2>
            <p className="text-xs text-zinc-500">Historique des accès à mon dossier</p>
          </div>
        </div>
        <button
          onClick={charger}
          disabled={loading}
          className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-50"
          aria-label="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs text-blue-800 leading-relaxed">
        Chaque consultation de votre dossier médical par un professionnel est tracée ici.
        Si vous ne reconnaissez pas un accès, signalez-le immédiatement à votre établissement.
      </div>

      {/* Chargement */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Erreur */}
      {!loading && erreur && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-700">{erreur}</div>
        </div>
      )}

      {/* Liste vide */}
      {!loading && !erreur && historique.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
          <Eye className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Aucun accès enregistré pour l'instant.</p>
        </div>
      )}

      {/* Liste des accès */}
      {!loading && !erreur && historique.length > 0 && (
        <ul className="space-y-2">
          {historique.map((acc) => {
            const niv = niveauAcces(acc.action)
            return (
              <li
                key={acc.id}
                className="bg-white border border-zinc-200 rounded-2xl p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      Dr {acc.prenom ?? ''} {acc.nom ?? ''}
                    </p>
                    <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-full ${niv.classe}`}>
                      {niv.label}
                    </span>
                  </div>
                  {acc.hopital_nom && (
                    <p className="text-xs text-zinc-500 truncate">{acc.hopital_nom}</p>
                  )}
                  <p className="text-[11px] text-zinc-400 mt-0.5">{fmtDate(acc.created_at)}</p>
                </div>
                <button
                  onClick={() => setSignalement(acc)}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg flex-shrink-0"
                >
                  Signaler
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Modal signalement */}
      {signalement && (
        <SignalerAccesModal
          acces={signalement}
          onClose={() => setSignalement(null)}
        />
      )}
    </div>
  )
}

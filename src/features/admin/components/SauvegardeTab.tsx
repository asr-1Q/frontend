// features/admin/components/SauvegardeTab.tsx
import { useState } from 'react'
import { FiDatabase, FiCheckCircle, FiAlertTriangle, FiDownloadCloud } from 'react-icons/fi'
import { adminApi } from '../api/adminApi'
import type { StatistiquesResponse } from '../types'
import { ROLE_LABEL } from '../types'

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

interface Props { statistiques: StatistiquesResponse | null }

export default function SauvegardeTab({ statistiques }: Props) {
  const [loading, setLoading] = useState(false)
  const [succes,  setSucces]  = useState('')
  const [error,   setError]   = useState('')

  // ── Téléchargement direct sur la machine ──────────────
  const handleSauvegarde = async () => {
    setLoading(true)
    setSucces('')
    setError('')
    try {
      const response = await adminApi.sauvegarder()

      // Récupérer le nom du fichier depuis le header Content-Disposition
      const disposition = response.headers?.['content-disposition'] ?? ''
      const match       = disposition.match(/filename="?([^";\n]+)"?/)
      const timestamp   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename    = match?.[1] ?? `hmc_db_${timestamp}.sql`

      // Créer le blob et déclencher le téléchargement
      const blob = new Blob([response.data], { type: 'application/sql' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSucces(`Sauvegarde téléchargée : ${filename}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const stats   = statistiques?.stats
  const parRole = statistiques?.personnel_par_role ?? []

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Personnel total', value: fcfa(Number(stats.total_personnel)) },
            { label: 'Patients total',  value: fcfa(Number(stats.total_patients))  },
            { label: 'Visites totales', value: fcfa(Number(stats.total_visites))   },
            { label: 'Comptes actifs',  value: fcfa(Number(stats.comptes_actifs))  },
            { label: 'Comptes bloqués', value: fcfa(Number(stats.comptes_bloques)) },
          ].map(s => (
            <div key={s.label} className="bg-white border border-zinc-200 rounded-xl p-3">
              <p className="text-xs text-zinc-400">{s.label}</p>
              <p className="text-lg font-bold text-zinc-800">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Répartition */}
      {parRole.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Répartition personnel</h3>
          <div className="grid grid-cols-2 gap-2">
            {parRole.map(r => (
              <div key={r.role} className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2">
                <span className="text-xs text-zinc-600">{ROLE_LABEL[r.role] ?? r.role}</span>
                <span className="text-xs font-bold text-zinc-700">{r.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone sauvegarde */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
            <FiDatabase size={22} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 mb-1">
              Sauvegarde manuelle de la base de données
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Génère un fichier <code className="bg-zinc-100 px-1 rounded">.sql</code> complet
              et le télécharge directement sur votre machine. L'action est tracée dans le journal d'audit.
            </p>
          </div>
        </div>

        {succes && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
            <FiCheckCircle size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">{succes}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <FiAlertTriangle size={15} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <button onClick={handleSauvegarde} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
          <FiDownloadCloud size={16} />
          {loading ? 'Préparation…' : 'Télécharger la sauvegarde (.sql)'}
        </button>

        <p className="text-xs text-zinc-400 mt-3">
          ⚠️ Cette opération peut prendre quelques secondes selon la taille de la base.
          Le fichier sera téléchargé directement dans votre dossier de téléchargements.
        </p>
      </div>
    </div>
  )
}
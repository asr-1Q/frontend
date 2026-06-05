import { useState } from 'react'
import { FiDownload, FiFilter, FiCalendar } from 'react-icons/fi'
import type { GlobalLog, Hopital } from '../types'
import { ROLE_LABEL } from '../types'

const today = () => new Date().toISOString().split('T')[0]

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const ACTIONS = [
  'LOGIN', 'LOGOUT', 'LOGIN_ECHEC', 'COMPTE_BLOQUE',
  'COMPTE_CREE', 'COMPTE_MODIFIE', 'RESET_PASSWORD',
  'AUMT_DECLENCHE', 'HOPITAL_CREE', 'ADMIN_IT_CREE',
  'CREATION_PATIENT', 'CREATION_VISITE', 'SAUVEGARDE_BDD',
]

// Export CSV simple (pas de dépendance externe)
const exportCSV = (logs: GlobalLog[], dateDebut: string, dateFin: string) => {
  const headers = ['Acteur', 'Rôle', 'Hôpital', 'Action', 'Détails', 'IP', 'Date']
  const rows = logs.map(l => [
    `${l.prenom ?? ''} ${l.nom ?? ''}`.trim(),
    ROLE_LABEL[l.role ?? ''] ?? (l.role ?? ''),
    l.hopital_nom ?? '',
    l.action,
    (l.details ?? '').replace(/,/g, ';'),
    l.ip_address ?? '',
    fmtDate(l.created_at),
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `audit_global_${dateDebut}_${dateFin}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  logs:           GlobalLog[]
  hopitaux:       Hopital[]
  onParamsChange: (p: { hopital_id?: number; action?: string; date_debut?: string; date_fin?: string }) => void
}

export default function LogsTab({ logs, hopitaux, onParamsChange }: Props) {
  const [hopitalId, setHopitalId] = useState<number | ''>('')
  const [action,    setAction]    = useState('')
  const [dateDebut, setDateDebut] = useState(today())
  const [dateFin,   setDateFin]   = useState(today())

  const apply = (h: number | '', a: string, dd: string, df: string) => {
    onParamsChange({
      hopital_id: h  ? Number(h) : undefined,
      action:     a  ? a         : undefined,
      date_debut: dd ? dd        : undefined,
      date_fin:   df ? df        : undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-zinc-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <FiFilter size={14} className="text-zinc-400" />

        <select value={hopitalId}
          onChange={e => { const v = e.target.value ? Number(e.target.value) : ''; setHopitalId(v); apply(v, action, dateDebut, dateFin) }}
          className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 text-zinc-700 max-w-48 truncate">
          <option value="">Tous les hôpitaux</option>
          {hopitaux.map(h => <option key={h.id} value={h.id}>{h.nom}</option>)}
        </select>

        <select value={action}
          onChange={e => { setAction(e.target.value); apply(hopitalId, e.target.value, dateDebut, dateFin) }}
          className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 text-zinc-700">
          <option value="">Toutes les actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <FiCalendar size={13} className="text-zinc-400" />
          <input type="date" value={dateDebut}
            onChange={e => { setDateDebut(e.target.value); apply(hopitalId, action, e.target.value, dateFin) }}
            className="text-xs border border-zinc-200 rounded-lg px-2 py-1" />
          <span className="text-xs text-zinc-400">→</span>
          <input type="date" value={dateFin}
            onChange={e => { setDateFin(e.target.value); apply(hopitalId, action, dateDebut, e.target.value) }}
            className="text-xs border border-zinc-200 rounded-lg px-2 py-1" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-400">{logs.length} entrée(s)</span>
          <button onClick={() => exportCSV(logs, dateDebut, dateFin)} disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40">
            <FiDownload size={13} /> Exporter CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {logs.length === 0
          ? <div className="text-center py-12 text-zinc-400 text-sm">Aucun log pour ces critères.</div>
          : (
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0">
                  <tr>
                    {['Acteur', 'Rôle', 'Hôpital', 'Action', 'Détails', 'IP', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                      <td className="px-4 py-2.5 font-medium text-zinc-700">{log.prenom} {log.nom}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{ROLE_LABEL[log.role ?? ''] ?? log.role}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{log.hopital_nom}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">{log.action}</span>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                      <td className="px-4 py-2.5 font-mono text-zinc-400">{log.ip_address}</td>
                      <td className="px-4 py-2.5 text-zinc-400 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}
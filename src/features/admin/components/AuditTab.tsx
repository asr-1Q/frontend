import { useState } from 'react'
import { FiDownload, FiFilter, FiCalendar } from 'react-icons/fi'
import { useAuthStore } from '@/store/authStore'
import type { AuditLog } from '../types'
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
  'AUMT_DECLENCHE', 'CREATION_PATIENT', 'CREATION_VISITE',
  'SAISIE_CONSTANTES', 'FIN_CONSULTATION', 'SAUVEGARDE_BDD',
  'CONFIG_ROLES_MODIFIEE',
]

// ─── Chargement logo ──────────────────────────────────────────
const chargerLogo = async (): Promise<string | null> => {
  try {
    const mod = await import('@/assets/logo.png')
    const url = mod.default
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror   = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

// ─── Export PDF moderne ───────────────────────────────────────
const exportPDF = async (
  logs: AuditLog[],
  dateDebut: string,
  dateFin: string,
  hopitalNom: string
) => {
  const { jsPDF } = await import('jspdf')
  const autoTable  = (await import('jspdf-autotable')).default
  const logo       = await chargerLogo()

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W   = 297

  // ── En-tête ──────────────────────────────────────────────
  doc.setFillColor(29, 158, 117)
  doc.rect(0, 0, W, 32, 'F')
  doc.setFillColor(225, 245, 238)
  doc.rect(0, 32, W, 7, 'F')

  if (logo) {
    try { doc.addImage(logo, 'PNG', 10, 4, 22, 22) } catch {}
  }

  const xT = logo ? 36 : 14
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Health Mboa Connect', xT, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text("Journal d'audit de sécurité", xT, 20)
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, xT, 26)

  doc.setTextColor(29, 158, 117)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(
    `Hôpital : ${hopitalNom || '—'}   ·   Période : ${dateDebut} → ${dateFin}   ·   ${logs.length} entrée(s)`,
    14, 36.5
  )

  doc.setDrawColor(29, 158, 117)
  doc.setLineWidth(0.5)
  doc.line(0, 39, W, 39)

  // ── Tableau ───────────────────────────────────────────────
  autoTable(doc, {
    startY: 44,
    head: [['Acteur', 'Rôle', 'Action', 'Détails', 'IP', 'Date & heure']],
    body: logs.map(l => {
      const nom  = `${l.acteur_prenom ?? l.prenom ?? ''} ${l.acteur_nom ?? l.nom ?? ''}`.trim()
      const role = l.acteur_role ?? l.role ?? ''
      return [
        nom || '—',
        (ROLE_LABEL[role] ?? role) || '—',
        l.action,
        (l.details ?? '').slice(0, 70) + ((l.details ?? '').length > 70 ? '…' : ''),
        l.ip_address ?? '—',
        fmtDate(l.created_at),
      ]
    }),
    styles:             { fontSize: 7.5, cellPadding: 2.8, font: 'helvetica' },
    headStyles:         { fillColor: [29, 158, 117], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 250, 248] },
    rowPageBreak:       'auto',
    columnStyles: {
      0: { cellWidth: 36, fontStyle: 'bold' },
      1: { cellWidth: 24 },
      2: { cellWidth: 40, textColor: [29, 158, 117] },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 28, font: 'courier', fontSize: 7 },
      5: { cellWidth: 40 },
    },
    didDrawPage: (data: any) => {
      // Mini en-tête sur les pages suivantes
      if (data.pageNumber > 1) {
        doc.setFillColor(29, 158, 117)
        doc.rect(0, 0, W, 10, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text(`Health Mboa Connect — Journal d'audit (suite)`, 14, 7)
      }
    }
  })

  // ── Pied de page ──────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  const H         = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(10, H - 12, W - 10, H - 12)
    doc.setFontSize(7)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text('Health Mboa Connect — Document confidentiel — Usage interne uniquement', 14, H - 7)
    doc.text(`Page ${i} / ${pageCount}`, W - 28, H - 7)
  }

  doc.save(`audit_hmc_${dateDebut}_${dateFin}.pdf`)
}

interface Props {
  logs:           AuditLog[]
  onParamsChange: (p: { action?: string; date_debut?: string; date_fin?: string }) => void
}

export default function AuditTab({ logs, onParamsChange }: Props) {
  const user = useAuthStore(s => s.user)

  const [action,     setAction]     = useState('')
  const [dateDebut,  setDateDebut]  = useState(today())
  const [dateFin,    setDateFin]    = useState(today())
  const [pdfLoading, setPdfLoading] = useState(false)

  const applyFilter = (a: string, dd: string, df: string) => {
    onParamsChange({ action: a || undefined, date_debut: dd, date_fin: df })
  }

  const handleExportPDF = async () => {
    if (logs.length === 0) return
    setPdfLoading(true)
    try { await exportPDF(logs, dateDebut, dateFin, user?.hopital_nom ?? '') }
    catch { /* silencieux */ }
    finally { setPdfLoading(false) }
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <FiFilter size={14} className="text-zinc-400" />
        <select value={action}
          onChange={e => { setAction(e.target.value); applyFilter(e.target.value, dateDebut, dateFin) }}
          className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 text-zinc-700">
          <option value="">Toutes les actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <FiCalendar size={13} className="text-zinc-400" />
          <input type="date" value={dateDebut}
            onChange={e => { setDateDebut(e.target.value); applyFilter(action, e.target.value, dateFin) }}
            className="text-xs border border-zinc-200 rounded-lg px-2 py-1 text-zinc-700" />
          <span className="text-xs text-zinc-400">→</span>
          <input type="date" value={dateFin}
            onChange={e => { setDateFin(e.target.value); applyFilter(action, dateDebut, e.target.value) }}
            className="text-xs border border-zinc-200 rounded-lg px-2 py-1 text-zinc-700" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-400">{logs.length} entrée(s)</span>
          <button onClick={handleExportPDF} disabled={logs.length === 0 || pdfLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition">
            <FiDownload size={13} />
            {pdfLoading ? 'PDF…' : 'Exporter PDF'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {logs.length === 0
          ? <div className="text-center py-12 text-zinc-400 text-sm">Aucun log pour ces critères.</div>
          : (
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0">
                  <tr>
                    {['Acteur', 'Rôle', 'Action', 'Détails', 'IP', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const nom    = log.acteur_prenom ?? log.prenom ?? ''
                    const prenom = log.acteur_nom    ?? log.nom    ?? ''
                    const role   = log.acteur_role   ?? log.role   ?? ''
                    return (
                      <tr key={log.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                        <td className="px-4 py-2.5 font-medium text-zinc-700">{nom} {prenom}</td>
                        <td className="px-4 py-2.5 text-zinc-500">{ROLE_LABEL[role] ?? role}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">{log.action}</span>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                        <td className="px-4 py-2.5 font-mono text-zinc-400">{log.ip_address}</td>
                        <td className="px-4 py-2.5 text-zinc-400 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}
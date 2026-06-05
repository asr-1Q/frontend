import { useState } from 'react'
import {
  FiPlus, FiLock, FiUnlock, FiKey, FiTrash2,
  FiSearch, FiX, FiAlertTriangle, FiDownload,
} from 'react-icons/fi'
import { adminApi } from '../api/adminApi'
import type { Utilisateur, NouvelUtilisateur } from '../types'
import { ROLE_LABEL, ROLES_HOPITAL } from '../types'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

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
const exportPDF = async (utilisateurs: Utilisateur[]) => {
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
  doc.text('Liste du Personnel', xT, 20)
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, xT, 26)

  doc.setTextColor(29, 158, 117)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(`${utilisateurs.length} compte(s) exporté(s)`, 14, 36.5)

  doc.setDrawColor(29, 158, 117)
  doc.setLineWidth(0.5)
  doc.line(0, 39, W, 39)

  // ── Tableau ───────────────────────────────────────────────
  autoTable(doc, {
    startY: 44,
    head: [['Nom & Prénom', 'Téléphone', 'Rôle', 'Statut', 'Créé le']],
    body: utilisateurs.map(u => [
      `${u.prenom} ${u.nom}`,
      u.telephone ?? '—',
      ROLE_LABEL[u.role] ?? u.role,
      u.compte_bloque ? 'Bloqué' : u.premier_login ? '1er login' : u.actif ? 'Actif' : 'Inactif',
      fmtDate(u.created_at),
    ]),
    styles:             { fontSize: 9, cellPadding: 3.5, font: 'helvetica' },
    headStyles:         { fillColor: [29, 158, 117], textColor: 255, fontStyle: 'bold', fontSize: 9.5 },
    alternateRowStyles: { fillColor: [245, 250, 248] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 45, font: 'courier', fontSize: 8.5 },
      2: { cellWidth: 50, textColor: [29, 158, 117] },
      3: { cellWidth: 30 },
      4: { cellWidth: 40 },
    },
    didDrawCell: (data: any) => {
      // Coloriser la colonne Statut
      if (data.column.index === 3 && data.section === 'body') {
        const val = data.cell.raw as string
        if (val === 'Bloqué')    data.cell.styles.textColor = [220, 38, 38]
        if (val === '1er login') data.cell.styles.textColor = [202, 138, 4]
        if (val === 'Actif')     data.cell.styles.textColor = [16, 185, 129]
      }
    },
    didDrawPage: (data: any) => {
      if (data.pageNumber > 1) {
        doc.setFillColor(29, 158, 117)
        doc.rect(0, 0, W, 10, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text('Health Mboa Connect — Liste du Personnel (suite)', 14, 7)
      }
    }
  })

  // ── Pied de page ──────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  const H = doc.internal.pageSize.getHeight()
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

  doc.save(`personnel_hmc_${new Date().toISOString().slice(0, 10)}.pdf`)
}

interface Props {
  utilisateurs: Utilisateur[]
  onReload:     () => void
}

// ─── Modal Créer / Modifier ───────────────────────────────
function ModalUtilisateur({ initial, onClose, onSave }: {
  initial?: Utilisateur | null; onClose: () => void; onSave: () => void
}) {
  const [form, setForm] = useState<NouvelUtilisateur>({
    nom:       initial?.nom       ?? '',
    prenom:    initial?.prenom    ?? '',
    telephone: initial?.telephone ?? '',
    role:      initial?.role      ?? 'medecin',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k: keyof NouvelUtilisateur, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.telephone || !form.role) {
      setError('Nom, prénom, téléphone et rôle sont obligatoires.')
      return
    }
    setLoading(true); setError('')
    try {
      if (initial) await adminApi.modifierUtilisateur(initial.id, form)
      else         await adminApi.creerUtilisateur(form)
      onSave(); onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Erreur lors de la sauvegarde')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-800">
            {initial ? 'Modifier le compte' : 'Nouveau compte'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><FiX size={18} /></button>
        </div>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">{error}</div>}
        <div className="space-y-3">
          {[
            { label: 'Prénom *',    key: 'prenom'    as const },
            { label: 'Nom *',       key: 'nom'       as const },
            { label: 'Téléphone *', key: 'telephone' as const, type: 'tel' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-zinc-600 block mb-1">{f.label}</label>
              <input type={f.type ?? 'text'} value={form[f.key] ?? ''}
                placeholder={f.key === 'telephone' ? '+237 6XX XXX XXX' : ''}
                onChange={e => set(f.key, e.target.value)}
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-zinc-600 block mb-1">Rôle *</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {ROLES_HOPITAL.map(r => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">Annuler</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: '#1D9E75' }}>
            {loading ? 'Sauvegarde…' : initial ? 'Modifier' : 'Créer'}
          </button>
        </div>
        {!initial && <p className="text-xs text-zinc-400 text-center mt-3">Les credentials seront envoyés par SMS au numéro indiqué.</p>}
      </div>
    </div>
  )
}

function ModalConfirmSupprimer({ user, onClose, onConfirm }: {
  user: Utilisateur; onClose: () => void; onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-red-100 rounded-full"><FiAlertTriangle size={18} className="text-red-600" /></div>
          <h2 className="text-base font-semibold text-zinc-800">Confirmer la désactivation</h2>
        </div>
        <p className="text-sm text-zinc-600 mb-6">
          Désactiver le compte de <strong>{user.prenom} {user.nom}</strong> ? Le compte ne sera pas supprimé définitivement.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">Désactiver</button>
        </div>
      </div>
    </div>
  )
}

export default function PersonnelTab({ utilisateurs, onReload }: Props) {
  const [search,     setSearch]     = useState('')
  const [filtreRole, setFiltreRole] = useState('')
  const [modal,      setModal]      = useState<'creer' | 'modifier' | 'supprimer' | null>(null)
  const [selected,   setSelected]   = useState<Utilisateur | null>(null)
  const [actionMsg,  setActionMsg]  = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const notify = (type: 'ok' | 'err', text: string) => {
    setActionMsg({ type, text })
    setTimeout(() => setActionMsg(null), 4000)
  }

  const handleBloquer   = async (u: Utilisateur) => { try { const r = await adminApi.bloquerUtilisateur(u.id); notify('ok', r.message); onReload() } catch { notify('err', 'Erreur lors du blocage') } }
  const handleReset     = async (u: Utilisateur) => { try { const r = await adminApi.resetPassword(u.id); notify('ok', r.message) } catch { notify('err', 'Erreur lors du reset') } }
  const handleSupprimer = async () => {
    if (!selected) return
    try { await adminApi.supprimerUtilisateur(selected.id); notify('ok', 'Compte désactivé'); setModal(null); onReload() }
    catch { notify('err', 'Erreur lors de la désactivation') }
  }
  const handleExportPDF = async () => {
    setPdfLoading(true)
    try { await exportPDF(filtered) }
    catch { notify('err', 'Erreur lors de la génération du PDF') }
    finally { setPdfLoading(false) }
  }

  const filtered = utilisateurs.filter(u => {
    const q = search.toLowerCase()
    return (u.nom.toLowerCase().includes(q) || u.prenom.toLowerCase().includes(q) || (u.telephone ?? '').includes(q))
      && (filtreRole ? u.role === filtreRole : true)
  })

  const StatutBadge = ({ u }: { u: Utilisateur }) => {
    if (u.compte_bloque) return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Bloqué</span>
    if (u.premier_login) return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">1er login</span>
    if (u.actif)         return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Actif</span>
    return <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">Inactif</span>
  }

  return (
    <div className="space-y-4">
      {actionMsg && (
        <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${actionMsg.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {actionMsg.text}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Rechercher par nom ou téléphone…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <select value={filtreRole} onChange={e => setFiltreRole(e.target.value)}
          className="text-xs border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700">
          <option value="">Tous les rôles</option>
          {ROLES_HOPITAL.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <button onClick={handleExportPDF} disabled={filtered.length === 0 || pdfLoading}
          className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:bg-zinc-50 disabled:opacity-40 transition">
          <FiDownload size={14} /> {pdfLoading ? 'PDF…' : 'Export PDF'}
        </button>
        <button onClick={() => { setSelected(null); setModal('creer') }}
          className="flex items-center gap-1.5 px-3 py-2 text-white text-xs font-medium rounded-lg" style={{ background: '#1D9E75' }}>
          <FiPlus size={14} /> Nouveau compte
        </button>
      </div>
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>{['Nom', 'Téléphone', 'Rôle', 'Statut', 'Créé le', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} className="text-center py-10 text-zinc-400">Aucun utilisateur trouvé.</td></tr>
                : filtered.map(u => (
                  <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#1D9E75' }}>
                          {u.prenom[0]}{u.nom[0]}
                        </div>
                        <p className="font-medium text-zinc-700">{u.prenom} {u.nom}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-mono">{u.telephone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-medium text-xs" style={{ background: '#E1F5EE', color: '#0F6E56' }}>{ROLE_LABEL[u.role] ?? u.role}</span>
                    </td>
                    <td className="px-4 py-3"><StatutBadge u={u} /></td>
                    <td className="px-4 py-3 text-zinc-400">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleBloquer(u)} title={u.compte_bloque ? 'Débloquer' : 'Bloquer'} className={`p-1.5 rounded-lg transition ${u.compte_bloque ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}>
                          {u.compte_bloque ? <FiUnlock size={14} /> : <FiLock size={14} />}
                        </button>
                        <button onClick={() => handleReset(u)} title="Réinitialiser mot de passe" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"><FiKey size={14} /></button>
                        <button onClick={() => { setSelected(u); setModal('supprimer') }} title="Désactiver" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><FiTrash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-zinc-100 text-xs text-zinc-400">{filtered.length} compte(s) affiché(s) sur {utilisateurs.length}</div>
      </div>
      {(modal === 'creer' || modal === 'modifier') && <ModalUtilisateur initial={modal === 'modifier' ? selected : null} onClose={() => setModal(null)} onSave={onReload} />}
      {modal === 'supprimer' && selected && <ModalConfirmSupprimer user={selected} onClose={() => setModal(null)} onConfirm={handleSupprimer} />}
    </div>
  )
}
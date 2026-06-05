import { useState } from 'react'
import { FiPlus, FiX, FiLock, FiUnlock, FiKey } from 'react-icons/fi'
import { superAdminApi } from '../api/superAdminApi'
import type { AdminIT, NouvelAdminIT, Hopital } from '../types'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

function ModalAdminIT({ hopitaux, onClose, onSave }: {
  hopitaux: Hopital[]; onClose: () => void; onSave: () => void
}) {
  const [form, setForm] = useState<NouvelAdminIT>({
    nom: '', prenom: '', telephone: '', hopital_id: hopitaux[0]?.id ?? 0,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k: keyof NouvelAdminIT, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.telephone || !form.hopital_id) {
      setError('Nom, prénom, téléphone et hôpital sont obligatoires.')
      return
    }
    setLoading(true); setError('')
    try {
      await superAdminApi.creerAdminIT(form)
      onSave(); onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Erreur lors de la création')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-800">Nouvel Admin IT</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><FiX size={18}/></button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="space-y-3">
          {([
            { label: 'Prénom *',    key: 'prenom'    },
            { label: 'Nom *',       key: 'nom'       },
            { label: 'Téléphone *', key: 'telephone', type: 'tel' },
          ] as { label: string; key: keyof NouvelAdminIT; type?: string }[]).map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-zinc-600 block mb-1">{f.label}</label>
              <input
                type={f.type ?? 'text'}
                value={String(form[f.key] ?? '')}
                placeholder={f.key === 'telephone' ? '+237 6XX XXX XXX' : ''}
                onChange={e => set(f.key, e.target.value)}
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-zinc-600 block mb-1">Hôpital *</label>
            <select value={form.hopital_id} onChange={e => set('hopital_id', Number(e.target.value))}
              className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]">
              {hopitaux.filter(h => h.actif).map(h => (
                <option key={h.id} value={h.id}>{h.nom} — {h.ville}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-zinc-400 text-center mt-3">
          Les credentials seront envoyés par SMS au numéro indiqué.
        </p>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: '#1D9E75' }}>
            {loading ? 'Création…' : 'Créer Admin IT'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props { adminsIT: AdminIT[]; hopitaux: Hopital[]; onReload: () => void }

export default function AdminsITTab({ adminsIT, hopitaux, onReload }: Props) {
  const [modal,     setModal]     = useState(false)
  const [search,    setSearch]    = useState('')
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const notify = (type: 'ok' | 'err', text: string) => {
    setActionMsg({ type, text }); setTimeout(() => setActionMsg(null), 4000)
  }

  const handleToggle = async (a: AdminIT) => {
    try {
      const r = await superAdminApi.toggleAdminIT(a.id)
      notify('ok', r.message); onReload()
    } catch { notify('err', 'Erreur lors du blocage') }
  }

  const handleReset = async (a: AdminIT) => {
    try {
      const r = await superAdminApi.resetAdminITPassword(a.id)
      notify('ok', r.message)
    } catch { notify('err', 'Erreur lors du reset') }
  }

  const filtered = adminsIT.filter(a =>
    `${a.nom} ${a.prenom} ${a.telephone ?? ''} ${a.hopital_nom}`
      .toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">

      {actionMsg && (
        <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
          actionMsg.type === 'ok'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>{actionMsg.text}</div>
      )}

      <div className="flex items-center gap-3">
        <input type="text" placeholder="Rechercher un Admin IT…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
        <button onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-white text-xs font-medium rounded-lg"
          style={{ background: '#1D9E75' }}>
          <FiPlus size={14} /> Nouvel Admin IT
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                {['Admin IT', 'Téléphone', 'Hôpital', 'Région', 'Statut', 'Créé le', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} className="text-center py-10 text-zinc-400">Aucun Admin IT.</td></tr>
                : filtered.map(a => (
                  <tr key={a.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                             style={{ background: '#1D9E75' }}>
                          {a.prenom[0]}{a.nom[0]}
                        </div>
                        <p className="font-medium text-zinc-700">{a.prenom} {a.nom}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-mono">{a.telephone ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-zinc-700">{a.hopital_nom}</td>
                    <td className="px-4 py-3 text-zinc-500">{a.hopital_region}</td>
                    <td className="px-4 py-3">
                      {a.compte_bloque
                        ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Bloqué</span>
                        : a.premier_login
                          ? <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">1er login</span>
                          : <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Actif</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{fmtDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggle(a)}
                          title={a.compte_bloque ? 'Débloquer' : 'Bloquer'}
                          className={`p-1.5 rounded-lg transition ${
                            a.compte_bloque
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}>
                          {a.compte_bloque ? <FiUnlock size={14}/> : <FiLock size={14}/>}
                        </button>
                        <button onClick={() => handleReset(a)}
                          title="Réinitialiser mot de passe"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition">
                          <FiKey size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-zinc-100 text-xs text-zinc-400">
          {filtered.length} Admin(s) IT
        </div>
      </div>

      {modal && (
        <ModalAdminIT
          hopitaux={hopitaux}
          onClose={() => setModal(false)}
          onSave={onReload}
        />
      )}
    </div>
  )
}
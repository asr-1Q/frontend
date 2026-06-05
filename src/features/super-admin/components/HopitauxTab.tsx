import { useState } from 'react'
import { FiPlus, FiX, FiCheckCircle, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import { superAdminApi } from '../api/superAdminApi'
import type { Hopital, NouvelHopital } from '../types'
import { REGIONS_CAMEROUN, TYPES_HOPITAL } from '../types'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

function ModalHopital({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<NouvelHopital>({
    nom: '', code: '', ville: '', region: 'Littoral', type: 'public',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k: keyof NouvelHopital, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.nom || !form.code || !form.ville || !form.region) {
      setError('Nom, code, ville et région sont obligatoires.')
      return
    }
    setLoading(true); setError('')
    try {
      await superAdminApi.creerHopital(form)
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
          <h2 className="text-base font-semibold text-zinc-800">Nouvel hôpital</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><FiX size={18} /></button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="space-y-3">
          {([
            { label: "Nom de l'hôpital *", key: 'nom'   },
            { label: 'Code unique *',       key: 'code'  },
            { label: 'Ville *',             key: 'ville' },
          ] as { label: string; key: keyof NouvelHopital }[]).map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-zinc-600 block mb-1">{f.label}</label>
              <input type="text" value={form[f.key] ?? ''}
                onChange={e => set(f.key, e.target.value)}
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">Région *</label>
              <select value={form.region} onChange={e => set('region', e.target.value)}
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]">
                {REGIONS_CAMEROUN.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">Type *</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]">
                {TYPES_HOPITAL.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: '#1D9E75' }}>
            {loading ? 'Création…' : "Créer l'hôpital"}
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props { hopitaux: Hopital[]; onReload: () => void }

export default function HopitauxTab({ hopitaux, onReload }: Props) {
  const [modal,    setModal]    = useState(false)
  const [search,   setSearch]   = useState('')
  const [actionId, setActionId] = useState<number | null>(null)
  const [msg,      setMsg]      = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const notifier = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 3000)
  }

  const handleToggle = async (h: Hopital) => {
    setActionId(h.id)
    try {
      const r = await superAdminApi.toggleHopital(h.id)
      notifier('ok', r.message); onReload()
    } catch { notifier('err', 'Erreur lors du changement de statut') }
    finally { setActionId(null) }
  }

  const filtered = hopitaux.filter(h =>
    `${h.nom} ${h.code} ${h.ville}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">

      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
          msg.type === 'ok'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>{msg.text}</div>
      )}

      <div className="flex items-center gap-3">
        <input type="text" placeholder="Rechercher un hôpital…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
        <button onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-white text-xs font-medium rounded-lg"
          style={{ background: '#1D9E75' }}>
          <FiPlus size={14} /> Nouvel hôpital
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                {['Hôpital', 'Code', 'Ville', 'Région', 'Type', 'Médecins', 'Infirmiers', 'Patients', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={10} className="text-center py-10 text-zinc-400">Aucun hôpital.</td></tr>
                : filtered.map(h => (
                  <tr key={h.id} className={`border-b border-zinc-50 hover:bg-zinc-50 ${!h.actif ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-zinc-700">{h.nom}</td>
                    <td className="px-4 py-3 font-mono text-zinc-500">{h.code}</td>
                    <td className="px-4 py-3 text-zinc-500">{h.ville}</td>
                    <td className="px-4 py-3 text-zinc-500">{h.region}</td>
                    <td className="px-4 py-3 text-zinc-500 capitalize">{h.type}</td>
                    <td className="px-4 py-3 text-center">{h.medecins ?? 0}</td>
                    <td className="px-4 py-3 text-center">{h.infirmiers ?? 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-zinc-700">{h.nb_patients}</td>
                    <td className="px-4 py-3">
                      {h.actif
                        ? <span className="flex items-center gap-1 text-green-600"><FiCheckCircle size={12}/> Actif</span>
                        : <span className="text-zinc-400">Inactif</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(h)} disabled={actionId === h.id}
                        title={h.actif ? 'Désactiver' : 'Activer'}
                        className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
                          h.actif
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}>
                        {h.actif ? <FiToggleRight size={16}/> : <FiToggleLeft size={16}/>}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-zinc-100 text-xs text-zinc-400">
          {filtered.length} hôpital(s)
        </div>
      </div>

      {modal && <ModalHopital onClose={() => setModal(false)} onSave={onReload} />}
    </div>
  )
}
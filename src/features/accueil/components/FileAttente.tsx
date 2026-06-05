import { useState, useEffect } from 'react'
import { FiRefreshCw, FiClock, FiUser, FiUserPlus, FiXCircle, FiRotateCcw, FiPrinter } from 'react-icons/fi'
import type { VisiteFile, MedecinDispo } from '../types'
import { assignerMedecin, fermerDossier, rouvrirDossier, getMedecins, genererQR } from '../api/accueilApi'

// ─── Statuts ──────────────────────────────────────────────────
const STATUTS: Record<string, { label: string; color: string }> = {
  en_attente_tri:     { label: 'Attente tri',     color: 'bg-orange-100 text-orange-700' },
  en_attente_medecin: { label: 'Attente médecin', color: 'bg-blue-100 text-blue-700'    },
  en_consultation:    { label: 'En consultation', color: 'bg-green-100 text-green-700'  },
  en_pause:           { label: 'En pause',        color: 'bg-yellow-100 text-yellow-700'},
  termine:            { label: 'Terminé',         color: 'bg-zinc-100 text-zinc-500'    },
  annule:             { label: 'Annulé',          color: 'bg-red-100 text-red-500'      },
}

const Badge = ({ statut }: { statut: string }) => {
  const s = STATUTS[statut] ?? { label: statut, color: 'bg-zinc-100 text-zinc-500' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
}

const heureDepuis = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  return diff < 60 ? `${diff} min` : `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, '0')}`
}

// ─── Modal assignation médecin ────────────────────────────────
function ModalAssigner({ visite, medecins, onClose, onSuccess }: {
  visite: VisiteFile; medecins: MedecinDispo[]; onClose: () => void; onSuccess: () => void
}) {
  const [medecinId, setMedecinId] = useState<number>(0)
  const [loading,   setLoading]   = useState(false)
  const [erreur,    setErreur]    = useState('')

  const handleSubmit = async () => {
    if (!medecinId) { setErreur('Sélectionnez un médecin'); return }
    setLoading(true)
    try { await assignerMedecin(visite.id, medecinId); onSuccess(); onClose() }
    catch { setErreur("Erreur lors de l'assignation") }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-zinc-800 mb-1">Assigner un médecin</h2>
        <p className="text-xs text-zinc-400 mb-4">
          Patient : <span className="font-semibold text-zinc-700">{visite.prenom_masque?.replace('***', '')} {visite.nom_masque?.replace('***', '')}</span>
          <span className="font-mono ml-2 text-zinc-400">{visite.cpu}</span>
        </p>
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {medecins.length === 0
            ? <p className="text-sm text-zinc-400 text-center py-4">Aucun médecin disponible</p>
            : medecins.map(m => (
              <button key={m.id} onClick={() => setMedecinId(m.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition ${
                  medecinId === m.id ? 'border-[#1D9E75] bg-green-50' : 'border-zinc-200 hover:border-zinc-300'
                }`}>
                <div className="text-left">
                  <p className="font-medium text-zinc-800">Dr. {m.prenom} {m.nom}</p>
                  {m.specialite && <p className="text-xs text-zinc-400">{m.specialite}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  m.statut_presence === 'disponible' ? 'bg-green-100 text-green-700' :
                  m.statut_presence === 'absent'     ? 'bg-red-100 text-red-600'     :
                                                       'bg-amber-100 text-amber-700'
                }`}>
                  {m.statut_presence === 'absent' ? 'Absent' : `${m.patients_en_attente} patients`}
                </span>
              </button>
            ))
          }
        </div>
        {erreur && <p className="text-sm text-red-600 mb-3">{erreur}</p>}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading || !medecinId}
            className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: '#1D9E75' }}>
            {loading ? 'Assignation…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal réouverture dossier ────────────────────────────────
function ModalRouvrir({ visite, onClose, onSuccess }: {
  visite: VisiteFile; onClose: () => void; onSuccess: () => void
}) {
  const [motif,   setMotif]   = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur,  setErreur]  = useState('')

  const handleSubmit = async () => {
    if (!motif.trim()) { setErreur('Motif obligatoire'); return }
    setLoading(true)
    try { await rouvrirDossier(visite.id, motif.trim()); onSuccess(); onClose() }
    catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setErreur(e?.response?.data?.message ?? 'Erreur serveur')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-2 mb-1">
          <FiRotateCcw className="text-blue-600" size={18} />
          <h2 className="text-base font-semibold text-zinc-800">Réouvrir le dossier</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-4">Patient : <span className="font-mono">{visite.cpu}</span></p>
        <div className="mb-4">
          <label className="text-xs font-medium text-zinc-600 block mb-1">
            Motif de réouverture <span className="text-red-500">*</span>
          </label>
          <textarea value={motif} onChange={e => setMotif(e.target.value)}
            rows={3} placeholder="Raison de la réouverture du dossier…"
            className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
        </div>
        {erreur && <p className="text-sm text-red-600 mb-3">{erreur}</p>}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading || !motif.trim()}
            className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: '#1D9E75' }}>
            {loading ? 'Réouverture…' : 'Réouvrir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal génération QR ──────────────────────────────────────
function ModalQR({ visite, onClose }: { visite: VisiteFile; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [qrData,  setQrData]  = useState<{ qr_content: string; donnees_c0: Record<string, unknown> } | null>(null)
  const [erreur,  setErreur]  = useState('')

  const generer = async () => {
    setLoading(true); setErreur('')
    try { setQrData(await genererQR(visite.cpu)) }
    catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setErreur(e?.response?.data?.message ?? 'Erreur serveur')
    } finally { setLoading(false) }
  }

  useEffect(() => { generer() }, [])

  const imprimer = () => {
    if (!qrData) return
    const win = window.open('', '_blank')
    if (!win) return
    const d = qrData.donnees_c0 as Record<string, string | null>
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Carte — ${visite.cpu}</title>
      <style>* { margin:0;padding:0;box-sizing:border-box }
      body { font-family:Arial,sans-serif }
      .carte { width:85.6mm;height:54mm;border:1px solid #ccc;border-radius:4mm;padding:4mm;display:flex;flex-direction:column;justify-content:space-between }
      .header { display:flex;align-items:center;gap:2mm;border-bottom:0.5px solid #eee;padding-bottom:2mm }
      .logo { width:8mm;height:8mm;background:#1D9E75;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:4mm;font-weight:bold }
      .titre { font-size:3mm;font-weight:bold;color:#1D9E75 }
      .sous-titre { font-size:2mm;color:#888 }
      .corps { display:flex;gap:3mm;flex:1;padding-top:2mm }
      .infos { flex:1 }
      .nom { font-size:3.5mm;font-weight:bold;color:#222 }
      .cpu { font-size:2mm;color:#888;font-family:monospace }
      .ligne { font-size:2.5mm;color:#333;margin-top:1mm }
      .badge { display:inline-block;background:#fee2e2;color:#b91c1c;border-radius:1mm;padding:0.5mm 1.5mm;font-size:2mm;font-weight:bold;margin-right:1mm }
      .qr-zone { width:24mm;display:flex;flex-direction:column;align-items:center }
      .qr-placeholder { width:22mm;height:22mm;border:0.5px solid #ddd;display:flex;align-items:center;justify-content:center;font-size:1.8mm;color:#aaa;text-align:center }
      .footer { font-size:1.8mm;color:#bbb;border-top:0.5px solid #eee;padding-top:1.5mm;display:flex;justify-content:space-between }
      </style></head><body>
      <div class="carte">
        <div class="header"><div class="logo">HMC</div><div><div class="titre">Health Mboa Connect</div><div class="sous-titre">Carte Sanitaire d'Urgence</div></div></div>
        <div class="corps">
          <div class="infos">
            <div class="nom">${d.nom || ''} ${d.prenom || ''}</div>
            <div class="cpu">${d.cpu || ''}</div>
            <div class="ligne">Né(e) : ${d.date_naissance ? new Date(d.date_naissance).toLocaleDateString('fr-FR') : '—'} | ${d.sexe === 'M' ? 'Masculin' : d.sexe === 'F' ? 'Féminin' : '—'}</div>
            <div class="ligne" style="margin-top:2mm;"><strong>Groupe :</strong> ${d.groupe_sanguin || '—'}</div>
            ${d.allergies ? `<div class="ligne"><span class="badge">⚠ ALLERGIE</span>${d.allergies}</div>` : ''}
            ${d.pathologies ? `<div class="ligne"><strong>Chronique :</strong> ${d.pathologies}</div>` : ''}
          </div>
          <div class="qr-zone"><div class="qr-placeholder">QR Code</div></div>
        </div>
        <div class="footer"><span>${d.hopital || 'HMC'}</span><span>Émis le ${new Date().toLocaleDateString('fr-FR')}</span><span>Valide 1 an</span></div>
      </div>
      <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>`)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-2 mb-1">
          <FiPrinter className="text-green-600" size={18} />
          <h2 className="text-base font-semibold text-zinc-800">Carte QR sanitaire</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-4">Patient : <span className="font-mono">{visite.cpu}</span></p>
        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Génération en cours…</p>
          </div>
        )}
        {erreur && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">{erreur}</div>}
        {qrData && !loading && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              ✓ Carte générée et signée HMAC-SHA256
            </div>
            <div className="bg-zinc-50 rounded-xl p-3 text-xs space-y-1">
              <p><strong>Groupe :</strong> {String(qrData.donnees_c0.groupe_sanguin || '—')}</p>
              {Boolean(qrData.donnees_c0.allergies) && (
                <p className="text-red-600"><strong>⚠ Allergies :</strong> {String(qrData.donnees_c0.allergies)}</p>
              )}
              {Boolean(qrData.donnees_c0.pathologies) && (
                <p><strong>Chronique :</strong> {String(qrData.donnees_c0.pathologies)}</p>
              )}
            </div>
            <button onClick={imprimer}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: '#1D9E75' }}>
              <FiPrinter size={14} /> Imprimer la carte (format CNI)
            </button>
          </div>
        )}
        <button onClick={onClose}
          className="w-full mt-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">
          Fermer
        </button>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────
interface Props {
  file:      VisiteFile[]
  loading:   boolean
  onRefresh: () => void
  afficherTermines?: boolean
}

export default function FileAttente({ file, loading, onRefresh, afficherTermines = false }: Props) {
  const [actionId,     setActionId]     = useState<number | null>(null)
  const [msg,          setMsg]          = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [medecins,     setMedecins]     = useState<MedecinDispo[]>([])
  const [modalAssign,  setModalAssign]  = useState<VisiteFile | null>(null)
  const [modalRouvrir, setModalRouvrir] = useState<VisiteFile | null>(null)
  const [modalQR,      setModalQR]      = useState<VisiteFile | null>(null)
  const [showTermines, setShowTermines] = useState(false)

  useEffect(() => { getMedecins().then(setMedecins).catch(() => {}) }, [])

  const notifier = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 3000)
  }

  const handleFermer = async (visiteId: number) => {
    setActionId(visiteId)
    try { await fermerDossier(visiteId); notifier('ok', 'Dossier fermé'); onRefresh() }
    catch { notifier('err', 'Erreur lors de la fermeture') }
    finally { setActionId(null) }
  }

  const visiteActives  = file.filter(v => !['termine', 'annule'].includes(v.statut))
  const visiteTermines = file.filter(v => ['termine', 'annule'].includes(v.statut))
  const fileAffichee   = showTermines ? file : visiteActives

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-zinc-800">File d'attente ({visiteActives.length})</h2>
          {visiteTermines.length > 0 && (
            <button onClick={() => setShowTermines(v => !v)}
              className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-500 hover:border-zinc-300 transition">
              {showTermines ? 'Masquer terminés' : `Voir terminés (${visiteTermines.length})`}
            </button>
          )}
        </div>
        <button onClick={onRefresh} className="flex items-center gap-1 text-sm hover:underline" style={{ color: '#1D9E75' }}>
          <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Message flash */}
      {msg && (
        <div className={`mb-3 px-3 py-2 rounded-lg text-sm font-medium ${
          msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>{msg.text}</div>
      )}

      {/* Liste vide */}
      {!loading && visiteActives.length === 0 && (
        <div className="text-center py-12">
          <FiUser size={32} className="text-zinc-200 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">Aucune visite en cours aujourd'hui</p>
        </div>
      )}

      {/* Liste des visites */}
      <div className="space-y-2">
        {fileAffichee.map(v => {
          const estTermine = ['termine', 'annule'].includes(v.statut)
          return (
            <div key={v.id}
              className={`p-3 rounded-xl border transition ${
                v.urgence || v.priorite === 'URGENT'
                  ? 'border-red-200 bg-red-50'
                  : estTermine
                    ? 'border-zinc-100 bg-zinc-50 opacity-70'
                    : 'border-zinc-100 bg-white hover:border-zinc-200'
              }`}>

              {/* Ligne principale */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white ${
                  v.urgence || v.priorite === 'URGENT' ? 'bg-red-500' : estTermine ? 'bg-zinc-400' : ''
                }`} style={!(v.urgence || v.priorite === 'URGENT') && !estTermine ? { background: '#1D9E75' } : {}}>
                  {v.ticket_numero}
                </div>

                <div className="flex-1 min-w-0">
                  {/* ── Nom complet visible pour l'accueil ── */}
                  <p className="font-semibold text-zinc-800 text-sm">
                    {v.prenom_masque} {v.nom_masque}
                    {(v.urgence || v.priorite === 'URGENT') && (
                      <span className="ml-1 text-red-500 text-xs font-semibold">⚠ URGENT</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-400 font-mono">{v.cpu}</p>
                  {v.medecin_nom
                    ? <p className="text-xs text-zinc-500">Dr. {v.medecin_prenom} {v.medecin_nom}</p>
                    : <p className="text-xs text-amber-500 font-medium">Médecin non assigné</p>
                  }
                </div>

                <div className="text-right flex-shrink-0 space-y-1">
                  <Badge statut={v.statut} />
                  <p className="text-xs text-zinc-400 flex items-center justify-end gap-1">
                    <FiClock size={10} /> {heureDepuis(v.created_at)}
                  </p>
                </div>
              </div>

              {/* Actions — simplifiées : QR et AUMT retirés */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-100 flex-wrap">

                {/* Assigner / changer médecin */}
                {['en_attente_tri', 'en_attente_medecin'].includes(v.statut) && (
                  <button onClick={() => setModalAssign(v)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-[#1D9E75] hover:text-[#1D9E75] transition">
                    <FiUserPlus size={11} />
                    {v.medecin_nom ? 'Changer médecin' : 'Assigner médecin'}
                  </button>
                )}

                {/* Fermer dossier */}
                {['en_attente_tri', 'en_attente_medecin'].includes(v.statut) && (
                  <button onClick={() => handleFermer(v.id)} disabled={actionId === v.id}
                    className="flex items-center gap-1 ml-auto text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-400 hover:border-red-300 hover:text-red-500 transition disabled:opacity-50">
                    <FiXCircle size={11} />
                    Fermer
                  </button>
                )}

                {/* Réouvrir */}
                {estTermine && (
                  <button onClick={() => setModalRouvrir(v)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition">
                    <FiRotateCcw size={11} />
                    Réouvrir
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {modalAssign && (
        <ModalAssigner visite={modalAssign} medecins={medecins}
          onClose={() => setModalAssign(null)}
          onSuccess={() => { onRefresh(); notifier('ok', 'Médecin assigné avec succès') }} />
      )}
      {modalRouvrir && (
        <ModalRouvrir visite={modalRouvrir}
          onClose={() => setModalRouvrir(null)}
          onSuccess={() => { onRefresh(); notifier('ok', 'Dossier réouvert') }} />
      )}
      {modalQR && (
        <ModalQR visite={modalQR} onClose={() => setModalQR(null)} />
      )}
    </div>
  )
}
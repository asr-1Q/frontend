import { useState, useCallback } from 'react'
import { FiSearch, FiX, FiArrowLeft } from 'react-icons/fi'
import { useAuthStore }         from '@/store/authStore'
import { useMedecin }           from '../hooks/useMedecin'
import { useConsultation }      from '../hooks/useConsultation'
import { StatCards }            from '../components/StatCards'
import { ListePatientsAttente } from '../components/ListePatientsAttente'
import { ConsultationPanel }    from '../components/ConsultationPanel'
import { PauseModal }           from '../components/PauseModal'
import type { PatientAttente }  from '../types'

export default function MedecinPage() {
  const user        = useAuthStore(s => s.user)
  const medecin     = useMedecin()
  const consultation = useConsultation(medecin.rafraichir)

  const [showPause,         setShowPause]         = useState(false)
  const [pendingVisite,     setPendingVisite]      = useState<PatientAttente | null>(null)
  const [mobileVoirDossier, setMobileVoirDossier] = useState(false)

  const handleOuvrir = useCallback((visite: PatientAttente) => {
    if (consultation.dossier) { setPendingVisite(visite); setShowPause(true); return }
    consultation.ouvrirDossier(visite.visite_id)
    setMobileVoirDossier(true)
  }, [consultation])

  const handleReprendre = useCallback((visite: PatientAttente) => {
    if (consultation.dossier && consultation.dossier.consultation.visite_id !== visite.visite_id) {
      setPendingVisite(visite); setShowPause(true); return
    }
    consultation.ouvrirDossier(visite.visite_id)
    setMobileVoirDossier(true)
  }, [consultation])

  const handleConfirmerPause = useCallback(async (raison: string) => {
    await consultation.pauserConsultation(raison)
    setShowPause(false)
    if (pendingVisite) {
      consultation.ouvrirDossier(pendingVisite.visite_id)
      setPendingVisite(null)
      setMobileVoirDossier(true)
    }
  }, [consultation, pendingVisite])

  const handleRechercheChange = useCallback((q: string) => {
    medecin.setRechercheQuery(q)
    medecin.lancerRecherche(q)
  }, [medecin])

  const visiteActiveId = consultation.dossier?.consultation.visite_id ?? null

  return (
    <div className="h-full flex flex-col overflow-hidden -m-4 md:-m-6" style={{ background: '#F8F7F2' }}>

      {/* Mobile — vue dossier plein écran */}
      {mobileVoirDossier && consultation.dossier && (
        <div className="md:hidden flex flex-col h-full bg-white">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200">
            <button onClick={() => setMobileVoirDossier(false)}
              className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition">
              <FiArrowLeft size={18} />
            </button>
            <p className="text-sm font-semibold text-zinc-700">Dossier en cours</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConsultationPanel hook={consultation} />
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden ${mobileVoirDossier && consultation.dossier ? 'hidden md:flex' : 'flex'}`}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3 md:px-6 space-y-3" style={{ background: '#F8F7F2' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-zinc-800">Consultations</h1>
              <p className="text-xs text-zinc-400">Dr {user?.prenom} {user?.nom}</p>
            </div>
            <button onClick={medecin.ouvrirRecherche}
              className="flex items-center gap-1.5 text-xs px-3 py-2 border border-zinc-200 rounded-xl text-zinc-500 hover:text-zinc-800 bg-white transition">
              <FiSearch size={13} /> Recherche
            </button>
          </div>
          <StatCards stats={medecin.stats} loading={medecin.loadingInit} />
        </div>

        {/* Overlay recherche */}
        {medecin.rechercheMode && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
                <FiSearch size={16} className="text-zinc-400" />
                <input type="text" value={medecin.rechercheQuery}
                  onChange={e => handleRechercheChange(e.target.value)}
                  placeholder="CPU, ticket…" autoFocus
                  className="flex-1 text-sm focus:outline-none" />
                <button onClick={medecin.fermerRecherche}>
                  <FiX size={16} className="text-zinc-400 hover:text-zinc-600" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
                {medecin.rechercheLoad && <p className="text-xs text-center py-6 text-zinc-400">Recherche…</p>}
                {!medecin.rechercheLoad && medecin.rechercheRes.length === 0 && medecin.rechercheQuery.length >= 2 && (
                  <p className="text-xs text-center py-6 text-zinc-400">Aucun résultat</p>
                )}
                {medecin.rechercheRes.map(v => (
                  <button key={v.visite_id}
                    onClick={() => { medecin.fermerRecherche(); handleOuvrir(v) }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition text-left">
                    <div className="size-8 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                         style={{ background: '#1D9E75' }}>
                      {v.prenom_masque?.[0]}{v.nom_masque?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 truncate">
                        {v.prenom_masque} {v.nom_masque}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">{v.cpu} · #{v.ticket_numero}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      v.niveau_urgence === 'critique' ? 'bg-red-100 text-red-700' :
                      v.niveau_urgence === 'urgent'   ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>{v.niveau_urgence}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2 colonnes */}
        <div className="flex-1 flex overflow-hidden">
          <div className="w-full md:w-[380px] md:flex-shrink-0 flex flex-col border-r border-zinc-200 bg-white overflow-hidden">
            <div className="flex-1 overflow-hidden px-3 py-3">
              <ListePatientsAttente
                visites={medecin.visites}
                loading={medecin.loadingInit}
                erreur={medecin.erreur}
                filtres={medecin.filtres}
                onSetFiltre={medecin.setFiltre}
                onReinitFiltres={medecin.reinitialiserFiltres}
                medecinId={user?.id ?? 0}
                visiteActiveId={visiteActiveId}
                onOuvrir={handleOuvrir}
                onReprendre={handleReprendre}
                onRefresh={medecin.rafraichir}
              />
            </div>
          </div>
          <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-white">
            <ConsultationPanel hook={consultation} />
          </div>
        </div>
      </div>

      {showPause && (
        <PauseModal
          onConfirmer={handleConfirmerPause}
          onAnnuler={() => { setShowPause(false); setPendingVisite(null) }}
          loading={consultation.loadingAction}
        />
      )}
    </div>
  )
}
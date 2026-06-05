import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchDashboard, fetchPatientsAttente, fetchRecherchePatients } from '../api/medecinApi'
import type { PatientAttente, NiveauUrgence, StatutVisite } from '../types'

const POLLING_MS = 30_000

export interface FiltresFile {
  recherche: string
  urgence:   NiveauUrgence | ''
  statut:    StatutVisite | ''
}

const FILTRES_DEFAUT: FiltresFile = { recherche: '', urgence: '', statut: '' }

interface StatsMedecin {
  aujourd_hui: number
  termines:    number
  en_attente:  number
  aumt_actifs: number
}

const POIDS: Record<string, number> = { critique: 1, urgent: 2, semi_urgent: 3, normal: 4 }

const trierFile = (visites: PatientAttente[]): PatientAttente[] =>
  [...visites].sort((a, b) => {
    const ua = a.urgence ? 0 : (POIDS[a.niveau_urgence] ?? 4)
    const ub = b.urgence ? 0 : (POIDS[b.niveau_urgence] ?? 4)
    if (ua !== ub) return ua - ub
    return a.ticket_numero - b.ticket_numero
  })

const appliquerFiltres = (visites: PatientAttente[], filtres: FiltresFile): PatientAttente[] => {
  const terme = filtres.recherche.toLowerCase().trim()
  return visites.filter(v => {
    if (filtres.urgence && v.niveau_urgence !== filtres.urgence) return false
    if (filtres.statut  && v.statut         !== filtres.statut)  return false
    if (!terme) return true
    // Recherche sur CPU et noms masqués
    return (
      v.cpu.toLowerCase().includes(terme)           ||
      v.nom_masque.toLowerCase().includes(terme)    ||
      v.prenom_masque.toLowerCase().includes(terme) ||
      String(v.ticket_numero).includes(terme)
    )
  })
}

export const useMedecin = () => {
  const [stats,         setStats]         = useState<StatsMedecin | null>(null)
  const [visites,       setVisites]       = useState<PatientAttente[]>([])
  const [filtres,       setFiltres]       = useState<FiltresFile>(FILTRES_DEFAUT)
  const [loadingInit,   setLoadingInit]   = useState(true)
  const [erreur,        setErreur]        = useState<string | null>(null)
  const [rechercheMode, setRechercheMode] = useState(false)
  const [rechercheQuery,setRechercheQuery]= useState('')
  const [rechercheRes,  setRechercheRes]  = useState<PatientAttente[]>([])
  const [rechercheLoad, setRechercheLoad] = useState(false)

  const snapV = useRef('')
  const snapS = useRef('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const charger = useCallback(async (silencieux = false) => {
    try {
      if (!silencieux) setLoadingInit(true)
      setErreur(null)

      const [nouvellesVisites, dash] = await Promise.all([
        fetchPatientsAttente(),
        fetchDashboard(),
      ])

      const triees = trierFile(nouvellesVisites)
      const jV = JSON.stringify(triees)
      const jS = JSON.stringify(dash.stats)

      if (jV !== snapV.current) { snapV.current = jV; setVisites(triees) }
      if (jS !== snapS.current) { snapS.current = jS; setStats(dash.stats) }
    } catch {
      if (!silencieux) setErreur("Impossible de charger la file d'attente")
    } finally {
      if (!silencieux) setLoadingInit(false)
    }
  }, [])

  useEffect(() => {
    charger(false)
    timer.current = setInterval(() => charger(true), POLLING_MS)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [charger])

  const rafraichir = useCallback(() => charger(true), [charger])

  const setFiltre = useCallback(<K extends keyof FiltresFile>(k: K, v: FiltresFile[K]) => {
    setFiltres(prev => ({ ...prev, [k]: v }))
  }, [])

  const reinitialiserFiltres = useCallback(() => setFiltres(FILTRES_DEFAUT), [])

  const lancerRecherche = useCallback(async (q: string) => {
    if (q.length < 2) { setRechercheRes([]); return }
    setRechercheLoad(true)
    try { setRechercheRes(await fetchRecherchePatients(q)) }
    catch { setRechercheRes([]) }
    finally { setRechercheLoad(false) }
  }, [])

  const ouvrirRecherche  = useCallback(() => setRechercheMode(true), [])
  const fermerRecherche  = useCallback(() => {
    setRechercheMode(false); setRechercheQuery(''); setRechercheRes([])
  }, [])

  return {
    stats,
    visites: appliquerFiltres(visites, filtres),
    loadingInit,
    erreur,
    filtres,
    setFiltre,
    reinitialiserFiltres,
    rechercheMode,
    rechercheQuery,
    setRechercheQuery,
    rechercheRes,
    rechercheLoad,
    ouvrirRecherche,
    fermerRecherche,
    lancerRecherche,
    rafraichir,
  }
}
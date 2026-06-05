import api from '@/lib/axios'
import type {
  PatientAttente,
  DossierOuvert,
  PayloadSauvegarderEtape,
  PayloadPause,
  PayloadDiagnostic,
  PayloadDecision,
} from '../types'

// ─── Types pour ConsultationModal (compatibilité) ──────────
export interface FichierConsultation {
  id:              number
  visite_id:       number
  consultation_id: number
  type_fichier:    string
  nom_fichier:     string
  fichier_url:     string
  taille_octets:   number
  uploaded_at:     string
}

export interface ExamenHistorique {
  id:               number
  type_examen:      string
  resultats:        string | null
  valeurs_reference?: string | null
  alerte_critique?: boolean
  image_base64?:    string | null
  traite_at?:       string | null
  visite_id:        number
  visite_date:      string
  motif_visite:     string | null
}

// ─── Dashboard ────────────────────────────────────────────
export const fetchDashboard = async () => {
  const { data } = await api.get('/medecin/dashboard')
  return data
}

export const fetchPatientsAttente = async (): Promise<PatientAttente[]> => {
  const { data } = await api.get('/medecin/patients-attente')
  return data.visites ?? data.patients ?? []
}

export const fetchRecherchePatients = async (q: string): Promise<PatientAttente[]> => {
  const { data } = await api.get('/medecin/recherche', { params: { q } })
  return data.visites ?? data.patients ?? []
}

// ─── Consultation ─────────────────────────────────────────
export const ouvrirConsultation = async (visite_id: number): Promise<DossierOuvert> => {
  const { data } = await api.post('/medecin/consultations/ouvrir', { visite_id })
  return data
}

export const sauvegarderEtape = async (payload: PayloadSauvegarderEtape): Promise<void> => {
  await api.put('/medecin/consultations/etape', payload)
}

export const mettreEnPause = async (payload: PayloadPause): Promise<void> => {
  await api.put('/medecin/consultations/pause', payload)
}

export const enregistrerDiagnostic = async (payload: PayloadDiagnostic): Promise<void> => {
  await api.put('/medecin/consultations/diagnostic', payload)
}

export const terminerConsultation = async (payload: PayloadDecision): Promise<void> => {
  await api.put('/medecin/consultations/terminer', payload)
}

// ─── Stubs — fonctionnalités futures (évite les erreurs TS) ──
export const prescrireExamens = async (_payload: unknown): Promise<void> => {
  console.warn('prescrireExamens — non implémenté')
}

export const prescrireMedicament = async (_payload: unknown): Promise<void> => {
  console.warn('prescrireMedicament — non implémenté')
}

export const prescrireAvecJustification = async (_payload: unknown): Promise<void> => {
  console.warn('prescrireAvecJustification — non implémenté')
}

export const getResultatsLabo = async (_visite_id: number): Promise<{
  total: number; avec_resultats: number; resultats: ExamenHistorique[]
}> => {
  console.warn('getResultatsLabo — non implémenté')
  return { total: 0, avec_resultats: 0, resultats: [] }
}

export const getFichiersPatient = async (_patient_id: number): Promise<{
  fichiers: FichierConsultation[]; examens: ExamenHistorique[]
}> => {
  console.warn('getFichiersPatient — non implémenté')
  return { fichiers: [], examens: [] }
}
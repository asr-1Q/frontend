import api from '@/lib/axios'
import type {
  StatsAccueil, VisiteFile, PatientRecherche, MedecinDispo,
  NouvelleVisitePayload, UrgencePayload, NouveauPatientPayload,
} from '../types'

export const getStatsAccueil = async (): Promise<StatsAccueil> => {
  const { data } = await api.get('/accueil/dashboard')
  return data.stats
}

export const getMedecins = async (): Promise<MedecinDispo[]> => {
  const { data } = await api.get('/accueil/medecins')
  return data.medecins
}

export const getFileAttente = async (): Promise<VisiteFile[]> => {
  const { data } = await api.get('/accueil/file-attente')
  return data.file_attente
}

export const getFilePlusDossiersFermes = async (): Promise<VisiteFile[]> => {
  const { data } = await api.get('/accueil/file-attente?inclure_termines=true')
  return data.file_attente
}

export const rechercherPatients = async (q: string): Promise<PatientRecherche[]> => {
  const { data } = await api.get('/accueil/patients/recherche', { params: { q } })
  return data.patients
}

// Récupérer le médecin référent d'un patient
export const getMedecinReferent = async (cpu: string): Promise<MedecinDispo | null> => {
  const { data } = await api.get(`/accueil/patients/${cpu}/medecin-referent`)
  return data.medecin_referent
}

export const creerPatient = async (payload: NouveauPatientPayload) => {
  const { data } = await api.post('/accueil/patients', payload)
  return data
}

export const creerVisite = async (payload: NouvelleVisitePayload) => {
  const { data } = await api.post('/accueil/visites', payload)
  return data
}

export const creerUrgence = async (payload: UrgencePayload) => {
  const { data } = await api.post('/accueil/urgence', payload)
  return data
}

export const assignerMedecin = async (visiteId: number, medecin_id: number) => {
  const { data } = await api.patch(`/accueil/visites/${visiteId}/assigner`, { medecin_id })
  return data
}

export const orienterVersMedecin = async (visiteId: number, medecin_id: number) => {
  const { data } = await api.patch(`/accueil/visites/${visiteId}/orienter-medecin`, { medecin_id })
  return data
}

export const fermerDossier = async (visiteId: number) => {
  const { data } = await api.patch(`/accueil/visites/${visiteId}/fermer`, {})
  return data
}

export const rouvrirDossier = async (visiteId: number, motif: string) => {
  const { data } = await api.patch(`/accueil/visites/${visiteId}/rouvrir`, { motif })
  return data
}

export const genererQR = async (cpu: string) => {
  const { data } = await api.post(`/accueil/patients/${cpu}/qr`, {})
  return data
}
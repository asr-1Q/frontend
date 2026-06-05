import api from '@/lib/axios'
import type {
  PatientConnecte, Constante, ConsultationPatient,
  AccesDossier, SignalementPayload,
} from '../types'

// ─── Auth — étape 1 ──────────────────────────────────────────
export interface LoginStep1Response {
  message:          string
  otp_requis:       boolean
  telephone_masque: string
  cpu:              string
  code_dev?:        string
}

export const loginPatient = async (payload: {
  telephone?: string
  cpu?:       string
  password:   string
}): Promise<LoginStep1Response> => {
  const res = await api.post('/patient/login', payload)
  return res.data
}

// ─── Auth — étape 2 OTP ──────────────────────────────────────
export interface LoginStep2Response {
  message: string
  token:   string
  patient: PatientConnecte
}

export const verifierOtpPatient = async (payload: {
  cpu:  string
  code: string
}): Promise<LoginStep2Response> => {
  const res = await api.post('/patient/verify-otp', payload)
  return res.data
}

// ─── Activation premier compte ───────────────────────────────
export const activerCompte = async (payload: {
  cpu:             string
  code_activation: string
  mot_de_passe:    string
}): Promise<void> => {
  await api.post('/patient/activer', payload)
}

// ─── Reset mot de passe ──────────────────────────────────────
export const recupererMotDePasse = async (cpu: string): Promise<{ code_dev?: string }> => {
  const res = await api.post('/patient/recuperer-mdp', { cpu })
  return res.data
}

export const verifierCodeReset = async (cpu: string, code: string): Promise<void> => {
  await api.post('/patient/reset-verifier-code', { cpu, code })
}

export const confirmerResetMdp = async (payload: {
  cpu:                  string
  code:                 string
  nouveau_mot_de_passe: string
}): Promise<void> => {
  await api.post('/patient/reset-confirmer', payload)
}

// ─── Dashboard ───────────────────────────────────────────────
export const getDashboard = async (): Promise<{
  patient:           PatientConnecte
  dernieres_visites: any[]
  acces_aumt:        any[]
}> => {
  const res = await api.get('/patient/dashboard')
  return res.data
}

// ─── Carte QR ────────────────────────────────────────────────
export const getCarte = async (): Promise<{
  patient:  PatientConnecte
  carte_qr: { donnees_c0_json: any; hmac_signature: string; emis_le: string; expire_le: string } | null
}> => {
  const res = await api.get('/patient/carte')
  return res.data
}

// ─── Consultations terminées (historique médical) ────────────
// Retourne ordonnance, examens, date_rdv, nom médecin, motif
export const getConsultations = async (): Promise<{ consultations: ConsultationPatient[] }> => {
  const res = await api.get('/patient/consultations')
  return res.data
}

// ─── Rendez-vous planifiés ───────────────────────────────────
// Retourne uniquement les consultations ayant un date_rdv
export const getRendezVous = async (): Promise<{ rendez_vous: any[] }> => {
  const res = await api.get('/patient/rendez-vous')
  return res.data
}

// ─── Constantes (C1) ─────────────────────────────────────────
export const getConstantes = async (): Promise<{ constantes: Constante[] }> => {
  const res = await api.get('/patient/constantes')
  return res.data
}

// ─── Profil ──────────────────────────────────────────────────
export const updateProfil = async (payload: {
  contact_urgence_nom?:       string
  contact_urgence_telephone?: string
  notifications_actives?:     boolean
}): Promise<void> => {
  await api.put('/patient/profil', payload)
}

export const changerMotDePasse = async (payload: {
  ancien_mot_de_passe:  string
  nouveau_mot_de_passe: string
}): Promise<void> => {
  await api.put('/patient/changer-mdp', payload)
}

// ─── Sécurité ────────────────────────────────────────────────
export const getHistoriqueAcces = async (): Promise<AccesDossier[]> => {
  const res = await api.get('/patient/historique-acces')
  return res.data.historique ?? []
}

export const signalerAcces = async (payload: SignalementPayload): Promise<void> => {
  await api.post('/patient/signaler-acces', payload)
}

// ─── Upload photo carte CSI ───────────────────────────────────
export const uploadPhoto = async (file: File): Promise<{ photo_url: string }> => {
  const formData = new FormData()
  formData.append('photo', file)
  const res = await api.post('/patient/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

// ─── Re-auth avant données sensibles ─────────────────────────
export const reAuth = async (password: string): Promise<{ reauth_token: string }> => {
  const res = await api.post('/patient/reauth', { password })
  return res.data
}
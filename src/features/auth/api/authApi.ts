import api from '@/lib/axios'
import type { LoginPayload, LoginStep1Response, VerifyOtpPayload, LoginFinalResponse } from '../types'

// ─── Login unifié (personnel + patients) ─────────────────────────────────────
export const loginUnifie = async (telephone: string, password: string) => {
  const { data } = await api.post('/auth/login-unifie', { telephone, password })
  return data
}

// ─── Étape 1 legacy ───────────────────────────────────────────────────────────
export const loginStep1 = async (payload: LoginPayload): Promise<LoginStep1Response> => {
  const { data } = await api.post('/auth/login', payload)
  return data
}

// ─── Étape 2 — OTP personnel → JWT ───────────────────────────────────────────
export const verifyOtp = async (payload: VerifyOtpPayload): Promise<LoginFinalResponse> => {
  const { data } = await api.post('/auth/login/otp', payload)
  return data
}

// ─── Étape 2 — OTP patient → JWT ─────────────────────────────────────────────
export const verifyOtpPatient = async (telephone: string, code: string) => {
  const { data } = await api.post('/patient/verify-otp', { telephone, code })
  return data
}

// ─── Renvoyer OTP personnel ───────────────────────────────────────────────────
export const resendOtp = async (user_id: number): Promise<void> => {
  await api.post('/auth/resend-otp', { user_id })
}

// ─── Renvoyer OTP patient ─────────────────────────────────────────────────────
export const resendOtpPatient = async (telephone: string): Promise<void> => {
  await api.post('/patient/renvoyer-otp', { telephone })
}

// ─── Reset MDP — étape 1 ─────────────────────────────────────────────────────
export const resetPasswordRequest = async (telephone: string) => {
  const { data } = await api.post('/auth/reset-password/request', { telephone })
  return data
  // Retourne : { message, user_id?, cpu?, typeCompte, telephone_masque, code_dev? }
}

// ─── Reset MDP — étape 2 : vérifier OTP (legacy — non utilisé) ───────────────
export const verifyResetOtp = async (user_id: number, code: string) => {
  const { data } = await api.post('/auth/verify-reset-otp', { user_id, code })
  return data
}

// ─── Reset MDP — étape 3 : nouveau mot de passe ──────────────────────────────
// Accepte soit user_id (personnel) soit cpu (patient)
export const resetPasswordConfirm = async (payload:
  | { user_id: number;  code_otp: string; nouveau_password: string }
  | { cpu:     string;  code_otp: string; nouveau_password: string }
) => {
  const { data } = await api.post('/auth/reset-password/confirm', payload)
  return data
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logoutApi = async (): Promise<void> => {
  try { await api.post('/auth/logout') } catch { /* non bloquant */ }
}
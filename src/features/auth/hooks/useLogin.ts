import { useState } from 'react'
import { loginStep1, verifyOtp, resendOtp } from '../api/authApi'
import { useAuthStore } from '@/store/authStore'
import type { LoginPayload, LoginStep1Response, AuthUser } from '../types'

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth)

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [otpStep,   setOtpStep]   = useState<LoginStep1Response | null>(null)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  const submitCredentials = async (payload: LoginPayload) => {
    setLoading(true)
    setError(null)
    try {
      const data = await loginStep1(payload)
      setOtpStep(data)
      return data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message || 'Téléphone ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  const submitOtp = async (code: string): Promise<AuthUser | undefined> => {
    if (!otpStep) return
    setLoading(true)
    setError(null)
    try {
      const data = await verifyOtp({ user_id: otpStep.user_id, code })
      setAuth(data.utilisateur, data.token)
      return data.utilisateur
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message || 'Code OTP incorrect')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!otpStep) return
    setResending(true)
    setResendMsg(null)
    try {
      await resendOtp(otpStep.user_id)
      setResendMsg('Nouveau code envoyé par SMS.')
    } catch {
      setResendMsg('Erreur lors du renvoi.')
    } finally {
      setResending(false)
    }
  }

  const resetOtpStep = () => setOtpStep(null)

  return {
    submitCredentials,
    submitOtp,
    handleResend,
    resetOtpStep,
    otpStep,
    loading,
    error,
    resending,
    resendMsg,
  }
}
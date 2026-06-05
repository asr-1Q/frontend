import { useState, useEffect, useCallback } from 'react'
import { getDashboard, getCarte, getConsultations, getConstantes, updateProfil } from '../api/patientApi'
import { usePatientAuthStore } from '@/store/patientAuthStore'
import type { Constante, ConsultationPatient } from '../types'

export const usePatientData = () => {
  const { patient, setSession, token } = usePatientAuthStore()

  const [data, setData] = useState<{
    carte:            any
    constantes:       Constante[]
    consultations:    ConsultationPatient[]
    dernieresVisites: any[]
    acces_aumt:       any[]
  }>({
    carte: null, constantes: [], consultations: [],
    dernieresVisites: [], acces_aumt: [],
  })

  const [loading,      setLoading]      = useState(false)
  const [loadingTab,   setLoadingTab]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [savingProfil, setSavingProfil] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    getDashboard()
      .then(d => {
        if (patient && token) {
          setSession(token, { ...patient, ...d.patient })
        }
        setData(s => ({
          ...s,
          dernieresVisites: d.dernieres_visites ?? [],
          acces_aumt:       d.acces_aumt ?? [],
        }))
      })
      .catch(() => setError('Erreur chargement'))
      .finally(() => setLoading(false))
  }, [token])

  const loadCarte = useCallback(async () => {
    setLoadingTab(true)
    try { const d = await getCarte(); setData(s => ({ ...s, carte: d })) }
    catch { /* silent */ }
    finally { setLoadingTab(false) }
  }, [])

  const loadConstantes = useCallback(async () => {
    setLoadingTab(true)
    try { const d = await getConstantes(); setData(s => ({ ...s, constantes: d.constantes })) }
    catch { /* silent */ }
    finally { setLoadingTab(false) }
  }, [])

  const loadConsultations = useCallback(async () => {
    setLoadingTab(true)
    try { const d = await getConsultations(); setData(s => ({ ...s, consultations: d.consultations })) }
    catch { /* silent */ }
    finally { setLoadingTab(false) }
  }, [])

  const handleUpdateProfil = async (
    contact_urgence_nom: string,
    contact_urgence_telephone: string
  ) => {
    setSavingProfil(true)
    try {
      await updateProfil({ contact_urgence_nom, contact_urgence_telephone })
      if (patient && token) {
        // Cast explicite pour satisfaire TypeScript
        setSession(token, {
          ...patient,
          contact_urgence_nom:       contact_urgence_nom       || undefined,
          contact_urgence_telephone: contact_urgence_telephone || undefined,
        } as typeof patient)
      }
      return true
    } catch { return false }
    finally { setSavingProfil(false) }
  }

  const handleUploadPhoto = async (_file: File) => null

  return {
    patient, data, loading, loadingTab, error,
    uploadingPhoto: false,
    savingProfil,
    loadCarte, loadConstantes, loadConsultations,
    handleUpdateProfil, handleUploadPhoto,
  }
}
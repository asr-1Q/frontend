// src/store/patientAuthStore.ts
// Store dédié au portail patient — compatible avec usePatientData et PatientDashboardPage
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PatientConnecte } from '@/features/patient-pwa/types'

interface PatientAuthStore {
  token:      string | null
  patient:    PatientConnecte | null
  // setAuth — appelé depuis LoginForm après vérification OTP
  setAuth:    (cpu: string, nom: string, prenom: string, token: string) => void
  // setSession — appelé depuis usePatientData pour enrichir le patient avec les données dashboard
  setSession: (token: string, patient: PatientConnecte) => void
  logout:     () => void
}

export const usePatientAuthStore = create<PatientAuthStore>()(
  persist(
    (set) => ({
      token:   null,
      patient: null,

      setAuth: (cpu, nom, prenom, token) => set({
        token,
        patient: {
          cpu,
          nom,
          prenom,
          telephone:                 '',
          groupe_sanguin:            null,
          allergies_texte:           null,
          pathologies_chroniques:    null,
          contact_urgence_nom:       null,
          contact_urgence_telephone: null,
          notifications_actives:     false,
        } as PatientConnecte,
      }),

      setSession: (token, patient) => set({ token, patient }),

      logout: () => set({ token: null, patient: null }),
    }),
    {
      name:    'hmc-patient-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
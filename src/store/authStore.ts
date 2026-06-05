import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AuthUser {
  id:            number
  nom:           string
  prenom:        string
  role:          'super_admin' | 'admin_it' | 'medecin' | 'infirmier' | 'accueil' | 'patient'
  hopital_id:    number | null
  hopital_nom:   string | null
  telephone:     string
  premier_login: boolean
  otp_actif:     boolean
  cpu?:          string
}

interface AuthStore {
  user:    AuthUser | null
  token:   string | null
  setAuth: (user: AuthUser, token: string) => void
  logout:  () => void
}

// ─── Store personnel (staff) ──────────────────────────────────────────────────
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:    null,
      token:   null,
      setAuth: (user, token) => set({ user, token }),
      logout:  () => set({ user: null, token: null }),
    }),
    {
      name:    'hmc-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ─── Store patient (portail patient) ─────────────────────────────────────────
// Séparé pour que axios.ts puisse distinguer les deux tokens
interface PatientStore {
  cpu:      string | null
  nom:      string | null
  prenom:   string | null
  token:    string | null
  setAuth:  (cpu: string, nom: string, prenom: string, token: string) => void
  logout:   () => void
}

export const usePatientStore = create<PatientStore>()(
  persist(
    (set) => ({
      cpu:     null,
      nom:     null,
      prenom:  null,
      token:   null,
      setAuth: (cpu, nom, prenom, token) => set({ cpu, nom, prenom, token }),
      logout:  () => set({ cpu: null, nom: null, prenom: null, token: null }),
    }),
    {
      name:    'hmc-patient-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
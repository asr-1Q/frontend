import api from '@/lib/axios'
import type {
  DashboardResponse,
  ConstantesForm,
  ConstantesResponse,
} from '../types'

// GET /api/infirmier/dashboard
export const getDashboard = async (): Promise<DashboardResponse> => {
  const { data } = await api.get('/infirmier/dashboard')
  return data
}

// GET /api/infirmier/patients/:visite_id
export const getPatientDetails = async (visiteId: number) => {
  const { data } = await api.get(`/infirmier/patients/${visiteId}`)
  return data
}

// POST /api/infirmier/constantes
export const saisirConstantes = async (
  form: ConstantesForm
): Promise<ConstantesResponse> => {
  const { data } = await api.post('/infirmier/constantes', form)
  return data
}

// GET /api/infirmier/recherche?q=
export const rechercherPatients = async (q: string) => {
  const { data } = await api.get('/infirmier/recherche', { params: { q } })
  return data.patients
}

// GET /api/infirmier/medecins?visite_id=X
// Retourne la liste + referent_id (null si le patient n'a pas encore de référent)
export const getMedecins = async (visiteId: number) => {
  const { data } = await api.get('/infirmier/medecins', {
    params: { visite_id: visiteId }
  })
  return data as { medecins: Medecin[]; referent_id: number | null }
}

// PATCH /api/infirmier/visites/:id/orienter
export const orienterVersMedecin = async (
  visiteId: number,
  medecinId: number
) => {
  const { data } = await api.patch(`/infirmier/visites/${visiteId}/orienter`, {
    medecin_id: medecinId
  })
  return data
}

// PATCH /api/infirmier/visites/:id/fermer
export const fermerVisite = async (visiteId: number) => {
  const { data } = await api.patch(`/infirmier/visites/${visiteId}/fermer`, {})
  return data
}

// Type local utilisé par getMedecins
interface Medecin {
  id: number
  nom: string
  prenom: string
  specialite?: string
  statut_presence: string
  patients_en_attente: number
}
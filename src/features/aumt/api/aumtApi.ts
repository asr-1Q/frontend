import api from '@/lib/axios'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PatientRechercheAumt {
  visite_id:    number
  patient_id:   number
  cpu:          string
  nom_masque:   string
  prenom_masque: string
  age:          number | null
  groupe_sanguin: string | null
  allergies_texte: string | null
}

export interface VisiteAumt {
  id:                   number
  created_at:           string
  statut:               string
  motif_visite:         string | null
  niveau_urgence:       string
  diagnostic_principal: string | null
  decision_finale:      string | null
}

export interface ResultatAumt {
  id:            number
  created_at:    string
  diagnostic:    string | null
  notes_medecin: string | null
  medecin_nom:   string | null
  medecin_prenom: string | null
}

export interface DossierPatientAumt {
  cpu:                     string
  nom:                     string
  prenom:                  string
  date_naissance:          string | null
  sexe:                    string | null
  telephone:               string | null
  groupe_sanguin:          string | null
  allergies_texte:         string | null
  pathologies_chroniques:  string | null
  contact_urgence_nom:     string | null
  contact_urgence_telephone: string | null
}

export interface DossierAumt {
  aumt_id:              number
  aumt_timestamp:       string
  avertissement:        string
  expire_at:            string
  dossier_patient:      DossierPatientAumt
  historique_visites:   VisiteAumt[]
  resultats_medicaux:   ResultatAumt[]
  responsables_notifies: number
}

// ─── Recherche patient ───────────────────────────────────────────────────────
export const rechercherPatientAumt = async (q: string): Promise<PatientRechercheAumt[]> => {
  const { data } = await api.get('/infirmier/recherche', { params: { q } })
  return data.patients ?? []
}

// ─── Déclencher AUMT ─────────────────────────────────────────────────────────
export const declencherAumt = async (payload: {
  patient_cpu:  string
  motif:        string
  mot_de_passe: string
  duree_min?:   number
}): Promise<DossierAumt> => {
  const { data } = await api.post('/aumt/declencher', payload)
  return data
}

// ─── Vérifier statut ─────────────────────────────────────────────────────────
export const verifierAumt = async (patient_cpu: string) => {
  const { data } = await api.get(`/aumt/statut/${patient_cpu}`)
  return data
}

// ─── Révoquer ─────────────────────────────────────────────────────────────────
export const revoquerAumt = async (aumt_id: number) => {
  const { data } = await api.post(`/aumt/revoquer/${aumt_id}`, {})
  return data
}
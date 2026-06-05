export type Priorite     = 'CRITIQUE' | 'URGENT' | 'NORMAL'
export type NiveauUrgence = 'critique' | 'urgent' | 'semi_urgent' | 'normal'

export interface PatientAttente {
  visite_id:      number
  ticket_numero:  number
  created_at:     string
  type_visite:    string
  motif_visite:   string | null
  urgence:        boolean
  patient_id:     number
  cpu:            string
  // Noms masqués côté backend HMC
  nom_masque:     string
  prenom_masque:  string
  groupe_sanguin: string | null
  allergies_texte: string | null
  age:            number | null
  priorite:       Priorite
  // Constantes si déjà saisies
  score_urgence:  number | null
}

export interface StatsDashboard {
  en_attente:          number
  traites_aujourd_hui: number
  total_jour:          number
}

export interface DashboardResponse {
  patients_attente: PatientAttente[]
  stats:            StatsDashboard
}

export interface ConstantesForm {
  visite_id:              number
  temperature:            string
  tension_systolique:     string
  tension_diastolique:    string
  frequence_cardiaque:    string
  frequence_respiratoire: string
  spo2:                   string
  poids:                  string
  taille:                 string
  glycemie:               string
  eva_douleur:            string
  motif_detaille:         string
}

export interface ConstantesResponse {
  message:        string
  constantes_id:  number
  score_urgence:  number
  niveau_urgence: NiveauUrgence
  alerte:         boolean
}
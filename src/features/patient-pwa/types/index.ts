export interface PatientConnecte {
  cpu:                        string
  nom:                        string
  prenom:                     string
  telephone:                  string
  date_naissance?:            string | null
  sexe?:                      string | null
  groupe_sanguin?:            string | null
  allergies_texte?:           string | null
  pathologies_chroniques?:    string | null
  contact_urgence_nom?:       string | null
  contact_urgence_telephone?: string | null
  notifications_actives?:     boolean
  photo_url?:                 string | null
}

export interface VisiteDashboard {
  visite_id:       number
  created_at:      string
  motif_visite:    string | null
  statut:          string
  medecin_nom:     string | null
  medecin_prenom:  string | null
}

export interface AumtRecent {
  created_at:         string
  duree_demandee_min: number
  statut:             string
  declencheur_nom:    string
  declencheur_prenom: string
}

export interface Constante {
  temperature:         number | null
  tension_systolique:  number | null
  tension_diastolique: number | null
  frequence_cardiaque: number | null
  spo2:                number | null
  poids:               number | null
  taille:              number | null
  imc:                 number | null
  glycemie:            number | null
  eva_douleur:         number | null
  score_urgence:       number | null
  created_at:          string
  visite_date:         string
  motif_detaille:      string | null
  motif_visite:        string | null
}

export interface ConsultationPatient {
  visite_id:            number
  created_at:           string
  motif_visite:         string | null
  statut:               string
  consultation_id:      number | null
  decision_finale:      string | null
  code_cim10:           string | null
  date_rdv:             string | null      // ← nouveau
  ordonnance_texte:     string | null      // ← nouveau
  examens_prescrits:    string | null      // ← nouveau
  medecin_nom:          string | null
  medecin_prenom:       string | null
}

export interface AccesDossier {
  id:          number
  action:      string
  created_at:  string
  nom:         string | null
  prenom:      string | null
  role:        string | null
  hopital_nom: string | null
}

export type VueLogin =
  | 'login'
  | 'otp'
  | 'activation'
  | 'forgot_cpu'
  | 'forgot_code'
  | 'forgot_mdp'
  | 'succes'

export type TabPatient =
  | 'dashboard'
  | 'constantes'
  | 'historique'
  | 'carte'
  | 'securite'

export type TypeAcces = 'C1' | 'C2' | 'AUMT'

export interface SignalementPayload {
  motif:      string
  type_acces: TypeAcces
  medecin_id: number | null
}
export interface StatsAccueil {
  patients_aujourdhui:  number
  en_attente_tri:       number
  en_attente_medecin:   number
  en_consultation:      number
  urgences:             number
  termines:             number
  patients_total:       number
}

export interface MedecinDispo {
  id:                  number
  nom:                 string
  prenom:              string
  specialite:          string | null
  statut_presence:     'disponible' | 'occupe' | 'absent'
  patients_en_attente: number
}

export interface VisiteFile {
  id:             number
  ticket_numero:  number
  statut:         string
  created_at:     string
  type_visite:    string
  urgence:        boolean
  notes_accueil:  string | null
  patient_id:     number
  cpu:            string
  nom_masque:     string
  prenom_masque:  string
  medecin_nom:    string | null
  medecin_prenom: string | null
  priorite:       'URGENT' | 'EN ATTENTE' | 'NORMAL'
}

export interface PatientRecherche {
  id:                     number
  cpu:                    string
  nom:                    string
  prenom:                 string
  telephone:              string | null
  date_naissance:         string | null
  sexe:                   'M' | 'F' | null
  groupe_sanguin:         string | null
  allergies_texte:        string | null
  pathologies_chroniques: string | null
  // médecin référent chargé dynamiquement
  medecin_referent?: {
    id:              number
    nom:             string
    prenom:          string
    specialite:      string | null
    statut_presence: string
  } | null
}

// ─── Payloads ─────────────────────────────────────────────────

export interface NouveauPatientPayload {
  nom:                       string
  prenom:                    string
  date_naissance?:           string
  sexe?:                     'M' | 'F'
  telephone?:                string
  numero_cni?:               string
  groupe_sanguin?:           string
  allergies_texte?:          string
  pathologies_chroniques?:   string
  contact_urgence_nom?:      string
  contact_urgence_telephone?: string
  notifications_actives?:    boolean
  medecin_id?:               number
  motif_visite?:             string
  // 'normal' | 'prise_constantes' | 'rendez_vous' | 'urgence'
  type_visite?:              string
  notes_accueil?:            string
}

export interface NouvelleVisitePayload {
  patient_cpu:    string
  medecin_id?:    number
  motif_visite?:  string
  // 'normal' | 'prise_constantes' | 'rendez_vous' | 'urgence'
  type_visite?:   string
  notes_accueil?: string
}

export interface UrgencePayload {
  nom?:        string
  prenom?:     string
  sexe?:       'M' | 'F' | ''
  telephone?:  string
  motif:       string
  medecin_id?: number
}
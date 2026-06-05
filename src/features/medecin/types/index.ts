export type NiveauUrgence = 'critique' | 'urgent' | 'semi_urgent' | 'normal'

export type StatutVisite =
  | 'en_attente_tri'
  | 'en_attente_medecin'
  | 'en_consultation'
  | 'en_pause'
  | 'termine'
  | 'annule'

export type DecisionFinale =
  | 'sortie'
  | 'rendez_vous'

export type GraviteAllergie = 'legere' | 'moderee' | 'severe'

export interface Patient {
  id:                        number
  nom:                       string
  prenom:                    string
  cpu:                       string
  sexe:                      string
  date_naissance:            string
  telephone:                 string | null
  groupe_sanguin:            string | null
  allergies:                 string | null
  pathologies:               string | null
  contact_urgence_nom:       string | null
  contact_urgence_telephone: string | null
}

export interface Constante {
  id:                     number
  visite_id:              number
  temperature:            number | null
  tension_systolique:     number | null
  tension_diastolique:    number | null
  frequence_cardiaque:    number | null
  frequence_respiratoire: number | null
  spo2:                   number | null
  poids:                  number | null
  taille:                 number | null
  imc:                    number | null
  glycemie:               number | null
  eva_douleur:            number | null
  niveau_urgence:         NiveauUrgence
  score_urgence:          number | null
  motif_detaille:         string | null
  created_at:             string
}

export interface VisiteResume {
  id:                   number
  created_at:           string
  motif_visite:         string | null
  type_visite:          string
  diagnostic_principal: string | null
  decision_finale:      DecisionFinale | null
  code_cim10:           string | null
}

export interface PatientAttente {
  visite_id:           number
  ticket_numero:       number
  statut:              StatutVisite
  type_visite:         string
  motif_visite:        string | null
  urgence:             boolean
  created_at:          string
  patient_id:          number
  nom_masque:          string
  prenom_masque:       string
  cpu:                 string
  sexe:                string
  date_naissance:      string
  age:                 number
  groupe_sanguin:      string | null
  allergies_texte:     string | null
  temperature:         number | null
  tension_systolique:  number | null
  tension_diastolique: number | null
  frequence_cardiaque: number | null
  spo2:                number | null
  niveau_urgence:      NiveauUrgence
  score_urgence:       number | null
  eva_douleur:         number | null
  motif_detaille:      string | null
}

export interface Consultation {
  id:                        number
  visite_id:                 number
  medecin_id:                number
  anamnese:                  string | null
  examen_clinique:           string | null
  diagnostic_principal:      string | null
  code_cim10:                string | null
  diagnostics_differentiels: string | null
  decision_finale:           DecisionFinale | null
  notes_privees:             string | null
  etape_courante:            number
  etapes_validees:           number[]
  statut_final:              string
  created_at:                string
  updated_at:                string
}

export interface DossierOuvert {
  consultation:       Consultation
  patient:            Patient
  constantes:         Constante | null
  historique_visites: VisiteResume[]
}

export interface AllergieDetectee {
  substance: string
  gravite:   GraviteAllergie
}

export interface PayloadSauvegarderEtape {
  consultation_id:  number
  anamnese?:        string
  examen_clinique?: string
  etape_courante:   number
  etapes_validees:  number[]
}

export interface PayloadPause {
  consultation_id: number
  visite_id:       number
  raison_pause:    string
  etape_courante:  number
  etapes_validees: number[]
}

export interface PayloadDiagnostic {
  consultation_id:            number
  diagnostic_principal:       string
  code_cim10?:                string
  diagnostics_differentiels?: string
  anamnese?:                  string
  examen_clinique?:           string
}

// ── FIX : ajout des 3 champs manquants ──────────────────────
export interface PayloadDecision {
  consultation_id:    number
  visite_id:          number
  decision_finale:    DecisionFinale
  notes_privees?:     string
  ordonnance_texte?:  string
  examens_prescrits?: string
  date_rdv?:          string
}

export interface EtapeAnamnese {
  anamnese: string
}

export interface EtapeExamenClinique {
  auscultation: string
  palpation:    string
  inspection:   string
  neurologique: string
  autres:       string
}

export interface EtapeDiagnostic {
  diagnostic_principal:      string
  code_cim10:                string
  diagnostics_differentiels: string[]
}

// ── FIX : indentation corrigée + champs complets ────────────
export interface EtapeDecision {
  decision:           DecisionFinale | ''
  notes_privees:      string
  ordonnance_texte?:  string
  examens_prescrits?: string
  date_rdv?:          string
}

export interface FichierConsultation {
  id:              number
  consultation_id: number
  type_fichier:    string
  nom_fichier:     string
  fichier_url:     string
  taille_octets:   number
  uploaded_at:     string
}

export interface EtapePrescription {
  medicament: string
  dosage:     string
  posologie:  string
  duree:      string
}

export type VisiteAttente = PatientAttente

export interface Allergie {
  id:        number
  substance: string
  gravite:   string
}

export interface ConsultationOuverte {
  consultation: Consultation & {
    notes_privees?: string | null
  }
  patient:            Patient
  allergies:          Allergie[]
  antecedents:        { id: number; type: string; description: string }[]
  constantes:         Constante | null
  historique_visites: VisiteResume[]
  consultation_bloquee?: boolean
  examens_stats?: {
    total:           string
    payes:           string
    avec_resultats:  string
  }
}
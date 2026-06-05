export type AdminOnglet = 'dashboard' | 'personnel' | 'audit' | 'sauvegarde'

export interface StatsDashboard {
  total_personnel:       number
  comptes_actifs:        number
  comptes_bloques:       number
  premier_login_attente: number
}

export interface PersonnelRecent {
  id:            number
  nom:           string
  prenom:        string
  telephone:     string | null  // ← plus d'email
  role:          string
  actif:         boolean
  compte_bloque: boolean
  premier_login: boolean
  created_at:    string
}

export interface PersonnelParRole {
  role:      string
  total:     number
  actifs:    number
  bloques:   number
  en_attente: number
}

export interface DashboardResponse {
  stats:               StatsDashboard
  personnel_recent:    PersonnelRecent[]
  personnel_par_role:  PersonnelParRole[]
}

export interface Utilisateur {
  id:            number
  nom:           string
  prenom:        string
  telephone:     string | null  // ← plus d'email
  role:          string
  actif:         boolean
  compte_bloque: boolean
  premier_login: boolean
  created_at:    string
}

export interface AuditLog {
  id:           number
  action:       string
  details:      string
  ip_address:   string
  created_at:   string
  acteur_nom?:  string
  acteur_prenom?: string
  acteur_role?: string
  nom?:         string
  prenom?:      string
  role?:        string
}

export interface StatistiquesResponse {
  stats: StatsDashboard & {
    total_patients: number
    total_visites:  number
    visites_7j:     number
  }
  personnel_par_role: PersonnelParRole[]
}

export interface NouvelUtilisateur {
  nom:        string
  prenom:     string
  telephone:  string   // ← obligatoire, plus d'email
  role:       string
}

// Rôles HMC uniquement
export const ROLES_HOPITAL = [
  'medecin', 'infirmier', 'accueil',
] as const

export const ROLE_LABEL: Record<string, string> = {
  medecin:     'Médecin',
  infirmier:   'Infirmier',
  accueil:     'Accueil',
  admin_it:    'Admin IT',
  super_admin: 'Super Admin',
}
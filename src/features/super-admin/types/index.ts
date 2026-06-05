export type SuperAdminOnglet = 'stats' | 'hopitaux' | 'admins_it' | 'logs'

export interface StatsGlobales {
  hopitaux_actifs:     number
  admins_it:           number
  total_personnel:     number
  total_patients:      number
  visites_aujourd_hui: number
}

export interface Hopital {
  id:          number
  nom:         string
  code:        string
  ville:       string
  region:      string
  type:        string
  actif:       boolean
  created_at:  string
  nb_admins:   number
  nb_patients: number
  medecins:    number
  infirmiers:  number
  visites_jour: number
}

export interface NouvelHopital {
  nom:    string
  code:   string
  ville:  string
  region: string
  type:   string
}

export interface AdminIT {
  id:             number
  nom:            string
  prenom:         string
  telephone:      string | null
  role:           string
  actif:          boolean
  compte_bloque:  boolean
  premier_login:  boolean
  created_at:     string
  hopital_id:     number
  hopital_nom:    string
  hopital_ville:  string
  hopital_region: string
  hopital_type:   string
}

export interface NouvelAdminIT {
  nom:        string
  prenom:     string
  telephone:  string
  hopital_id: number
}

export interface StatParRole {
  role:                  string
  total:                 number
  actifs:                number
  bloques:               number
  premier_login_attente: number
}

export interface StatParHopital {
  id:             number
  hopital_nom:    string
  hopital_type:   string
  hopital_region: string
  medecins:       number
  infirmiers:     number
  agents_accueil: number
  total_actifs:   number
  total_patients: number
}

export interface Maladie {
  diagnostic:       string
  nombre:           number
  patients_uniques: number
}

export interface GlobalLog {
  id:             number
  action:         string
  details:        string
  ip_address:     string
  created_at:     string
  nom:            string
  prenom:         string
  role:           string
  hopital_nom:    string
  hopital_region: string
}

export const REGIONS_CAMEROUN = [
  'Littoral', 'Centre', 'Ouest', 'Nord-Ouest', 'Sud-Ouest',
  'Nord', 'Adamaoua', 'Est', 'Sud', 'Extrême-Nord',
]

export const TYPES_HOPITAL = ['public', 'privé', 'confessionnel', 'militaire']

export const ROLE_LABEL: Record<string, string> = {
  medecin:     'Médecin',
  infirmier:   'Infirmier',
  accueil:     'Accueil',
  admin_it:    'Admin IT',
  super_admin: 'Super Admin',
}
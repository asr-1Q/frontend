export interface LoginPayload {
  telephone: string
  password:  string
}

export interface LoginStep1Response {
  message:          string
  otp_sms_requis:   boolean
  telephone_masque: string
  user_id:          number
  code_dev?:        string  // visible en dev uniquement
}

export interface VerifyOtpPayload {
  user_id: number
  code:    string
}

export interface AuthUser {
  id:            number
  nom:           string
  prenom:        string
  role:          'super_admin' | 'admin_it' | 'medecin' | 'infirmier' | 'accueil'
  hopital_id:    number | null
  hopital_nom:   string | null
  telephone:     string
  premier_login: boolean
  otp_actif:     boolean
}

export interface LoginFinalResponse {
  message:     string
  token:       string
  utilisateur: AuthUser
}
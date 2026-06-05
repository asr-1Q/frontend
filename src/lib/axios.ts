import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
})

const getToken = (): string | null => {
  try {
    const isPatientRoute = window.location.pathname.startsWith('/patient')

    if (isPatientRoute) {
      const patientStored = localStorage.getItem('hmc-patient-auth')
      if (patientStored) {
        const token = JSON.parse(patientStored)?.state?.token
        if (token) return token
      }
    }

    const staffStored = localStorage.getItem('hmc-auth-storage')
    if (staffStored) {
      const token = JSON.parse(staffStored)?.state?.token
      if (token) return token
    }
  } catch {}
  return null
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname

      // Pages de login : ne jamais rediriger (c'est une erreur de credentials, pas de session expirée)
      const estPageLogin =
        path === '/login' ||
        path === '/patient/login' ||
        path.startsWith('/patient/login')

      // Endpoint logout : 401 attendu si le token est déjà invalide — ne pas rediriger
      const estLogout = error.config?.url?.endsWith('/auth/logout')

      if (!estPageLogin && !estLogout) {
        const isPatientRoute = path.startsWith('/patient')
        // Marque la session comme expirée pour affichage du message sur la page login
        sessionStorage.setItem('hmc-session-expired', '1')
        if (isPatientRoute) {
          localStorage.removeItem('hmc-patient-auth')
          window.location.href = '/patient/login'
        } else {
          localStorage.removeItem('hmc-auth-storage')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
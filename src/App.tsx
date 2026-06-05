import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginForm            from './features/auth/components/LoginForm'
import InscriptionForm      from './features/auth/components/InscriptionForm'
import { DashboardLayout }  from './layouts/DashboardLayout'
import { useAuthStore }     from './store/authStore'
import { usePatientAuthStore } from './store/patientAuthStore'
import AccueilPage          from './features/accueil/pages/AccueilPage'
import InfirmierPage        from './features/infirmier/pages/InfirmierPage'
import MedecinPage          from './features/medecin/pages/MedecinPage'
import AdminPage            from './features/admin/pages/AdminPage'
import SuperAdminPage       from './features/super-admin/pages/SuperAdminPage'
import PatientDashboardPage from './features/patient-pwa/pages/PatientDashboardPage'
import AumtPage             from './features/aumt/pages/AumtPage'
import ParametresPage       from './features/parametres/pages/ParametresPage'
import React from 'react'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

const PatientRoute = ({ children }: { children: React.ReactNode }) => {
  const token = usePatientAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

// Wrapper pour InscriptionForm — useNavigate doit être dans un composant enfant de BrowserRouter
const InscriptionPage = () => {
  const navigate = useNavigate()
  return <InscriptionForm onRetour={() => navigate('/login')} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Routes publiques ── */}
        <Route path="/login"         element={<LoginForm />} />
        <Route path="/patient/login" element={<Navigate to="/login" replace />} />
        <Route path="/inscription"   element={<InscriptionPage />} />

        {/* ── Portail patient ── */}
        <Route path="/patient/*" element={
          <PatientRoute><PatientDashboardPage /></PatientRoute>
        } />

        {/* ── App personnel protégée ── */}
        <Route path="/" element={
          <PrivateRoute><DashboardLayout /></PrivateRoute>
        }>
          <Route index element={<Navigate to="/accueil" replace />} />
          <Route path="accueil"     element={<AccueilPage />} />
          <Route path="infirmier"   element={<InfirmierPage />} />
          <Route path="medecin"     element={<MedecinPage />} />
          <Route path="aumt"        element={<AumtPage />} />
          <Route path="admin"       element={<AdminPage />} />
          <Route path="super-admin" element={<SuperAdminPage />} />
          <Route path="parametres"  element={<ParametresPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
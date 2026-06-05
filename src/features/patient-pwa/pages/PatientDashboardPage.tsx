import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { usePatientAuthStore } from '@/store/patientAuthStore'
import { usePatientData }      from '../hooks/usePatientData'
import type { TabPatient }     from '../types'
import { AccueilTab }    from '../components/dark/AccueilTab'
import { HistoriqueTab } from '../components/dark/HistoriqueTab'
import { ConstantesTab } from '../components/dark/ConstantesTab'
import { CarteTab }      from '../components/dark/CarteTab'
import { SecuriteTab }   from '../components/dark/SecuriteTab'
import { BottomNav }     from '../components/dark/BottomNav'
import logo from '@/assets/logo.png'
import medBg from '@/assets/img1.png'
import { LogOut } from 'lucide-react'

export default function PatientDashboardPage() {
  const token   = usePatientAuthStore(s => s.token)
  const patient = usePatientAuthStore(s => s.patient)
  const logout  = usePatientAuthStore(s => s.logout)

  const [tab, setTab] = useState<TabPatient>('dashboard')
  const patientData   = usePatientData()
  const navigate      = useNavigate()

  if (!token) return <Navigate to="/login" />

  const handleLogout = () => { logout(); navigate('/login') }

  const renderTab = () => {
    switch (tab) {
      case 'dashboard':  return <AccueilTab    {...patientData} onTabChange={setTab} />
      case 'historique': return <HistoriqueTab data={patientData.data} loadingTab={patientData.loadingTab} loadConsultations={patientData.loadConsultations} patient={patientData.patient} />
      case 'constantes': return <ConstantesTab data={patientData.data} loadingTab={patientData.loadingTab} loadConstantes={patientData.loadConstantes} />
      case 'carte':      return <CarteTab />
      case 'securite':   return <SecuriteTab />
      default:           return <AccueilTab    {...patientData} onTabChange={setTab} />
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${medBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      position: 'relative',
    }}>
      {/* Overlay blanc transparent */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(255,255,255,0.82)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="HMC" style={{ height: 36, borderRadius: 8 }} />
            <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
            <div>
              <p style={{ color: '#1e293b', fontWeight: 700, fontSize: 13, margin: 0 }}>
                {patient?.prenom} {patient?.nom}
              </p>
              <p style={{ color: '#10b981', fontSize: 11, fontFamily: 'monospace', margin: 0 }}>
                {patient?.cpu}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 99,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#64748b', fontSize: 12, cursor: 'pointer',
          }}>
            <LogOut size={13} /> Quitter
          </button>
        </div>
      </header>

      {/* Contenu */}
      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: 520, margin: '0 auto',
        padding: '16px 16px 88px',
      }}>
        {renderTab()}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
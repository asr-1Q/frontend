import { Home, Activity, FileText, CreditCard, Shield } from 'lucide-react'
import type { TabPatient } from '../../types'

interface Props { active: TabPatient; onChange: (t: TabPatient) => void }

const TABS: { id: TabPatient; label: string; Icon: any }[] = [
  { id: 'dashboard',  label: 'Accueil',    Icon: Home       },
  { id: 'constantes', label: 'Constantes', Icon: Activity   },
  { id: 'historique', label: 'Historique', Icon: FileText   },
  { id: 'carte',      label: 'Carte QR',   Icon: CreditCard },
  { id: 'securite',   label: 'Sécurité',   Icon: Shield     },
]

export const BottomNav = ({ active, onChange }: Props) => (
  <nav style={{
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    background: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    padding: '8px 0',
    boxShadow: '0 -1px 6px rgba(0,0,0,0.06)',
  }}>
    <div style={{ display: 'flex', maxWidth: 520, margin: '0 auto' }}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer',
            color: isActive ? '#10b981' : '#94a3b8',
            transition: 'color 0.15s',
          }}>
            <Icon size={20} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
          </button>
        )
      })}
    </div>
  </nav>
)
import { LayoutDashboard, Activity, CreditCard, ShieldCheck, FileText } from 'lucide-react'
import type { TabPatient } from '../types'

interface Props {
  active:   TabPatient
  onChange: (tab: TabPatient) => void
}

const TABS: { id: TabPatient; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'Accueil',    icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'constantes', label: 'Constantes', icon: <Activity        className="w-5 h-5" /> },
  { id: 'historique', label: 'Historique', icon: <FileText        className="w-5 h-5" /> },
  { id: 'carte',      label: 'Carte QR',   icon: <CreditCard      className="w-5 h-5" /> },
  { id: 'securite',   label: 'Sécurité',   icon: <ShieldCheck     className="w-5 h-5" /> },
]

export const PatientNavBar = ({ active, onChange }: Props) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-50">
    <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
      {TABS.map(tab => {
        const isActive = active === tab.id
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all flex-1 ${
              isActive ? 'text-teal-600 bg-teal-50' : 'text-zinc-400 hover:text-zinc-600'
            }`}>
            {tab.icon}
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
          </button>
        )
      })}
    </div>
  </nav>
)
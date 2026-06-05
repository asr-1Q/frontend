import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { logoutApi } from '@/features/auth/api/authApi'
import {
  FiUsers, FiFileText, FiActivity, FiLogOut,
  FiX, FiShield, FiSettings,
  FiClock, FiKey,
  FiSun, FiCloud, FiMoon, FiStar
} from 'react-icons/fi' 
import { useState, useEffect } from 'react'
import React from 'react'
import logo from '@/assets/logo.png'

type Role = 'super_admin' | 'admin_it' | 'medecin' | 'infirmier' | 'accueil'

const allNavItems: { to: string; icon: React.ReactNode; label: string; roles: Role[]; count?: number }[] = [
  { to: '/accueil',     icon: <FiUsers size={18} />,    label: 'Accueil patients', roles: ['accueil'],              count: 12 },
  { to: '/infirmier',   icon: <FiActivity size={18} />, label: 'Constantes',       roles: ['infirmier']                       },
  { to: '/medecin',     icon: <FiFileText size={18} />, label: 'Consultations',    roles: ['medecin']                         },
  { to: '/aumt',        icon: <FiShield size={18} />,   label: 'Accès AUMT',       roles: ['medecin', 'infirmier']            },
  { to: '/admin',       icon: <FiSettings size={18} />, label: 'Administration',   roles: ['admin_it']                        },
  { to: '/super-admin', icon: <FiUsers size={18} />,    label: 'Administration',   roles: ['super_admin']                     },
]

const PARAM_ITEM = { to: '/parametres', icon: <FiKey size={18} />, label: 'Paramètres' }

const getSalutation = (heure: number) => {
  if (heure >= 5  && heure < 12) return { text: 'Bonjour',        icon: <FiSun   className="text-yellow-500" size={13} /> }
  if (heure >= 12 && heure < 18) return { text: 'Bon après-midi', icon: <FiCloud className="text-orange-400" size={13} /> }
  if (heure >= 18 && heure < 22) return { text: 'Bonsoir',        icon: <FiMoon  className="text-indigo-500" size={13} /> }
  return { text: 'Bonne nuit',                                    icon: <FiStar  className="text-blue-500"   size={13} /> }
}

const Avatar = ({ nom, prenom, size = 'md' }: { nom: string; prenom: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <div
      className={`${sizes[size]} rounded-full text-white flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: 'linear-gradient(135deg, #1D9E75, #16815f)' }}
    >
      {`${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase()}
    </div>
  )
}

export const DashboardLayout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [maintenant, setMaintenant] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setMaintenant(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const navItems = allNavItems.filter(item =>
    user?.role && item.roles.includes(user.role as Role)
  )

  const allItems = [...navItems, PARAM_ITEM]
  const pageTitle = allItems.find(item => location.pathname.startsWith(item.to))?.label ?? 'Dashboard'

  const handleLogout = async () => {
    await logoutApi()
    logout()
    navigate('/login')
  }

  const salutation = getSalutation(maintenant.getHours())

  const dateStr = maintenant.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const heureStr = maintenant.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  // ─── NavItem Modifié (Style image_f074fb.png) ──────────────────────────────
  const NavItem = ({ to, icon, label, count, onClick }: {
    to: string; icon: React.ReactNode; label: string; count?: number; onClick?: () => void
  }) => (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'text-zinc-900 font-bold bg-zinc-50/60'
            : 'text-zinc-500 hover:bg-zinc-50/40 hover:text-zinc-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Barre verticale verte à gauche ("mini vert") */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#1D9E75] rounded-r-md" />
          )}
          <div className="flex items-center gap-3">
            {/* Icône changeant de couleur au vert si actif */}
            <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-[#1D9E75]' : 'text-zinc-400'}`}>
              {icon}
            </span>
            <span>{label}</span>
          </div>
          {count && (
            <span className={`text-xs py-0.5 px-2 rounded-full font-semibold transition-colors ${
              isActive ? 'bg-[#1D9E75]/10 text-[#1D9E75]' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {count}+
            </span>
          )}
        </>
      )}
    </NavLink>
  )

  // ─── Sidebar Content ──────────────────────────────────────────────────────
  const SidebarContent = ({ onClickItem }: { onClickItem?: () => void }) => (
    <div className="flex flex-col h-full bg-white p-5">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2 flex-shrink-0">
        <div className="bg-[#1D9E75]/10 p-2 rounded-xl">
          <img src={logo} alt="HMC" className="w-6 h-6 object-contain" />
        </div>
        <div>
          <p className="text-base font-bold text-zinc-900 leading-none tracking-tight">Health Mboa</p>
          <p className="text-xs text-zinc-500 mt-1 font-medium leading-none">Connect</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto space-y-8 scrollbar-hide">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-4 mb-3">
            Menu
          </p>
          <nav className="space-y-1">
            {navItems.map(item => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                count={item.count}
                onClick={onClickItem}
              />
            ))}
          </nav>
        </div>

        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-4 mb-3">
            Général
          </p>
          <nav className="space-y-1">
            <NavItem
              to={PARAM_ITEM.to}
              icon={PARAM_ITEM.icon}
              label={PARAM_ITEM.label}
              onClick={onClickItem}
            />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <FiLogOut size={18} />
              Se déconnecter
            </button>
          </nav>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-full bg-[#E8ECEF] p-2 sm:p-4 lg:p-6 overflow-hidden">
      <div className="flex flex-1 w-full bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-xl shadow-zinc-200/50 overflow-hidden ring-1 ring-zinc-100">
        
        {/* ── Sidebar desktop ──────────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-[260px] flex-shrink-0 border-r border-zinc-100/50">
          <SidebarContent />
        </aside>

        {/* ── Sidebar mobile overlay ───────────────────────────────────────────── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-2 top-2 bottom-2 w-[260px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-4 right-4 z-10">
                <button onClick={() => setSidebarOpen(false)} className="p-2 bg-zinc-100 text-zinc-500 rounded-full hover:text-zinc-800">
                  <FiX size={16} />
                </button>
              </div>
              <SidebarContent onClickItem={() => setSidebarOpen(false)} />
            </aside>
          </div>
        )}

        {/* ── Zone principale ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA]">

          {/* ── Header Restauré ───────────────────────────────────────────────── */}
          <header className="px-6 lg:px-10 py-5 flex items-center justify-between gap-6 flex-shrink-0 bg-transparent">

            {/* Centre — Date et Heure dynamiques réintégrées */}
            <div className="hidden sm:flex flex-col items-center flex-shrink-0 px-2">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
                <FiClock size={12} />
                <span className="capitalize">{dateStr}</span>
              </div>
              <p className="text-sm font-mono font-bold text-zinc-700 mt-0.5 tracking-wide">{heureStr}</p>
            </div>

            {/* Droite — Icônes d'action & Profil utilisateur complet */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              {/* Bloc de profil incluant le message "Bonjour" contextuel */}
              <div className="flex items-center gap-3 sm:pl-4 sm:border-l border-zinc-200">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] text-zinc-400 font-semibold flex items-center justify-end gap-1 mb-0.5">
                    {salutation.icon} <span className="normal-case">{salutation.text}</span>
                  </p>
                  <p className="text-sm font-bold text-zinc-900 leading-tight">
                    {user?.prenom} {user?.nom}
                  </p>
                </div>
                <Avatar nom={user?.nom ?? ''} prenom={user?.prenom ?? ''} size="md" />
              </div>
            </div>
          </header>

          {/* ── Contenu de la page ───────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto px-6 lg:px-10 pb-24 md:pb-10 scrollbar-hide">
            
            <div className="mb-8 mt-2">
              <h1 className="text-3xl lg:text-[2rem] font-bold text-zinc-900 tracking-tight leading-none mb-2">
                {pageTitle}
              </h1>
            </div>

            <div className="w-full">
              <Outlet />
            </div>
          </main>

        </div>
      </div>

      {/* ── Navigation mobile bas de page ─────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 flex items-center justify-around p-2 z-40">
        {[...navItems.slice(0, 4), PARAM_ITEM].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-14 h-14 rounded-xl gap-1 transition-all ${
                isActive ? 'text-[#1D9E75] font-bold bg-zinc-50' : 'text-zinc-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-1 w-4 h-1 bg-[#1D9E75] rounded-full" />
                )}
                <span className="text-[20px]">{item.icon}</span>
                <span className="text-[9px] font-semibold truncate w-full text-center px-1">
                  {item.label.split(' ')[0]}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
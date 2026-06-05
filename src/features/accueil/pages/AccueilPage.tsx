import { useEffect, useRef, useState, useCallback } from 'react'
import { FiActivity, FiPlus, FiAlertTriangle, FiUsers, FiClock, FiCheckCircle, FiShield } from 'react-icons/fi'
import { getStatsAccueil, getFileAttente } from '../api/accueilApi'
import type { StatsAccueil, VisiteFile } from '../types'
import FileAttente    from '../components/FileAttente'
import NouvelleVisite from '../components/NouvelleVisite'
import Urgence        from '../components/Urgence'
import AccueilAumtTab from '../components/AccueilAumtTab'
import React from 'react'

type Tab = 'file' | 'visite' | 'urgence' | 'aumt'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'file',    label: "File d'attente",  icon: <FiActivity size={14} />      },
  { id: 'visite',  label: 'Nouvelle visite', icon: <FiPlus size={14} />          },
  { id: 'urgence', label: '🚨 Urgence',      icon: <FiAlertTriangle size={14} /> },
  { id: 'aumt',    label: 'Accès AUMT',      icon: <FiShield size={14} />        },
]

export default function AccueilPage() {
  const [tab, setTab]             = useState<Tab>('file')
  const [file, setFile]           = useState<VisiteFile[]>([])
  const [loadingFile, setLoading] = useState(false)
  const [stats, setStats]         = useState<StatsAccueil | null>(null)
  const statsLoading              = useRef(false)

  const chargerStats = useCallback(async () => {
    if (statsLoading.current) return
    statsLoading.current = true
    try   { setStats(await getStatsAccueil()) }
    catch { /* silent */ }
    finally { statsLoading.current = false }
  }, [])

  const chargerFile = useCallback(async () => {
    setLoading(true)
    try   { setFile(await getFileAttente()) }
    catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  const rafraichir = useCallback(() => {
    chargerStats()
    chargerFile()
  }, [chargerStats, chargerFile])

  useEffect(() => {
    rafraichir()
    const interval = setInterval(rafraichir, 30_000)
    return () => clearInterval(interval)
  }, [rafraichir])

  const allerFile = useCallback(() => {
    rafraichir()
    setTab('file')
  }, [rafraichir])

  const CARDS = [
    {
      label: 'Patients auj.',
      value: stats?.patients_aujourdhui ?? 0,
      color: 'bg-blue-50 text-blue-700 border border-blue-100',
      icon: <FiUsers size={18} className="text-blue-400" />
    },
    {
      label: 'Attente tri',
      value: stats?.en_attente_tri ?? 0,
      color: 'bg-orange-50 text-orange-700 border border-orange-100',
      icon: <FiClock size={18} className="text-orange-400" />
    },
    {
      label: 'Chez médecin',
      value: (stats?.en_attente_medecin ?? 0) + (stats?.en_consultation ?? 0),
      color: 'bg-green-50 text-green-700 border border-green-100',
      icon: <FiActivity size={18} className="text-green-400" />
    },
    {
      label: 'Urgences',
      value: stats?.urgences ?? 0,
      color: 'bg-red-50 text-red-700 border border-red-100',
      icon: <FiAlertTriangle size={18} className="text-red-400" />
    },
    {
      label: 'Terminés',
      value: stats?.termines ?? 0,
      color: 'bg-zinc-50 text-zinc-600 border border-zinc-100',
      icon: <FiCheckCircle size={18} className="text-zinc-400" />
    },
    {
      label: 'Total patients',
      value: stats?.patients_total ?? 0,
      color: 'bg-purple-50 text-purple-700 border border-purple-100',
      icon: <FiUsers size={18} className="text-purple-400" />
    },
  ]

  return (
    <div className="space-y-4">

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {CARDS.map(c => (
          <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium opacity-70">{c.label}</p>
              {c.icon}
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              tab === t.id
                ? t.id === 'urgence'
                  ? 'bg-white shadow text-red-600'
                  : t.id === 'aumt'
                  ? 'bg-white shadow text-amber-700'
                  : 'bg-white shadow text-blue-700'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}>
            {t.icon} {t.label}
            {/* Badge file d'attente */}
            {t.id === 'file' && (stats?.en_attente_tri ?? 0) > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {stats!.en_attente_tri}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        {tab === 'file'    && (
          <FileAttente
            file={file}
            loading={loadingFile}
            onRefresh={rafraichir}
            afficherTermines={true}
          />
        )}
        {tab === 'visite'  && <NouvelleVisite onVisiteCreee={allerFile} />}
        {tab === 'urgence' && <Urgence onSuccess={allerFile} />}
        {tab === 'aumt'    && <AccueilAumtTab />}
      </div>
    </div>
  )
}
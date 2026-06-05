// features/super-admin/hooks/useSuperAdmin.ts
import { useState, useEffect, useCallback } from 'react'
import { superAdminApi } from '../api/superAdminApi'
import type {
  SuperAdminOnglet, StatsGlobales, Hopital,
  AdminIT, StatParRole, StatParHopital, Maladie, GlobalLog,
} from '../types'

interface UseSuperAdminOptions {
  onglet: SuperAdminOnglet
  logParams?: {
    hopital_id?: number
    action?: string
    date_debut?: string
    date_fin?: string
  }
  refreshKey?: number
}

interface UseSuperAdminReturn {
  stats: StatsGlobales | null
  statsByRole: StatParRole[]
  statsByHopital: StatParHopital[]
  maladies: Maladie[]
  hopitaux: Hopital[]
  adminsIT: AdminIT[]
  logs: GlobalLog[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useSuperAdmin({
  onglet, logParams = {}, refreshKey = 0,
}: UseSuperAdminOptions): UseSuperAdminReturn {

  const [stats,          setStats]          = useState<StatsGlobales | null>(null)
  const [statsByRole,    setStatsByRole]    = useState<StatParRole[]>([])
  const [statsByHopital, setStatsByHopital] = useState<StatParHopital[]>([])
  const [maladies,       setMaladies]       = useState<Maladie[]>([])
  const [hopitaux,       setHopitaux]       = useState<Hopital[]>([])
  const [adminsIT,       setAdminsIT]       = useState<AdminIT[]>([])
  const [logs,           setLogs]           = useState<GlobalLog[]>([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [internalKey,    setInternalKey]    = useState(0)

  const reload = useCallback(() => setInternalKey(k => k + 1), [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      switch (onglet) {
        case 'stats': {
          const [s, r, m] = await Promise.all([
            superAdminApi.getStats(),
            superAdminApi.getStatsByRole(),
            superAdminApi.getStatsMaladies(),
          ])
          setStats(s.stats)
          setStatsByRole(r.par_role ?? [])
          setStatsByHopital(r.par_hopital ?? [])
          setMaladies(m.maladies ?? [])
          break
        }
        case 'hopitaux': {
          const h = await superAdminApi.getHopitaux()
          setHopitaux(h.hopitaux ?? [])
          break
        }
        case 'admins_it': {
          const a = await superAdminApi.getAdminsIT()
          setAdminsIT(a.admins ?? [])
          break
        }
        case 'logs': {
          const l = await superAdminApi.getLogs({ ...logParams, limit: 200 })
          setLogs(l.logs ?? [])
          break
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [onglet, logParams.hopital_id, logParams.action, logParams.date_debut, logParams.date_fin, refreshKey, internalKey])

  useEffect(() => { load() }, [load])

  return {
    stats, statsByRole, statsByHopital, maladies,
    hopitaux, adminsIT, logs, loading, error, reload,
  }
}
// features/admin/hooks/useAdmin.ts
import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api/adminApi'

import type {
  AdminOnglet,
  DashboardResponse,
  Utilisateur,
  AuditLog,
  StatistiquesResponse,
} from '../types'

interface UseAdminOptions {
  onglet:       AdminOnglet
  auditParams?: { action?: string; date_debut?: string; date_fin?: string }
  refreshKey?:  number
}

interface UseAdminReturn {
  dashboard:    DashboardResponse | null
  utilisateurs: Utilisateur[]
  auditLogs:    AuditLog[]
  statistiques: StatistiquesResponse | null
  loading:      boolean
  error:        string | null
  reload:       () => void
}

export function useAdmin({
  onglet,
  auditParams = {},
  refreshKey = 0,
}: UseAdminOptions): UseAdminReturn {

  const [dashboard,    setDashboard]    = useState<DashboardResponse | null>(null)
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [auditLogs,    setAuditLogs]    = useState<AuditLog[]>([])
  const [statistiques, setStatistiques] = useState<StatistiquesResponse | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [internalKey,  setInternalKey]  = useState(0)

  const reload = useCallback(() => setInternalKey(k => k + 1), [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      switch (onglet) {

        case 'dashboard': {
          // getMaladies supprimé — route inexistante
          const d = await adminApi.getDashboard()
          setDashboard(d)
          break
        }

        case 'personnel': {
          const u = await adminApi.getUtilisateurs()
          setUtilisateurs(u.utilisateurs ?? [])
          break
        }

        case 'audit': {
          const a = await adminApi.getAudit({ ...auditParams, limit: 200 })
          setAuditLogs(a.logs ?? [])
          break
        }

        case 'sauvegarde': {
          const s = await adminApi.getStatistiques()
          setStatistiques(s)
          break
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [
    onglet,
    auditParams.action,
    auditParams.date_debut,
    auditParams.date_fin,
    refreshKey,
    internalKey,
  ])

  useEffect(() => { load() }, [load])

  return { dashboard, utilisateurs, auditLogs, statistiques, loading, error, reload }
}
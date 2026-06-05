// features/admin/api/adminApi.ts
import api from '@/lib/axios'
import type { NouvelUtilisateur } from '../types'

const BASE = '/admin'

export const adminApi = {
  getDashboard: () =>
    api.get(`${BASE}/dashboard`).then(r => r.data),

  getUtilisateurs: () =>
    api.get(`${BASE}/utilisateurs`).then(r => r.data),

  creerUtilisateur: (data: NouvelUtilisateur) =>
    api.post(`${BASE}/utilisateurs`, data).then(r => r.data),

  modifierUtilisateur: (id: number, data: Partial<NouvelUtilisateur & { actif: boolean }>) =>
    api.put(`${BASE}/utilisateurs/${id}`, data).then(r => r.data),

  supprimerUtilisateur: (id: number) =>
    api.delete(`${BASE}/utilisateurs/${id}`).then(r => r.data),

  // CORRECTION : PATCH /toggle au lieu de PUT /bloquer
  bloquerUtilisateur: (id: number) =>
    api.patch(`${BASE}/utilisateurs/${id}/toggle`).then(r => r.data),

  resetPassword: (id: number) =>
    api.post(`${BASE}/utilisateurs/${id}/reset-password`).then(r => r.data),

  // CORRECTION : /logs au lieu de /audit
  getAudit: (params?: {
    action?: string
    date_debut?: string
    date_fin?: string
    limit?: number
  }) => api.get(`${BASE}/logs`, { params }).then(r => r.data),

  getStatistiques: () =>
    api.get(`${BASE}/statistiques`).then(r => r.data),

  // CORRECTION : retourne le blob pour téléchargement
  sauvegarder: () =>
    api.post(`${BASE}/sauvegarde`, {}, { responseType: 'blob' }).then(r => r),
}
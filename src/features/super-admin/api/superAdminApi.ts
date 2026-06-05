import api from '@/lib/axios'
import type { NouvelHopital, NouvelAdminIT } from '../types'

const BASE = '/super-admin'

export const superAdminApi = {

  getStats: () =>
    api.get(`${BASE}/stats`).then(r => r.data),

  getStatsByRole: () =>
    api.get(`${BASE}/stats/roles`).then(r => r.data),

  getStatsMaladies: () =>
    api.get(`${BASE}/stats/maladies`).then(r => r.data),

  getHopitaux: () =>
    api.get(`${BASE}/hopitaux`).then(r => r.data),

  creerHopital: (data: NouvelHopital) =>
    api.post(`${BASE}/hopitaux`, data).then(r => r.data),

  toggleHopital: (id: number) =>
    api.patch(`${BASE}/hopitaux/${id}/toggle`).then(r => r.data),

  getAdminsIT: () =>
    api.get(`${BASE}/admins-it`).then(r => r.data),

  creerAdminIT: (data: NouvelAdminIT) =>
    api.post(`${BASE}/admins-it`, data).then(r => r.data),

  // CORRIGÉ : PATCH /admins-it/:id/toggle (pas PUT /bloquer)
  toggleAdminIT: (id: number) =>
    api.patch(`${BASE}/admins-it/${id}/toggle`).then(r => r.data),

  resetAdminITPassword: (id: number) =>
    api.post(`${BASE}/admins-it/${id}/reset-password`).then(r => r.data),

  getLogs: (params?: {
    hopital_id?: number
    action?:     string
    date_debut?: string
    date_fin?:   string
    limit?:      number
  }) => api.get(`${BASE}/logs`, { params }).then(r => r.data),

  getAumtLogs: (params?: {
    hopital_id?: number
    date_debut?: string
    date_fin?:   string
  }) => api.get(`${BASE}/aumt-logs`, { params }).then(r => r.data),
}
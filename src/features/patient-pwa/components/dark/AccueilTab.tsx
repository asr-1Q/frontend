import { useEffect } from 'react'
import { FileText, Activity, Heart, Calendar, Phone, Droplets, AlertTriangle, ChevronRight, Clock } from 'lucide-react'
import type { TabPatient } from '../../types'
import type { usePatientData } from '../../hooks/usePatientData'

type Props = ReturnType<typeof usePatientData> & { onTabChange: (t: TabPatient) => void }

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    ...style,
  }}>{children}</div>
)

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

export const AccueilTab = ({ patient, data, loading, loadConstantes, onTabChange }: Props) => {
  useEffect(() => { loadConstantes() }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #d1fae5', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Carte résumé */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 99,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {patient?.prenom?.[0]}{patient?.nom?.[0]}
          </div>
          <div>
            <p style={{ color: '#1e293b', fontWeight: 700, fontSize: 16, margin: '0 0 2px' }}>
              Bonjour, {patient?.prenom} 👋
            </p>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{dateStr}</p>
          </div>
        </div>

        {/* Stats rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'Consultations', value: data.consultations?.length ?? 0,    color: '#10b981', Icon: FileText },
            { label: 'Constantes',    value: data.constantes?.length ?? 0,       color: '#3b82f6', Icon: Activity },
            { label: 'Visites',       value: data.dernieresVisites?.length ?? 0, color: '#f59e0b', Icon: Calendar },
          ].map(({ label, value, color, Icon }) => (
            <div key={label} style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 14, padding: '12px 10px', textAlign: 'center',
            }}>
              <Icon size={16} color={color} style={{ margin: '0 auto 6px' }} />
              <p style={{ color: '#1e293b', fontWeight: 800, fontSize: 20, margin: '0 0 2px' }}>{value}</p>
              <p style={{ color: '#94a3b8', fontSize: 10, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Données C0 urgence */}
      {(patient?.allergies_texte || patient?.groupe_sanguin) && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
          background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 14,
        }}>
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ color: '#b91c1c', fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>Données d'urgence (C0)</p>
            {patient?.groupe_sanguin && (
              <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 2px' }}>
                Groupe : <strong>{patient.groupe_sanguin}</strong>
              </p>
            )}
            {patient?.allergies_texte && (
              <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>
                ⚠ Allergies : {patient.allergies_texte}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Infos patient */}
      <Card>
        <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
          Mes informations
        </p>
        {[
          { label: 'Téléphone',      value: patient?.telephone || '—',      Icon: Phone    },
          { label: 'Groupe sanguin', value: patient?.groupe_sanguin || '—', Icon: Droplets },
          { label: 'CPU',            value: patient?.cpu || '—',            Icon: FileText },
        ].map(({ label, value, Icon }, i, arr) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
            borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
          }}>
            <Icon size={14} color="#10b981" />
            <p style={{ color: '#64748b', fontSize: 12, flex: 1, margin: 0 }}>{label}</p>
            <p style={{ color: '#1e293b', fontSize: 13, fontWeight: 600, margin: 0 }}>{value}</p>
          </div>
        ))}
      </Card>

      {/* Contact urgence */}
      {patient?.contact_urgence_nom && (
        <Card>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
            Contact d'urgence
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 99,
              background: '#fff1f2', border: '1px solid #fecdd3',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={16} color="#ef4444" />
            </div>
            <div>
              <p style={{ color: '#1e293b', fontWeight: 600, fontSize: 14, margin: '0 0 2px' }}>{patient.contact_urgence_nom}</p>
              <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{patient.contact_urgence_telephone}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Dernières visites */}
      {(data.dernieresVisites?.length ?? 0) > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              Dernières visites
            </p>
            <button onClick={() => onTabChange('historique')} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: '#10b981', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer',
            }}>
              Voir tout <ChevronRight size={12} />
            </button>
          </div>
          {data.dernieresVisites.slice(0, 3).map((v: any, i: number) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{ padding: 8, borderRadius: 10, background: '#f8fafc' }}>
                <Clock size={14} color="#94a3b8" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#1e293b', fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>
                  {v.motif_visite || 'Consultation'}
                </p>
                <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>{fmtDate(v.created_at)}</p>
              </div>
              <span style={{
                padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                background: v.statut === 'termine' ? '#d1fae5' : '#dbeafe',
                color: v.statut === 'termine' ? '#059669' : '#2563eb',
                border: `1px solid ${v.statut === 'termine' ? '#a7f3d0' : '#bfdbfe'}`,
              }}>
                {v.statut}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
import { useEffect } from 'react'
import { Activity, Thermometer, Heart, Wind, Scale, Droplets, Zap } from 'lucide-react'
import type { usePatientData } from '../../hooks/usePatientData'

type Props = Pick<ReturnType<typeof usePatientData>, 'data' | 'loadingTab' | 'loadConstantes'>

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    ...style
  }}>
    {children}
  </div>
)

export const ConstantesTab = ({ data, loadingTab, loadConstantes }: Props) => {
  useEffect(() => { loadConstantes() }, [])

  if (loadingTab) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #d1fae5', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const constantes = data.constantes ?? []

  if (constantes.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ width: 56, height: 56, margin: '0 auto 12px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Activity size={24} color="#cbd5e1" />
      </div>
      <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucune constante enregistrée</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ color: '#1e293b', fontWeight: 800, fontSize: 20, margin: 0 }}>Mes constantes vitales</p>

      {constantes.map((c: any, idx: number) => {
        const alerteTemp  = c.temperature != null && (c.temperature < 36 || c.temperature > 38.5)
        const alerteSpo2  = c.spo2 != null && c.spo2 < 95
        const alerteTens  = c.tension_systolique != null && (c.tension_systolique > 140 || c.tension_systolique < 90)
        const alertePouls = c.frequence_cardiaque != null && (c.frequence_cardiaque > 100 || c.frequence_cardiaque < 60)
        const nbAlertes   = [alerteTemp, alerteSpo2, alerteTens, alertePouls].filter(Boolean).length

        const items = [
          { label: 'Température',   value: c.temperature != null ? `${c.temperature}°C` : '—',                                             Icon: Thermometer, alerte: alerteTemp,  color: alerteTemp  ? '#ef4444' : '#f97316' },
          { label: 'SpO2',          value: c.spo2 != null ? `${c.spo2}%` : '—',                                                            Icon: Wind,        alerte: alerteSpo2,  color: alerteSpo2  ? '#ef4444' : '#3b82f6' },
          { label: 'Tension',       value: c.tension_systolique != null ? `${c.tension_systolique}/${c.tension_diastolique}` : '—',         Icon: Activity,    alerte: alerteTens,  color: alerteTens  ? '#ef4444' : '#10b981' },
          { label: 'Pouls',         value: c.frequence_cardiaque != null ? `${c.frequence_cardiaque} bpm` : '—',                            Icon: Heart,       alerte: alertePouls, color: alertePouls ? '#ef4444' : '#ec4899' },
          { label: 'Poids',         value: c.poids != null ? `${c.poids} kg` : '—',                                                        Icon: Scale,       alerte: false,       color: '#94a3b8'   },
          { label: 'Glycémie',      value: c.glycemie != null ? `${c.glycemie} g/L` : '—',                                                 Icon: Droplets,    alerte: false,       color: '#f59e0b'   },
          { label: 'Douleur (EVA)', value: c.eva_douleur != null ? `${c.eva_douleur}/10` : '—',                                            Icon: Zap,         alerte: false,       color: (c.eva_douleur ?? 0) >= 7 ? '#ef4444' : '#94a3b8' },
          { label: 'Score urgence', value: c.score_urgence != null ? `${c.score_urgence}/10` : '—',                                        Icon: Activity,    alerte: false,       color: '#94a3b8'   },
        ]

        return (
          <Card key={idx}>
            <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                {idx === 0 ? 'Dernières constantes' : `Mesure ${constantes.length - idx}`}
              </p>
              <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>{fmtDate(c.created_at)}</p>
            </div>

            {nbAlertes > 0 && (
              <div style={{ margin: '0 18px 10px', padding: '8px 14px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10 }}>
                <p style={{ color: '#dc2626', fontSize: 12, fontWeight: 600, margin: 0 }}>
                  ⚠ {nbAlertes} valeur{nbAlertes > 1 ? 's' : ''} hors norme
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '4px 18px 18px' }}>
              {items.map(item => (
                <div key={item.label} style={{
                  padding: '12px 14px', borderRadius: 14,
                  background: item.alerte ? '#fff1f2' : '#f8fafc',
                  border: item.alerte ? '1px solid #fecdd3' : '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <item.Icon size={14} color={item.color} />
                    {item.alerte && (
                      <span style={{ fontSize: 9, fontWeight: 700, background: '#fee2e2', color: '#ef4444', padding: '1px 5px', borderRadius: 99 }}>Alerte</span>
                    )}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: 10, margin: '0 0 2px' }}>{item.label}</p>
                  <p style={{ color: '#1e293b', fontSize: 16, fontWeight: 700, margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
import { useEffect } from 'react'
import { Activity, Thermometer, Heart, Wind, Scale, Droplets, Zap } from 'lucide-react'
import type { usePatientData } from '../hooks/usePatientData'

type Props = Pick<ReturnType<typeof usePatientData>, 'data' | 'loadingTab' | 'loadConstantes'>

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export const ConstantesTab = ({ data, loadingTab, loadConstantes }: Props) => {
  useEffect(() => { loadConstantes() }, [])

  if (loadingTab) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // constantes est maintenant un tableau — on prend la dernière
  const constantes = data.constantes ?? []

  if (constantes.length === 0) return (
    <div className="text-center py-12 text-zinc-400">
      <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
      <p className="text-sm">Aucune constante enregistrée</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-zinc-800">Mes constantes vitales</h2>

      {constantes.map((c, idx) => {
        const alerteTemp  = c.temperature != null && (c.temperature < 36 || c.temperature > 38.5)
        const alerteSpo2  = c.spo2 != null && c.spo2 < 95
        const alerteTens  = c.tension_systolique != null && (c.tension_systolique > 140 || c.tension_systolique < 90)
        const alertePouls = c.frequence_cardiaque != null && (c.frequence_cardiaque > 100 || c.frequence_cardiaque < 60)

        const nbAlertes = [alerteTemp, alerteSpo2, alerteTens, alertePouls].filter(Boolean).length

        const items = [
          { label: 'Température',   value: c.temperature       != null ? `${c.temperature}°C`                                        : '—', icon: <Thermometer className="w-4 h-4" />, alerte: alerteTemp,  color: alerteTemp  ? 'bg-red-50 text-red-600 border-red-200'   : 'bg-orange-50 text-orange-600 border-orange-100' },
          { label: 'SpO2',          value: c.spo2              != null ? `${c.spo2}%`                                                : '—', icon: <Wind        className="w-4 h-4" />, alerte: alerteSpo2,  color: alerteSpo2  ? 'bg-red-50 text-red-600 border-red-200'   : 'bg-blue-50 text-blue-600 border-blue-100'       },
          { label: 'Tension',       value: c.tension_systolique!= null ? `${c.tension_systolique}/${c.tension_diastolique} mmHg`     : '—', icon: <Activity    className="w-4 h-4" />, alerte: alerteTens,  color: alerteTens  ? 'bg-red-50 text-red-600 border-red-200'   : 'bg-teal-50 text-teal-600 border-teal-100'       },
          { label: 'Pouls',         value: c.frequence_cardiaque != null ? `${c.frequence_cardiaque} bpm`                            : '—', icon: <Heart       className="w-4 h-4" />, alerte: alertePouls, color: alertePouls ? 'bg-red-50 text-red-600 border-red-200'   : 'bg-pink-50 text-pink-600 border-pink-100'       },
          { label: 'Poids',         value: c.poids              != null ? `${c.poids} kg`                                            : '—', icon: <Scale       className="w-4 h-4" />, alerte: false,       color: 'bg-zinc-50 text-zinc-600 border-zinc-200'                                                          },
          { label: 'IMC',           value: c.imc                != null ? `${c.imc}`                                                 : '—', icon: <Scale       className="w-4 h-4" />, alerte: false,       color: 'bg-zinc-50 text-zinc-600 border-zinc-200'                                                          },
          { label: 'Glycémie',      value: c.glycemie           != null ? `${c.glycemie} g/L`                                        : '—', icon: <Droplets    className="w-4 h-4" />, alerte: false,       color: 'bg-amber-50 text-amber-600 border-amber-100'                                                       },
          { label: 'Douleur (EVA)', value: c.eva_douleur        != null ? `${c.eva_douleur}/10`                                      : '—', icon: <Zap         className="w-4 h-4" />, alerte: false,       color: (c.eva_douleur ?? 0) >= 7 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200' },
          { label: 'Score urgence', value: c.score_urgence      != null ? `${c.score_urgence}/10`                                    : '—', icon: <Activity    className="w-4 h-4" />, alerte: false,       color: 'bg-zinc-50 text-zinc-600 border-zinc-200'                                                          },
        ]

        return (
          <div key={idx} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {idx === 0 ? 'Dernières constantes' : `Mesure ${constantes.length - idx}`}
              </p>
              <p className="text-xs text-zinc-400">{fmtDate(c.created_at)}</p>
            </div>

            {nbAlertes > 0 && (
              <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 font-medium">
                ⚠ {nbAlertes} valeur{nbAlertes > 1 ? 's' : ''} hors norme
              </div>
            )}

            {c.motif_detaille && (
              <div className="mx-4 mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
                <span className="font-semibold">Motif : </span>{c.motif_detaille}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 p-4">
              {items.map(item => (
                <div key={item.label} className={`border rounded-xl p-3 ${item.color}`}>
                  <div className="flex items-center justify-between mb-1">
                    {item.icon}
                    {item.alerte && (
                      <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Alerte</span>
                    )}
                  </div>
                  <p className="text-[10px] opacity-70 mb-0.5">{item.label}</p>
                  <p className="text-base font-bold leading-tight">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
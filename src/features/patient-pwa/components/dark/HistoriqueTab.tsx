import { useEffect, useState, useCallback } from 'react'
import { FileText, Calendar, Pill, Activity, ChevronDown, ChevronUp, Download, Clock } from 'lucide-react'
import { jsPDF } from 'jspdf'
import type { usePatientData } from '../../hooks/usePatientData'
import { getRendezVous } from '../../api/patientApi'

type Props = Pick<ReturnType<typeof usePatientData>, 'data' | 'loadingTab' | 'loadConsultations'> & {
  patient: ReturnType<typeof usePatientData>['patient']
}

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    ...style
  }}>{children}</div>
)

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const DECISION: Record<string, { label: string; color: string; bg: string }> = {
  sortie:      { label: 'Sortie',      color: '#059669', bg: '#d1fae5' },
  rendez_vous: { label: 'Rendez-vous', color: '#2563eb', bg: '#dbeafe' },
}

const chargerLogo = async (): Promise<string | null> => {
  try {
    const mod = await import('@/assets/logo.png')
    const url = mod.default
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror   = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

const telechargerPDF = async (c: any, patient: any) => {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await chargerLogo()
  const W    = 210

  doc.setFillColor(29, 158, 117)
  doc.rect(0, 0, W, 32, 'F')
  doc.setFillColor(225, 245, 238)
  doc.rect(0, 32, W, 7, 'F')

  if (logo) { try { doc.addImage(logo, 'PNG', 10, 4, 22, 22) } catch {} }

  const xT = logo ? 36 : 14
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Health Mboa Connect', xT, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Compte-rendu de consultation', xT, 20)
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, xT, 26)

  doc.setTextColor(29, 158, 117)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Document confidentiel — réservé au patient', 14, 36.5)
  doc.setDrawColor(29, 158, 117)
  doc.setLineWidth(0.5)
  doc.line(0, 39, W, 39)

  let y = 48

  doc.setFillColor(225, 245, 238)
  doc.roundedRect(10, y - 4, W - 20, 8, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(29, 158, 117)
  doc.text('INFORMATIONS PATIENT', 14, y + 0.5)
  y += 12

  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`${patient?.prenom ?? ''} ${patient?.nom ?? ''}`, 14, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`CPU : ${patient?.cpu ?? '—'}`, 14, y + 6)
  doc.text(`Date de consultation : ${fmtDate(c.date_visite)}`, 14, y + 12)
  if (c.medecin_nom) doc.text(`Médecin traitant : Dr ${c.medecin_prenom ?? ''} ${c.medecin_nom}${c.medecin_specialite ? ' · ' + c.medecin_specialite : ''}`, 14, y + 18)
  y += 28

  if (c.motif_visite) {
    doc.setFillColor(225, 245, 238)
    doc.roundedRect(10, y - 4, W - 20, 8, 1, 1, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(29, 158, 117)
    doc.text('MOTIF DE LA VISITE', 14, y + 0.5); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 30, 30)
    const ml = doc.splitTextToSize(c.motif_visite, W - 28)
    doc.text(ml, 14, y); y += ml.length * 5 + 6
  }

  const dec = DECISION[c.decision_finale]
  if (dec) {
    const bg = c.decision_finale === 'rendez_vous' ? [219, 234, 254] : [209, 250, 229]
    const fg = c.decision_finale === 'rendez_vous' ? [29, 78, 216]   : [6, 95, 70]
    doc.setFillColor(bg[0], bg[1], bg[2])
    doc.roundedRect(10, y, W - 20, 10, 2, 2, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.setTextColor(fg[0], fg[1], fg[2])
    doc.text(`Décision médicale : ${dec.label}`, 14, y + 7); y += 16
  }

  if (c.date_rdv) {
    doc.setFillColor(219, 234, 254)
    doc.roundedRect(10, y - 4, W - 20, 8, 1, 1, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(29, 78, 216)
    doc.text('PROCHAIN RENDEZ-VOUS', 14, y + 0.5); y += 10
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 30, 30)
    doc.text(fmtDate(c.date_rdv), 14, y); y += 10
  }

  if (c.ordonnance_texte) {
    doc.setFillColor(225, 245, 238)
    doc.roundedRect(10, y - 4, W - 20, 8, 1, 1, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(29, 158, 117)
    doc.text('ORDONNANCE MÉDICALE', 14, y + 0.5); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 30, 30)
    const ol = doc.splitTextToSize(c.ordonnance_texte, W - 28)
    doc.text(ol, 14, y); y += ol.length * 5 + 6
  }

  if (c.examens_prescrits) {
    doc.setFillColor(254, 252, 232)
    doc.roundedRect(10, y - 4, W - 20, 8, 1, 1, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(133, 77, 14)
    doc.text('EXAMENS PRESCRITS', 14, y + 0.5); y += 12
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 30, 30)
    const el = doc.splitTextToSize(c.examens_prescrits, W - 28)
    doc.text(el, 14, y); y += el.length * 5 + 6
  }

  const H = doc.internal.pageSize.getHeight()
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3)
  doc.line(10, H - 12, W - 10, H - 12)
  doc.setFontSize(7); doc.setTextColor(160, 160, 160); doc.setFont('helvetica', 'normal')
  doc.text('Health Mboa Connect — Document confidentiel — Ne pas diffuser', 14, H - 7)
  doc.text('Page 1 / 1', W - 20, H - 7)

  doc.save(`HMC_CR_${patient?.cpu ?? 'patient'}_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ═══ ONGLET HISTORIQUE ═══════════════════════════════════════
const OngletHistorique = ({ consultations, patient }: { consultations: any[]; patient: any }) => {
  const [ouvert, setOuvert] = useState<number | null>(0)

  if (consultations.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ width: 56, height: 56, margin: '0 auto 12px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FileText size={24} color="#cbd5e1" />
      </div>
      <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucune consultation terminée</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {consultations.map((c: any, idx: number) => {
        const isOuvert   = ouvert === idx
        const dec        = DECISION[c.decision_finale]
        const hasDetails = c.ordonnance_texte || c.examens_prescrits || c.date_rdv

        return (
          <Card key={idx}>
            <button onClick={() => setOuvert(isOuvert ? null : idx)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} color="#10b981" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#1e293b', fontWeight: 600, fontSize: 14, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.motif_visite || 'Consultation'}</p>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>
                  {fmtDate(c.date_visite)}{c.medecin_nom ? ` · Dr ${c.medecin_prenom ?? ''} ${c.medecin_nom}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {dec && <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: dec.bg, color: dec.color }}>{dec.label}</span>}
                {isOuvert ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
              </div>
            </button>

            {isOuvert && (
              <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #f1f5f9' }}>
                {c.date_rdv && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 14, marginTop: 12 }}>
                    <Calendar size={16} color="#2563eb" />
                    <div>
                      <p style={{ color: '#1d4ed8', fontSize: 11, fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prochain rendez-vous</p>
                      <p style={{ color: '#1e40af', fontWeight: 700, fontSize: 15, margin: 0 }}>{fmtDate(c.date_rdv)}</p>
                    </div>
                  </div>
                )}
                {c.ordonnance_texte && (
                  <div style={{ padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Pill size={14} color="#16a34a" />
                      <p style={{ color: '#16a34a', fontSize: 11, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ordonnance médicale</p>
                    </div>
                    <p style={{ color: '#1e293b', fontSize: 13, margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{c.ordonnance_texte}</p>
                  </div>
                )}
                {c.examens_prescrits && (
                  <div style={{ padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Activity size={14} color="#d97706" />
                      <p style={{ color: '#d97706', fontSize: 11, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Examens prescrits</p>
                    </div>
                    <p style={{ color: '#1e293b', fontSize: 13, margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{c.examens_prescrits}</p>
                  </div>
                )}
                {!hasDetails && <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '12px 0', margin: 0 }}>Aucune prescription pour cette consultation.</p>}
                <button onClick={() => telechargerPDF(c, patient)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12, cursor: 'pointer', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: 13 }}>
                  <Download size={15} /> Télécharger le compte-rendu PDF
                </button>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// ═══ ONGLET RENDEZ-VOUS ══════════════════════════════════════
const OngletRendezVous = ({ rendezVous }: { rendezVous: any[] }) => {
  const now    = new Date()
  const aVenir = rendezVous.filter(r => new Date(r.date_rdv) >= now)
  const passes = rendezVous.filter(r => new Date(r.date_rdv) <  now)

  if (rendezVous.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ width: 56, height: 56, margin: '0 auto 12px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Calendar size={24} color="#cbd5e1" />
      </div>
      <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucun rendez-vous planifié</p>
    </div>
  )

  const CarteRDV = ({ r, estPassé }: { r: any; estPassé: boolean }) => (
    <Card style={{ opacity: estPassé ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: estPassé ? '#f8fafc' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={20} color={estPassé ? '#cbd5e1' : '#2563eb'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: estPassé ? '#94a3b8' : '#1d4ed8', fontWeight: 700, fontSize: 15, margin: '0 0 3px' }}>{fmtDate(r.date_rdv)}</p>
          <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 2px' }}>Dr {r.medecin_prenom ?? ''} {r.medecin_nom ?? ''}{r.medecin_specialite ? ` · ${r.medecin_specialite}` : ''}</p>
          {r.motif_visite && <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>Motif : {r.motif_visite}</p>}
        </div>
        <span style={{ fontSize: 11, fontWeight: estPassé ? 400 : 700, flexShrink: 0, padding: '3px 8px', borderRadius: 99, color: estPassé ? '#94a3b8' : '#2563eb', background: estPassé ? '#f8fafc' : '#dbeafe', border: `1px solid ${estPassé ? '#e2e8f0' : '#bfdbfe'}` }}>
          {estPassé ? 'Passé' : 'À venir'}
        </span>
      </div>
    </Card>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {aVenir.length > 0 && <>
        <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>À venir — {aVenir.length}</p>
        {aVenir.map((r, i) => <CarteRDV key={i} r={r} estPassé={false} />)}
      </>}
      {passes.length > 0 && <>
        <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: `${aVenir.length > 0 ? 8 : 0}px 0 0` }}>Passés — {passes.length}</p>
        {passes.map((r, i) => <CarteRDV key={i} r={r} estPassé={true} />)}
      </>}
    </div>
  )
}

// ═══ COMPOSANT PRINCIPAL ════════════════════════════════════
export const HistoriqueTab = ({ data, loadingTab, loadConsultations, patient }: Props) => {
  const [onglet,     setOnglet]     = useState<'historique' | 'rendez_vous'>('historique')
  const [rendezVous, setRendezVous] = useState<any[]>([])
  const [loadingRdv, setLoadingRdv] = useState(false)

  useEffect(() => { loadConsultations() }, [])

  const chargerRendezVous = useCallback(async () => {
    if (rendezVous.length > 0) return
    setLoadingRdv(true)
    try { const r = await getRendezVous(); setRendezVous(r.rendez_vous ?? []) }
    catch { }
    finally { setLoadingRdv(false) }
  }, [rendezVous.length])

  const handleOnglet = (o: 'historique' | 'rendez_vous') => {
    setOnglet(o)
    if (o === 'rendez_vous') chargerRendezVous()
  }

  if (loadingTab) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #d1fae5', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ color: '#1e293b', fontWeight: 800, fontSize: 20, margin: 0 }}>Suivi médical</p>

      <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', borderRadius: 14, padding: 4 }}>
        {([
          { key: 'historique',  label: 'Historique',  icon: <FileText size={14} /> },
          { key: 'rendez_vous', label: 'Rendez-vous', icon: <Clock size={14} /> },
        ] as const).map(o => (
          <button key={o.key} onClick={() => handleOnglet(o.key)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s', background: onglet === o.key ? '#ffffff' : 'transparent', color: onglet === o.key ? '#10b981' : '#94a3b8', boxShadow: onglet === o.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {o.icon} {o.label}
          </button>
        ))}
      </div>

      {onglet === 'historique' && <OngletHistorique consultations={data.consultations ?? []} patient={patient} />}
      {onglet === 'rendez_vous' && (
        loadingRdv
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
              <div style={{ width: 36, height: 36, border: '3px solid #dbeafe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          : <OngletRendezVous rendezVous={rendezVous} />
      )}
    </div>
  )
}
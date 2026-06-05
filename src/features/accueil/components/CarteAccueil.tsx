/**
 * CarteAccueil.tsx
 * Composant carte CSI léger — utilisé depuis l'accueil après création de patient.
 * Reprend le design de CarteCSI mais avec des props directes (sans usePatientData).
 * Permet aperçu recto/verso + téléchargement PDF format CNI (85.6 × 54 mm).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'
import { ShieldCheck, AlertCircle, Phone, CalendarDays, Download, FlipHorizontal, Camera } from 'lucide-react'
import logoSrc from '@/assets/logo.png'

/* ── Dimensions carte bancaire ── */
const CW = 85.6
const CH = 53.98
const CARD_W = 340
const CARD_H = Math.round(CARD_W * CH / CW)
const PHOTO_H = Math.round(CARD_H * 0.55)
const PHOTO_W = Math.round(PHOTO_H * 0.73)

/* ── Palette HMC ── */
const BLUE_DARK  = '#1a5276'
const BLUE_MID   = '#2980b9'
const TEAL       = '#48c9b0'
const GREEN_DARK = '#0d6b3b'
const GREEN_MID  = '#1a9e5c'

// ─── Données patient pour la carte ───────────────────────────
export interface PatientCarteData {
  cpu:                       string
  nom:                       string
  prenom:                    string
  date_naissance?:           string | null
  sexe?:                     'M' | 'F' | null
  telephone?:                string | null
  groupe_sanguin?:           string | null
  allergies_texte?:          string | null
  pathologies_chroniques?:   string | null
  contact_urgence_nom?:      string | null
  contact_urgence_telephone?: string | null
  photoPreview?:             string | null   // base64 ou URL
}

// ─── WavePattern ─────────────────────────────────────────────
const WavePattern = ({ green }: { green: boolean }) => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    {Array.from({ length: 18 }, (_, i) => {
      const y     = 6 + i * 12
      const amp   = 6 + Math.sin(i * 0.7) * 4
      const freq  = 0.013 + Math.sin(i * 0.4) * 0.003
      const phase = i * 1.3
      const pts   = Array.from({ length: 80 }, (_, k) => {
        const x  = k * 8
        const yy = y + Math.sin(x * freq + phase) * amp
        return `${k === 0 ? 'M' : 'L'}${x},${yy}`
      }).join(' ')
      return (
        <path key={i} d={pts} fill="none"
          stroke={green ? '#a7d9c5' : '#c8d0de'}
          strokeWidth="0.5"
          opacity={0.22 + Math.sin(i * 0.5) * 0.1}
        />
      )
    })}
  </svg>
)

// ─── CardShell ───────────────────────────────────────────────
const CardShell = ({ children, green, captureRef }: {
  children: React.ReactNode
  green: boolean
  captureRef: React.RefObject<HTMLDivElement | null> | null
}) => (
  <div
    ref={captureRef as React.RefObject<HTMLDivElement>}
    style={{
      width: CARD_W, height: CARD_H, borderRadius: 12, overflow: 'hidden',
      position: 'relative', flexShrink: 0,
      boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
      border: `1px solid ${green ? '#a7d9c5' : '#dde3ef'}`,
      background: green ? '#f0fff8' : '#ffffff',
      display: 'flex', flexDirection: 'column',
    }}
  >
    <WavePattern green={green} />
    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {children}
    </div>
  </div>
)

// ─── CardHeader ──────────────────────────────────────────────
const CardHeader = ({ subtitle, green, logoB64 }: {
  subtitle: [string, string]
  green: boolean
  logoB64: string | null
}) => (
  <div style={{
    background: green
      ? `linear-gradient(90deg,${GREEN_DARK} 0%,${GREEN_MID} 60%,${TEAL} 100%)`
      : `linear-gradient(90deg,${BLUE_DARK} 0%,${BLUE_MID} 65%,${TEAL} 100%)`,
    flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <img src={logoB64 || logoSrc} alt="HMC"
          style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: '0.04em' }}>HMC</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 7.5 }}>Health Mboa Connect</span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          {subtitle[0]}
        </p>
        <p style={{ color: '#fff', fontSize: 8.5, fontWeight: 700, margin: 0, marginTop: 1 }}>{subtitle[1]}</p>
      </div>
    </div>
    <div style={{ height: 2, background: 'rgba(72,201,176,0.6)' }} />
  </div>
)

// ─── CardFooter ──────────────────────────────────────────────
const CardFooter = ({ green }: { green: boolean }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
    background: green
      ? `linear-gradient(90deg,${GREEN_DARK},${GREEN_MID})`
      : `linear-gradient(90deg,${BLUE_DARK},${BLUE_MID})`,
    flexShrink: 0, marginTop: 'auto',
  }}>
    <ShieldCheck size={8} color={TEAL} style={{ flexShrink: 0 }} />
    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 6, fontWeight: 500, margin: 0, lineHeight: 1.3 }}>
      Valable à vie dans tout le réseau HMC.{' '}
      <span style={{ fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
        Cette carte ne contient aucune donnée médicale sensible.
      </span>
    </p>
  </div>
)

// ─── QRBlock ─────────────────────────────────────────────────
const QRBlock = ({ url, label, labelBottom, size = 50 }: {
  url: string; label: string; labelBottom?: string; size?: number
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
    <p style={{ fontSize: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5a7a6a', textAlign: 'center', margin: 0, whiteSpace: 'pre-line' }}>
      {label}
    </p>
    <div style={{ background: '#fff', border: '1px solid #dde8e3', borderRadius: 5, padding: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      {url
        ? <img src={url} alt="QR" style={{ width: size, height: size, display: 'block' }} />
        : <div style={{ width: size, height: size, background: '#f1f5f9', borderRadius: 3 }} />
      }
    </div>
    {labelBottom && (
      <p style={{ fontSize: 5.5, color: '#8aab98', textAlign: 'center', margin: 0, lineHeight: 1.3, whiteSpace: 'pre-line' }}>{labelBottom}</p>
    )}
  </div>
)

// ─── RectoCard ───────────────────────────────────────────────
const RectoCard = React.memo(({ patient, photoPreview, qrCodeUrl, logoB64, captureRef }: {
  patient: PatientCarteData
  photoPreview: string | null
  qrCodeUrl: string
  logoB64: string | null
  captureRef: React.RefObject<HTMLDivElement | null> | null
}) => (
  <CardShell green={false} captureRef={captureRef}>
    <CardHeader subtitle={['Carte de Santé', 'IDENTITAIRE (CSI)']} green={false} logoB64={logoB64} />
    <div style={{ display: 'flex', gap: 8, padding: '8px 10px', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
      {/* Photo */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: PHOTO_W, height: PHOTO_H, borderRadius: 7, overflow: 'hidden',
          border: `2px solid ${TEAL}`, background: '#f1f5f9', flexShrink: 0,
        }}>
          {photoPreview
            ? <img src={photoPreview} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <Camera size={18} color="#94a3b8" />
                <span style={{ fontSize: 7, color: '#94a3b8', fontWeight: 600 }}>Photo</span>
              </div>
            )
          }
        </div>
      </div>

      {/* Infos patient */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, overflow: 'hidden' }}>
        <div>
          <p style={{ fontSize: 6.5, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px' }}>Nom</p>
          <p style={{ fontSize: 12, fontWeight: 900, color: '#1e293b', margin: 0, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {patient.nom} {patient.prenom}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 6.5, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px' }}>Code Patient (CPU)</p>
          <p style={{ fontSize: 9.5, fontWeight: 900, color: BLUE_DARK, fontFamily: 'monospace', margin: 0 }}>{patient.cpu}</p>
        </div>
        {patient.date_naissance && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarDays size={9} color={BLUE_MID} />
            <span style={{ fontSize: 8, color: '#64748b' }}>Né(e) le</span>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: '#334155' }}>
              {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
        {patient.telephone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Phone size={9} color={BLUE_MID} />
            <span style={{ fontSize: 8.5, fontWeight: 600, color: '#334155' }}>{patient.telephone}</span>
          </div>
        )}
        {patient.contact_urgence_nom && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={9} color="#ef4444" />
            <span style={{ fontSize: 7.5, color: '#ef4444', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {patient.contact_urgence_nom} — {patient.contact_urgence_telephone}
            </span>
          </div>
        )}
      </div>

      <QRBlock url={qrCodeUrl} label={`Scanner\nidentification`} labelBottom={`CPU encodé\nréseau HMC`} size={50} />
    </div>
    <CardFooter green={false} />
  </CardShell>
))

// ─── VersoCard ───────────────────────────────────────────────
const VersoCard = React.memo(({ patient, qrCodeUrl, logoB64, captureRef }: {
  patient: PatientCarteData
  qrCodeUrl: string
  logoB64: string | null
  captureRef: React.RefObject<HTMLDivElement | null> | null
}) => (
  <CardShell green captureRef={captureRef}>
    <CardHeader subtitle={['Informations', 'COMPLÉMENTAIRES']} green logoB64={logoB64} />
    <div style={{ display: 'flex', gap: 8, padding: '8px 10px', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
      <div style={{
        flex: 1, borderRadius: 9, padding: '8px 10px',
        border: `1.5px solid ${TEAL}`, background: 'rgba(72,201,176,0.08)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <AlertCircle size={11} color={GREEN_DARK} />
          <p style={{ fontSize: 7.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: GREEN_DARK, margin: 0 }}>
            Contact d'urgence
          </p>
        </div>
        <div style={{ borderTop: `1px solid rgba(72,201,176,0.3)`, paddingTop: 6 }}>
          {patient.contact_urgence_nom ? (
            <>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#1a3b2b', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {patient.contact_urgence_nom}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={9} color={GREEN_MID} />
                <p style={{ fontSize: 10, fontWeight: 700, color: '#2d5a40', margin: 0 }}>
                  {patient.contact_urgence_telephone}
                </p>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 9.5, color: '#5aab80', fontStyle: 'italic', margin: 0 }}>Non renseigné</p>
          )}
        </div>
        {patient.groupe_sanguin && patient.groupe_sanguin !== 'Inconnu' && (
          <div style={{
            marginTop: 7, padding: '3px 8px', borderRadius: 6,
            background: `linear-gradient(90deg,${GREEN_DARK},${GREEN_MID})`,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>Groupe</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{patient.groupe_sanguin}</span>
          </div>
        )}
        {patient.allergies_texte && (
          <div style={{ marginTop: 6, padding: '3px 6px', borderRadius: 5, background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p style={{ fontSize: 7, color: '#b91c1c', fontWeight: 700, margin: 0 }}>⚠ Allergies : {patient.allergies_texte}</p>
          </div>
        )}
      </div>
      <QRBlock url={qrCodeUrl} label={`QR — Infos\nvitales`} size={50} />
    </div>
    <CardFooter green />
  </CardShell>
))

// ═════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : CarteAccueil
// ═════════════════════════════════════════════════════════════
interface Props {
  patient: PatientCarteData
  ticket: number
  onTermine: () => void       // retour à la file d'attente
}

export default function CarteAccueil({ patient, ticket, onTermine }: Props) {
  const [verseau,        setVerseau]        = useState(false)
  const [qrCodeUrl,      setQrCodeUrl]      = useState('')
  const [logoB64,        setLogoB64]        = useState<string | null>(null)
  const [generatingCard, setGeneratingCard] = useState(false)
  const [msgOk,          setMsgOk]          = useState<string | null>(null)
  const [msgErr,         setMsgErr]         = useState<string | null>(null)
  const [consentement,   setConsentement]   = useState(false)

  const rectoCapRef = useRef<HTMLDivElement>(null)
  const versoCapRef = useRef<HTMLDivElement>(null)

  const toBase64 = useCallback((url: string): Promise<string> =>
    fetch(url)
      .then(r => r.blob())
      .then(blob => new Promise((res, rej) => {
        const rd = new FileReader()
        rd.onloadend = () => res(rd.result as string)
        rd.onerror   = rej
        rd.readAsDataURL(blob)
      }))
  , [])

  useEffect(() => {
    toBase64(logoSrc).then(setLogoB64).catch(() => {})

    // Générer le QR code avec données C0
    const payload = JSON.stringify({
      cpu:             patient.cpu,
      nom:             patient.nom,
      prenom:          patient.prenom,
      date_naissance:  patient.date_naissance ?? null,
      telephone:       patient.telephone ?? null,
      groupe_sanguin:  patient.groupe_sanguin ?? null,
      allergies:       patient.allergies_texte ?? null,
      contact_urgence: {
        nom:       patient.contact_urgence_nom       ?? null,
        telephone: patient.contact_urgence_telephone ?? null,
      },
    })

    QRCode.toDataURL(payload, {
      width: 200, margin: 1,
      color: { dark: BLUE_DARK, light: '#ffffff' },
    }).then(setQrCodeUrl).catch(() => {})
  }, [patient])

  const handleDownload = async () => {
    if (!consentement) {
      setMsgErr('Veuillez accepter les conditions avant de télécharger')
      return
    }
    if (!rectoCapRef.current || !versoCapRef.current) {
      setMsgErr('Éléments de carte introuvables')
      return
    }
    setGeneratingCard(true)
    setMsgErr(null)
    try {
      const opts = { quality: 1, pixelRatio: 4, cacheBust: true, skipFonts: true }
      const [imgR, imgV] = await Promise.all([
        toPng(rectoCapRef.current, opts),
        toPng(versoCapRef.current, opts),
      ])
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CW, CH] })
      doc.addImage(imgR, 'PNG', 0, 0, CW, CH, undefined, 'SLOW')
      doc.addPage([CW, CH], 'landscape')
      doc.addImage(imgV, 'PNG', 0, 0, CW, CH, undefined, 'SLOW')
      doc.save(`carte_CSI_${patient.cpu}.pdf`)
      setMsgOk('Carte téléchargée avec succès !')
    } catch (err: unknown) {
      const e = err as Error
      setMsgErr(`Erreur PDF : ${e.message ?? 'inconnue'}`)
    } finally {
      setGeneratingCard(false)
    }
  }

  const cardProps = { patient, photoPreview: patient.photoPreview ?? null, qrCodeUrl, logoB64 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Conteneurs hors-écran pour capture PDF */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
        <RectoCard {...cardProps} captureRef={rectoCapRef} />
        <VersoCard {...cardProps} captureRef={versoCapRef} />
      </div>

      {/* En-tête succès */}
      <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#E1F5EE',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
        }}>
          <ShieldCheck size={28} color="#1D9E75" />
        </div>
        <p style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', margin: '0 0 4px' }}>Dossier créé avec succès</p>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          CPU : <strong style={{ fontFamily: 'monospace', color: BLUE_DARK }}>{patient.cpu}</strong>
          {ticket > 0 && <> · Ticket N° <strong>{ticket}</strong></>}
        </p>
      </div>

      {/* Toggle recto/verso */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => setVerseau(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
            borderRadius: 99, cursor: 'pointer', border: 'none', fontSize: 12, fontWeight: 700, color: '#fff',
            background: verseau
              ? `linear-gradient(90deg,${GREEN_DARK},${GREEN_MID})`
              : `linear-gradient(90deg,${BLUE_MID},${TEAL})`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          <FlipHorizontal size={13} />
          {verseau ? '← Voir le recto' : 'Voir le verso →'}
        </button>
      </div>

      {/* Aperçu carte */}
      <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        {!verseau
          ? <RectoCard {...cardProps} captureRef={null} />
          : <VersoCard {...cardProps} captureRef={null} />
        }
      </div>

      {/* Consentement */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '14px 16px' }}>
        <label htmlFor="consent-accueil" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input
            id="consent-accueil"
            type="checkbox"
            checked={consentement}
            onChange={e => setConsentement(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, cursor: 'pointer', accentColor: '#16a34a' }}
          />
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#92400e', margin: '0 0 4px' }}>
              📋 Consentement — données médicales
            </p>
            <p style={{ fontSize: 11, color: '#78350f', margin: '0 0 6px', lineHeight: 1.5 }}>
              Le patient autorise Health Mboa Connect à encoder dans le QR code : groupe sanguin, contact d'urgence et CPU.
            </p>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px' }}>
              <p style={{ fontSize: 11, color: '#b91c1c', fontWeight: 700, margin: '0 0 3px' }}>⚠️ Le patient reconnaît que :</p>
              <p style={{ fontSize: 11, color: '#991b1b', margin: 0, lineHeight: 1.5 }}>
                Ces informations sont lisibles par simple scan. Il est <strong>seul responsable</strong> en cas de perte ou vol de cette carte.
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Messages */}
      {msgOk && (
        <p style={{ textAlign: 'center', fontSize: 13, color: '#16a34a', background: '#f0fdf4', padding: '8px 12px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
          ✅ {msgOk}
        </p>
      )}
      {msgErr && (
        <p style={{ textAlign: 'center', fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 10, border: '1px solid #fecaca' }}>
          ⚠️ {msgErr}
        </p>
      )}

      {/* Bouton télécharger */}
      <button
        onClick={handleDownload}
        disabled={!consentement || generatingCard}
        style={{
          width: '100%', padding: '13px', borderRadius: 14, cursor: consentement ? 'pointer' : 'not-allowed',
          border: 'none',
          background: consentement ? `linear-gradient(90deg,${GREEN_DARK},${GREEN_MID})` : '#e2e8f0',
          color: consentement ? '#fff' : '#94a3b8',
          fontSize: 14, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: consentement ? '0 4px 18px rgba(13,107,59,0.3)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {generatingCard
          ? <>
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Génération en cours…
            </>
          : <><Download size={16} /> Télécharger la carte CSI — PDF recto/verso</>
        }
      </button>

      {!consentement && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#854d0e', background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 12px' }}>
          Cochez le consentement pour activer le téléchargement
        </p>
      )}

      {/* Bouton retour file */}
      <button
        onClick={onTermine}
        style={{
          width: '100%', padding: '11px', borderRadius: 12, cursor: 'pointer',
          border: '1.5px solid #e2e8f0', background: '#f8fafc',
          color: '#475569', fontSize: 13, fontWeight: 600,
        }}
      >
        Retour à la file d'attente
      </button>
    </div>
  )
}
import React, { useEffect, useState, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'
import {
  CalendarDays, Phone, Camera, FlipHorizontal,
  X, Check, ZoomIn, ZoomOut, Download, Pencil, Plus,
  Globe, Mail,
} from 'lucide-react'

// ─── IMPORTS À ADAPTER SELON VOTRE PROJET ──────────────────────────────────
import logoSrc from '@/assets/logo.png' // Chemin vers votre logo HMC
// import type { usePatientData } from '../hooks/usePatientData'
// import { uploadPhoto } from '../api/patientApi'

/* ── MODE D'INTÉGRATION (Choix entre données fictives et réelles) ────────── */
// Pour utiliser vos données réelles, décommentez la ligne ci-dessus et celle-ci :
// type Props = Pick<ReturnType<typeof usePatientData>, 'data' | 'loadingTab' | 'loadCarte' | 'patient' | 'handleUpdateProfil' | 'handleUploadPhoto' | 'savingProfil' | 'uploadingPhoto'>

// ─────────────────────────────────────────────────────────────────────────────

/* ── Dimensions carte CNI standard (ID-1) (mm) ── */
const CW = 85.6
const CH = 53.98

/* ── Dimensions d'affichage (px) ── */
const CARD_W = 480
const CARD_H = Math.round(CARD_W * CH / CW)

/* ── Palette HMC ── */
const GREEN_DARK  = '#006b44' // Vert profond de la maquette
const GREEN_MID   = '#193828' // Vert moyen (bandes, puces)
const GREEN_LIGHT = '#213e38' // Vert clair (vagues, bordures)
const BLUE_DECOR  = '#0a8aa0' // Bleu décoratif (vagues)
const TEXT_GRAY   = '#718096' // Gris des labels plus doux
const TEXT_DARK   = '#1a202c' // Noir des valeurs

interface CardProps {
  captureRef: React.RefObject<HTMLDivElement | null> | null
  patient: any | null
  photoPreview: string | null
  qrCodeUrl: string
  logoB64: string | null
  showControls?: boolean
  onPhotoClick?: () => void
  uploadingPhoto?: boolean
}

// ─── Caducée SVG (Vrai motif médical ailé) ─────────────────────────────
const Caducee = ({ size = 80, opacity = 0.08 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
    <g fill={GREEN_MID}>
      {/* Bâton central et sphère supérieure */}
      <rect x="30" y="8" width="4" height="48" rx="2" />
      <circle cx="32" cy="4" r="4" />
      
      {/* Aile Gauche (plumes) */}
      <path d="M30,15 c-8,-5 -20,-3 -26,3 c6,2 12,0 16,3 c-4,2 -8,4 -10,8 c5,-1 10,-3 14,0 c-2,3 -4,6 -5,9 c4,-4 8,-7 11,-10 z"/>
      
      {/* Aile Droite (plumes) */}
      <path d="M34,15 c8,-5 20,-3 26,3 c-6,2 -12,0 -16,3 c4,2 8,4 10,8 c-5,-1 -10,-3 -14,0 c2,3 4,6 5,9 c-4,-4 -8,-7 -11,-10 z"/>
    </g>
    
    {/* Serpents entrelacés */}
    <g fill="none" stroke={GREEN_MID} strokeWidth="3.5" strokeLinecap="round">
      <path d="M25,22 c-8,8 2,16 7,18 c6,2.5 10,8 10,14 c0,6 -6,8 -10,6" />
      <path d="M39,22 c8,8 -2,16 -7,18 c-6,2.5 -10,8 -10,14 c0,6 6,8 10,6" />
    </g>
  </svg>
)

// ─── Vagues SVG spécifiques au Recto (Pour correspondre à la maquette) ────────────
const VaguesRecto = () => (
  <svg viewBox="0 0 480 303" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    {/* Vague verte foncée principale */}
    <path d="M0,0 L480,0 L480,55 Q240,110 0,65 Z" fill={GREEN_DARK} />
    {/* Légère vague de transition en dessous */}
    <path d="M0,0 L480,0 L480,60 Q240,120 0,75 Z" fill={GREEN_MID} opacity="0.4" />
    {/* Vagues de fond côté gauche pour le dynamisme */}
    <path d="M0,0 L180,0 Q130,55 0,90 Z" fill={GREEN_LIGHT} opacity="0.6" />
    <path d="M0,0 L100,0 Q60,70 0,110 Z" fill={BLUE_DECOR} opacity="0.4" />
    
    {/* Fines lignes diagonales en filigrane (bas-droite) */}
    <defs>
      <pattern id="diagonalHatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="12" stroke={GREEN_MID} strokeWidth="1" opacity="0.05" />
      </pattern>
    </defs>
    <rect x="250" y="100" width="230" height="203" fill="url(#diagonalHatch)" />
  </svg>
)

// ─── Vagues SVG pour le Verso (Restées inchangées) ─────────────────────────────
const Vagues = () => (
  <svg viewBox="0 0 480 90" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 90, pointerEvents: 'none' }} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,0 L0,55 Q90,75 180,40 Q270,5 380,40 Q440,55 480,30 L480,0 Z" fill={GREEN_DARK} />
    <path d="M0,0 L0,40 Q80,60 170,25 Q260,-5 360,25 Q420,40 480,15 L480,0 Z" fill={GREEN_MID} opacity="0.85" />
    <path d="M0,0 L0,25 Q70,40 150,15 Q230,-5 330,15 Q400,28 480,5 L480,0 Z" fill={GREEN_LIGHT} opacity="0.7" />
    <path d="M0,0 L0,55 Q40,75 80,55 Q60,40 30,30 Q15,25 0,30 Z" fill={BLUE_DECOR} opacity="0.55" />
  </svg>
)

const HexagoneDecor = () => (
  <svg viewBox="0 0 200 100" style={{ position: 'absolute', top: 70, right: 60, width: 160, height: 80, opacity: 0.12, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
    {[[40,20],[80,40],[120,20],[160,40],[60,60],[100,80],[140,60]].map(([x, y], i) => (
      <polygon key={i} points={`${x},${y-8} ${x+7},${y-4} ${x+7},${y+4} ${x},${y+8} ${x-7},${y+4} ${x-7},${y-4}`} fill="none" stroke={GREEN_MID} strokeWidth="0.8" />
    ))}
  </svg>
)

// ─── Footer vert Recto (Refondu selon la maquette) ──────────────────────────────────────────────
const FooterRecto = () => (
  <div style={{
    background: GREEN_DARK,
    height: 36, // Hauteur fixe pour le footer
    padding: '0 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0, position: 'relative', zIndex: 3,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Phone size={9} color={GREEN_DARK} />
      </div>
      <span style={{ color: '#fff', fontSize: 8.5, fontWeight: 500 }}>+237 6XX XXX XXX</span>
    </div>

    <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />

    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Globe size={9} color={GREEN_DARK} />
      </div>
      <span style={{ color: '#fff', fontSize: 8.5, fontWeight: 500 }}>www.hmc.cm</span>
    </div>

    <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />

    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Mail size={9} color={GREEN_DARK} />
      </div>
      <span style={{ color: '#fff', fontSize: 8.5, fontWeight: 500 }}>contact@hmc.cm</span>
    </div>

    <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />

    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 7, fontWeight: 400, margin: 0, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.3 }}>
      CETTE CARTE NE CONTIENT<br />AUCUNE DONNÉE MÉDICALE SENSIBLE
    </p>
  </div>
)

const FooterVerso = ({ logoB64 }: { logoB64: string | null }) => (
  <div style={{
    background: GREEN_DARK, padding: '8px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0, position: 'relative', zIndex: 3,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src={logoB64 || logoSrc} alt="HMC" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', background: '#fff', padding: 2 }} />
      <div>
        <p style={{ color: '#fff', fontWeight: 800, fontSize: 11, margin: 0 }}>Health Mboa Connect</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 7.5, margin: 0 }}>Votre santé, notre engagement</p>
      </div>
    </div>
    <p style={{ color: '#fff', fontSize: 9, fontWeight: 700, margin: 0, textAlign: 'right', fontStyle: 'italic' }}>
      Prenons soin de vous,<br />partout, ensemble.
    </p>
  </div>
)

// ─── RectoCard (Modifié pour s'aligner sur la maquette fournie) ───────────────────
const RectoCard = React.memo(({ captureRef, patient, photoPreview, qrCodeUrl, logoB64, showControls, onPhotoClick, uploadingPhoto }: CardProps) => (
  <div ref={captureRef as React.RefObject<HTMLDivElement>} style={{
    width: CARD_W, height: CARD_H, borderRadius: 12, overflow: 'hidden',
    position: 'relative', flexShrink: 0,
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    background: '#f8fafc', // Fond légèrement cassé comme sur l'image
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{position: 'absolute', inset: 0, background: '#ffffff', zIndex: 0}} />
    
    <VaguesRecto />

    {/* Motif Caducée sur la partie blanche (ajusté pour ne pas toucher le footer) */}
    <div style={{ position: 'absolute', bottom: 45, right: 20, zIndex: 1, pointerEvents: 'none' }}>
      <Caducee size={150} opacity={0.06} />
    </div>

    {/* Header logo + titre */}
    <div style={{ position: 'relative', zIndex: 2, padding: '16px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: 75, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={logoB64 || logoSrc} alt="HMC" style={{ width: 44, height: 44, objectFit: 'contain' }} />
        <div style={{ borderLeft: '1.5px solid rgba(255,255,255,0.5)', paddingLeft: 12 }}>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 13, margin: 0, lineHeight: 1.1 }}>Health Mboa Connect</p>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 9, margin: 0, marginTop: 2 }}>Votre santé, notre engagement</p>
        </div>
      </div>
      <div style={{ textAlign: 'right', marginTop: 4 }}>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>CARTE DE SANTÉ</p>
        <p style={{ color: '#fff', fontSize: 14, fontWeight: 900, margin: '2px 0 0', letterSpacing: '0.02em' }}>IDENTITAIRE (CSI)</p>
      </div>
    </div>

    {/* Corps Central */}
    <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 20 }}>
      
      {/* Photo avec bordure verte */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <div
          onClick={() => showControls && !uploadingPhoto && onPhotoClick?.()}
          style={{
            width: 95, height: 125, borderRadius: 10, overflow: 'hidden',
            cursor: showControls ? 'pointer' : 'default',
            border: `2px solid ${GREEN_MID}`,
            background: '#f8fafc', position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {photoPreview
            ? <img src={photoPreview} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <>
                <Camera size={22} color={GREEN_MID} />
                <span style={{ fontSize: 10, color: GREEN_MID, fontWeight: 600, marginTop: 6 }}>Photo</span>
              </>
            )
          }
          {showControls && uploadingPhoto && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
        </div>
        {showControls && photoPreview && (
          <button className="hide-on-print" onClick={() => onPhotoClick?.()} style={{ position:'absolute', bottom:-18, background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: GREEN_MID, fontWeight: 700, width: '100%', textAlign: 'center' }}>
            ✏️ Recadrer
          </button>
        )}
      </div>

      {/* Informations Patient */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 8 }}>
        <div>
          <p style={{ fontSize: 9, color: TEXT_GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>NOM</p>
          <p style={{ fontSize: 18, fontWeight: 900, color: GREEN_DARK, margin: 0, lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {patient?.nom} {patient?.prenom}
          </p>
        </div>
        
        <div>
          <p style={{ fontSize: 9, color: TEXT_GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>CODE PATIENT (CPU)</p>
          <p style={{ fontSize: 12, fontWeight: 800, color: GREEN_DARK, margin: 0, letterSpacing: '0.03em' }}>{patient?.cpu}</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={13} color={GREEN_MID} />
            <span style={{ fontSize: 10, fontWeight: 700, color: TEXT_DARK }}>
              Né(e) le {patient?.date_naissance ? new Date(patient.date_naissance).toLocaleDateString('fr-FR') : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={13} color={GREEN_MID} />
            <span style={{ fontSize: 10, fontWeight: 700, color: TEXT_DARK }}>{patient?.telephone ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* QR Code à droite */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 110 }}>
        <p style={{ fontSize: 9, color: GREEN_DARK, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'center', lineHeight: 1.2 }}>SCANNER<br/>IDENTIFICATION</p>
        <div style={{ background: '#fff', border: `1px solid #e2e8f0`, borderRadius: 8, padding: 5, marginTop: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          {qrCodeUrl
            ? <img src={qrCodeUrl} alt="QR" style={{ width: 75, height: 75, display: 'block' }} />
            : <div style={{ width: 75, height: 75, background: '#f1f5f9', borderRadius: 4 }} />
          }
        </div>
        <p style={{ fontSize: 8.5, color: GREEN_DARK, fontWeight: 600, margin: '6px 0 0', textAlign: 'center', lineHeight: 1.2 }}>CPU encodé<br/><span style={{fontWeight: 400}}>réseau HMC</span></p>
      </div>
    </div>

    <FooterRecto />
  </div>
))

// ─── VersoCard (Inchangé) ────────────────────────────────────────────────
const VersoCard = React.memo(({ captureRef, qrCodeUrl, logoB64 }: CardProps) => (
  <div ref={captureRef as React.RefObject<HTMLDivElement>} style={{
    width: CARD_W, height: CARD_H, borderRadius: 14, overflow: 'hidden',
    position: 'relative', flexShrink: 0,
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    background: '#ffffff',
    display: 'flex', flexDirection: 'column',
  }}>
    <Vagues />
    <div style={{ position: 'absolute', top: 60, right: 30, pointerEvents: 'none' }}>
      <Caducee size={90} opacity={0.07} />
    </div>
    <HexagoneDecor />
    <div style={{ height: 70, flexShrink: 0 }} />

    <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', gap: 0, padding: '8px 20px 12px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN_MID, flexShrink: 0 }} />
          <p style={{ fontSize: 9, fontWeight: 800, color: GREEN_DARK, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>UTILISATION DE LA CARTE</p>
          <div style={{ flex: 1, height: 1, background: GREEN_LIGHT, opacity: 0.5 }} />
        </div>
        <div style={{ paddingLeft: 12, borderLeft: `1.5px solid ${GREEN_LIGHT}` }}>
          <p style={{ fontSize: 8, color: TEXT_DARK, margin: 0, lineHeight: 1.6 }}>Présenter à l'accueil.<br/>QR scanné par le soignant.<br/>Valable à vie sur le réseau.</p>
        </div>
      </div>
      <div style={{ flex: 1, padding: '0 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN_MID, flexShrink: 0 }} />
          <p style={{ fontSize: 9, fontWeight: 800, color: GREEN_DARK, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>AVANTAGES</p>
          <div style={{ flex: 1, height: 1, background: GREEN_LIGHT, opacity: 0.5 }} />
        </div>
        <div style={{ paddingLeft: 12, borderLeft: `1.5px solid ${GREEN_LIGHT}` }}>
          <p style={{ fontSize: 8, color: TEXT_DARK, margin: 0, lineHeight: 1.6 }}>Accès rapide aux soins.<br/>Dossier sécurisé.<br/>Suivi personnalisé.</p>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN_MID, flexShrink: 0 }} />
          <p style={{ fontSize: 9, fontWeight: 800, color: GREEN_DARK, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>RÉSEAU PARTENAIRE</p>
          <div style={{ flex: 1, height: 1, background: GREEN_LIGHT, opacity: 0.5 }} />
        </div>
        <div style={{ paddingLeft: 12, borderLeft: `1.5px solid ${GREEN_LIGHT}` }}>
          <p style={{ fontSize: 8, color: TEXT_DARK, margin: 0, lineHeight: 1.6 }}>Hôpitaux publics.<br/>Cliniques agréées.<br/>10 villes couvertes.</p>
        </div>
      </div>
    </div>

    <div style={{
      position: 'relative', zIndex: 2, background: '#e8f8f0', border: `1px solid ${GREEN_LIGHT}40`,
      margin: '0 16px 6px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 0, overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ flex: 1, padding: '8px 14px' }}>
        <p style={{ fontSize: 8.5, fontWeight: 800, color: GREEN_DARK, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>EN CAS D'URGENCE</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: GREEN_MID, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(13,107,59,0.3)' }}>
            <Phone size={13} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 8, color: GREEN_DARK, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>APPELEZ LE</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: GREEN_DARK, margin: 0, lineHeight: 1 }}>1515</p>
            <p style={{ fontSize: 7, color: '#5a7a6a', margin: 0 }}>Disponible 24h/24 - 7j/7</p>
          </div>
        </div>
      </div>
      <div style={{ width: 1, height: 60, background: GREEN_LIGHT, opacity: 0.5 }} />
      <div style={{ flex: 1, padding: '8px 14px' }}>
        <p style={{ fontSize: 8.5, fontWeight: 800, color: GREEN_DARK, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>CONDITIONS D'UTILISATION</p>
        <p style={{ fontSize: 8, color: TEXT_DARK, margin: 0, lineHeight: 1.5 }}>Carte strictement personnelle et non transférable. En cas de perte, signalez immédiatement.</p>
      </div>
      <div style={{ width: 1, height: 60, background: GREEN_LIGHT, opacity: 0.5 }} />
      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <p style={{ fontSize: 8.5, fontWeight: 800, color: GREEN_DARK, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, textAlign: 'center' }}>CODE DE VÉRIFICATION</p>
        <div style={{ background: '#fff', border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 6, padding: 3 }}>
          {qrCodeUrl ? <img src={qrCodeUrl} alt="QR" style={{ width: 50, height: 50, display: 'block' }} /> : <div style={{ width: 50, height: 50, background: '#f1f5f9', borderRadius: 3 }} />}
        </div>
      </div>
    </div>

    <FooterVerso logoB64={logoB64} />
  </div>
))

// ─── Field ────────────────────────────────────────────────────
const Field = ({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string; placeholder?: string
}) => (
  <div>
    <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', margin: '0 0 5px', fontWeight: 600 }}>{label}</p>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, color: '#1a202c', outline: 'none', boxSizing: 'border-box', background: '#fafafa' }}
      onFocus={e => (e.target.style.borderColor = GREEN_LIGHT)}
      onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
    />
  </div>
)

// ═════════════════════════════════════════════
// COMPOSANT PRINCIPAL (CarteCSI)
// ═════════════════════════════════════════════
export const CarteCSI = () => {

  // ─── DONNÉES FICTIVES (pour le rendu immédiat) ────────────
  const fakePatientData = {
    nom: 'TSAMO',
    prenom: 'AUREL',
    cpu: 'HMC-LAQ-2026-000006',
    date_naissance: '2003-01-20',
    telephone: '+237659303856',
    groupe_sanguin: 'O+',
    photo_url: null,
    contact_urgence_nom: 'KENGNE MARTIAL',
    contact_urgence_telephone: '677777777',
  }

  const [patient, setPatient] = useState<any | null>(fakePatientData)
  const loadingTab = false
  const loadCarte = async () => {}
  const handleUpdateProfil = async (nom: string, tel: string) => { setPatient((p: any) => ({ ...p, contact_urgence_nom: nom, contact_urgence_telephone: tel })); return true }
  const uploadingPhoto: boolean = false

  const [verseau,        setVerseau]        = useState(false)
  const [qrCodeUrl,      setQrCodeUrl]      = useState('')
  const [photoPreview,   setPhotoPreview]   = useState<string | null>(null)
  const [logoB64,        setLogoB64]        = useState<string | null>(null)
  const [editing,        setEditing]        = useState(false)
  const [consentement,   setConsentement]   = useState(false)
  const [, setUploadingPhotoLocal] = useState(false)
  const [contactUrgence, setContactUrgence] = useState({ nom: patient?.contact_urgence_nom ?? '', telephone: patient?.contact_urgence_telephone ?? '' })
  const [generatingCard, setGeneratingCard] = useState(false)
  const [msgOk,          setMsgOk]          = useState<string | null>(null)
  const [msgErr,         setMsgErr]         = useState<string | null>(null)

  const [showCropper, setShowCropper] = useState(false)
  const [cropperSrc,  setCropperSrc]  = useState('')
  const [cropperFile, setCropperFile] = useState<File | null>(null)
  const [cropZoom,    setCropZoom]    = useState(1)
  const [cropOffset,  setCropOffset]  = useState({ x: 0, y: 0 })
  const [dragState,   setDragState]   = useState<{ startX: number; startY: number; ox: number; oy: number } | null>(null)

  const fileInputRef  = useRef<HTMLInputElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  const cropImgEl     = useRef(new Image())
  const rectoCapRef   = useRef<HTMLDivElement>(null)
  const versoCapRef   = useRef<HTMLDivElement>(null)

  const CANVAS_W = 240
  const CANVAS_H = Math.round(CANVAS_W * 125 / 95) // Adapté au nouveau ratio de la photo

  const toBase64 = useCallback((url: string): Promise<string> =>
    fetch(url).then(r => r.blob()).then(blob => new Promise((res, rej) => {
      const rd = new FileReader()
      rd.onloadend = () => res(rd.result as string)
      rd.onerror   = rej
      rd.readAsDataURL(blob)
    }))
  , [])

  useEffect(() => {
    loadCarte()
    toBase64(logoSrc).then(b64 => setLogoB64(b64)).catch(() => {})
  }, [loadCarte, toBase64])

  useEffect(() => {
    if (!patient) return
    setContactUrgence({ nom: patient.contact_urgence_nom ?? '', telephone: patient.contact_urgence_telephone ?? '' })
    if (patient.photo_url) {
      const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'
      const fullUrl = patient.photo_url.startsWith('http') ? patient.photo_url : `${BASE_URL}${patient.photo_url}`
      toBase64(fullUrl).then(b64 => setPhotoPreview(b64)).catch(() => setPhotoPreview(fullUrl))
    }
    regenererQR(patient)
  }, [patient, toBase64])

  const regenererQR = async (p: NonNullable<typeof patient>) => {
    const url = await QRCode.toDataURL(
      JSON.stringify({
        cpu: p.cpu, nom: p.nom, prenom: p.prenom,
        date_naissance: p.date_naissance, telephone: p.telephone,
        groupe_sanguin: p.groupe_sanguin,
        contact_urgence: { nom: p.contact_urgence_nom, telephone: p.contact_urgence_telephone },
      }),
     { width: 240, margin: 1, color: { dark: '#000000', light: '#ffffff' } }
    )
    setQrCodeUrl(url)
  }

  useEffect(() => {
    if (!showCropper || !cropperSrc) return
    cropImgEl.current = new Image()
    cropImgEl.current.onload = () => renderCropCanvas()
    cropImgEl.current.src = cropperSrc
  }, [showCropper, cropperSrc])

  useEffect(() => { if (showCropper) renderCropCanvas() }, [cropZoom, cropOffset, showCropper])

  const renderCropCanvas = () => {
    const canvas = cropCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const img = cropImgEl.current
    if (!img.complete || !img.naturalWidth) return
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    const base = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight) * cropZoom
    const dw = img.naturalWidth * base, dh = img.naturalHeight * base
    ctx.drawImage(img, (CANVAS_W - dw) / 2 + cropOffset.x, (CANVAS_H - dh) / 2 + cropOffset.y, dw, dh)
  }

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragState({ startX: cx, startY: cy, ox: cropOffset.x, oy: cropOffset.y })
  }
  const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragState) return
    e.preventDefault()
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY
    setCropOffset({ x: dragState.ox + cx - dragState.startX, y: dragState.oy + cy - dragState.startY })
  }, [dragState])
  const onPointerUp = () => setDragState(null)

  const handleCropConfirm = async () => {
    const cropped = cropCanvasRef.current!.toDataURL('image/jpeg', 0.92)
    setPhotoPreview(cropped)
    setShowCropper(false)
    setCropZoom(1); setCropOffset({ x: 0, y: 0 })
    if (!cropperFile) return
    setUploadingPhotoLocal(true)
    try {
      await (await fetch(cropped)).blob()
      const res = { photo_url: '/images/photo.jpg' } 
      if (res.photo_url) setMsgOk('Photo enregistrée')
    } catch { setMsgErr('Photo non sauvegardée côté serveur') }
    finally { setUploadingPhotoLocal(false) }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setMsgErr('Photo trop lourde (max 5 Mo)'); return }
    setCropperFile(file)
    const reader = new FileReader()
    reader.onloadend = () => { setCropperSrc(reader.result as string); setCropZoom(1); setCropOffset({ x: 0, y: 0 }); setShowCropper(true) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSaveContact = async () => {
    if (!contactUrgence.nom || !contactUrgence.telephone) { setMsgErr('Remplissez les deux champs'); return }
    setMsgErr(null)
    const ok = await handleUpdateProfil(contactUrgence.nom, contactUrgence.telephone)
    if (ok) {
      setMsgOk("Contact d'urgence enregistré"); setEditing(false)
      if (patient) regenererQR({ ...patient, contact_urgence_nom: contactUrgence.nom, contact_urgence_telephone: contactUrgence.telephone })
    } else { setMsgErr('Erreur lors de la sauvegarde') }
  }

  const handleDownloadCard = async () => {
    if (!consentement) { setMsgErr('Acceptez les conditions pour télécharger'); return }
    if (!rectoCapRef.current || !versoCapRef.current) { setMsgErr('Éléments introuvables'); return }
    setGeneratingCard(true)
    try {
      const btns = document.querySelectorAll<HTMLElement>('.hide-on-print')
      btns.forEach(b => (b.style.visibility = 'hidden'))
      await new Promise(r => setTimeout(r, 350))
      const opts = { quality: 1, pixelRatio: 4, cacheBust: true, skipFonts: true }
      const [imgR, imgV] = await Promise.all([toPng(rectoCapRef.current, opts), toPng(versoCapRef.current, opts)])
      btns.forEach(b => (b.style.visibility = ''))
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CW, CH] })
      doc.addImage(imgR, 'PNG', 0, 0, CW, CH, undefined, 'SLOW')
      doc.addPage([CW, CH], 'landscape')
      doc.addImage(imgV, 'PNG', 0, 0, CW, CH, undefined, 'SLOW')
      doc.save(`carte_CSI_${patient?.cpu ?? 'HMC'}.pdf`)
      setMsgOk('Carte PDF générée !')
    } catch (err: unknown) {
      const e = err as Error
      setMsgErr(`Erreur PDF : ${e.message ?? 'inconnue'}`)
    } finally { setGeneratingCard(false) }
  }

  const profilComplet = !!(photoPreview && patient?.contact_urgence_nom)
  const onPhotoClick  = () => fileInputRef.current?.click()
  const cardProps     = { patient, photoPreview, qrCodeUrl, logoB64 }

  if (loadingTab) return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ width: 36, height: 36, margin: '0 auto 12px', border: `3px solid ${GREEN_LIGHT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
        <RectoCard {...cardProps} captureRef={rectoCapRef} showControls={false} uploadingPhoto={false} />
        <VersoCard {...cardProps} captureRef={versoCapRef} />
      </div>

      {showCropper && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 340, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(90deg,${GREEN_DARK},${GREEN_MID})` }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>📐 Recadrer la photo</p>
              <button onClick={() => setShowCropper(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 12, color: TEXT_GRAY, textAlign: 'center', margin: 0 }}>Glissez pour repositionner · Ajustez le zoom</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <canvas ref={cropCanvasRef} width={CANVAS_W} height={CANVAS_H}
                  style={{ width: Math.min(CANVAS_W, 260), height: Math.min(CANVAS_H, 327), borderRadius: 12, border: `2.5px solid ${GREEN_LIGHT}`, cursor: dragState ? 'grabbing' : 'grab', display: 'block' }}
                  onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
                  onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: TEXT_GRAY }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ZoomOut size={13} /> Zoom</span>
                  <span style={{ fontWeight: 700, color: GREEN_MID }}>{Math.round(cropZoom * 100)}%</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ZoomIn size={13} /> Max</span>
                </div>
                <input type="range" min="0.8" max="3" step="0.05" value={cropZoom}
                  onChange={e => { setCropZoom(parseFloat(e.target.value)); setCropOffset({ x: 0, y: 0 }) }}
                  style={{ width: '100%', accentColor: GREEN_LIGHT, cursor: 'pointer' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowCropper(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f8fafc', color: TEXT_GRAY, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <X size={15} /> Annuler
                </button>
                <button onClick={handleCropConfirm} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: 'none', background: `linear-gradient(90deg,${GREEN_DARK},${GREEN_MID})`, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Check size={15} /> Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setVerseau(!verseau)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, cursor: 'pointer', border: 'none', fontSize: 12, fontWeight: 700, color: '#fff', background: `linear-gradient(90deg,${GREEN_MID},${GREEN_LIGHT})`, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
          <FlipHorizontal size={13} />
          {verseau ? '← Voir le recto' : 'Voir le verso →'}
        </button>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        {!verseau
          ? <RectoCard {...cardProps} captureRef={null} showControls={true} onPhotoClick={onPhotoClick} uploadingPhoto={uploadingPhoto} />
          : <VersoCard {...cardProps} captureRef={null} />
        }
      </div>

      <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" style={{ display: 'none' }} />

      <button onClick={onPhotoClick} style={{ width: '100%', padding: '11px', borderRadius: 12, cursor: 'pointer', border: 'none', background: `linear-gradient(90deg,${GREEN_DARK},${GREEN_MID})`, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 3px 14px rgba(13,107,59,0.3)' }}>
        <Camera size={16} />
        {photoPreview ? 'Changer / Recadrer la photo' : 'Ajouter une photo'}
      </button>

      <div style={{ background: '#fff', borderRadius: 16, padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 99, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={14} color="#ef4444" />
            </div>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: 0 }}>Contact d'urgence</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: GREEN_MID, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              {patient?.contact_urgence_nom ? <><Pencil size={11} /> Modifier</> : <><Plus size={11} /> Ajouter</>}
            </button>
          )}
        </div>
        {!editing ? (
          patient?.contact_urgence_nom ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#991b1b', margin: '0 0 3px' }}>{patient.contact_urgence_nom}</p>
              <p style={{ fontSize: 13, color: '#b91c1c', margin: 0 }}>{patient.contact_urgence_telephone}</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0', color: TEXT_GRAY, fontSize: 12 }}>Aucun contact d'urgence renseigné</div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Nom complet" value={contactUrgence.nom} placeholder="Nom du contact" onChange={e => setContactUrgence(c => ({ ...c, nom: e.target.value }))} />
            <Field label="Téléphone" type="tel" value={contactUrgence.telephone} placeholder="6XXXXXXXX" onChange={e => setContactUrgence(c => ({ ...c, telephone: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              <button onClick={handleSaveContact} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700 }}>Enregistrer</button>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f8fafc', color: TEXT_GRAY, fontSize: 13 }}>Annuler</button>
            </div>
          </div>
        )}
      </div>

      {msgOk && <p style={{ textAlign: 'center', fontSize: 13, color: '#16a34a', background: '#f0fdf4', padding: '8px 12px', borderRadius: 10, border: '1px solid #bbf7d0' }}>✅ {msgOk}</p>}
      {msgErr && <p style={{ textAlign: 'center', fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 10, border: '1px solid #fecaca' }}>⚠️ {msgErr}</p>}

      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: '14px 16px' }}>
        <label htmlFor="consent" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input id="consent" type="checkbox" checked={consentement} onChange={e => setConsentement(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, cursor: 'pointer', accentColor: '#16a34a' }} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#92400e', margin: '0 0 4px' }}>📋 Consentement — données médicales</p>
            <p style={{ fontSize: 11, color: '#78350f', margin: '0 0 6px', lineHeight: 1.5 }}>
              J'autorise Health Mboa Connect à encoder dans le QR code : mon groupe sanguin, mon contact d'urgence et mon CPU.
            </p>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px' }}>
              <p style={{ fontSize: 11, color: '#b91c1c', fontWeight: 700, margin: '0 0 3px' }}>⚠️ Je reconnais que :</p>
              <p style={{ fontSize: 11, color: '#991b1b', margin: 0, lineHeight: 1.5 }}>Ces informations sont accessibles par scan. Je suis <strong>seul responsable</strong> en cas de perte ou vol.</p>
            </div>
          </div>
        </label>
      </div>

      <button onClick={handleDownloadCard} disabled={!profilComplet || generatingCard || !consentement}
        style={{ width: '100%', padding: '13px', borderRadius: 14, cursor: profilComplet && consentement ? 'pointer' : 'not-allowed', border: 'none', background: profilComplet && consentement ? `linear-gradient(90deg,${GREEN_DARK},${GREEN_MID})` : '#e2e8f0', color: profilComplet && consentement ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: profilComplet && consentement ? '0 4px 18px rgba(13,107,59,0.35)' : 'none', transition: 'all 0.2s' }}>
        {generatingCard
          ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Génération en cours…</>
          : <><Download size={16} /> Télécharger ma carte CSI — PDF recto/verso</>
        }
      </button>

      {!profilComplet && (
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontSize: 12, color: '#854d0e' }}>
          ⚠️ Ajoutez une <strong>photo</strong> et un <strong>contact d'urgence</strong> pour télécharger.
        </div>
      )}
    </div>
  )
}
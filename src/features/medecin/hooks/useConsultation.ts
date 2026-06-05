import { useState, useEffect, useCallback } from 'react'
import {
  ouvrirConsultation, sauvegarderEtape,
  mettreEnPause, enregistrerDiagnostic, terminerConsultation,
} from '../api/medecinApi'
import type {
  DossierOuvert, AllergieDetectee,
  EtapeAnamnese, EtapeExamenClinique,
  EtapeDiagnostic, EtapeDecision, EtapePrescription,
} from '../types'

const ANAMNESE_DEF:   EtapeAnamnese       = { anamnese: '' }
const EXAMEN_DEF:     EtapeExamenClinique = { auscultation: '', palpation: '', inspection: '', neurologique: '', autres: '' }
const DIAGNOSTIC_DEF: EtapeDiagnostic    = { diagnostic_principal: '', code_cim10: '', diagnostics_differentiels: [] }
const DECISION_DEF:   EtapeDecision      = { decision: '', notes_privees: '', ordonnance_texte: '', examens_prescrits: '', date_rdv: '' }

export type ConsultationHookReturn = ReturnType<typeof useConsultation>

export const useConsultation = (onRefreshFile: () => void) => {
  const [dossier,        setDossier]        = useState<DossierOuvert | null>(null)
  const [loadingOuvrir,  setLoadingOuvrir]  = useState(false)
  const [erreurOuvrir,   setErreurOuvrir]   = useState<string | null>(null)
  const [etapeCourante,  setEtapeCourante]  = useState(1)
  const [etapesValidees, setEtapesValidees] = useState<number[]>([])
  const [anamnese,       setAnamnese]       = useState<EtapeAnamnese>(ANAMNESE_DEF)
  const [examenClinique, setExamenClinique] = useState<EtapeExamenClinique>(EXAMEN_DEF)
  const [diagnostic,     setDiagnostic]     = useState<EtapeDiagnostic>(DIAGNOSTIC_DEF)
  const [decision,       setDecision]       = useState<EtapeDecision>(DECISION_DEF)
  const [loadingAction,  setLoadingAction]  = useState(false)
  const [erreurAction,   setErreurAction]   = useState<string | null>(null)
  const [showConfirmFin, setShowConfirmFin] = useState(false)
  const [allergieDetectee,  setAllergieDetectee]  = useState<AllergieDetectee | null>(null)
  const [formPrescription,  setFormPrescription]  = useState<EtapePrescription>({
    medicament: '', dosage: '', posologie: '', duree: ''
  })

  const confirmerOverrideAllergie = useCallback(() => setAllergieDetectee(null), [])
  const annulerOverrideAllergie   = useCallback(() => setAllergieDetectee(null), [])

  useEffect(() => {
    if (!dossier) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dossier])

  const reinitialiser = useCallback(() => {
    setDossier(null)
    setEtapeCourante(1)
    setEtapesValidees([])
    setAnamnese(ANAMNESE_DEF)
    setExamenClinique(EXAMEN_DEF)
    setDiagnostic(DIAGNOSTIC_DEF)
    setDecision(DECISION_DEF)
    setErreurAction(null)
    setShowConfirmFin(false)
    setAllergieDetectee(null)
  }, [])

  const restaurer = useCallback((d: DossierOuvert) => {
    const c = d.consultation
    if (c.anamnese) setAnamnese({ anamnese: c.anamnese })
    if (c.examen_clinique) {
      try   { setExamenClinique(JSON.parse(c.examen_clinique)) }
      catch { setExamenClinique({ ...EXAMEN_DEF, autres: c.examen_clinique }) }
    }
    if (c.diagnostic_principal) {
      setDiagnostic({
        diagnostic_principal:      c.diagnostic_principal,
        code_cim10:                c.code_cim10 ?? '',
        diagnostics_differentiels: c.diagnostics_differentiels
          ? JSON.parse(c.diagnostics_differentiels) : [],
      })
    }
    if (c.etape_courante) {
      const etape = Math.min(Math.max(1, Math.ceil(c.etape_courante / 1.5)), 4)
      setEtapeCourante(etape)
    }
    if (c.etapes_validees?.length) setEtapesValidees(c.etapes_validees)
  }, [])

  const ouvrirDossier = useCallback(async (visite_id: number) => {
    setLoadingOuvrir(true)
    setErreurOuvrir(null)
    try {
      const data = await ouvrirConsultation(visite_id)
      reinitialiser()
      setDossier(data)
      restaurer(data)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      setErreurOuvrir(status === 409
        ? 'Dossier ouvert par un autre médecin'
        : "Impossible d'ouvrir le dossier")
    } finally {
      setLoadingOuvrir(false)
    }
  }, [reinitialiser, restaurer])

  const sauvegarder = useCallback(async () => {
    if (!dossier) return
    setLoadingAction(true)
    try {
      await sauvegarderEtape({
        consultation_id: dossier.consultation.id,
        anamnese:        anamnese.anamnese || undefined,
        examen_clinique: JSON.stringify(examenClinique),
        etape_courante:  etapeCourante,
        etapes_validees: etapesValidees,
      })
    } catch { setErreurAction('Erreur de sauvegarde') }
    finally { setLoadingAction(false) }
  }, [dossier, anamnese, examenClinique, etapeCourante, etapesValidees])

  const pauserConsultation = useCallback(async (raison: string) => {
    if (!dossier) return
    setLoadingAction(true)
    try {
      await mettreEnPause({
        consultation_id: dossier.consultation.id,
        visite_id:       dossier.consultation.visite_id,
        raison_pause:    raison,
        etape_courante:  etapeCourante,
        etapes_validees: etapesValidees,
      })
      reinitialiser()
      onRefreshFile()
    } catch { setErreurAction('Erreur lors de la pause') }
    finally { setLoadingAction(false) }
  }, [dossier, etapeCourante, etapesValidees, reinitialiser, onRefreshFile])

  const allerEtape = useCallback((num: number) => {
    const etape = Math.min(Math.max(1, num), 4)
    setEtapeCourante(etape)
    if (etape > 1 && !etapesValidees.includes(etape - 1))
      setEtapesValidees(prev => [...new Set([...prev, etape - 1])])
  }, [etapesValidees])

  const validerEtapeActuelle = useCallback(() => {
    setEtapesValidees(prev => [...new Set([...prev, etapeCourante])])
    setEtapeCourante(prev => Math.min(prev + 1, 4))
  }, [etapeCourante])

  const enregistrerDiag = useCallback(async () => {
    if (!dossier || !diagnostic.diagnostic_principal.trim()) {
      setErreurAction('Diagnostic principal obligatoire')
      return
    }
    setLoadingAction(true)
    setErreurAction(null)
    try {
      await enregistrerDiagnostic({
        consultation_id:           dossier.consultation.id,
        diagnostic_principal:      diagnostic.diagnostic_principal,
        code_cim10:                diagnostic.code_cim10 || undefined,
        diagnostics_differentiels: diagnostic.diagnostics_differentiels.length
          ? JSON.stringify(diagnostic.diagnostics_differentiels) : undefined,
        anamnese:        anamnese.anamnese || undefined,
        examen_clinique: JSON.stringify(examenClinique),
      })
      validerEtapeActuelle()
    } catch { setErreurAction('Erreur enregistrement diagnostic') }
    finally { setLoadingAction(false) }
  }, [dossier, diagnostic, anamnese, examenClinique, validerEtapeActuelle])

  // ══════════════════════════════════════════════════════════
  // TERMINER — FIX : ordonnance_texte, examens_prescrits,
  // date_rdv étaient omis du payload → null en base
  // ══════════════════════════════════════════════════════════
  const terminer = useCallback(async () => {
    if (!dossier || !decision.decision) {
      setErreurAction('Sélectionnez une décision')
      return
    }
    setLoadingAction(true)
    setErreurAction(null)
    try {
      await terminerConsultation({
        consultation_id:  dossier.consultation.id,
        visite_id:        dossier.consultation.visite_id,
        decision_finale:  decision.decision,
        notes_privees:    decision.notes_privees    || undefined,
        ordonnance_texte: decision.ordonnance_texte || undefined,  // ✅ ajouté
        examens_prescrits: decision.examens_prescrits || undefined, // ✅ ajouté
        date_rdv:         decision.date_rdv         || undefined,  // ✅ ajouté
      })
      reinitialiser()
      onRefreshFile()
    } catch { setErreurAction('Erreur finalisation consultation') }
    finally { setLoadingAction(false); setShowConfirmFin(false) }
  }, [dossier, decision, reinitialiser, onRefreshFile])

  return {
    dossier, loadingOuvrir, erreurOuvrir,
    etapeCourante, etapesValidees,
    anamnese,       setAnamnese,
    examenClinique, setExamenClinique,
    diagnostic,     setDiagnostic,
    decision,       setDecision,
    formPrescription, setFormPrescription,
    allergieDetectee,
    confirmerOverrideAllergie,
    annulerOverrideAllergie,
    loadingAction, erreurAction, setErreurAction,
    showConfirmFin, setShowConfirmFin,
    allerEtape, validerEtapeActuelle,
    ouvrirDossier, sauvegarder, pauserConsultation,
    enregistrerDiag, terminer, reinitialiser,
  }
}
import { useState, useEffect, useRef } from 'react'
import { Siren, MapPin, AlertCircle, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { classifyIncident } from '@/lib/ai-classifier'
import { createIncident, assignResponders } from '@/lib/incidents'
import { assignRespondersToIncident } from '@/lib/responders'

interface SOSFormProps {
  buildingId: string
  userId: string
}

type Step = 1 | 2 | 3 | 4 | 5

export function SOSForm({ buildingId, userId }: SOSFormProps) {
  const [step, setStep] = useState<Step>(1)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [floor, setFloor] = useState(2)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState<any>(null)
  const [eta, setEta] = useState(120)
  const etaTimerRef = useRef<number>()

  // Auto-detect location on step 3
  useEffect(() => {
    if (step !== 3 || location) return

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`Level ${floor} · GPS lock (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`)
        },
        () => {
          setLocation(`Level ${floor} · Building premises`)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      setLocation(`Level ${floor} · Building premises`)
    }
  }, [step, floor, location])

  // AI classification when description is provided
  useEffect(() => {
    if (step !== 2 || !description || loading) return

    const analyzeAsync = async () => {
      setLoading(true)
      const result = await classifyIncident(description)
      setAiAnalysis(result)
      setLoading(false)
    }

    const debounce = setTimeout(analyzeAsync, 500)
    return () => clearTimeout(debounce)
  }, [description, step])

  // ETA countdown
  useEffect(() => {
    if (!submitted) return

    return () => {
      if (etaTimerRef.current) clearInterval(etaTimerRef.current)
    }
  }, [submitted])

  const handleSubmit = async () => {
    if (!aiAnalysis || !location) {
      toast.error('Missing required information')
      return
    }

    setLoading(true)
    try {
      // Create incident
      const { incident, error: incidentError } = await createIncident(
        buildingId,
        userId,
        aiAnalysis.type,
        aiAnalysis.severity,
        location,
        description,
        floor
      )

      if (incidentError || !incident) throw new Error(incidentError)

      // Assign responders
      const responders = await assignRespondersToIncident(buildingId, aiAnalysis.type)
      if (responders.length > 0) {
        await assignResponders(incident.id, responders.map((r) => r.id))
      }

      setSubmitted({
        incident,
        responders,
        eta: aiAnalysis.severity === 'critical' ? 60 : aiAnalysis.severity === 'high' ? 90 : 120,
      })

      toast.success(`${aiAnalysis.type.toUpperCase()} dispatch sent · ${incident.id}`)

      // Start ETA countdown
      let remainingEta = aiAnalysis.severity === 'critical' ? 60 : aiAnalysis.severity === 'high' ? 90 : 120
      etaTimerRef.current = window.setInterval(() => {
        remainingEta = Math.max(0, remainingEta - 1)
        setEta(remainingEta)

        if (remainingEta === 0) {
          clearInterval(etaTimerRef.current)
          toast.success('Responders on scene!')
        }
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create incident')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    const pct = (120 - eta) / 120
    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl border border-success/40 bg-success/5 p-8 text-center">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>

          <h1 className="font-display text-3xl font-semibold">Help is on the way</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {submitted.responders.length} responder{submitted.responders.length !== 1 ? 's' : ''} assigned. Move to safe location.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-border/60 bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">Incident ID</p>
              <p className="mt-1 font-mono font-semibold text-sm">{submitted.incident.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="mt-1 font-semibold text-sm capitalize">{submitted.incident.type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ETA</p>
              <p className="mt-1 font-mono font-semibold text-sm text-success">
                {Math.floor(eta / 60)}:{String(eta % 60).padStart(2, '0')}
              </p>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-success transition-all"
              style={{ width: `${Math.min(100, pct * 100)}%` }}
            />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {Math.round(pct * 100)}% · {eta === 0 ? 'On scene' : 'En route'}
          </p>

          <Button
            onClick={() => {
              setSubmitted(null)
              setStep(1)
              setDescription('')
              setLocation('')
              setAiAnalysis(null)
              if (etaTimerRef.current) clearInterval(etaTimerRef.current)
            }}
            variant="outline"
            className="mt-6 rounded-xl"
          >
            Report another incident
          </Button>
        </div>
      </div>
    )
  }

  const canAdvance = step === 1 || (step === 2 && aiAnalysis) || (step === 3 && location) || step === 4 || (step === 5 && description)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-destructive">Emergency reporting</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Emergency SOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">Step {step}/5</p>
      </div>

      {/* BIG RED SOS BUTTON */}
      <button
        onClick={() => {
          if (step === 5 && canAdvance) handleSubmit()
          else if (canAdvance) setStep((s) => Math.min(5, s + 1) as Step)
        }}
        disabled={!canAdvance || loading}
        className="group relative w-full overflow-hidden rounded-3xl border border-destructive/40 bg-destructive/5 p-8 text-center transition-all hover:bg-destructive/10 disabled:opacity-50"
      >
        <span className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/30 animate-pulse" />
        <span className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/15 animate-pulse" style={{ animationDelay: '600ms' }} />

        <div className="relative">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-destructive text-white shadow-[0_0_40px_-4px_rgb(239_68_68)]">
            <Siren className="h-10 w-10" />
          </div>
          <p className="font-display text-2xl font-semibold text-destructive">
            {step === 5 ? 'CONFIRM & DISPATCH' : 'CONTINUE'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {step === 1 ? 'Describe the emergency' : step === 2 ? 'AI analyzing...' : step === 3 ? 'Confirm location' : step === 4 ? 'Review incident' : 'Final confirmation'}
          </p>
        </div>
      </button>

      {/* Step 1: Description */}
      {step === 1 && (
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <label className="block text-sm font-medium">Describe what you see</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g., 'There is smoke in the hallway' or 'Someone is unconscious'"
            className="mt-2 min-h-[100px]"
          />
        </div>
      )}

      {/* Step 2: AI Classification */}
      {step === 2 && (
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Analyzing incident with AI...</p>
            </div>
          ) : aiAnalysis ? (
            <>
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">Classification</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Confidence: High</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface/60 p-3">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="mt-1 font-semibold capitalize">{aiAnalysis.type}</p>
                  </div>
                  <div className="rounded-xl bg-surface/60 p-3">
                    <p className="text-xs text-muted-foreground">Severity</p>
                    <p className="mt-1 font-semibold capitalize">{aiAnalysis.severity}</p>
                  </div>
                </div>
              </div>

              {aiAnalysis.suggestedActions.length > 0 && (
                <div className="rounded-2xl border border-border/60 bg-card p-4">
                  <p className="text-sm font-medium mb-3">Recommended Actions</p>
                  <ul className="space-y-2">
                    {aiAnalysis.suggestedActions.map((action: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="shrink-0">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <label className="text-sm font-medium">Location</label>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/60 p-3 mb-3">
            <p className="text-sm text-muted-foreground">Floor</p>
            <Input
              type="number"
              min="1"
              value={floor}
              onChange={(e) => setFloor(parseInt(e.target.value))}
              className="mt-1"
            />
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/60 p-3">
            <p className="text-sm text-muted-foreground">Detected Location</p>
            <p className="mt-1 font-semibold">{location || 'Detecting...'}</p>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-sm font-medium mb-4">Review Incident</p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Description</p>
              <p className="mt-1">{description}</p>
            </div>
            {aiAnalysis && (
              <>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="mt-1 capitalize font-semibold">{aiAnalysis.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Severity</p>
                  <p className="mt-1 capitalize font-semibold">{aiAnalysis.severity}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="mt-1">{location}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === 5 && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-success mb-3" />
          <p className="font-semibold">Ready to dispatch responders?</p>
          <p className="mt-1 text-sm text-muted-foreground">All emergency units will be notified immediately.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1) as Step)}
          disabled={step === 1}
          className="rounded-xl"
        >
          Back
        </Button>
        <Button
          variant="outline"
          onClick={() => setStep(Math.min(5, step + 1) as Step)}
          disabled={step === 5 || !canAdvance || loading}
          className="rounded-xl"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

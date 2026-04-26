import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  MapPin,
  ShieldAlert,
  Siren,
  TextCursorInput,
} from "lucide-react";
import { getBuilding, responders, type Incident, type Responder } from "@/data/buildings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/building/$buildingId/dashboard/sos")({
  component: SOSPage,
});

type EmergencyType = Incident["type"];
type EmergencySeverity = Incident["severity"];

const types: Array<{ id: EmergencyType; label: string; icon: typeof Flame; tone: "destructive" | "warning"; hint: string }> = [
  { id: "fire", label: "Fire", icon: Flame, tone: "destructive", hint: "Smoke, flames, heat anomaly" },
  { id: "medical", label: "Medical", icon: Heart, tone: "warning", hint: "Injury, cardiac, respiratory" },
  { id: "security", label: "Security threat", icon: ShieldAlert, tone: "destructive", hint: "Intruder, weapon, suspicious activity" },
  { id: "structural", label: "Structural", icon: AlertTriangle, tone: "warning", hint: "Leak, crack, collapse risk" },
  { id: "evacuation", label: "Evacuation", icon: Siren, tone: "destructive", hint: "Immediate zone evacuation" },
];

const severities: Array<{ id: EmergencySeverity; label: string; hint: string; dot: string }> = [
  { id: "low", label: "Low", hint: "Monitor / minor", dot: "bg-success" },
  { id: "medium", label: "Medium", hint: "Needs response", dot: "bg-warning" },
  { id: "high", label: "High", hint: "Urgent attention", dot: "bg-destructive" },
  { id: "critical", label: "Critical", hint: "Life-threatening", dot: "bg-destructive shadow-[0_0_12px_var(--destructive)]" },
];

type Step = 1 | 2 | 3 | 4 | 5;

type SOSDraft = {
  type: EmergencyType | null;
  severity: EmergencySeverity | null;
  locationText: string;
  locationCoords?: { lat: number; lng: number } | null;
  floor: number;
  description: string;
};

type Assigned = {
  incident: Incident;
  assigned: Responder[];
  etaSeconds: number;
  createdAt: number;
  timeline: Array<{ at: number; text: string; kind: "system" | "info" | "alert" }>;
};

function safeLoadIncidents(buildingId: string): Incident[] {
  try {
    const raw = sessionStorage.getItem(`cs-incidents-${buildingId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Incident[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function safeSaveIncident(buildingId: string, incident: Incident) {
  try {
    const existing = safeLoadIncidents(buildingId);
    sessionStorage.setItem(`cs-incidents-${buildingId}`, JSON.stringify([incident, ...existing].slice(0, 25)));
  } catch {}
}

function pickRespondersFor(type: EmergencyType): Responder[] {
  const byId = new Map(responders.map((r) => [r.id, r]));
  const order =
    type === "fire"
      ? ["r1", "r4"]
      : type === "medical"
        ? ["r2", "r4"]
        : type === "security"
          ? ["r3", "r4"]
          : type === "structural"
            ? ["r4", "r1"]
            : ["r4", "r3"];
  const picked = order.map((id) => byId.get(id)).filter(Boolean) as Responder[];
  return picked.length ? picked : responders.slice(0, 2);
}

function formatEta(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function makeIncidentId() {
  return `INC-${Math.floor(2400 + Math.random() * 600)}`;
}

function SOSPage() {
  const { buildingId } = Route.useParams();
  const building = getBuilding(buildingId);
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<SOSDraft>(() => ({
    type: null,
    severity: null,
    locationText: "",
    locationCoords: null,
    floor: 2,
    description: "",
  }));
  const [assigned, setAssigned] = useState<Assigned | null>(null);
  const timerRef = useRef<number | null>(null);

  if (!building) return null;

  const canNext =
    (step === 1 && Boolean(draft.type)) ||
    (step === 2 && Boolean(draft.severity)) ||
    (step === 3 && Boolean(draft.locationText)) ||
    (step === 4 && true) ||
    (step === 5 && Boolean(draft.type && draft.severity && draft.locationText));

  const title = useMemo(() => {
    return step === 1
      ? "Select emergency type"
      : step === 2
        ? "Select severity"
        : step === 3
          ? "Auto-detect location"
          : step === 4
            ? "Optional description"
            : "Confirm dispatch";
  }, [step]);

  const detectLocation = () => {
    const base = `${building.shortName} · ${building.area}`;
    const floor = draft.floor || 2;
    const fallbackText = `Level ${floor} · ${base}`;
    if (!navigator.geolocation) {
      setDraft((d) => ({ ...d, locationText: fallbackText, locationCoords: null }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraft((d) => ({
          ...d,
          locationText: `Level ${floor} · ${base} · GPS lock`,
          locationCoords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        }));
      },
      () => {
        setDraft((d) => ({ ...d, locationText: fallbackText, locationCoords: null }));
      },
      { enableHighAccuracy: true, timeout: 3500, maximumAge: 15_000 },
    );
  };

  useEffect(() => {
    if (step !== 3) return;
    if (draft.locationText) return;
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const submit = () => {
    if (!draft.type || !draft.severity || !draft.locationText) return;
    const t = types.find((x) => x.id === draft.type)!;
    const inc: Incident = {
      id: makeIncidentId(),
      type: draft.type,
      severity: draft.severity,
      location: draft.locationText,
      floor: draft.floor,
      status: "active",
      reportedAt: "Just now",
      responder: "Dispatch AI",
      eta: "Calculating…",
      description: draft.description?.trim() || t.hint,
    };

    const team = pickRespondersFor(draft.type);
    const etaSeconds = draft.severity === "critical" ? 60 : draft.severity === "high" ? 90 : draft.severity === "medium" ? 140 : 180;
    const createdAt = Date.now();

    safeSaveIncident(buildingId, inc);

    const initial: Assigned = {
      incident: { ...inc, status: "responding", responder: team.map((x) => x.name).join(" + "), eta: formatEta(etaSeconds) },
      assigned: team,
      etaSeconds,
      createdAt,
      timeline: [
        { at: createdAt, text: `Signal accepted · ${inc.id}`, kind: "system" },
        { at: createdAt + 400, text: `${t.label} protocol engaged`, kind: "info" },
        { at: createdAt + 800, text: `Team assigned: ${team.map((x) => x.name).join(", ")}`, kind: "info" },
      ],
    };

    setAssigned(initial);
    toast.success(`${t.label} dispatched · ${inc.id}`, { description: `${team[0]?.name ?? "Unit"} en route` });

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setAssigned((cur) => {
        if (!cur) return cur;
        const elapsed = Math.floor((Date.now() - cur.createdAt) / 1000);
        const left = Math.max(0, cur.etaSeconds - elapsed);
        const pct = cur.etaSeconds === 0 ? 1 : 1 - left / cur.etaSeconds;

        const nextTimeline = [...cur.timeline];
        const maybePush = (seconds: number, text: string, kind: "system" | "info" | "alert") => {
          const tAt = cur.createdAt + seconds * 1000;
          if (Date.now() >= tAt && !nextTimeline.some((x) => x.text === text)) {
            nextTimeline.push({ at: tAt, text, kind });
          }
        };

        maybePush(15, "Dispatch confirmed · channels synchronized", "system");
        maybePush(Math.round(cur.etaSeconds * 0.35), "Unit in transit · route optimized", "info");
        maybePush(Math.round(cur.etaSeconds * 0.7), "Approaching scene · standby for instructions", "alert");

        const status: Incident["status"] = left === 0 ? "on-scene" : "responding";
        return {
          ...cur,
          etaSeconds: cur.etaSeconds,
          timeline: nextTimeline.sort((a, b) => a.at - b.at),
          incident: {
            ...cur.incident,
            eta: formatEta(left),
            status: status === "on-scene" ? "contained" : cur.incident.status,
          },
          // pct available for UI; not stored in object to keep minimal shape
          _pct: pct,
        } as Assigned & { _pct: number };
      });
    }, 1000);
  };

  if (assigned) {
    const pct = (assigned as Assigned & { _pct?: number })._pct ?? 0;
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl border border-success/40 bg-success/5 p-8 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-success to-transparent" />
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">Help is on the way</h1>
          <p className="mt-2 text-sm text-muted-foreground">Stay calm. Move to a safe location and follow visual evacuation guidance.</p>

          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60">
            <Stat label="Incident" value={assigned.incident.id} />
            <Stat label="Assigned team" value={assigned.assigned.map((x) => x.name.split(" · ")[0]).join(" + ")} />
            <Stat label="ETA" value={assigned.incident.eta} accent="text-success" />
          </div>

          <div className="mt-5 rounded-2xl border border-border/60 bg-card p-4 text-left">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Status updates</p>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {Math.round(pct * 100)}% · {assigned.incident.status}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-success transition-all" style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%` }} />
            </div>
            <div className="mt-4 space-y-2">
              {assigned.timeline.slice(-5).map((t) => (
                <div key={t.at} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-surface/60 px-3 py-2">
                  <p className="text-sm text-foreground">{t.text}</p>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {new Date(t.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={() => { setSubmitted(null); setType(null); setNotes(""); }} variant="outline" className="mt-6 rounded-xl">
            Report another incident
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-destructive">Emergency reporting</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Trigger SOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">{title} · Step {step}/5</p>
      </div>

      {/* SOS HERO BUTTON */}
      <button
        onClick={() => {
          if (step === 5) submit();
          else if (canNext) setStep((s) => (s === 5 ? 5 : ((s + 1) as Step)));
        }}
        disabled={!canNext}
        className="group relative w-full overflow-hidden rounded-3xl border border-destructive/40 bg-destructive/5 p-8 text-center transition-all hover:bg-destructive/10 disabled:opacity-50 disabled:hover:bg-destructive/5"
      >
        <span className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/30 animate-pulse-ring" />
        <span className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/15 animate-pulse-ring [animation-delay:600ms]" />
        <div className="relative">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-destructive text-destructive-foreground shadow-[0_0_40px_-4px_var(--destructive)]">
            <Siren className="h-9 w-9" />
          </div>
          <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-destructive">{step === 5 ? "CONFIRM DISPATCH" : "CONTINUE"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {step === 1
              ? "Select an emergency type below"
              : step === 2
                ? "Select severity to prioritize dispatch"
                : step === 3
                  ? "Confirm detected location"
                  : step === 4
                    ? "Add optional details"
                    : "Review and confirm the signal"}
          </p>
        </div>
      </button>

      {/* Step content */}
      {step === 1 && (
        <div className="grid gap-3 md:grid-cols-3">
          {types.map((t) => {
            const Icon = t.icon;
            const active = draft.type === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setDraft((d) => ({ ...d, type: t.id }))}
                className={`group rounded-2xl border p-5 text-left transition-all ${
                  active ? "border-destructive bg-destructive/10 shadow-[0_0_0_1px_var(--destructive)]" : "border-border/60 bg-card hover:border-border-strong"
                }`}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-4 font-display text-base font-semibold">{t.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
              </button>
            );
          })}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-3 md:grid-cols-4">
          {severities.map((s) => {
            const active = draft.severity === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setDraft((d) => ({ ...d, severity: s.id }))}
                className={`group rounded-2xl border p-5 text-left transition-all ${
                  active ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]" : "border-border/60 bg-card hover:border-border-strong"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{s.id}</span>
                </div>
                <p className="mt-3 font-display text-base font-semibold">{s.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Location + notes */}
      {step === 3 && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Auto location</p>
              </div>
              <Button variant="outline" size="sm" onClick={detectLocation} className="h-8 rounded-xl font-mono text-[10px] uppercase tracking-[0.2em]">
                Refresh
              </Button>
            </div>
            <p className="mt-2 font-display text-base font-semibold">{building.shortName}</p>
            <p className="text-sm text-muted-foreground">{draft.locationText || "Detecting…"}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Dispatch model</p>
            </div>
            <p className="mt-2 font-display text-base font-semibold">&lt; 3 minutes</p>
            <p className="text-sm text-muted-foreground">Closest available unit will be assigned automatically.</p>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <TextCursorInput className="h-3.5 w-3.5 text-primary" />
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Optional details</p>
          </div>
          <Textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Briefly describe what you observe (optional)…"
            className="mt-3 min-h-[90px] rounded-xl border-border bg-background"
          />
        </div>
      )}

      {step === 5 && (
        <div className="rounded-3xl border border-border/60 bg-surface/60 p-6 shadow-card backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Confirmation</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Mini label="Type" value={types.find((t) => t.id === draft.type)?.label ?? "—"} />
            <Mini label="Severity" value={severities.find((s) => s.id === draft.severity)?.label ?? "—"} />
            <Mini label="Location" value={draft.locationText ? "Detected" : "—"} />
            <Mini label="Building" value={building.shortName} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {draft.locationText}
          </p>
          {draft.description?.trim() && (
            <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Description</p>
              <p className="mt-2 text-sm text-foreground">{draft.description.trim()}</p>
            </div>
          )}
          <div className="mt-5 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(4)} className="rounded-xl">
              Back
            </Button>
            <Button onClick={submit} className="rounded-xl bg-destructive text-destructive-foreground hover:opacity-90">
              Confirm dispatch
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)))}
          disabled={step === 1}
          className="rounded-xl"
        >
          Back
        </Button>
        <Button
          variant="outline"
          onClick={() => setStep((s) => (s === 5 ? 5 : ((s + 1) as Step)))}
          disabled={step === 5 || !canNext}
          className="rounded-xl"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-surface/60 p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-base font-semibold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-sm font-semibold">{value}</p>
    </div>
  );
}

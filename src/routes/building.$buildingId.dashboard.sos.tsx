import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Clock, Flame, Heart, MapPin, ShieldAlert, Siren } from "lucide-react";
import { getBuilding } from "@/data/buildings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/building/$buildingId/dashboard/sos")({
  component: SOSPage,
});

const types = [
  { id: "fire", label: "Fire", icon: Flame, tone: "destructive" as const, hint: "Smoke, flames, heat anomaly" },
  { id: "medical", label: "Medical", icon: Heart, tone: "warning" as const, hint: "Injury, cardiac, respiratory" },
  { id: "security", label: "Security threat", icon: ShieldAlert, tone: "destructive" as const, hint: "Intruder, weapon, suspicious activity" },
];

function SOSPage() {
  const { buildingId } = Route.useParams();
  const building = getBuilding(buildingId);
  const [type, setType] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ type: string; eta: string; responder: string; id: string } | null>(null);
  const [notes, setNotes] = useState("");

  if (!building) return null;

  const submit = () => {
    if (!type) return;
    const t = types.find((x) => x.id === type)!;
    const responder = type === "fire" ? "Fire Squad 7" : type === "medical" ? "Medical Alpha" : "Security Bravo";
    const eta = type === "fire" ? "2 min" : type === "medical" ? "1 min" : "3 min";
    const id = `INC-${Math.floor(2400 + Math.random() * 600)}`;
    setSubmitted({ type: t.label, responder, eta, id });
    toast.success(`${t.label} dispatched · ${id}`, { description: `${responder} en route · ETA ${eta}` });
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl border border-success/40 bg-success/5 p-8 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-success to-transparent" />
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">Help is on the way</h1>
          <p className="mt-2 text-sm text-muted-foreground">Stay calm. Move to a safe location and follow visual evacuation guidance.</p>
          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60">
            <Stat label="Incident" value={submitted.id} />
            <Stat label="Responder" value={submitted.responder} />
            <Stat label="ETA" value={submitted.eta} accent="text-success" />
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
        <p className="mt-1 text-sm text-muted-foreground">Select the emergency type. Your location auto-fills from your floor sensor.</p>
      </div>

      {/* SOS HERO BUTTON */}
      <button
        onClick={submit}
        disabled={!type}
        className="group relative w-full overflow-hidden rounded-3xl border border-destructive/40 bg-destructive/5 p-8 text-center transition-all hover:bg-destructive/10 disabled:opacity-50 disabled:hover:bg-destructive/5"
      >
        <span className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/30 animate-pulse-ring" />
        <span className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/15 animate-pulse-ring [animation-delay:600ms]" />
        <div className="relative">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-destructive text-destructive-foreground shadow-[0_0_40px_-4px_var(--destructive)]">
            <Siren className="h-9 w-9" />
          </div>
          <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-destructive">DISPATCH EMERGENCY</p>
          <p className="mt-1 text-xs text-muted-foreground">{type ? `Sending ${type} signal…` : "Select an emergency type below"}</p>
        </div>
      </button>

      {/* Type selector */}
      <div className="grid gap-3 md:grid-cols-3">
        {types.map((t) => {
          const Icon = t.icon;
          const active = type === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`group rounded-2xl border p-5 text-left transition-all ${active ? "border-destructive bg-destructive/10 shadow-[0_0_0_1px_var(--destructive)]" : "border-border/60 bg-card hover:border-border-strong"}`}
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

      {/* Location + notes */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Auto location</p>
          </div>
          <p className="mt-2 font-display text-base font-semibold">{building.shortName}</p>
          <p className="text-sm text-muted-foreground">Level 2 · Gate C14 vicinity · {building.area}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Estimated dispatch</p>
          </div>
          <p className="mt-2 font-display text-base font-semibold">&lt; 90 seconds</p>
          <p className="text-sm text-muted-foreground">Closest available unit will be assigned automatically.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Optional details</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Briefly describe what you observe (optional)…"
          className="mt-2 min-h-[80px] rounded-xl border-border bg-background"
        />
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

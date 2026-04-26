import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertOctagon, Clock, Filter, Flame, Heart, ShieldAlert, Wrench } from "lucide-react";
import { getBuilding, incidentsByBuilding, type Incident } from "@/data/buildings";

export const Route = createFileRoute("/building/$buildingId/dashboard/incidents")({
  component: IncidentsPage,
});

const typeIcon = {
  fire: Flame,
  medical: Heart,
  security: ShieldAlert,
  structural: Wrench,
  evacuation: AlertOctagon,
};

function IncidentsPage() {
  const { buildingId } = Route.useParams();
  const building = getBuilding(buildingId);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [pulse, setPulse] = useState(0);

  // Simulated real-time tick
  useEffect(() => {
    const i = setInterval(() => setPulse((p) => p + 1), 5000);
    return () => clearInterval(i);
  }, []);

  if (!building) return null;
  const incidents = incidentsByBuilding[buildingId] ?? [];

  const filtered = incidents.filter((inc) => {
    if (filter === "all") return true;
    if (filter === "active") return inc.status === "active" || inc.status === "responding";
    return inc.status === "contained" || inc.status === "resolved";
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Live operations · Pulse {pulse}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Active incidents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time incident feed across {building.shortName}.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-1">
          {(["all", "active", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-success/15">
            <Filter className="h-5 w-5 text-success" />
          </div>
          <p className="mt-4 font-display text-lg font-semibold">All clear</p>
          <p className="mt-1 text-sm text-muted-foreground">No incidents match this filter.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((inc, i) => (
            <IncidentCard key={inc.id} inc={inc} delay={i * 60} />
          ))}
        </div>
      )}
    </div>
  );
}

function IncidentCard({ inc, delay }: { inc: Incident; delay: number }) {
  const Icon = typeIcon[inc.type];
  const sev =
    inc.severity === "critical" || inc.severity === "high"
      ? { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/40", dot: "bg-destructive shadow-[0_0_10px_var(--destructive)]" }
      : inc.severity === "medium"
      ? { color: "text-warning", bg: "bg-warning/10", border: "border-warning/40", dot: "bg-warning" }
      : { color: "text-success", bg: "bg-success/10", border: "border-success/40", dot: "bg-success" };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${sev.border} bg-card p-5 animate-fade-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-current opacity-80" style={{ color: sev.color.replace("text-", "var(--") + ")" }} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`grid h-11 w-11 place-items-center rounded-xl ${sev.bg} ${sev.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-semibold capitalize">{inc.type}</p>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{inc.id}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${sev.bg} ${sev.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                {inc.severity}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{inc.description}</p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {inc.location} · L{inc.floor}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium capitalize">{inc.status}</p>
          <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {inc.reportedAt}
          </p>
          <p className="mt-2 text-xs">{inc.responder}</p>
          <p className="font-mono text-[10px] text-muted-foreground">ETA {inc.eta}</p>
        </div>
      </div>
    </div>
  );
}

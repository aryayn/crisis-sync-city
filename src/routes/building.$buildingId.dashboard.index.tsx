import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertOctagon, ArrowUpRight, ChevronRight, DoorOpen, MessageSquare, Siren, Users } from "lucide-react";
import { getBuilding, responders } from "@/data/buildings";
import { statusConfig } from "@/lib/building-meta";
import { useIncidents } from "@/contexts/IncidentContext";

export const Route = createFileRoute("/building/$buildingId/dashboard/")({
  component: OverviewPage,
});

function OverviewPage() {
  const { buildingId } = Route.useParams();
  const building = getBuilding(buildingId);
  const incidents = useIncidents(buildingId);

  if (!building) return null;

  // Calculate dynamic status based on live incidents
  const activeIncidents = incidents.filter(i => i.status === "active" || i.status === "responding");
  const isCritical = activeIncidents.some(i => i.severity === "critical" || i.severity === "high");
  const isElevated = activeIncidents.some(i => i.severity === "medium");
  const currentStatus = isCritical ? "critical" : isElevated ? "elevated" : "normal";
  
  const cfg = statusConfig[currentStatus];
  const occupancyPct = Math.round((building.occupancy / building.capacity) * 100);

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="flex flex-col gap-2 animate-fade-up">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Operations · Overview</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{building.shortName}</h1>
        <p className="text-sm text-muted-foreground">
          {building.tagline} · {new Date().toLocaleString("en-IN", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Status banner */}
      {currentStatus !== "normal" && (
        <div className={`relative overflow-hidden rounded-2xl border p-5 animate-fade-up ${currentStatus === "critical" ? "border-destructive/40 bg-destructive/5" : "border-warning/40 bg-warning/5"}`}>
          <div className="absolute inset-y-0 left-0 w-1 bg-current opacity-80" style={{ color: currentStatus === "critical" ? "var(--destructive)" : "var(--warning)" }} />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertOctagon className={`h-5 w-5 ${cfg.color}`} />
              <div>
                <p className={`font-display text-base font-semibold ${cfg.color}`}>
                  {currentStatus === "critical" ? "Critical incident in progress" : "Elevated alert level"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeIncidents.length} incident{activeIncidents.length !== 1 ? "s" : ""} requires coordination. All response teams synchronized.
                </p>
              </div>
            </div>
            <Link
              to="/building/$buildingId/dashboard/incidents"
              params={{ buildingId }}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border-strong bg-surface px-3 py-2 text-xs font-medium transition-all hover:bg-surface-elevated"
            >
              Open log <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Status" value={cfg.label} accent={cfg.color} icon={Activity} />
        <StatCard label="Occupancy" value={`${occupancyPct}%`} sub={`${building.occupancy.toLocaleString()} / ${building.capacity.toLocaleString()}`} icon={Users} />
        <StatCard label="Active incidents" value={activeIncidents.length} icon={AlertOctagon} accent={activeIncidents.length ? "text-warning" : "text-success"} />
        <StatCard label="Responders ready" value={responders.filter(r => r.status === "available").length} icon={Siren} />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 md:grid-cols-3">
        <QuickAction
          to="/building/$buildingId/dashboard/sos"
          buildingId={buildingId}
          title="Trigger SOS"
          desc="Report fire, medical or security emergencies"
          icon={Siren}
          tone="destructive"
        />
        <QuickAction
          to="/building/$buildingId/dashboard/floor-plan"
          buildingId={buildingId}
          title="View floor plan"
          desc="Live floor layout & evacuation routes"
          icon={DoorOpen}
        />
        <QuickAction
          to="/building/$buildingId/dashboard/comms"
          buildingId={buildingId}
          title="Open comms"
          desc="Broadcast alerts & coordinate teams"
          icon={MessageSquare}
        />
      </div>

      {/* Incidents preview + Responders */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent incidents</h2>
            <Link to="/building/$buildingId/dashboard/incidents" params={{ buildingId }} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border/60">
            {incidents.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No active incidents. All systems nominal.</p>
            )}
            {incidents.slice(0, 5).map((inc) => (
              <div key={inc.id} className="flex items-start justify-between gap-3 py-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2 w-2 rounded-full ${
                    inc.status === "resolved" || inc.status === "contained" 
                      ? "bg-success"
                      : inc.severity === "critical" || inc.severity === "high" 
                        ? "bg-destructive shadow-[0_0_8px_var(--destructive)]" 
                        : inc.severity === "medium" ? "bg-warning" : "bg-success"
                  }`} />
                  <div>
                    <p className="text-sm font-medium capitalize">{inc.type} · <span className="font-mono text-xs text-muted-foreground">{inc.id}</span></p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{inc.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium capitalize">{inc.status}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{inc.reportedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Responders</h2>
          <div className="mt-4 space-y-3">
            {responders.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{r.role}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${r.status === "available" ? "bg-success/10 text-success" : r.status === "dispatched" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${r.status === "available" ? "bg-success" : r.status === "dispatched" ? "bg-warning" : "bg-primary"}`} />
                    {r.status}
                  </span>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{r.distance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${accent ?? "text-muted-foreground"}`} />
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-2 font-display text-2xl font-semibold tracking-tight ${accent ?? ""}`}>{value}</p>
      {sub && <p className="mt-1 font-mono text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function QuickAction({ to, buildingId, title, desc, icon: Icon, tone }: { to: string; buildingId: string; title: string; desc: string; icon: React.ElementType; tone?: "destructive" }) {
  return (
    <Link
      to={to as "/building/$buildingId/dashboard"}
      params={{ buildingId }}
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all ${tone === "destructive" ? "border-destructive/40 bg-destructive/5 hover:border-destructive/60" : "border-border/60 bg-card hover:border-primary/40"}`}
    >
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone === "destructive" ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <p className="mt-4 font-display text-base font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}

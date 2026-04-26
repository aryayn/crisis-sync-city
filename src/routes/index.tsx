import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Radio,
  Shield,
  Users,
} from "lucide-react";
import { buildings } from "@/data/buildings";
import { buildingIcon, buildingTypeLabel, statusConfig } from "@/lib/building-meta";
import { useTheme } from "@/components/app/theme-provider";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CrisisSync AI · Mumbai Live Grid" },
      { name: "description", content: "Live emergency intelligence across Mumbai's airports, hotels, malls and towers." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const [hovered, setHovered] = useState<string | null>(null);
  const { theme, toggle } = useTheme();

  const stats = useMemo(() => {
    const total = buildings.length;
    const incidents = buildings.reduce((s, b) => s + b.activeIncidents, 0);
    const critical = buildings.filter((b) => b.status === "critical").length;
    const occupants = buildings.reduce((s, b) => s + b.occupancy, 0);
    return { total, incidents, critical, occupants };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] radial-spot" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 right-0 top-0 h-px bg-primary/40 animate-scan" />
      </div>

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
            <Shield className="h-4 w-4 text-primary" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success shadow-[0_0_10px_var(--success)]" />
          </div>
          <div>
            <p className="font-display text-base font-semibold leading-none tracking-tight">CrisisSync<span className="text-primary">.</span>AI</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">City Emergency Intelligence</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-surface/40 px-4 py-1.5 backdrop-blur md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Live · Mumbai Grid</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggle} className="font-mono text-[11px] uppercase tracking-widest">
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
      </header>

      {/* Hero copy */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-4 md:px-10 md:pt-8">
        <div className="flex flex-col gap-2 animate-fade-up">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-surface/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <Radio className="h-3 w-3 text-primary" /> Operational · {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
            Mumbai <span className="text-gradient">live grid</span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">
            Select a building to access its emergency operations dashboard. Real-time status, incidents, and evacuation intelligence.
          </p>
        </div>
      </section>

      {/* Stat strip */}
      <section className="relative z-10 mx-auto mt-8 max-w-6xl px-6 md:px-10">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 md:grid-cols-4">
          <Stat label="Buildings online" value={stats.total} icon={Shield} accent="text-primary" />
          <Stat label="Active incidents" value={stats.incidents} icon={AlertTriangle} accent="text-warning" />
          <Stat label="Critical zones" value={stats.critical} icon={Activity} accent="text-destructive" />
          <Stat label="People monitored" value={stats.occupants.toLocaleString()} icon={Users} accent="text-foreground" />
        </div>
      </section>

      {/* Map area */}
      <section className="relative z-10 mx-auto mt-8 max-w-6xl px-6 pb-16 md:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface/40 shadow-elevated backdrop-blur">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_10px_var(--destructive)]" />
              <span className="h-2 w-2 rounded-full bg-warning" />
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">/grid/mumbai/v2</span>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">19.0760° N · 72.8777° E</span>
          </div>

          <div className="relative aspect-[16/10] w-full grid-bg-fine">
            <StylizedMumbaiMap />

            {buildings.map((b, idx) => {
              const Icon = buildingIcon[b.type];
              const cfg = statusConfig[b.status];
              const isHover = hovered === b.id;
              return (
                <Link
                  key={b.id}
                  to="/building/$buildingId/login"
                  params={{ buildingId: b.id }}
                  onMouseEnter={() => setHovered(b.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 outline-none animate-fade-up"
                  style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${idx * 60}ms` }}
                >
                  {/* Pulse */}
                  {b.status !== "normal" && (
                    <span className={`absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${b.status === "critical" ? "bg-destructive/30" : "bg-warning/30"} animate-pulse-ring`} />
                  )}
                  {/* Marker */}
                  <span className={`relative grid h-10 w-10 place-items-center rounded-2xl border bg-surface-elevated shadow-card ring-2 ${cfg.ring} transition-all duration-300 group-hover:scale-110 group-focus-visible:scale-110 ${b.status === "critical" ? "border-destructive/60" : b.status === "warning" ? "border-warning/60" : "border-border-strong"}`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                    <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                  </span>

                  {/* Hover card */}
                  <div className={`pointer-events-none absolute left-1/2 top-full z-30 mt-3 w-64 -translate-x-1/2 rounded-2xl border border-border-strong bg-popover/95 p-4 text-left shadow-elevated backdrop-blur transition-all duration-200 ${isHover ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{buildingTypeLabel[b.type]} · {b.area}</p>
                        <p className="mt-1 font-display text-sm font-semibold leading-tight">{b.shortName}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center gap-1.5 ${cfg.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <span className="text-muted-foreground">{b.activeIncidents} active</span>
                    </div>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${Math.round((b.occupancy / b.capacity) * 100)}%` }} />
                    </div>
                    <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                      {b.occupancy.toLocaleString()} / {b.capacity.toLocaleString()} occupants
                    </p>
                  </div>
                </Link>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-full border border-border/60 bg-surface/80 px-4 py-2 backdrop-blur">
              {(["normal", "warning", "critical"] as const).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusConfig[s].dot}`} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{statusConfig[s].label}</span>
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 right-4 rounded-full border border-border/60 bg-surface/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
              Click any node to enter
            </div>
          </div>
        </div>

        {/* Building list */}
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {buildings.map((b, i) => {
            const Icon = buildingIcon[b.type];
            const cfg = statusConfig[b.status];
            return (
              <Link
                key={b.id}
                to="/building/$buildingId/login"
                params={{ buildingId: b.id }}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-card animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl bg-muted ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{buildingTypeLabel[b.type]}</p>
                      <p className="font-display text-sm font-semibold leading-tight">{b.shortName}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.color} ${b.status === "critical" ? "border-destructive/40 bg-destructive/10" : b.status === "warning" ? "border-warning/40 bg-warning/10" : "border-success/40 bg-success/10"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{b.area} · {b.floors} floors</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {b.occupancy.toLocaleString()} occupants
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Enter <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: React.ElementType; accent: string }) {
  return (
    <div className="bg-surface/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">{value}</p>
    </div>
  );
}

function StylizedMumbaiMap() {
  return (
    <svg
      viewBox="0 0 800 500"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.16 210)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="oklch(0.78 0.16 210)" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.5 0.1 220)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="oklch(0.5 0.1 220)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Water (Arabian Sea) */}
      <rect width="800" height="500" fill="url(#water)" />

      {/* Mumbai landmass — stylized */}
      <path
        d="M 180 60 L 320 50 L 420 90 L 480 140 L 520 220 L 540 300 L 510 360 L 470 410 L 380 450 L 300 480 L 220 460 L 180 400 L 200 320 L 180 240 L 200 160 Z"
        fill="url(#land)"
        stroke="oklch(0.78 0.16 210 / 0.4)"
        strokeWidth="1"
      />
      {/* Bandra peninsula */}
      <path
        d="M 380 240 L 460 250 L 480 280 L 440 310 L 380 290 Z"
        fill="oklch(0.78 0.16 210 / 0.08)"
        stroke="oklch(0.78 0.16 210 / 0.3)"
        strokeWidth="1"
      />
      {/* Roads */}
      <path d="M 220 100 L 280 200 L 340 280 L 380 380 L 360 460" stroke="oklch(1 0 0 / 0.08)" strokeWidth="1.5" fill="none" />
      <path d="M 200 250 L 350 260 L 480 270" stroke="oklch(1 0 0 / 0.08)" strokeWidth="1.5" fill="none" />
      <path d="M 300 80 L 320 200 L 310 320 L 290 440" stroke="oklch(1 0 0 / 0.06)" strokeWidth="1" fill="none" strokeDasharray="2 4" />

      {/* Labels */}
      <text x="100" y="40" fill="oklch(0.66 0.015 240)" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="2">ARABIAN SEA</text>
      <text x="600" y="200" fill="oklch(0.66 0.015 240)" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="2">THANE CREEK</text>
      <text x="350" y="490" fill="oklch(0.66 0.015 240)" fontSize="8" fontFamily="JetBrains Mono" letterSpacing="2" opacity="0.7">SOUTH MUMBAI</text>
    </svg>
  );
}

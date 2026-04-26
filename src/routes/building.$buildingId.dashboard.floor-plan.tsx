import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DoorOpen, Flame, Heart, Layers, MapPin, ShieldAlert, ZoomIn, ZoomOut } from "lucide-react";
import { getBuilding } from "@/data/buildings";

export const Route = createFileRoute("/building/$buildingId/dashboard/floor-plan")({
  component: FloorPlanPage,
});

interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "room" | "exit" | "corridor" | "stairs" | "hazard";
}

const zones: Zone[] = [
  { id: "z1", label: "Concourse A", x: 8, y: 12, w: 26, h: 18, kind: "room" },
  { id: "z2", label: "Retail Zone D", x: 38, y: 12, w: 26, h: 18, kind: "hazard" },
  { id: "z3", label: "Lounge B", x: 68, y: 12, w: 24, h: 18, kind: "room" },
  { id: "z4", label: "Main Corridor", x: 8, y: 34, w: 84, h: 8, kind: "corridor" },
  { id: "z5", label: "Gate C12", x: 8, y: 46, w: 18, h: 16, kind: "room" },
  { id: "z6", label: "Gate C14", x: 30, y: 46, w: 18, h: 16, kind: "room" },
  { id: "z7", label: "Gate C16", x: 52, y: 46, w: 18, h: 16, kind: "room" },
  { id: "z8", label: "Service", x: 74, y: 46, w: 18, h: 16, kind: "room" },
  { id: "z9", label: "Immigration Hall", x: 14, y: 68, w: 52, h: 18, kind: "room" },
  { id: "z10", label: "Stairs N", x: 70, y: 68, w: 10, h: 18, kind: "stairs" },
  { id: "z11", label: "Exit A", x: 0, y: 30, w: 6, h: 12, kind: "exit" },
  { id: "z12", label: "Exit B", x: 94, y: 30, w: 6, h: 12, kind: "exit" },
  { id: "z13", label: "Main Exit", x: 40, y: 90, w: 18, h: 8, kind: "exit" },
];

const userPos = { x: 36, y: 52 };

function FloorPlanPage() {
  const { buildingId } = Route.useParams();
  const building = getBuilding(buildingId);
  const [floor, setFloor] = useState(2);
  const [selected, setSelected] = useState<Zone | null>(null);
  const [zoom, setZoom] = useState(1);

  if (!building) return null;

  const fillFor = (k: Zone["kind"], active: boolean) => {
    if (k === "hazard") return "fill-destructive/20 stroke-destructive/60";
    if (k === "exit") return "fill-success/25 stroke-success/70";
    if (k === "stairs") return "fill-primary/15 stroke-primary/60";
    if (k === "corridor") return "fill-muted/40 stroke-border-strong";
    return active ? "fill-primary/20 stroke-primary/70" : "fill-surface-elevated stroke-border-strong";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Floor plan · Live</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Spatial intelligence</h1>
          <p className="mt-1 text-sm text-muted-foreground">Click any zone for details. Nearest exits highlighted in green.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-border/60 bg-card">
            {Array.from({ length: Math.min(building.floors, 6) }).map((_, i) => {
              const f = i + 1;
              return (
                <button
                  key={f}
                  onClick={() => setFloor(f)}
                  className={`px-3 py-2 font-mono text-xs transition-all ${floor === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  L{f}
                </button>
              );
            })}
          </div>
          <button onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))} className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-card text-muted-foreground hover:text-foreground">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))} className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-card text-muted-foreground hover:text-foreground">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Floor canvas */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface/40 shadow-card backdrop-blur">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              <Layers className="h-3 w-3" /> Level {floor} · {building.shortName}
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <Legend color="bg-success" label="Exit" />
              <Legend color="bg-destructive" label="Hazard" />
              <Legend color="bg-primary" label="You" />
            </div>
          </div>

          <div className="relative aspect-[4/3] grid-bg-fine overflow-hidden">
            <div className="absolute inset-4 transition-transform duration-500" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
              <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
                {/* Evacuation path: from user → main exit (animated) */}
                <path
                  d={`M ${userPos.x} ${userPos.y} L ${userPos.x} 38 L 49 38 L 49 90`}
                  fill="none"
                  stroke="oklch(0.65 0.16 155)"
                  strokeWidth="0.6"
                  strokeDasharray="2 1.2"
                  className="animate-pulse-soft"
                />

                {zones.map((z) => {
                  const active = selected?.id === z.id;
                  return (
                    <g key={z.id} onClick={() => setSelected(z)} className="cursor-pointer">
                      <rect
                        x={z.x}
                        y={z.y}
                        width={z.w}
                        height={z.h}
                        rx="1.2"
                        className={`${fillFor(z.kind, active)} transition-all hover:opacity-80`}
                        strokeWidth="0.3"
                      />
                      <text
                        x={z.x + z.w / 2}
                        y={z.y + z.h / 2 + 1}
                        textAnchor="middle"
                        className="fill-foreground"
                        fontSize="2"
                        fontFamily="Inter"
                        opacity="0.8"
                      >
                        {z.label}
                      </text>
                      {z.kind === "exit" && (
                        <circle cx={z.x + z.w / 2} cy={z.y + z.h / 2 - 3} r="0.8" className="fill-success animate-pulse-soft" />
                      )}
                      {z.kind === "hazard" && (
                        <circle cx={z.x + z.w / 2} cy={z.y + z.h / 2 - 3} r="0.8" className="fill-destructive animate-pulse-soft" />
                      )}
                    </g>
                  );
                })}

                {/* User marker */}
                <g>
                  <circle cx={userPos.x} cy={userPos.y} r="2.4" className="fill-primary/30 animate-pulse-ring" />
                  <circle cx={userPos.x} cy={userPos.y} r="1.2" className="fill-primary" />
                </g>
              </svg>
            </div>

            <div className="absolute bottom-3 left-3 rounded-full border border-border/60 bg-surface/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
              <MapPin className="mr-1 inline h-3 w-3 text-primary" /> You · Gate C14 vicinity
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
            <div className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4 text-success" />
              <p className="font-display text-sm font-semibold text-success">Nearest safe exit</p>
            </div>
            <p className="mt-2 text-sm">Main Exit · ~24m south</p>
            <p className="mt-1 text-xs text-muted-foreground">Path clear · Avoid Retail Zone D (active hazard)</p>
            <button className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-success px-3 py-2 text-xs font-medium text-success-foreground transition-all hover:opacity-90">
              <DoorOpen className="h-3.5 w-3.5" /> Begin guided evacuation
            </button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Selection</p>
            {selected ? (
              <>
                <p className="mt-2 font-display text-lg font-semibold">{selected.label}</p>
                <p className="text-xs capitalize text-muted-foreground">{selected.kind}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Mini icon={Heart} label="Status" value={selected.kind === "hazard" ? "Hazard" : "Clear"} accent={selected.kind === "hazard" ? "text-destructive" : "text-success"} />
                  <Mini icon={ShieldAlert} label="People" value={selected.kind === "hazard" ? "12" : "—"} />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Tap any zone on the floor plan for live details.</p>
            )}
          </div>

          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-destructive" />
              <p className="font-display text-sm font-semibold text-destructive">Active hazard</p>
            </div>
            <p className="mt-2 text-sm">Smoke detected · Retail Zone D</p>
            <p className="mt-1 text-xs text-muted-foreground">Avoid corridor between C14–C16. Containment in progress.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.2em] text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} /> {label}
    </span>
  );
}

function Mini({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background p-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-1 text-sm font-semibold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

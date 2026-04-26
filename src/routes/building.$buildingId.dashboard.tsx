import { createFileRoute, Link, Outlet, useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  AlertOctagon,
  Bell,
  ChevronLeft,
  LayoutGrid,
  LogOut,
  Map as MapIcon,
  MessageSquare,
  Radio,
  Settings,
  Shield,
  Siren,
  Sun,
  Moon,
} from "lucide-react";
import { getBuilding } from "@/data/buildings";
import { buildingIcon, buildingTypeLabel, statusConfig } from "@/lib/building-meta";
import { useTheme } from "@/components/app/theme-provider";
import { Button } from "@/components/ui/button";
import { ensureSingleBuildingSession, hasBuildingSession } from "@/lib/auth";

export const Route = createFileRoute("/building/$buildingId/dashboard")({
  head: ({ params }) => {
    const b = getBuilding(params.buildingId);
    return {
      meta: [
        { title: b ? `${b.shortName} · Operations` : "Operations · CrisisSync" },
        { name: "description", content: "Live operations dashboard for building emergency intelligence." },
      ],
    };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { buildingId } = Route.useParams();
  const building = getBuilding(buildingId);
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Switching buildings invalidates prior session, and dashboard requires building login.
    ensureSingleBuildingSession(buildingId);
    if (!hasBuildingSession(buildingId)) {
      navigate({ to: "/building/$buildingId/login", params: { buildingId }, replace: true });
    }
  }, [buildingId, navigate]);

  if (!building) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Link to="/" className="text-sm text-primary hover:underline">← Return to map</Link>
      </div>
    );
  }

  const Icon = buildingIcon[building.type];
  const cfg = statusConfig[building.status];

  const nav: Array<{ to: string; label: string; icon: typeof LayoutGrid; end?: boolean; urgent?: boolean }> = [
    { to: "/building/$buildingId/dashboard", label: "Overview", icon: LayoutGrid, end: true },
    { to: "/building/$buildingId/dashboard/floor-plan", label: "Floor Plan", icon: MapIcon },
    { to: "/building/$buildingId/dashboard/sos", label: "Emergency SOS", icon: Siren, urgent: true },
    { to: "/building/$buildingId/dashboard/incidents", label: "Live Incidents", icon: AlertOctagon },
    { to: "/building/$buildingId/dashboard/comms", label: "Communications", icon: MessageSquare },
    { to: "/building/$buildingId/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/60 bg-sidebar md:flex">
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold leading-none">CrisisSync<span className="text-primary">.</span>AI</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Operations</p>
          </div>
        </div>

        {/* Building card */}
        <div className="px-4 pt-4">
          <div className="rounded-2xl border border-border/60 bg-card p-3">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold">{building.shortName}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{buildingTypeLabel[building.type]} · {building.area}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px]">
              <span className={`inline-flex items-center gap-1.5 ${cfg.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              <span className="font-mono text-muted-foreground">{building.activeIncidents} active</span>
            </div>
          </div>
        </div>

        <nav className="mt-5 flex-1 space-y-1 px-3">
          {nav.map((n) => {
            const NIcon = n.icon;
            const active = n.end
              ? location.pathname === `/building/${buildingId}/dashboard`
              : location.pathname.startsWith(`/building/${buildingId}/dashboard/${n.to.split("/").pop()}`);
            return (
              <Link
                key={n.to}
                to={n.to as "/building/$buildingId/dashboard"}
                params={{ buildingId }}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_var(--border-strong)]"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                <NIcon className={`h-4 w-4 ${n.urgent ? "text-destructive" : ""}`} />
                <span className="flex-1">{n.label}</span>
                {n.urgent && (
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive shadow-[0_0_8px_var(--destructive)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Exit facility
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="md:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:text-foreground md:hidden">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-surface/40 px-3 py-1 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${building.status === "critical" ? "bg-destructive" : building.status === "warning" ? "bg-warning" : "bg-success"}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${building.status === "critical" ? "bg-destructive" : building.status === "warning" ? "bg-warning" : "bg-success"}`} />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground hidden sm:inline">
                Live · {building.shortName}
              </span>
            </div>
            <div className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground lg:flex">
              <Radio className="h-3 w-3" />
              CHANNEL 07 · Mumbai Grid
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} className="h-9 w-9 rounded-xl">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
              <Bell className="h-4 w-4" />
              {building.activeIncidents > 0 && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive shadow-[0_0_8px_var(--destructive)]" />
              )}
            </Button>
            <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-surface/40 px-3 py-1.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 font-mono text-[10px] font-semibold text-primary">RS</div>
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium leading-none">Cmdr. R. Sharma</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Emergency Personnel</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function useBuildingFromRoute() {
  const params = useParams({ strict: false }) as { buildingId?: string };
  return params.buildingId ? getBuilding(params.buildingId) : undefined;
}

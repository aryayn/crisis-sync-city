import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Briefcase, Lock, Mail, Shield, User, UserCheck, KeyRound } from "lucide-react";
import { getBuilding } from "@/data/buildings";
import { buildingIcon, buildingTypeLabel, statusConfig } from "@/lib/building-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ensureSingleBuildingSession, setBuildingSession } from "@/lib/auth";

export const Route = createFileRoute("/building/$buildingId/login")({
  head: ({ params }) => {
    const b = getBuilding(params.buildingId);
    return {
      meta: [
        { title: b ? `${b.shortName} · Secure Access` : "Secure Access · CrisisSync" },
        { name: "description", content: "Building-specific secure access for authorized personnel." },
      ],
    };
  },
  component: LoginPage,
});

const roles = [
  { id: "guest", label: "Guest / Visitor", icon: User, hint: "Limited view · Safety guidance only" },
  { id: "staff", label: "Staff", icon: Briefcase, hint: "Operational tools and incident reporting" },
  { id: "emergency", label: "Emergency Personnel", icon: UserCheck, hint: "Full command & control access" },
] as const;

function LoginPage() {
  const { buildingId } = Route.useParams();
  const building = getBuilding(buildingId);
  const navigate = useNavigate();
  
  const [step, setStep] = useState<"email" | "otp">("email");
  const [role, setRole] = useState<(typeof roles)[number]["id"]>("staff");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureSingleBuildingSession(buildingId);
  }, [buildingId]);

  if (!building) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Unknown node</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Building not on grid</h1>
          <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">← Return to map</Link>
        </div>
      </div>
    );
  }

  const Icon = buildingIcon[building.type];
  const cfg = statusConfig[building.status];

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      toast("Verification code sent to email.");
    }, 800);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setLoading(true);
    setTimeout(() => {
      setBuildingSession(buildingId, role, email);
      toast.success(`Verified · Welcome ${email.split("@")[0]}`);
      navigate({ to: "/building/$buildingId/dashboard", params: { buildingId } });
    }, 1000);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] radial-spot" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Mumbai grid
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-surface/40 px-3 py-1.5 backdrop-blur">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Encrypted channel</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-6 md:grid-cols-2 md:px-10 md:pt-12">
        <section className="animate-fade-up">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] ${cfg.color} ${building.status === "critical" ? "border-destructive/40 bg-destructive/10" : building.status === "warning" ? "border-warning/40 bg-warning/10" : "border-success/40 bg-success/10"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{buildingTypeLabel[building.type]} · {building.area}</p>
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{building.shortName}</h1>
            </div>
          </div>

          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Secure access for authorized individuals. Your role determines available tools and command authority within this facility.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60">
            <Mini label="Floors" value={building.floors} />
            <Mini label="Occupants" value={building.occupancy.toLocaleString()} />
            <Mini label="Capacity" value={`${Math.round((building.occupancy / building.capacity) * 100)}%`} />
          </div>
        </section>

        <section className="animate-fade-up [animation-delay:120ms]">
          <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-surface/80 p-7 shadow-elevated backdrop-blur">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Secure access</p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Authenticate</h2>
              </div>
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>

            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} className="mt-7 space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Work Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="name@organization.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl border-border bg-background pl-10 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Access role</Label>
                  <div className="grid gap-2">
                    {roles.map((r) => {
                      const RIcon = r.icon;
                      const active = role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                            active
                              ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]"
                              : "border-border bg-background hover:border-border-strong"
                          }`}
                        >
                          <div className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            <RIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{r.label}</p>
                            <p className="text-xs text-muted-foreground">{r.hint}</p>
                          </div>
                          <span className={`h-2 w-2 rounded-full transition-all ${active ? "bg-primary shadow-[0_0_10px_var(--primary)]" : "bg-border"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="mt-7 h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground transition-all hover:opacity-90"
                >
                  {loading ? "Sending link…" : (
                    <span className="inline-flex items-center gap-2">Continue with Email <ArrowRight className="h-4 w-4" /></span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="mt-7 space-y-5 animate-fade-in">
                <div className="rounded-xl border border-border/60 bg-surface p-4 text-sm text-muted-foreground">
                  We sent a 4-digit verification code to <strong className="text-foreground">{email}</strong>. Enter it below.
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="otp" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Verification Code</Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      required
                      placeholder="1234"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="h-12 rounded-xl border-border bg-background pl-10 text-base tracking-widest"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="mt-7 h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground transition-all hover:opacity-90"
                >
                  {loading ? "Verifying…" : (
                    <span className="inline-flex items-center gap-2">Verify and Enter <ArrowRight className="h-4 w-4" /></span>
                  )}
                </Button>

                <button 
                  type="button" 
                  onClick={() => setStep("email")}
                  className="mx-auto mt-2 block text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Wrong email? Go back.
                </button>
              </form>
            )}

            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Session encrypted · TLS 1.3 · {buildingId}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface/60 p-3 backdrop-blur">
      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}

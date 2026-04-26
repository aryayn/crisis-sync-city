import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Accessibility, Bell, Eye, Languages, Moon, Sun, Type, Volume2 } from "lucide-react";
import { useTheme } from "@/components/app/theme-provider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/building/$buildingId/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [notif, setNotif] = useState({ critical: true, warnings: true, broadcasts: true, daily: false });
  const [a11y, setA11y] = useState({ largeText: false, highContrast: false, reduceMotion: false, audio: true });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Personal preferences</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tune your CrisisSync experience for clarity and speed.</p>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 font-display text-lg font-semibold text-primary">RS</div>
          <div className="flex-1">
            <p className="font-display text-base font-semibold">Cmdr. R. Sharma</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Emergency Personnel · ID #4471</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Display name" defaultValue="Cmdr. R. Sharma" />
          <Field label="Email" defaultValue="commander@crisissync.ai" />
          <Field label="Phone" defaultValue="+91 98XXX XXXXX" />
          <Field label="Designation" defaultValue="Incident Commander" />
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Row
          icon={theme === "dark" ? Moon : Sun}
          title="Theme"
          desc={`Currently ${theme === "dark" ? "Dark — operations" : "Light — daylight"}`}
          right={
            <button
              onClick={toggle}
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-card px-3 py-2 text-xs font-medium transition-all hover:bg-surface-elevated"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              Switch to {theme === "dark" ? "light" : "dark"}
            </button>
          }
        />
        <Row
          icon={Languages}
          title="Language"
          desc="Interface language for crisis communications"
          right={<span className="font-mono text-xs text-muted-foreground">English (IN)</span>}
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <ToggleRow icon={Bell} title="Critical alerts" desc="Fire, security threats, evacuations" checked={notif.critical} onChange={(v) => setNotif({ ...notif, critical: v })} />
        <ToggleRow icon={Bell} title="Warnings" desc="Elevated risk, medical events" checked={notif.warnings} onChange={(v) => setNotif({ ...notif, warnings: v })} />
        <ToggleRow icon={Volume2} title="Channel broadcasts" desc="All-hands radio messages" checked={notif.broadcasts} onChange={(v) => setNotif({ ...notif, broadcasts: v })} />
        <ToggleRow icon={Bell} title="Daily summary" desc="End-of-shift recap email" checked={notif.daily} onChange={(v) => setNotif({ ...notif, daily: v })} />
      </Section>

      {/* Accessibility */}
      <Section title="Accessibility" subtitle="Critical for stressed users — tune for clarity">
        <ToggleRow icon={Type} title="Large text" desc="Increases base font size by 15%" checked={a11y.largeText} onChange={(v) => setA11y({ ...a11y, largeText: v })} />
        <ToggleRow icon={Eye} title="High contrast" desc="Stronger borders and text contrast" checked={a11y.highContrast} onChange={(v) => setA11y({ ...a11y, highContrast: v })} />
        <ToggleRow icon={Accessibility} title="Reduce motion" desc="Minimizes animations and transitions" checked={a11y.reduceMotion} onChange={(v) => setA11y({ ...a11y, reduceMotion: v })} />
        <ToggleRow icon={Volume2} title="Audio cues" desc="Audible feedback for alerts" checked={a11y.audio} onChange={(v) => setA11y({ ...a11y, audio: v })} />
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, title, desc, right }: { icon: React.ElementType; title: string; desc: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {right}
    </div>
  );
}

function ToggleRow({ icon, title, desc, checked, onChange }: { icon: React.ElementType; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <Row icon={icon} title={title} desc={desc} right={<Switch checked={checked} onCheckedChange={onChange} />} />;
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
      <Input defaultValue={defaultValue} className="h-10 rounded-xl border-border bg-background" />
    </div>
  );
}

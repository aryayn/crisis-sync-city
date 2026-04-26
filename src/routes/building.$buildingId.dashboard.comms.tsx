import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Megaphone, Send, ShieldAlert, Stethoscope, Users } from "lucide-react";
import { getBuilding, initialMessages, type Message } from "@/data/buildings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/building/$buildingId/dashboard/comms")({
  component: CommsPage,
});

const quickActions = [
  { id: "evac", label: "Evacuate now", icon: Megaphone, text: "BROADCAST: Evacuate immediately. Use nearest marked exit.", tone: "destructive" as const },
  { id: "calm", label: "Stay calm", icon: Users, text: "All occupants: Remain calm. Await further instructions.", tone: "primary" as const },
  { id: "med", label: "Medical dispatched", icon: Stethoscope, text: "Medical team dispatched to incident location. ETA imminent.", tone: "warning" as const },
  { id: "sec", label: "Lockdown active", icon: ShieldAlert, text: "Security lockdown active. Shelter in place until further notice.", tone: "destructive" as const },
];

function CommsPage() {
  const { buildingId } = Route.useParams();
  const building = getBuilding(buildingId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!building) return null;

  const send = (text: string, kind: Message["kind"] = "info", from = "Cmdr. R. Sharma") => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [
      ...m,
      {
        id: `m${Date.now()}`,
        from,
        role: from === "Cmdr. R. Sharma" ? "Incident Commander" : "Broadcast",
        text: t,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        kind,
      },
    ]);
    setInput("");
  };

  const broadcast = (text: string) => {
    send(text, "alert", "Command Center");
    toast.success("Broadcast sent to all channels");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Communications · Channel 07</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Coordination panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Broadcast alerts and coordinate with response teams in real time.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Chat */}
        <div className="flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Live · 12 participants</p>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">{building.shortName}</p>
          </div>

          <div className="max-h-[480px] flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.map((m) => (
              <div key={m.id} className={`animate-fade-up ${m.kind === "alert" ? "rounded-xl border border-destructive/30 bg-destructive/5 p-3" : m.kind === "system" ? "text-center" : ""}`}>
                {m.kind === "system" ? (
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">— {m.text} · {m.time}</p>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {m.from} <span className="font-mono text-[10px] font-normal uppercase tracking-[0.2em] text-muted-foreground">{m.role}</span>
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">{m.time}</p>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{m.text}</p>
                  </>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border/60 bg-surface/60 p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message to channel…"
              className="h-11 rounded-xl border-border bg-background"
            />
            <Button type="submit" className="h-11 rounded-xl" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Quick broadcasts</p>
          {quickActions.map((q) => {
            const Icon = q.icon;
            const tone =
              q.tone === "destructive"
                ? "border-destructive/40 bg-destructive/5 hover:bg-destructive/10 text-destructive"
                : q.tone === "warning"
                ? "border-warning/40 bg-warning/5 hover:bg-warning/10 text-warning"
                : "border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary";
            return (
              <button
                key={q.id}
                onClick={() => broadcast(q.text)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${tone}`}
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-current/15">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{q.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{q.text}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

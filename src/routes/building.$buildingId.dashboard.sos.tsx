import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Mic, Loader2, StopCircle } from "lucide-react";
import { aiClassify, createVoiceController, type VoiceState, type AIClassification } from "@/lib/ai-classify";
import { useIncidentContext } from "@/contexts/IncidentContext";
import { toast } from "sonner";

export const Route = createFileRoute("/building/$buildingId/dashboard/sos")({
  component: SOSPage,
});

export default function SOSPage() {
  return <SOSFlow />;
}

function SOSFlow() {
  const { buildingId } = Route.useParams();
  const navigate = useNavigate();
  const { addIncident } = useIncidentContext();
  
  const [stage, setStage] = useState<"idle" | "details" | "analyzing" | "review" | "dispatched">("idle");
  const [type, setType] = useState<any>(null);
  const [severity, setSeverity] = useState<any>(null);
  const [description, setDescription] = useState("");
  
  const [aiResult, setAiResult] = useState<AIClassification | null>(null);
  
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const voiceControllerRef = useRef<ReturnType<typeof createVoiceController> | null>(null);

  // Initialize Voice Controller
  useEffect(() => {
    voiceControllerRef.current = createVoiceController({
      onStateChange: setVoiceState,
      onResult: (transcript) => {
        setDescription((prev) => (prev ? prev + " " + transcript : transcript));
      },
      onError: (msg) => toast.error(msg)
    });
  }, []);

  const handleVoiceToggle = () => {
    if (!voiceControllerRef.current?.supported) {
      toast.error("Voice not supported in this browser");
      return;
    }
    if (voiceState === "listening") {
      voiceControllerRef.current.stop();
    } else if (voiceState === "idle") {
      voiceControllerRef.current.start();
    }
  };

  const handleAnalyze = async () => {
    if (!description && !type) return;
    setStage("analyzing");
    try {
      const result = await aiClassify(description, type);
      setAiResult(result);
      if (result.type) setType(result.type);
      if (result.severity) setSeverity(result.severity);
      setStage("review");
    } catch (err: any) {
      console.error("AI Error:", err);
      toast.error(err.message || "AI Analysis failed.");
      setStage("details");
    }
  };

  const handleDispatch = () => {
    const id = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    
    addIncident(buildingId, {
      id,
      type: type || "evacuation",
      severity: severity || "medium",
      location: "Auto-detected Location",
      floor: 1,
      status: "active",
      reportedAt: "Just now",
      responder: aiResult?.responderType || "Command Center",
      eta: aiResult?.estimatedEta || "2 min",
      description: description,
      translatedText: aiResult?.translatedText,
      detectedLanguage: aiResult?.detectedLanguage
    });
    
    setStage("dispatched");
    toast.success("Incident broadcast to all responders");
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">

      {stage === "idle" && (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <button
            onClick={() => setStage("details")}
            className="w-56 h-56 rounded-full bg-destructive text-destructive-foreground text-4xl font-bold animate-pulse shadow-[0_0_120px_var(--destructive)] hover:scale-105 transition-transform"
          >
            SOS
          </button>
          <p className="mt-10 text-muted-foreground font-mono text-sm tracking-widest uppercase">Tap to declare emergency</p>
        </div>
      )}

      {stage === "details" && (
        <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 animate-fade-up">
          <div>
            <h2 className="font-display text-4xl font-bold tracking-tight">Declare Emergency</h2>
            <p className="mt-2 text-muted-foreground">Select a category or simply describe the situation. AI will auto-categorize.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["fire", "medical", "security", "structural"].map(t => (
              <div 
                key={t} 
                onClick={() => setType(t)}
                className={`p-5 rounded-2xl cursor-pointer border transition-all text-center capitalize ${type === t ? "border-primary bg-primary/20 shadow-[0_0_30px_var(--primary)]" : "border-border bg-card hover:bg-surface"}`}
              >
                <div className="text-3xl mb-2">{t === "fire" ? "🔥" : t === "medical" ? "🩺" : t === "security" ? "🛡" : "🏗"}</div>
                <div className="font-medium text-sm">{t}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Description (Any Language or Voice)</label>
            <div className="relative">
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the emergency in any language..."
                className="w-full min-h-[140px] p-5 pr-16 bg-card border border-border rounded-2xl text-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/50" 
              />
              <button 
                onClick={handleVoiceToggle}
                className={`absolute right-4 bottom-4 p-3 rounded-xl transition-all ${
                  voiceState === "listening" 
                    ? "bg-destructive text-destructive-foreground animate-pulse shadow-[0_0_20px_var(--destructive)]" 
                    : voiceState === "processing"
                    ? "bg-warning text-warning-foreground"
                    : "bg-surface border border-border text-foreground hover:bg-surface-elevated"
                }`}
              >
                {voiceState === "listening" ? <StopCircle className="h-5 w-5" /> : voiceState === "processing" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
              </button>
            </div>
            {voiceState === "listening" && <p className="text-xs text-destructive animate-pulse">Listening... speak in any language</p>}
            {voiceState === "processing" && <p className="text-xs text-warning animate-pulse">Transcribing & translating audio via OpenAI Whisper...</p>}
          </div>

          <button 
            disabled={!description && !type}
            onClick={handleAnalyze}
            className="w-full py-5 bg-primary text-primary-foreground rounded-2xl text-lg font-semibold transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Emergency
          </button>
        </div>
      )}

      {stage === "analyzing" && (
        <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <h2 className="font-display text-2xl font-semibold animate-pulse">AI is translating and classifying input...</h2>
          <p className="text-muted-foreground font-mono text-xs">Model: gpt-4o-mini</p>
        </div>
      )}

      {stage === "review" && aiResult && (
        <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8 animate-fade-up">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold">AI Analysis Complete</h2>
            <p className="mt-2 text-muted-foreground">Please review and confirm dispatch.</p>
          </div>

          <div className="rounded-3xl border border-border bg-card overflow-hidden">
            <div className={`p-6 border-b border-border flex items-center justify-between ${
              aiResult.severity === "critical" ? "bg-destructive/10" : aiResult.severity === "high" ? "bg-warning/10" : "bg-primary/10"
            }`}>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Category</p>
                <p className="text-2xl font-bold capitalize mt-1">{aiResult.type} · {aiResult.severity}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">AI Confidence</p>
                <p className="text-2xl font-bold mt-1">{Math.round(aiResult.confidence * 100)}%</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {aiResult.detectedLanguage && aiResult.detectedLanguage !== "English" && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Original Text ({aiResult.detectedLanguage})</p>
                  <p className="mt-1 text-sm italic">"{description}"</p>
                  <div className="mt-3 p-3 bg-surface rounded-xl border border-border/50">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">Translated to English</p>
                    <p className="text-sm font-medium">{aiResult.translatedText}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">AI Reasoning</p>
                <p className="mt-1 text-sm">{aiResult.reasoning}</p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dispatch Plan</p>
                <p className="mt-1 text-sm font-medium">{aiResult.responderType} · ETA {aiResult.estimatedEta}</p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Suggested Actions</p>
                <ul className="mt-2 space-y-2">
                  {aiResult.suggestedActions.map((act, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary">•</span> {act}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setStage("details")}
              className="flex-1 py-4 border border-border rounded-xl font-medium hover:bg-surface transition-colors"
            >
              Back
            </button>
            <button 
              onClick={handleDispatch}
              className="flex-[2] py-4 bg-success text-success-foreground rounded-xl text-lg font-bold hover:bg-success/90 transition-all shadow-[0_0_20px_var(--success)]"
            >
              CONFIRM DISPATCH
            </button>
          </div>
        </div>
      )}

      {stage === "dispatched" && (
        <div className="flex flex-col items-center justify-center h-[80vh] space-y-6 animate-fade-in text-center px-6">
          <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center text-success border-4 border-success animate-pulse">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-display font-bold">Emergency Active</h1>
          <p className="text-muted-foreground max-w-md">The incident has been broadcasted to all responders and synced across the building network.</p>
          
          <button 
            onClick={() => navigate({ to: "/building/$buildingId/dashboard/incidents", params: { buildingId } })}
            className="mt-8 px-8 py-3 bg-surface border border-border rounded-xl font-medium hover:bg-surface-elevated transition-colors"
          >
            View Live Incident Board
          </button>
        </div>
      )}
    </div>
  );
}

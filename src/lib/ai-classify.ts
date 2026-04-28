import type { Incident } from "@/data/buildings";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIClassification {
  type: Incident["type"];
  severity: Incident["severity"];
  confidence: number; // 0–1
  suggestedActions: string[];
  evacuationNote: string;
  responderType: string;
  estimatedEta: string;
  reasoning: string;
  translatedText: string;
  detectedLanguage: string;
}

// ─── Keyword Engine (Offline Mock) ────────────────────────────────────────────

interface RuleSet {
  keywords: string[];
  type: Incident["type"];
  severityHints: Array<{ keywords: string[]; severity: Incident["severity"] }>;
  baseSeverity: Incident["severity"];
  actions: string[];
  evacuationNote: string;
  responderType: string;
}

const RULE_SETS: RuleSet[] = [
  {
    type: "fire",
    keywords: ["fire", "smoke", "flame", "burn", "ignition", "fuego", "incendio", "feu"],
    baseSeverity: "medium",
    severityHints: [
      { keywords: ["explosion", "inferno"], severity: "critical" },
      { keywords: ["fire", "flames", "fuego", "feu"], severity: "high" },
      { keywords: ["smoke", "humo", "fumée"], severity: "medium" },
    ],
    actions: [
      "Stay low and move away from smoke",
      "Activate nearest fire alarm pull station",
      "Wait for fire response team clearance before re-entry",
    ],
    evacuationNote: "Evacuate via nearest exit. Avoid smoke-filled corridors.",
    responderType: "Fire Response Unit",
  },
  {
    type: "medical",
    keywords: ["medical", "injured", "pain", "heart", "breathing", "blood", "ayuda", "médico", "secours", "help"],
    baseSeverity: "medium",
    severityHints: [
      { keywords: ["unconscious", "heart attack", "corazón"], severity: "critical" },
      { keywords: ["bleeding", "sangre"], severity: "high" },
      { keywords: ["pain", "dolor"], severity: "medium" },
    ],
    actions: [
      "Do not move the patient unless in immediate danger",
      "Keep patient conscious and calm",
      "Clear a 3m radius around patient for responder access",
    ],
    evacuationNote: "Medical team requires clear access. Do not crowd.",
    responderType: "Medical Alpha",
  },
  {
    type: "security",
    keywords: ["security", "threat", "weapon", "gun", "knife", "intruder", "arma", "peligro", "menace"],
    baseSeverity: "high",
    severityHints: [
      { keywords: ["gun", "weapon", "arma"], severity: "critical" },
      { keywords: ["threat", "peligro"], severity: "high" },
    ],
    actions: [
      "Do not confront the individual — evacuate the area",
      "Shelter in place if instructed by security",
      "Security Bravo team has been notified",
    ],
    evacuationNote: "Follow security team instructions. Shelter in nearest room.",
    responderType: "Security Bravo",
  },
];

const ETA_BY_SEVERITY: Record<Incident["severity"], string> = {
  critical: "< 1 min",
  high: "1–2 min",
  medium: "2–4 min",
  low: "4–6 min",
};

// ─── Core Classifier ──────────────────────────────────────────────────────────

export async function aiClassify(
  description: string,
  typeHint?: Incident["type"]
): Promise<AIClassification> {
  // Simulate AI processing time (1.5 - 2.5 seconds)
  const delay = 1500 + Math.random() * 1000;
  await new Promise((r) => setTimeout(r, delay));

  const lowerDesc = description.toLowerCase();
  
  // Fake Language Detection & Translation
  let detectedLanguage = "English";
  let translatedText = description;

  if (lowerDesc.includes("fuego") || lowerDesc.includes("ayuda") || lowerDesc.includes("incendio") || lowerDesc.includes("sangre") || lowerDesc.includes("arma") || lowerDesc.includes("peligro") || lowerDesc.includes("corazón")) {
    detectedLanguage = "Spanish";
    translatedText = lowerDesc
      .replace("fuego", "fire")
      .replace("incendio", "fire")
      .replace("ayuda", "help")
      .replace("sangre", "blood")
      .replace("arma", "weapon")
      .replace("peligro", "danger")
      .replace("corazón", "heart");
  } else if (lowerDesc.includes("feu") || lowerDesc.includes("secours") || lowerDesc.includes("menace") || lowerDesc.includes("fumée")) {
    detectedLanguage = "French";
    translatedText = lowerDesc
      .replace("feu", "fire")
      .replace("secours", "help")
      .replace("menace", "threat")
      .replace("fumée", "smoke");
  }

  if (!description.trim()) {
    return {
      type: typeHint ?? "evacuation",
      severity: "medium",
      confidence: 0.55,
      suggestedActions: ["Dispatch nearest available unit for assessment"],
      evacuationNote: "Standby for updated instructions.",
      responderType: "Command Center",
      estimatedEta: "2–4 min",
      reasoning: "Insufficient description — default protocol engaged.",
      translatedText,
      detectedLanguage
    };
  }

  // Scoring
  let bestRule = RULE_SETS[0];
  let maxScore = -1;

  for (const rule of RULE_SETS) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (translatedText.includes(kw)) score += 1;
    }
    // Boost if hinted
    if (typeHint === rule.type) score += 0.5;
    
    if (score > maxScore) {
      maxScore = score;
      bestRule = rule;
    }
  }

  // Fallback to hint if absolutely no match
  if (maxScore === 0 && typeHint) {
    bestRule = RULE_SETS.find(r => r.type === typeHint) || RULE_SETS[0];
  }

  // Pick severity
  let severity = bestRule.baseSeverity;
  for (const hint of bestRule.severityHints) {
    if (hint.keywords.some((kw) => translatedText.includes(kw))) {
      severity = hint.severity;
      break;
    }
  }

  const confidence = Math.min(0.98, 0.65 + (maxScore * 0.1));

  return {
    type: bestRule.type,
    severity,
    confidence,
    suggestedActions: bestRule.actions,
    evacuationNote: bestRule.evacuationNote,
    responderType: bestRule.responderType,
    estimatedEta: ETA_BY_SEVERITY[severity],
    reasoning: detectedLanguage !== "English" 
      ? `Translated ${detectedLanguage} input. Detected indicators for ${bestRule.type} scenario.` 
      : `Detected ${maxScore} indicators for ${bestRule.type} scenario.`,
    translatedText: detectedLanguage !== "English" ? `[Translated to English] ${translatedText}` : translatedText,
    detectedLanguage,
  };
}


// ─── Voice Input (Browser Native SpeechRecognition) ────────────────────────────

export type VoiceState = "idle" | "listening" | "processing" | "error";

interface VoiceOptions {
  onResult: (transcript: string) => void;
  onStateChange: (state: VoiceState) => void;
  onError?: (msg: string) => void;
}

export function createVoiceController(options: VoiceOptions) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      supported: false,
      start: () => {
        options.onError?.("Voice input not supported in this browser. Use Chrome or Edge.");
        options.onStateChange("error");
      },
      stop: () => {},
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  // Automatically detect language or use a highly compatible language code
  recognition.lang = navigator.language || "en-US";

  recognition.onstart = () => {
    options.onStateChange("listening");
  };

  recognition.onresult = (event: any) => {
    options.onStateChange("processing");
    const transcript = event.results[0]?.[0]?.transcript ?? "";
    options.onResult(transcript);
    
    // Slight delay to simulate "processing/translation" before going idle
    setTimeout(() => {
      options.onStateChange("idle");
    }, 500);
  };

  recognition.onerror = (event: any) => {
    const msg =
      event.error === "not-allowed"
        ? "Microphone access denied."
        : event.error === "no-speech"
          ? "No speech detected. Try again."
          : `Voice error: ${event.error}`;
    options.onError?.(msg);
    options.onStateChange("error");
  };

  recognition.onend = () => {
    // If we didn't explicitly move to processing/error, go idle
    options.onStateChange("idle");
  };

  return {
    supported: true,
    start: () => {
      try {
        recognition.start();
      } catch {
        options.onStateChange("error");
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
  };
}

// ─── Severity helpers (re-exported for UI) ────────────────────────────────────

export const SEVERITY_CONFIG = {
  critical: {
    label: "Critical",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/40",
    dot: "bg-destructive shadow-[0_0_12px_var(--destructive)]",
    ring: "shadow-[0_0_0_2px_var(--destructive)]",
  },
  high: {
    label: "High",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/40",
    dot: "bg-destructive",
    ring: "shadow-[0_0_0_2px_var(--destructive)]",
  },
  medium: {
    label: "Medium",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/40",
    dot: "bg-warning",
    ring: "shadow-[0_0_0_2px_var(--warning)]",
  },
  low: {
    label: "Low",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/40",
    dot: "bg-success",
    ring: "shadow-[0_0_0_2px_var(--success)]",
  },
} as const;

export const TYPE_CONFIG = {
  fire: { label: "Fire", emoji: "🔥" },
  medical: { label: "Medical", emoji: "🏥" },
  security: { label: "Security", emoji: "🛡️" },
  structural: { label: "Structural", emoji: "🏗️" },
  evacuation: { label: "Evacuation", emoji: "🚪" },
} as const;

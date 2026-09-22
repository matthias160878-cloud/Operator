export type AgentKey =
  | "content-brain"
  | "idea"
  | "trend"
  | "research"
  | "script"
  | "hook"
  | "voice"
  | "video"
  | "subtitle"
  | "thumbnail"
  | "hashtag"
  | "publishing"
  | "analytics"
  | "learning"
  | "growth"
  | "message";

export interface AgentDefinition {
  key: AgentKey;
  name: string;
  description: string;
}

export const AGENTS: AgentDefinition[] = [
  {
    key: "content-brain",
    name: "ContentBrainAgent",
    description: "Analysiert Themen und erstellt vollständige Content-Pläne.",
  },
  {
    key: "idea",
    name: "IdeaAgent",
    description: "Generiert Content-Ideen, Themencluster und Serien.",
  },
  {
    key: "trend",
    name: "TrendAgent",
    description: "Recherchiert aktuelle Themen (sofern Datenquelle konfiguriert).",
  },
  {
    key: "research",
    name: "ResearchAgent",
    description: "Vertieft Recherche zu einem Thema für die Content-Strategie.",
  },
  {
    key: "script",
    name: "ScriptAgent",
    description: "Erstellt plattformgerechte Scripts (Hook–Problem–Value–Example–Payoff–CTA).",
  },
  {
    key: "hook",
    name: "HookAgent",
    description: "Erzeugt mehrere Hook-Varianten pro Content-Idee.",
  },
  {
    key: "voice",
    name: "VoiceAgent",
    description: "Erstellt Voiceover via ElevenLabs (sofern konfiguriert).",
  },
  {
    key: "video",
    name: "VideoAgent",
    description: "Orchestriert die Video-Pipeline über austauschbare Provider.",
  },
  {
    key: "subtitle",
    name: "SubtitleAgent",
    description: "Erzeugt Untertitel (SRT/VTT) aus einem Script.",
  },
  {
    key: "thumbnail",
    name: "ThumbnailAgent",
    description: "Entwirft Thumbnail-Konzepte für Bildgeneratoren.",
  },
  {
    key: "hashtag",
    name: "HashtagAgent",
    description: "Erzeugt Hashtags und Keywords je Plattform.",
  },
  {
    key: "publishing",
    name: "PublishingAgent",
    description: "Steuert den Publishing-Workflow (Draft bis Published).",
  },
  {
    key: "analytics",
    name: "AnalyticsAgent",
    description: "Aggregiert Performance-Kennzahlen je Content-Item.",
  },
  {
    key: "learning",
    name: "LearningAgent",
    description: "Leitet Empfehlungen aus historischer Performance ab.",
  },
  {
    key: "growth",
    name: "GrowthAgent",
    description: "Beste Posting-Zeiten, Hashtags und Formate aus echten Analytics — keine Automatisierung.",
  },
  {
    key: "message",
    name: "MessageAgent",
    description: "Entwirft KI-Antworten auf Nachrichten/Kommentare zur manuellen Freigabe.",
  },
];

export function getAgentDefinition(key: AgentKey): AgentDefinition {
  const def = AGENTS.find((a) => a.key === key);
  if (!def) throw new Error(`Unbekannter Agent: ${key}`);
  return def;
}

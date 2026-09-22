import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Factory,
  Lightbulb,
  Brain,
  Dna,
  FileText,
  Mic,
  Video,
  Palette,
  Share2,
  CalendarDays,
  BarChart3,
  Wallet,
  Bot,
  Plug,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/content-factory", label: "Content Factory", icon: Factory },
  { href: "/ideas", label: "Ideen & Inspiration", icon: Lightbulb },
  { href: "/content-brain", label: "Content Brain", icon: Brain },
  { href: "/brand-dna", label: "Brand DNA", icon: Dna },
  { href: "/script-studio", label: "Script Studio", icon: FileText },
  { href: "/voice-studio", label: "Voice Studio", icon: Mic },
  { href: "/video-studio", label: "Video Studio", icon: Video },
  { href: "/design-studio", label: "Design Studio", icon: Palette },
  { href: "/social-media", label: "Social Media", icon: Share2 },
  { href: "/calendar", label: "Content Kalender", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/revenue", label: "Einnahmen", icon: Wallet },
  { href: "/agents", label: "Agenten", icon: Bot },
  { href: "/integrations", label: "Integrationen", icon: Plug },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

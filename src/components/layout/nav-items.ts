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
  TrendingUp,
  Inbox,
  Bot,
  Plug,
  Settings,
  GraduationCap,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/schulung", labelKey: "schulung", icon: GraduationCap },
  { href: "/content-factory", labelKey: "contentFactory", icon: Factory },
  { href: "/ideas", labelKey: "ideas", icon: Lightbulb },
  { href: "/content-brain", labelKey: "contentBrain", icon: Brain },
  { href: "/brand-dna", labelKey: "brandDna", icon: Dna },
  { href: "/script-studio", labelKey: "scriptStudio", icon: FileText },
  { href: "/voice-studio", labelKey: "voiceStudio", icon: Mic },
  { href: "/video-studio", labelKey: "videoStudio", icon: Video },
  { href: "/design-studio", labelKey: "designStudio", icon: Palette },
  { href: "/social-media", labelKey: "socialMedia", icon: Share2 },
  { href: "/calendar", labelKey: "calendar", icon: CalendarDays },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/growth", labelKey: "growth", icon: TrendingUp },
  { href: "/revenue", labelKey: "revenue", icon: Wallet },
  { href: "/inbox", labelKey: "inbox", icon: Inbox },
  { href: "/agents", labelKey: "agents", icon: Bot },
  { href: "/integrations", labelKey: "integrations", icon: Plug },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

import type { Href } from "expo-router";
import {
  Bot,
  CalendarClock,
  ClipboardList,
  Coins,
  History,
  Home,
  MessageSquare,
  User,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import type { Translations } from "@/constants/translations";

export type AppNavItem = {
  href: Href;
  labelKey: keyof Translations["tabs"];
  Icon: LucideIcon;
  doctorOnly?: boolean;
  patientOnly?: boolean;
  match: (path: string) => boolean;
};

function pathHas(path: string, segment: string) {
  return path.includes(`/${segment}`) || path.endsWith(segment);
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    href: "/(tabs)",
    labelKey: "home",
    Icon: Home,
    match: (path) =>
      path === "/" ||
      path === "/(tabs)" ||
      path.endsWith("/index") ||
      (path.includes("(tabs)") &&
        !pathHas(path, "history") &&
        !pathHas(path, "records") &&
        !pathHas(path, "appointments") &&
        !pathHas(path, "consultations") &&
        !pathHas(path, "points") &&
        !pathHas(path, "profile") &&
        !pathHas(path, "assistant") &&
        !pathHas(path, "intake") &&
        !pathHas(path, "reviews") &&
        !pathHas(path, "patients") &&
        !pathHas(path, "activity")),
  },
  {
    href: "/(tabs)/assistant",
    labelKey: "aiAssistant",
    Icon: Bot,
    match: (path) => pathHas(path, "assistant"),
  },
  {
    href: "/(tabs)/patients",
    labelKey: "patients",
    Icon: Users,
    doctorOnly: true,
    match: (path) =>
      pathHas(path, "patients") ||
      pathHas(path, "intake") ||
      pathHas(path, "reviews"),
  },
  {
    href: "/(tabs)/appointments",
    labelKey: "appointments",
    Icon: CalendarClock,
    match: (path) => pathHas(path, "appointments"),
  },
  {
    href: "/(tabs)/consultations",
    labelKey: "consultations",
    Icon: MessageSquare,
    match: (path) => pathHas(path, "consultations"),
  },
  {
    href: "/(tabs)/records",
    labelKey: "records",
    Icon: ClipboardList,
    patientOnly: true,
    match: (path) => pathHas(path, "records") || path.includes("/medical"),
  },
  {
    href: "/(tabs)/history",
    labelKey: "history",
    Icon: History,
    match: (path) => pathHas(path, "history"),
  },
  {
    href: "/(tabs)/points",
    labelKey: "points",
    Icon: Coins,
    patientOnly: true,
    match: (path) => pathHas(path, "points"),
  },
  {
    href: "/(tabs)/profile",
    labelKey: "profile",
    Icon: User,
    match: (path) => pathHas(path, "profile"),
  },
];

export function filterAppNavItems(role: string | null | undefined): AppNavItem[] {
  const isDoctor = role?.toLowerCase() === "doctor";
  return APP_NAV_ITEMS.filter((item) => {
    if (item.doctorOnly && !isDoctor) return false;
    if (item.patientOnly && isDoctor) return false;
    return true;
  });
}

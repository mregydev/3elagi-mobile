import type { Href } from "expo-router";
import {
  Bell,
  Bot,
  CalendarClock,
  ClipboardList,
  Coins,
  History,
  Home,
  ListChecks,
  MessageSquare,
  Star,
  Stethoscope,
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
  /** Visible without signing in (home / doctor browse). */
  guestAllowed?: boolean;
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
    guestAllowed: true,
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
        !pathHas(path, "activity") &&
        !pathHas(path, "notifications") &&
        !pathHas(path, "our-doctors")),
  },
  {
    href: "/(tabs)/our-doctors",
    labelKey: "ourDoctors",
    Icon: Stethoscope,
    guestAllowed: true,
    match: (path) => pathHas(path, "our-doctors"),
  },
  {
    href: "/(tabs)/notifications",
    labelKey: "notifications",
    Icon: Bell,
    match: (path) => pathHas(path, "notifications"),
  },
  {
    href: "/(tabs)/history",
    labelKey: "history",
    Icon: History,
    match: (path) => pathHas(path, "history"),
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
    match: (path) => pathHas(path, "patients"),
  },
  {
    href: "/(tabs)/reviews",
    labelKey: "reviews",
    Icon: Star,
    doctorOnly: true,
    match: (path) => pathHas(path, "reviews"),
  },
  {
    href: "/(tabs)/intake",
    labelKey: "intake",
    Icon: ListChecks,
    doctorOnly: true,
    match: (path) => pathHas(path, "intake"),
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

export function filterAppNavItems(
  role: string | null | undefined,
  options?: { signedIn?: boolean },
): AppNavItem[] {
  const signedIn = options?.signedIn ?? !!role;
  const isDoctor = role?.toLowerCase() === "doctor";
  return APP_NAV_ITEMS.filter((item) => {
    if (!signedIn) return !!item.guestAllowed;
    if (item.doctorOnly && !isDoctor) return false;
    if (item.patientOnly && isDoctor) return false;
    return true;
  });
}

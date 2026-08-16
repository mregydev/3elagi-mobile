import type { Href } from "expo-router";
import {
  Bell,
  Bot,
  CalendarClock,
  ClipboardList,
  Coins,
  History,
  Home,
  HelpCircle,
  Info,
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
  /** Marketing pages that only make sense before signing in. */
  guestOnly?: boolean;
  /** Hidden when AI is switched off in the profile. */
  aiOnly?: boolean;
  /** Informational page — collapsed under "More" in the sidebar. */
  secondary?: boolean;
  match: (path: string) => boolean;
};

/** Fired when Home is tapped in the nav; the home tab resets to the specialities grid. */
export const HOME_NAV_RESET_EVENT = "home-nav:reset";

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
        !pathHas(path, "about-us") &&
        !pathHas(path, "pricing") &&
        !pathHas(path, "faq") &&
        !pathHas(path, "for-doctors")),
  },
  {
    href: "/(tabs)/about-us",
    labelKey: "aboutUs",
    Icon: Info,
    guestAllowed: true,
    guestOnly: true,
    secondary: true,
    match: (path) => pathHas(path, "about-us"),
  },
  {
    href: "/(tabs)/assistant",
    labelKey: "assistant",
    Icon: Bot,
    guestAllowed: true,
    aiOnly: true,
    match: (path) => pathHas(path, "assistant"),
  },
  {
    href: "/(tabs)/pricing",
    labelKey: "pricing",
    Icon: Coins,
    guestAllowed: true,
    secondary: true,
    match: (path) => pathHas(path, "pricing"),
  },
  {
    href: "/(tabs)/for-doctors",
    labelKey: "forDoctors",
    Icon: Stethoscope,
    guestAllowed: true,
    secondary: true,
    // Marketing page — guests and doctors keep it, signed-in patients don't.
    doctorOnly: true,
    match: (path) => pathHas(path, "for-doctors"),
  },
  {
    href: "/(tabs)/faq",
    labelKey: "faq",
    Icon: HelpCircle,
    guestAllowed: true,
    secondary: true,
    match: (path) => pathHas(path, "faq"),
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
  options?: { signedIn?: boolean; aiEnabled?: boolean },
): AppNavItem[] {
  const signedIn = options?.signedIn ?? !!role;
  const aiEnabled = options?.aiEnabled ?? true;
  const isDoctor = role?.toLowerCase() === "doctor";
  return APP_NAV_ITEMS.filter((item) => {
    if (item.aiOnly && !aiEnabled) return false;
    if (!signedIn) return !!item.guestAllowed;
    if (item.guestOnly) return false;
    if (item.doctorOnly && !isDoctor) return false;
    if (item.patientOnly && isDoctor) return false;
    return true;
  });
}

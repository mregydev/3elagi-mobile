import { describe, expect, it, vi } from "vitest";

// The nav table only needs icons to exist — the real package fails to load
// outside a native runtime.
vi.mock("lucide-react-native", () => ({
  __esModule: true,
  default: {},
  ...Object.fromEntries(
    [
      "Bell",
      "Bot",
      "CalendarClock",
      "ClipboardList",
      "Coins",
      "History",
      "Home",
      "Info",
      "ListChecks",
      "MessageSquare",
      "Star",
      "Stethoscope",
      "User",
      "Users",
    ].map((name) => [name, () => null]),
  ),
}));

const { filterAppNavItems } = await import("@/constants/appNav");

const hrefs = (items: { href: unknown }[]) => items.map((i) => String(i.href));

describe("filterAppNavItems", () => {
  it("drops the assistant when AI is switched off", () => {
    expect(hrefs(filterAppNavItems("patient", { aiEnabled: false }))).not.toContain(
      "/(tabs)/assistant",
    );
  });

  it("keeps it for signed-in users, guests, and doctors when AI is on", () => {
    for (const role of ["patient", "doctor", null]) {
      expect(hrefs(filterAppNavItems(role, { aiEnabled: true }))).toContain(
        "/(tabs)/assistant",
      );
    }
  });

  it("defaults to showing it — callers that never heard of the switch keep working", () => {
    expect(hrefs(filterAppNavItems("patient"))).toContain("/(tabs)/assistant");
  });

  it("still filters by role while AI is off", () => {
    const patient = hrefs(filterAppNavItems("patient", { aiEnabled: false }));
    expect(patient).toContain("/(tabs)/records");
    expect(patient).not.toContain("/(tabs)/patients");
  });
});

import { describe, expect, it } from "vitest";
import { countUpcomingVideoCalls } from "@/domains/appointments/upcomingVideoCalls";
import type { UpcomingAppointment } from "@/domains/appointments/api";

function appt(status: string): UpcomingAppointment {
  return {
    id: "1",
    date: "2026-08-20",
    time: "10:00",
    status,
    meeting_link: "https://example.com/room",
    other_name: "Dr. Test",
    other_user_id: "user-1",
    booked_via_app: true,
  };
}

describe("countUpcomingVideoCalls", () => {
  it("counts scheduled video appointments and ignores cancelled", () => {
    expect(
      countUpcomingVideoCalls([
        appt("confirmed"),
        appt("pending"),
        appt("waiting"),
        appt("cancelled"),
      ]),
    ).toBe(3);
  });
});

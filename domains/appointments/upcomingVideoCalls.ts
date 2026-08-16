import type { UpcomingAppointment } from "@/domains/appointments/api";

const UPCOMING_VIDEO_STATUSES = new Set([
  "pending",
  "confirmed",
  "waiting",
  "active",
]);

/** Scheduled video consultations still on the calendar (not cancelled). */
export function countUpcomingVideoCalls(
  appointments: UpcomingAppointment[],
): number {
  return appointments.filter((item) => UPCOMING_VIDEO_STATUSES.has(item.status))
    .length;
}

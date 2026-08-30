import { Redirect } from "expo-router";

/** Admin doctor registrations inbox is web-only. */
export default function AdminDoctorRegistrationsFallback() {
  return <Redirect href="/welcome" />;
}

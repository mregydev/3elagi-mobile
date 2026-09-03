import { Redirect } from "expo-router";

/** Admin doctor signup is web-only. */
export default function AdminDoctorSignupFallback() {
  return <Redirect href="/welcome" />;
}

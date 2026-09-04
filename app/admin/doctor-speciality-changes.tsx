import { Redirect } from "expo-router";

/** Admin speciality change inbox is web-only. */
export default function AdminDoctorSpecialityChangesFallback() {
  return <Redirect href="/welcome" />;
}

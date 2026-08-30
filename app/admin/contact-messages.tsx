import { Redirect } from "expo-router";

/** Admin contact inbox is web-only. */
export default function AdminContactMessagesFallback() {
  return <Redirect href="/welcome" />;
}

import { Redirect } from "expo-router";

/** Admin specialities editor is web-only. */
export default function AdminSpecialitiesFallback() {
  return <Redirect href="/welcome" />;
}

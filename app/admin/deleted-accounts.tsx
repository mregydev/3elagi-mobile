import { Redirect } from "expo-router";

/** Admin deleted accounts is web-only. */
export default function AdminDeletedAccountsFallback() {
  return <Redirect href="/welcome" />;
}

import { Redirect } from "expo-router";

/** Admin RAG manager is web-only; native builds redirect away. */
export default function AdminRagFallback() {
  return <Redirect href="/welcome" />;
}

import { Redirect } from "expo-router";

/** Admin panel is web-only; native builds redirect away. */
export default function AdminPanelFallback() {
  return <Redirect href="/welcome" />;
}

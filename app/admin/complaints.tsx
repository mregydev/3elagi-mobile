import { Redirect } from "expo-router";

/** Admin complaints review is web-only; native builds redirect away. */
export default function AdminComplaintsFallback() {
  return <Redirect href="/welcome" />;
}

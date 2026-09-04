import { Redirect } from "expo-router";

/** Admin app reviews inbox is web-only. */
export default function AdminAppReviewsFallback() {
  return <Redirect href="/welcome" />;
}

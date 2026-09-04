import { Redirect } from "expo-router";

/** Admin credit-pricing editor is web-only. */
export default function AdminPricingFallback() {
  return <Redirect href="/welcome" />;
}

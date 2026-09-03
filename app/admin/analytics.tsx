import { Redirect } from "expo-router";

/** Admin analytics is web-only. */
export default function AdminAnalyticsFallback() {
  return <Redirect href="/welcome" />;
}

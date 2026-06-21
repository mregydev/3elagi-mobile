import { Redirect } from "expo-router";
import React from "react";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";

export default function Index() {
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated) return null;

  return <Redirect href={isSignedIn(profile, accessToken) ? "/(tabs)" : "/welcome"} />;
}

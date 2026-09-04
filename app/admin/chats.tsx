import { Redirect } from "expo-router";

/** Admin chats are web-only, like the rest of the admin panel. */
export default function AdminChatsFallback() {
  return <Redirect href="/welcome" />;
}

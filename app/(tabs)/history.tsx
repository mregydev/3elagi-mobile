import { useFocusEffect } from "@react-navigation/native";
import { Redirect, router } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { ChatHistoryList } from "@/components/ChatHistoryList";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useChatStore } from "@/domains/chat/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

export default function HistoryTab() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const conversations = useChatStore((s) => s.conversations);
  const loading = useChatStore((s) => s.loading);
  const error = useChatStore((s) => s.error);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const [query, setQuery] = useState("");

  const refresh = useCallback(() => {
    if (!accessToken || !profile?.id) return;
    void loadConversations(accessToken, profile.id, role);
  }, [accessToken, profile?.id, role, loadConversations]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.user.name.toLowerCase().includes(q));
  }, [conversations, query]);

  const dir = isRTL ? "row-reverse" : "row";
  const isDoctor = role?.toLowerCase() === "doctor";
  const emptyLabel = isDoctor
    ? isRTL
      ? "لا توجد محادثات بعد"
      : "No conversations yet"
    : isRTL
      ? "لا توجد محادثات بعد"
      : "No conversations yet";

  if (!isSignedIn(profile, accessToken) || !role) {
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              flexDirection: dir,
            },
          ]}
        >
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.common.search}
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.searchInput,
              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
          />
        </View>
      </AppHeader>

      <ChatHistoryList
        conversations={filtered}
        loading={loading}
        error={error}
        isRTL={isRTL}
        onSelect={(id) => router.push(`/chat/${id}`)}
        emptyLabel={emptyLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchBar: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
});

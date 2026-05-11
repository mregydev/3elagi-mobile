import { router } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Avatar } from "@/components/Avatar";
import { AppHeader } from "@/components/AppHeader";
import { useChatStore } from "@/domains/chat/store";
import type { Conversation } from "@/domains/chat/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function ChatsTab() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const conversations = useChatStore((s) => s.conversations);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const online = useMemo(
    () => conversations.filter((c) => c.user.presence === "online"),
    [conversations],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.user.name.toLowerCase().includes(q));
  }, [conversations, query]);

  const dir = isRTL ? "row-reverse" : "row";

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

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          online.length ? (
            <View style={styles.onlineSection}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {isRTL ? "متصلون الآن" : "Active now"}
              </Text>
              <FlatList
                horizontal
                inverted={isRTL}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
                data={online}
                keyExtractor={(c) => `o-${c.id}`}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => router.push(`/chat/${item.id}`)}
                    style={styles.onlineItem}
                  >
                    <Avatar
                      uri={item.user.avatarUrl}
                      size={58}
                      presence={item.user.presence}
                    />
                    <Text
                      numberOfLines={1}
                      style={[styles.onlineName, { color: colors.foreground }]}
                    >
                      {item.user.name.split(" ").slice(-1)[0]}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.divider,
              { backgroundColor: colors.border },
              isRTL ? { marginRight: 84, marginLeft: 0 } : { marginLeft: 84, marginRight: 0 },
            ]}
          />
        )}
        renderItem={({ item }) => (
          <ConversationRow item={item} colors={colors} isRTL={isRTL} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.mutedForeground }}>
              {isRTL ? "لا توجد محادثات" : "No conversations"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function ConversationRow({
  item,
  colors,
  isRTL,
}: {
  item: Conversation;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
}) {
  const dir = isRTL ? "row-reverse" : "row";

  return (
    <Pressable
      onPress={() => router.push(`/chat/${item.id}`)}
      style={({ pressed }) => [
        styles.row,
        { flexDirection: dir },
        pressed && { backgroundColor: colors.muted },
      ]}
    >
      <Avatar uri={item.user.avatarUrl} size={56} presence={item.user.presence} />

      <View style={{ flex: 1 }}>
        {/* Name + time */}
        <View style={[styles.rowTop, { flexDirection: dir }]}>
          <Text
            style={[
              styles.name,
              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
            numberOfLines={1}
          >
            {item.user.name}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(item.lastMessage?.createdAt)}
          </Text>
        </View>

        {/* Preview + unread badge */}
        <View style={[styles.rowBottom, { flexDirection: dir }]}>
          <Text
            style={[
              styles.preview,
              {
                color: item.unreadCount > 0 ? colors.foreground : colors.mutedForeground,
                fontWeight: item.unreadCount > 0 ? "700" : "400",
                textAlign: isRTL ? "right" : "left",
              },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage?.text || (isRTL ? "قل مرحبا 👋" : "Say hello 👋")}
          </Text>
          {item.unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
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
  onlineSection: { paddingTop: 14, paddingBottom: 6 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  onlineItem: { alignItems: "center", width: 64, gap: 6 },
  onlineName: { fontSize: 12, fontWeight: "500", textAlign: "center" },
  row: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowTop: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowBottom: {
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  name: { fontSize: 16, fontWeight: "600", flex: 1 },
  time: { fontSize: 12 },
  preview: { fontSize: 14, flex: 1 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth },
  empty: { alignItems: "center", paddingVertical: 60 },
});

import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Avatar } from "@/components/Avatar";
import { DoctorSubtitle, DoctorTrailingMeta } from "@/components/DoctorListMeta";
import { NameWithCountryFlag } from "@/components/NameWithCountryFlag";
import { messagePreviewText } from "@/domains/chat/messagePreview";
import type { Conversation } from "@/domains/chat/types";
import { usePresenceStore } from "@/domains/presence/store";
import { useColors } from "@/hooks/useColors";

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

function ConversationRow({
  item,
  colors,
  isRTL,
  onPress,
}: {
  item: Conversation;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
  onPress: () => void;
}) {
  const dir = isRTL ? "row-reverse" : "row";
  const peerRole = item.user.role === "doctor" ? "doctor" : "patient";
  const isOnline = usePresenceStore((s) => s.isOnline(item.user.id));
  const presence = isOnline ? "online" : "offline";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { flexDirection: dir },
        pressed && { backgroundColor: colors.muted },
      ]}
    >
      <Avatar
        uri={item.user.photoUrl}
        seed={item.user.id}
        role={peerRole}
        size={46}
        presence={presence}
      />

      <View style={[styles.content, { flexDirection: dir }]}>
        <View style={styles.mainCol}>
          <NameWithCountryFlag
            name={item.user.name}
            country={peerRole === "patient" ? item.user.country : undefined}
            isRTL={isRTL}
            nameStyle={[
              styles.name,
              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
          />

          {peerRole === "doctor" ? (
            <DoctorSubtitle specialty={item.user.specialty} isRTL={isRTL} />
          ) : null}

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
              {messagePreviewText(item.lastMessage, isRTL)}
            </Text>
            {item.unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.trailingCol, { alignItems: isRTL ? "flex-start" : "flex-end" }]}>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(item.lastMessage?.createdAt)}
          </Text>
          {peerRole === "doctor" ? (
            <DoctorTrailingMeta
              isRTL={isRTL}
              rating={item.user.rating}
              consultationPrice={item.user.consultationPrice}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

interface Props {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  isRTL: boolean;
  onSelect: (conversationId: string) => void;
  emptyLabel: string;
}

export function ChatHistoryList({
  conversations,
  loading,
  error,
  isRTL,
  onSelect,
  emptyLabel,
}: Props) {
  const colors = useColors();

  if (loading && conversations.length === 0) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  if (error && conversations.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: "#ef4444", textAlign: "center", paddingHorizontal: 24 }}>
          {error}
        </Text>
      </View>
    );
  }

  // No presence extraData / users subscription here: each row watches its own
  // peer, so the whole list no longer repaints when any user logs in or out.
  return (
    <FlatList
      data={conversations}
      keyExtractor={(c) => c.id}
      contentContainerStyle={
        conversations.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }
      }
      ItemSeparatorComponent={() => (
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.border },
            isRTL ? { marginRight: 74, marginLeft: 0 } : { marginLeft: 74, marginRight: 0 },
          ]}
        />
      )}
      renderItem={({ item }) => (
        <ConversationRow
          item={item}
          colors={colors}
          isRTL={isRTL}
          onPress={() => onSelect(item.id)}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            {emptyLabel}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    alignItems: "flex-start",
    gap: 10,
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
  },
  trailingCol: {
    gap: 4,
    paddingTop: 2,
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
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 24 },
  emptyContainer: { flexGrow: 1 },
});

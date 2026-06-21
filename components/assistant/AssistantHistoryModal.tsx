import { Plus, Trash2, X } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AiConversation } from "@/domains/ai/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  visible: boolean;
  conversations: AiConversation[];
  activeId: string | null;
  loading: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string, isEn: boolean) {
  try {
    return new Date(iso).toLocaleDateString(isEn ? "en-US" : "ar-EG", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function AssistantHistoryModal({
  visible,
  conversations,
  activeId,
  loading,
  onClose,
  onSelect,
  onNewChat,
  onDelete,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isRTL } = useI18n();
  const isEn = !isRTL;

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <View style={[styles.header, isRTL && styles.headerRtl]}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
            <X color={colors.foreground} size={22} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isEn ? "AI Chats" : "محادثات الذكاء الاصطناعي"}
          </Text>
          <Pressable onPress={handleNewChat} hitSlop={10} style={styles.iconBtn}>
            <Plus color={colors.primary} size={22} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : conversations.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {isEn ? "No conversations yet" : "لا توجد محادثات بعد"}
            </Text>
            <Pressable
              onPress={handleNewChat}
              style={[styles.newBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.newBtnText, { color: colors.primaryForeground }]}>
                {isEn ? "Start a chat" : "ابدأ محادثة"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {conversations.map((c) => {
              const selected = c.id === activeId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => handleSelect(c.id)}
                  style={[
                    styles.item,
                    {
                      backgroundColor: selected ? colors.muted : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.itemBody}>
                    <Text
                      numberOfLines={2}
                      style={[styles.itemTitle, { color: colors.foreground }]}
                    >
                      {c.title}
                    </Text>
                    <Text style={[styles.itemDate, { color: colors.mutedForeground }]}>
                      {formatDate(c.updatedAt, isEn)}
                    </Text>
                  </View>
                  {!c.id.startsWith("draft-") ? (
                    <Pressable
                      onPress={() => onDelete(c.id)}
                      hitSlop={8}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color={colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRtl: { flexDirection: "row-reverse" },
  iconBtn: { width: 36, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  loader: { marginTop: 40 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: { fontSize: 15, textAlign: "center" },
  newBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newBtnText: { fontSize: 15, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemBody: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 15, fontWeight: "600" },
  itemDate: { fontSize: 12 },
  deleteBtn: { padding: 4 },
});

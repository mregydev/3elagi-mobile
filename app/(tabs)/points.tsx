import { Plus, Wallet } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { PointsPieChart } from "@/components/PointsPieChart";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Redirect } from "expo-router";
import { reimbursePoints } from "@/domains/points/api";
import { usePointsStore } from "@/domains/points/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { usePointsPage } from "@/hooks/usePointsPage";
import { flexRow } from "@/utils/rtl";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export default function PointsTab() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const isDoctor = role?.toLowerCase() === "doctor";
  const loadPoints = usePointsStore((s) => s.loadPoints);
  const tabBarHeight = useBottomTabBarHeight();
  const dir = flexRow(isRTL);

  const {
    loading,
    displaySummary,
    amountText,
    setAmountText,
    parseAmount,
    summary,
  } = usePointsPage(isRTL);

  const [modalOpen, setModalOpen] = useState(false);
  const [reimbursing, setReimbursing] = useState(false);

  const doReimburse = async () => {
    if (!accessToken) return;
    setReimbursing(true);
    try {
      const updated = await reimbursePoints(accessToken);
      await loadPoints(accessToken);
      showSuccessToast(
        isRTL ? "تم طلب الاسترداد" : "Reimbursement requested",
        isRTL
          ? `تم استرداد ${updated.points_reimbursed_total ?? 0} نقطة إجمالاً`
          : `${updated.points_reimbursed_total ?? 0} points reimbursed in total`,
      );
    } catch (e) {
      showErrorToast(isRTL ? "تعذر الاسترداد" : "Reimburse failed", (e as Error).message);
    } finally {
      setReimbursing(false);
    }
  };

  const confirmReimburse = () => {
    if (displaySummary.message_points <= 0) return;
    Alert.alert(
      isRTL ? "استرداد النقاط" : "Reimburse points",
      isRTL
        ? `سيتم استرداد ${displaySummary.message_points} نقطة متاحة.`
        : `Cash out your ${displaySummary.message_points} available points.`,
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        { text: isRTL ? "استرداد" : "Reimburse", onPress: () => void doReimburse() },
      ],
    );
  };

  if (!isSignedIn(profile, accessToken)) {
    return <Redirect href="/welcome" />;
  }

  const handleSubmit = () => {
    const amount = parseAmount();
    if (!amount) return;
    setModalOpen(false);
    router.push(`/points/checkout?amount=${amount}`);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      <KeyboardSafeScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(24, tabBarHeight) + 16 },
        ]}
      >
        <View style={[styles.heading, { flexDirection: dir }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isRTL ? "نقاط الرسائل" : "Message points"}
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
          {isRTL
            ? "كل رسالة تستهلك نقطة واحدة. أضف نقاطًا لمواصلة المحادثة."
            : "Each message costs 1 point. Add points to keep chatting."}
        </Text>

        {loading && !summary ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
        ) : (
          <PointsPieChart summary={displaySummary} isRTL={isRTL} />
        )}

        <View style={[styles.statsRow, { flexDirection: dir }]}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{displaySummary.message_points}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {isRTL ? "المتاح" : "Available"}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {displaySummary.points_purchased_total}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {isRTL ? "المُشترى" : "Purchased"}
            </Text>
          </View>
        </View>

        {isDoctor ? (
          <Pressable
            onPress={confirmReimburse}
            disabled={reimbursing || displaySummary.message_points <= 0}
            style={({ pressed }) => [
              styles.addBtn,
              {
                backgroundColor: colors.primary,
                opacity:
                  reimbursing || displaySummary.message_points <= 0
                    ? 0.5
                    : pressed
                      ? 0.9
                      : 1,
                flexDirection: dir,
              },
            ]}
          >
            {reimbursing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Wallet size={20} color="#fff" />
                <Text style={styles.addBtnText}>{isRTL ? "استرداد النقاط" : "Reimburse points"}</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1, flexDirection: dir },
            ]}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addBtnText}>{isRTL ? "إضافة نقاط" : "Add points"}</Text>
          </Pressable>
        )}
      </KeyboardSafeScrollView>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {isRTL ? "إضافة نقاط" : "Add points"}
            </Text>
            <Text style={[styles.modalHint, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "أدخل عدد النقاط التي تريد إضافتها" : "Enter how many points you want to add"}
            </Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="number-pad"
              placeholder={isRTL ? "مثال: 50" : "e.g. 50"}
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            />
            <View style={[styles.modalActions, { flexDirection: dir }]}>
              <Pressable
                onPress={() => setModalOpen(false)}
                style={[styles.modalBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                style={[styles.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {isRTL ? "متابعة" : "Continue"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, gap: 16 },
  heading: { alignItems: "center", gap: 10, marginTop: 8 },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 14, lineHeight: 20 },
  statsRow: { gap: 12, marginTop: 8 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 12, fontWeight: "600" },
  addBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: { borderRadius: 16, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  modalHint: { fontSize: 13, lineHeight: 18 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  modalActions: { gap: 10, marginTop: 4 },
  modalBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 46,
  },
});

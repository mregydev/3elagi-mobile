import { router } from "expo-router";
import {
  Activity,
  Beaker,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  LogOut,
  ScanLine,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { Logo3elagi } from "@/components/Logo3elagi";
import { useAuthStore } from "@/domains/auth/store";
import { useMedicalStore } from "@/domains/medical/store";
import type { MedicalCategory, MedicalRecord } from "@/domains/medical/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

const CATEGORIES: {
  key: MedicalCategory;
  labelEn: string;
  labelAr: string;
  Icon: typeof Activity;
  color: string;
}[] = [
  { key: "symptom", labelEn: "Symptoms", labelAr: "الأعراض", Icon: Activity, color: "#ef4444" },
  { key: "lab", labelEn: "Lab results", labelAr: "نتائج المختبر", Icon: Beaker, color: "#10b981" },
  { key: "xray", labelEn: "X-rays & scans", labelAr: "الأشعة والمسح", Icon: ScanLine, color: "#8b5cf6" },
  { key: "intake", labelEn: "Intake exam", labelAr: "فحص الاستقبال", Icon: ClipboardList, color: "#3057F2" },
];

export default function ProfileTab() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const profile = useAuthStore((s) => s.profile);

  if (!profile) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader />
        <View style={styles.authBody}>
          <View style={styles.authBrand}>
            <Logo3elagi height={64} />
            <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>
              {isRTL
                ? "سجّل الدخول للوصول إلى سجلك الطبي"
                : "Sign in to access your medical history"}
            </Text>
          </View>

          <View style={{ width: "100%", paddingHorizontal: 24, gap: 12 }}>
            <Pressable
              onPress={() => router.push("/auth/login")}
              style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.btnPrimaryText}>
                {isRTL ? "تسجيل الدخول" : "Log in"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/auth/signup")}
              style={[
                styles.btnGhost,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Text style={[styles.btnGhostText, { color: colors.foreground }]}>
                {isRTL ? "إنشاء حساب" : "Create an account"}
              </Text>
            </Pressable>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 12,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {isRTL ? "حساب تجريبي · " : "Try the demo account · "}
              demo@3elagi.com / demo1234
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return <MedicalHistoryScreen />;
}

function MedicalHistoryScreen() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const profile = useAuthStore((s) => s.profile)!;
  const logout = useAuthStore((s) => s.logout);
  const records = useMedicalStore((s) => s.records);
  const load = useMedicalStore((s) => s.load);

  useEffect(() => {
    load(profile.id);
  }, [profile.id, load]);

  const grouped = useMemo(() => {
    const out: Record<MedicalCategory, MedicalRecord[]> = {
      symptom: [],
      lab: [],
      xray: [],
      intake: [],
    };
    for (const r of records) out[r.category]?.push(r);
    return out;
  }, [records]);

  // All sections collapsed by default
  const [openSections, setOpenSections] = useState<Set<MedicalCategory>>(new Set());
  const toggleSection = (key: MedicalCategory) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const dir = isRTL ? "row-reverse" : "row";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── Profile banner ── */}
        <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
          {/* Logout button — placed with flex so it sits at the correct edge in both directions */}
          <View style={[styles.profileHeaderTopRow, { flexDirection: dir }]}>
            <Pressable
              onPress={() =>
                Alert.alert(
                  isRTL ? "تسجيل الخروج" : "Log out",
                  isRTL ? "هل أنت متأكد؟" : "Are you sure?",
                  [
                    { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
                    {
                      text: isRTL ? "خروج" : "Log out",
                      style: "destructive",
                      onPress: logout,
                    },
                  ],
                )
              }
              style={styles.logoutBtn}
            >
              <LogOut size={16} color="#fff" />
              <Text style={styles.logoutText}>
                {isRTL ? "خروج" : "Log out"}
              </Text>
            </Pressable>
          </View>

          {/* Avatar + name */}
          <View style={{ alignItems: "center", gap: 10, paddingBottom: 8 }}>
            <Avatar uri={profile.avatarUrl} size={84} />
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
          </View>
        </View>

        {/* ── Section heading ── */}
        <View style={[styles.sectionHeading, { flexDirection: dir }]}>
          <Text style={[styles.h2, { color: colors.foreground }]}>
            {isRTL ? "السجل الطبي" : "Medical history"}
          </Text>
        </View>

        {/* ── Accordion categories ── */}
        {CATEGORIES.map(({ key, labelEn, labelAr, Icon, color }) => {
          const label = isRTL ? labelAr : labelEn;
          const isOpen = openSections.has(key);
          return (
            <View key={key} style={styles.categoryBlock}>
              {/* Single card row: [toggle area flex-1] | [divider] | [Add] */}
              <View
                style={[
                  styles.categoryCard,
                  {
                    flexDirection: dir,
                    backgroundColor: colors.card,
                    borderColor: isOpen ? color : colors.border,
                  },
                ]}
              >
                {/* Toggle area */}
                <Pressable
                  onPress={() => toggleSection(key)}
                  style={[styles.categoryTogglePart, { flexDirection: dir }]}
                >
                  <View style={[styles.iconBubble, { backgroundColor: color + "22" }]}>
                    <Icon size={16} color={color} />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {label}
                  </Text>
                  <View style={[styles.countBadge, { backgroundColor: color + "18" }]}>
                    <Text style={[styles.categoryCount, { color }]}>
                      {grouped[key].length}
                    </Text>
                  </View>
                  {isOpen ? (
                    <ChevronUp size={16} color={color} />
                  ) : (
                    <ChevronDown size={16} color={colors.mutedForeground} />
                  )}
                </Pressable>

                {/* Vertical divider */}
                <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

                {/* Inline Add button */}
                <Pressable
                  onPress={() => router.push(`/medical/add?category=${key}`)}
                  style={styles.inlineAddBtn}
                  hitSlop={6}
                >
                  <Text style={[styles.inlineAddBtnText, { color }]}>
                    {isRTL ? "إضافة" : "Add"}
                  </Text>
                </Pressable>
              </View>

              {/* Body */}
              {isOpen && (
                grouped[key].length === 0 ? (
                  <Text
                    style={[
                      styles.emptyCat,
                      {
                        color: colors.mutedForeground,
                        borderColor: colors.border,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  >
                    {isRTL ? "لا توجد إدخالات بعد" : "No entries yet"}
                  </Text>
                ) : (
                  <FlatList
                    data={grouped[key]}
                    scrollEnabled={false}
                    keyExtractor={(r) => r.id}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => router.push(`/medical/${item.id}`)}
                        style={({ pressed }) => [
                          styles.recordCard,
                          {
                            backgroundColor: pressed ? colors.muted : colors.card,
                            borderColor: colors.border,
                            flexDirection: dir,
                          },
                        ]}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            style={[
                              styles.recordTitle,
                              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
                            ]}
                          >
                            {item.title}
                          </Text>
                          {item.value ? (
                            <Text
                              style={[
                                styles.recordValue,
                                { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                              ]}
                            >
                              {item.value}
                            </Text>
                          ) : null}
                          <Text
                            style={[
                              styles.recordDate,
                              { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                            ]}
                          >
                            {new Date(item.date).toLocaleDateString()}
                          </Text>
                        </View>
                        <ChevronDown
                          size={16}
                          color={colors.mutedForeground}
                          style={{ transform: [{ rotate: isRTL ? "90deg" : "-90deg" }] }}
                        />
                      </Pressable>
                    )}
                  />
                )
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  authBody: { flex: 1, alignItems: "center", paddingTop: 40 },
  authBrand: { alignItems: "center", marginBottom: 40, gap: 14 },
  brandSub: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: 4,
  },
  btnPrimary: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnGhost: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  btnGhostText: { fontWeight: "700", fontSize: 15 },

  profileHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  profileHeaderTopRow: {
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  logoutText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  profileName: { color: "#fff", fontSize: 22, fontWeight: "800" },
  profileEmail: { color: "#dbe5ff", fontSize: 13 },

  sectionHeading: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  h2: { fontSize: 18, fontWeight: "800" },

  categoryBlock: { paddingHorizontal: 16, paddingTop: 10 },
  categoryCard: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
    overflow: "hidden",
  },
  categoryTogglePart: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  cardDivider: { width: 1, height: 28 },
  inlineAddBtn: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineAddBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: { fontSize: 15, fontWeight: "700", flex: 1 },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCount: { fontSize: 12, fontWeight: "700" },

  emptyCat: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    fontSize: 13,
    marginBottom: 4,
  },
  recordCard: {
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  recordTitle: { fontSize: 15, fontWeight: "700" },
  recordValue: { fontSize: 13, marginTop: 2 },
  recordDate:  { fontSize: 11, marginTop: 4 },
});

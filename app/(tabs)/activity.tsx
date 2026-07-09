import { Redirect } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { HubEmbeddedProvider } from "@/hooks/useHubEmbedded";
import { useI18n } from "@/hooks/useI18n";
import AppointmentsTab from "./appointments";
import HistoryTab from "./history";
import RecordsTab from "./records";

type SectionKey = "appointments" | "history" | "records";

export default function ActivityTab() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const role = useAuthStore((s) => s.role);
  const isDoctor = role?.toLowerCase() === "doctor";
  const [active, setActive] = useState<SectionKey>("appointments");

  if (isDoctor) return <Redirect href="/(tabs)" />;

  const sections: { key: SectionKey; label: string; Comp: React.ComponentType }[] = [
    { key: "appointments", label: t.tabs.appointments, Comp: AppointmentsTab },
    { key: "history", label: t.tabs.history, Comp: HistoryTab },
    { key: "records", label: t.tabs.records, Comp: RecordsTab },
  ];
  const ActiveComp =
    sections.find((s) => s.key === active)?.Comp ?? AppointmentsTab;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          {sections.map((s) => {
            const on = active === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setActive(s.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? colors.primary : colors.muted,
                    borderColor: on ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: on ? "#fff" : colors.foreground,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View style={styles.body}>
        <HubEmbeddedProvider>
          <ActiveComp />
        </HubEmbeddedProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabRow: { gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  body: { flex: 1, minHeight: 0 },
});

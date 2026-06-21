import { Redirect } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { MedicalHistoryTimeline } from "@/components/records/MedicalHistoryTimeline";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useRecordsPage } from "@/hooks/useRecordsPage";
import { alignText } from "@/utils/rtl";

export default function RecordsTab() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { records } = useRecordsPage();
  const textAlign = alignText(isRTL);

  if (!isSignedIn(profile, accessToken)) {
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground, textAlign }]}>
          {t.records.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}>
          {t.records.subtitle}
        </Text>
      </View>
      <MedicalHistoryTimeline
        records={records}
        patientUserId={profile!.id}
        canAdd
        showIntake
        contentPaddingBottom={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});

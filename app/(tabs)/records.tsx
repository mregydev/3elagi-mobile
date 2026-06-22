import { Redirect } from "expo-router";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Notifications from "expo-notifications";

import { AppHeader } from "@/components/AppHeader";
import { MedicalHistoryTimeline } from "@/components/records/MedicalHistoryTimeline";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useRecordsPage } from "@/hooks/useRecordsPage";
import { alignText } from "@/utils/rtl";

async function sendTestReminder() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission denied", "Enable notifications in Settings to test reminders.");
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💊 Amoxicillin 500mg",
      body: "Time to take your dose: 1 capsule",
      data: { prescriptionId: "test" },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });
  Alert.alert("Test reminder scheduled", "You'll get a notification in 5 seconds — background the app to see it.");
}

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
        {__DEV__ && (
          <TouchableOpacity onPress={sendTestReminder} style={styles.devBtn}>
            <Text style={styles.devBtnText}>🔔 Test Reminder (dev)</Text>
          </TouchableOpacity>
        )}
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
  devBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f59e0b",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  devBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
});

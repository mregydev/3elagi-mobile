import { Ban, ShieldCheck, ShieldOff, Stethoscope, Unlock } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AccessActionType, DoctorPatientAccessStatus } from "@/domains/chat/access";
import { useColors } from "@/hooks/useColors";
import { chatFlexRow } from "@/utils/rtl";

interface Chip {
  key: string;
  label: string;
  icon: React.ReactNode;
  action?: AccessActionType;
  onPress?: () => void;
  tone?: "primary" | "danger" | "muted";
}

interface Props {
  isRTL: boolean;
  isDoctor: boolean;
  access: DoctorPatientAccessStatus | null;
  showDiagnosis?: boolean;
  onAccessAction: (action: AccessActionType) => void;
  onDiagnosisPress?: () => void;
}

export function ChatAccessTemplates({
  isRTL,
  isDoctor,
  access,
  showDiagnosis = false,
  onAccessAction,
  onDiagnosisPress,
}: Props) {
  const colors = useColors();
  const dir = chatFlexRow();
  const chips: Chip[] = [];

  if (isDoctor) {
    if (showDiagnosis && access?.records_allowed && !access.is_blocked) {
      chips.push({
        key: "diagnosis",
        label: isRTL ? "تشخيص جديد" : "New diagnosis",
        icon: <Stethoscope size={15} color={colors.primary} />,
        onPress: onDiagnosisPress,
        tone: "primary",
      });
    }
    if (!access?.blocked_by_doctor) {
      chips.push({
        key: "doctor_block",
        label: isRTL ? "حظر المريض" : "Block patient",
        icon: <Ban size={15} color={colors.destructive} />,
        action: "doctor_block",
        tone: "danger",
      });
    } else {
      chips.push({
        key: "doctor_unblock",
        label: isRTL ? "إلغاء الحظر" : "Unblock patient",
        icon: <Unlock size={15} color={colors.primary} />,
        action: "doctor_unblock",
        tone: "primary",
      });
    }
  } else {
    if (!access?.records_allowed && !access?.is_blocked) {
      chips.push({
        key: "grant",
        label: isRTL ? "منح صلاحية السجل" : "Grant record access",
        icon: <ShieldCheck size={15} color={colors.primary} />,
        action: "grant_records",
        tone: "primary",
      });
    }
    if (access?.records_allowed && !access?.is_blocked) {
      chips.push({
        key: "revoke",
        label: isRTL ? "إلغاء الصلاحية" : "Revoke access",
        icon: <ShieldOff size={15} color={colors.mutedForeground} />,
        action: "revoke_records",
        tone: "muted",
      });
    }
    if (!access?.blocked_by_patient) {
      chips.push({
        key: "patient_block",
        label: isRTL ? "حظر الطبيب" : "Block doctor",
        icon: <Ban size={15} color={colors.destructive} />,
        action: "patient_block",
        tone: "danger",
      });
    } else {
      chips.push({
        key: "patient_unblock",
        label: isRTL ? "إلغاء الحظر" : "Unblock doctor",
        icon: <Unlock size={15} color={colors.primary} />,
        action: "patient_unblock",
        tone: "primary",
      });
    }
  }

  if (!chips.length) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, { flexDirection: dir }]}
        keyboardShouldPersistTaps="handled"
      >
        {chips.map((chip) => {
          const toneColor =
            chip.tone === "danger"
              ? colors.destructive
              : chip.tone === "muted"
                ? colors.mutedForeground
                : colors.primary;
          return (
            <Pressable
              key={chip.key}
              onPress={() => {
                if (chip.action) onAccessAction(chip.action);
                else chip.onPress?.();
              }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: pressed ? `${toneColor}22` : `${toneColor}12`,
                  borderColor: toneColor,
                  flexDirection: dir,
                },
              ]}
            >
              {chip.icon}
              <Text style={{ color: toneColor, fontWeight: "700", fontSize: 13 }}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingBottom: 6,
  },
  row: {
    gap: 8,
    paddingHorizontal: 14,
  },
  chip: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
});

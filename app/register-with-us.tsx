import { Stethoscope } from "lucide-react-native";
import { AppBackButton } from "@/components/nav/AppBackButton";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppTextInput } from "@/components/AppTextInput";
import { SpecialitySelectField } from "@/components/auth/SpecialitySelectField";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { submitDoctorRegistration } from "@/domains/doctorRegistration/api";
import { hasFieldErrors } from "@/domains/auth/validation";
import { fetchSpecialities, type Speciality } from "@/domains/home/api";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { flexRow } from "@/utils/rtl";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  doctorName?: string;
  email?: string;
  phone?: string;
  specialityId?: string;
};

export default function RegisterWithUsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const textAlign = isRTL ? "right" : "left";

  const [doctorName, setDoctorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialityId, setSpecialityId] = useState("");
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void fetchSpecialities()
      .then(setSpecialities)
      .catch(() => setSpecialities([]));
  }, []);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!doctorName.trim()) errors.doctorName = t.auth.fieldRequired;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) errors.email = t.auth.fieldRequired;
    else if (!EMAIL_RE.test(trimmedEmail)) errors.email = t.auth.invalidEmail;
    if (!phone.trim()) errors.phone = t.auth.fieldRequired;
    if (!specialityId) errors.specialityId = t.auth.specialityRequiredMsg;
    return errors;
  };

  const submit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;

    setSending(true);
    try {
      await submitDoctorRegistration({
        doctorName,
        email,
        phone,
        specialityId,
      });
      setSent(true);
      showSuccessToast(t.registerWithUs.sent);
      setDoctorName("");
      setEmail("");
      setPhone("");
      setSpecialityId("");
    } catch (e) {
      showErrorToast(t.registerWithUs.sendFailed, (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: colors.border,
            flexDirection: dir,
          },
        ]}
      >
        <AppBackButton
          color={colors.foreground}
          hitSlop={12}
          style={styles.backBtn}
          fallback="/(tabs)/for-doctors"
          accessibilityLabel={t.common.cancel}
        />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t.registerWithUs.title}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardSafeScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.intro, { flexDirection: dir }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
            <Stethoscope size={20} color={colors.primary} />
          </View>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}>
            {t.registerWithUs.subtitle}
          </Text>
        </View>

        {sent ? (
          <Text style={[styles.successNote, { color: colors.primary, textAlign }]}>
            {t.registerWithUs.sent}
          </Text>
        ) : null}

        <Text style={[styles.label, { color: colors.foreground, textAlign }]}>
          {t.registerWithUs.nameLabel}
        </Text>
        <AppTextInput
          value={doctorName}
          onChangeText={(value) => {
            setDoctorName(value);
            if (fieldErrors.doctorName) {
              setFieldErrors((prev) => ({ ...prev, doctorName: undefined }));
            }
          }}
          placeholder={t.auth.namePlaceholder}
          autoCapitalize="words"
          editable={!sending}
          error={!!fieldErrors.doctorName}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: fieldErrors.doctorName ? colors.destructive : colors.border,
              color: colors.foreground,
              textAlign,
            },
          ]}
        />
        {fieldErrors.doctorName ? (
          <Text style={[styles.fieldError, { color: colors.destructive }]}>{fieldErrors.doctorName}</Text>
        ) : null}

        <Text style={[styles.label, { color: colors.foreground, textAlign, marginTop: 16 }]}>
          {t.registerWithUs.emailLabel}
        </Text>
        <AppTextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          placeholder={t.auth.emailPlaceholder}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!sending}
          error={!!fieldErrors.email}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: fieldErrors.email ? colors.destructive : colors.border,
              color: colors.foreground,
              textAlign,
            },
          ]}
        />
        {fieldErrors.email ? (
          <Text style={[styles.fieldError, { color: colors.destructive }]}>{fieldErrors.email}</Text>
        ) : null}

        <Text style={[styles.label, { color: colors.foreground, textAlign, marginTop: 16 }]}>
          {t.registerWithUs.phoneLabel}
        </Text>
        <AppTextInput
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            if (fieldErrors.phone) {
              setFieldErrors((prev) => ({ ...prev, phone: undefined }));
            }
          }}
          placeholder={t.auth.phonePlaceholder}
          keyboardType="phone-pad"
          editable={!sending}
          error={!!fieldErrors.phone}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: fieldErrors.phone ? colors.destructive : colors.border,
              color: colors.foreground,
              textAlign,
            },
          ]}
        />
        {fieldErrors.phone ? (
          <Text style={[styles.fieldError, { color: colors.destructive }]}>{fieldErrors.phone}</Text>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <SpecialitySelectField
            label={t.auth.speciality}
            value={specialityId}
            onChange={(id) => {
              setSpecialityId(id);
              if (fieldErrors.specialityId) {
                setFieldErrors((prev) => ({ ...prev, specialityId: undefined }));
              }
            }}
            specialities={specialities}
            error={fieldErrors.specialityId}
            disabled={sending}
          />
        </View>

        <Pressable
          onPress={() => void submit()}
          disabled={sending}
          style={[
            styles.sendBtn,
            {
              backgroundColor: sending ? colors.mutedForeground : colors.primary,
              marginTop: 24,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>{t.registerWithUs.submit}</Text>
          )}
        </Pressable>
      </KeyboardSafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
  },
  title: { fontSize: 17, fontWeight: "800" },
  body: { padding: 20, paddingBottom: 40 },
  intro: { alignItems: "flex-start", gap: 12, marginBottom: 20 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { flex: 1, fontSize: 14, lineHeight: 20 },
  successNote: { fontSize: 14, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  fieldError: { fontSize: 12, fontWeight: "600", marginTop: 6 },
  sendBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
  },
  sendText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

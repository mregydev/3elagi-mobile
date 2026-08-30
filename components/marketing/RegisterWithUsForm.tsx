import { Stethoscope } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
import { DoctorSignupMarketField } from "@/components/auth/DoctorSignupMarketField";
import { SpecialitySelectField } from "@/components/auth/SpecialitySelectField";
import { primaryButton, UI } from "@/constants/uiTokens";
import {
  DEFAULT_PATIENT_COUNTRY,
  type MarketCountryCode,
} from "@/constants/patientCountries";
import { submitDoctorRegistration } from "@/domains/doctorRegistration/api";
import { hasFieldErrors } from "@/domains/auth/validation";
import { fetchSpecialities, type Speciality } from "@/domains/home/api";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText, flexRow } from "@/utils/rtl";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  doctorName?: string;
  email?: string;
  phone?: string;
  country?: string;
  specialityId?: string;
};

type Props = {
  /** Centered hero block above the fields (desktop card). */
  showHero?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function RegisterWithUsForm({ showHero = false, style }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);

  const [doctorName, setDoctorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<MarketCountryCode>(DEFAULT_PATIENT_COUNTRY);
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
    if (!country) errors.country = t.auth.doctorMarketRequired;
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
        country,
        specialityId,
      });
      setSent(true);
      showSuccessToast(t.registerWithUs.sent);
      setDoctorName("");
      setEmail("");
      setPhone("");
      setCountry(DEFAULT_PATIENT_COUNTRY);
      setSpecialityId("");
    } catch (e) {
      showErrorToast(t.registerWithUs.sendFailed, (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      {showHero ? (
        <View style={[styles.hero, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${colors.primary}18` }]}>
            <Stethoscope size={28} color={colors.primary} strokeWidth={2.2} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground, textAlign }]}>
            {t.registerWithUs.title}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground, textAlign }]}>
            {t.registerWithUs.subtitle}
          </Text>
        </View>
      ) : (
        <View style={[styles.intro, { flexDirection: dir }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
            <Stethoscope size={20} color={colors.primary} />
          </View>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}>
            {t.registerWithUs.subtitle}
          </Text>
        </View>
      )}

      {sent ? (
        <View
          style={[
            styles.successBanner,
            {
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}44`,
            },
          ]}
        >
          <Text style={[styles.successNote, { color: colors.primary, textAlign }]}>
            {t.registerWithUs.sent}
          </Text>
        </View>
      ) : null}

      <View style={styles.fields}>
        <FieldBlock label={t.registerWithUs.nameLabel} error={fieldErrors.doctorName}>
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
              inputStyle(colors, fieldErrors.doctorName, textAlign),
            ]}
          />
        </FieldBlock>

        <FieldBlock label={t.registerWithUs.emailLabel} error={fieldErrors.email}>
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
              inputStyle(colors, fieldErrors.email, textAlign),
            ]}
          />
        </FieldBlock>

        <FieldBlock label={t.registerWithUs.phoneLabel} error={fieldErrors.phone}>
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
              inputStyle(colors, fieldErrors.phone, textAlign),
            ]}
          />
        </FieldBlock>

        <DoctorSignupMarketField
          isRTL={isRTL}
          value={country}
          onChange={(code) => {
            setCountry(code);
            if (fieldErrors.country) {
              setFieldErrors((prev) => ({ ...prev, country: undefined }));
            }
          }}
          error={fieldErrors.country}
          disabled={sending}
        />

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
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          primaryButton(),
          styles.sendBtn,
          UI.shadowMd,
          {
            backgroundColor: sending ? colors.mutedForeground : colors.primary,
            opacity: pressed || hovered ? 0.92 : 1,
          },
        ]}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.sendText, { color: colors.primaryForeground }]}>
            {t.registerWithUs.submit}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function FieldBlock({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const textAlign = alignText(isRTL);

  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.label, { color: colors.foreground, textAlign }]}>{label}</Text>
      {children}
      {error ? (
        <Text style={[styles.fieldError, { color: colors.destructive }]}>{error}</Text>
      ) : null}
    </View>
  );
}

function inputStyle(
  colors: ReturnType<typeof useColors>,
  error: string | undefined,
  textAlign: "left" | "right" | "center",
) {
  return {
    backgroundColor: colors.card,
    borderColor: error ? colors.destructive : colors.border,
    color: colors.foreground,
    textAlign,
  };
}

const styles = StyleSheet.create({
  wrap: { gap: UI.space.md },
  hero: { gap: UI.space.sm, marginBottom: UI.space.xs },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: UI.space.xs,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 520,
    marginTop: UI.space.md,
  },
  intro: { alignItems: "flex-start", gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { flex: 1, fontSize: 14, lineHeight: 20 },
  successBanner: {
    borderWidth: 1,
    borderRadius: UI.radius.inner,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successNote: { fontSize: 14, fontWeight: "700" },
  fields: { gap: UI.space.md },
  fieldBlock: { gap: 8 },
  label: { fontSize: 13, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: UI.radius.inner,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  fieldError: { fontSize: 12, fontWeight: "600" },
  sendBtn: {
    marginTop: UI.space.sm,
    borderRadius: UI.radius.card,
    paddingVertical: 15,
  },
  sendText: { fontSize: 16, fontWeight: "800" },
});

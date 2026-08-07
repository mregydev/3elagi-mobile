import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Camera, Check, FileText, Stethoscope, UserRound, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { EgpPriceInput } from "@/components/EgpPriceInput";
import { AuthLanguageField } from "@/components/auth/AuthLanguageField";
import { AuthFormError, AuthFormField } from "@/components/auth/AuthFormField";
import { CountrySelectField } from "@/components/auth/CountrySelectField";
import { DoctorSignupMarketField } from "@/components/auth/DoctorSignupMarketField";
import {
  DEFAULT_PATIENT_COUNTRY,
  PATIENT_COUNTRY_CODES,
  type PatientCountryCode,
} from "@/constants/patientCountries";
import { fetchSpecialities, type Speciality } from "@/domains/home/api";
import { specialityLabel } from "@/domains/home/specialityLabel";
import { getPostAuthRoute } from "@/domains/auth/navigation";
import { useAuthStore } from "@/domains/auth/store";
import type { SignupFile, SignupRole } from "@/domains/auth/types";
import {
  hasFieldErrors,
  validateSignupFields,
  type SignupFieldErrors,
} from "@/domains/auth/validation";
import {
  getDoctorSignupMarket,
  setDoctorSignupMarketOverride,
} from "@/domains/market/doctorSignupMarket";
import { getUrlMarketCountry } from "@/domains/market/resolveMarketCountry";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { WEB_MOBILE_AUTH_SIGNUP_EXTRA_BOTTOM_PADDING } from "@/constants/webLayout";

type LocalFile = SignupFile & { label: string };

function initialSignupCountry(): PatientCountryCode {
  return getUrlMarketCountry() ?? DEFAULT_PATIENT_COUNTRY;
}

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL, locale } = useI18n();
  const { isDesktop, isMobile } = useWebLayout();
  const signup = useAuthStore((s) => s.signup);
  const loading = useAuthStore((s) => s.loading);

  const [role, setRole] = useState<SignupRole>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<SignupFile | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [graduationCert, setGraduationCert] = useState<LocalFile | null>(null);
  const [workPermit, setWorkPermit] = useState<LocalFile | null>(null);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [specialityId, setSpecialityId] = useState<string>("");
  const [consultationPrice, setConsultationPrice] = useState(1);
  const [country, setCountry] = useState<PatientCountryCode>(initialSignupCountry);
  const [medicalRecordsConsent, setMedicalRecordsConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const isDoctor = role === "doctor";
  const urlMarket = getUrlMarketCountry();
  const phonePlaceholder =
    urlMarket === "JO" ||
    (isDoctor && getDoctorSignupMarket() === "JO") ||
    (!isDoctor && country === "JO")
      ? t.auth.phonePlaceholderJordan
      : t.auth.phonePlaceholder;

  useEffect(() => {
    if (!isDoctor) return;
    void fetchSpecialities()
      .then((rows) => {
        setSpecialities(rows);
        if (rows[0] && !specialityId) setSpecialityId(rows[0].id);
      })
      .catch(() => setSpecialities([]));
  }, [isDoctor]);
  const dir = isRTL ? "row-reverse" : "row";
  const isWeb = Platform.OS === "web";
  const showTitle = true;
  const showSubtitle = !(isWeb && isDesktop);
  const hideWebTopBar = isWeb;

  const pickPhoto = () => {
    Alert.alert(t.auth.profilePhoto, t.auth.chooseSource, [
        {
          text: t.auth.camera,
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") return;
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.85,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setPhotoPreview(asset.uri);
              setPhoto({
                uri: asset.uri,
                mimeType: asset.mimeType ?? "image/jpeg",
                fileName: asset.fileName ?? `avatar-${Date.now()}.jpg`,
              });
            }
          },
        },
        {
          text: t.auth.gallery,
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.85,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setPhotoPreview(asset.uri);
              setPhoto({
                uri: asset.uri,
                mimeType: asset.mimeType ?? "image/jpeg",
                fileName: asset.fileName ?? `avatar-${Date.now()}.jpg`,
              });
            }
          },
        },
        { text: t.common.cancel, style: "cancel" },
      ],
    );
  };

  const pickDocument = async (
    kind: "graduationCert" | "workPermit",
    label: string,
  ) => {
    Alert.alert(label, t.auth.chooseFileType, [
      {
        text: t.auth.photo,
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.9,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const file: LocalFile = {
              uri: asset.uri,
              mimeType: asset.mimeType ?? "image/jpeg",
              fileName: asset.fileName ?? `${kind}-${Date.now()}.jpg`,
              label,
            };
            if (kind === "graduationCert") setGraduationCert(file);
            else setWorkPermit(file);
          }
        },
      },
      {
        text: "PDF",
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: "application/pdf",
            copyToCacheDirectory: true,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const file: LocalFile = {
              uri: asset.uri,
              mimeType: asset.mimeType ?? "application/pdf",
              fileName: asset.name,
              label,
            };
            if (kind === "graduationCert") setGraduationCert(file);
            else setWorkPermit(file);
          }
        },
      },
      { text: t.common.cancel, style: "cancel" },
    ]);
  };

  const submit = async () => {
    const doctorCountry = isDoctor ? getDoctorSignupMarket() ?? undefined : country;
    const errors = validateSignupFields(
      {
        name,
        email,
        phone,
        password,
        isDoctor,
        specialityId,
        country: doctorCountry,
        medicalRecordsStorageConsent: medicalRecordsConsent,
      },
      t.auth,
    );
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    try {
      await signup({
        role,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        photo: photo ?? undefined,
        graduationCert: isDoctor ? graduationCert ?? undefined : undefined,
        workPermit: isDoctor ? workPermit ?? undefined : undefined,
        specialityId: isDoctor ? specialityId : undefined,
        consultationPrice: isDoctor ? consultationPrice : undefined,
        country: doctorCountry,
        medicalRecordsStorageConsent: isDoctor ? undefined : medicalRecordsConsent,
      });
      const { role: nextRole, doctorApprovalStatus } = useAuthStore.getState();
      router.replace(getPostAuthRoute(nextRole, doctorApprovalStatus));
    } catch (e) {
      setFormError((e as Error).message || t.auth.genericError);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: Platform.OS === "web" ? "transparent" : colors.background },
        Platform.OS === "web" && styles.screenWeb,
      ]}
    >
      {!hideWebTopBar ? (
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Platform.OS === "web" ? 16 : insets.top + 8,
              flexDirection: dir,
            },
          ]}
        >
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            accessibilityRole="link"
            accessibilityLabel={t.tabs.home}
            style={{ paddingVertical: 6, paddingHorizontal: 4 }}
          >
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
              {t.tabs.home}
            </Text>
          </Pressable>
          <AuthLanguageField />
        </View>
      ) : null}

      <KeyboardSafeScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.body,
          Platform.OS === "web" && isMobile && styles.bodyMobileWeb,
        ]}
        bottomOffset={32}
      >
        {showTitle ? (
          <Text
            style={[
              styles.title,
              {
                color: colors.foreground,
                alignSelf: isRTL ? "flex-end" : "flex-start",
                width: "100%",
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {t.auth.createAccountTitle}
          </Text>
        ) : null}
        {showSubtitle ? (
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {t.auth.createAccountSubtitle}
          </Text>
        ) : null}

        <View style={[styles.roleRow, { flexDirection: dir, marginTop: showSubtitle ? 20 : 16 }]}>
          <RoleChip
            active={role === "patient"}
            onPress={() => {
              setRole("patient");
              setDoctorSignupMarketOverride(null);
              setFieldErrors((prev) => ({ ...prev, medicalRecordsConsent: undefined }));
            }}
            label={t.auth.patient}
            Icon={UserRound}
            colors={colors}
          />
          <RoleChip
            active={role === "doctor"}
            onPress={() => {
              setRole("doctor");
              setMedicalRecordsConsent(false);
              setFieldErrors((prev) => ({
                ...prev,
                medicalRecordsConsent: undefined,
                country: undefined,
              }));
            }}
            label={t.auth.doctor}
            Icon={Stethoscope}
            colors={colors}
          />
        </View>

        <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
          {photoPreview ? (
            <Image source={{ uri: photoPreview }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
              <Camera size={28} color={colors.mutedForeground} />
            </View>
          )}
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
            <Camera size={13} color="#fff" />
          </View>
        </Pressable>

        <View style={{ width: "100%", gap: 12, marginTop: 20 }}>
          {formError ? <AuthFormError message={formError} colors={colors} /> : null}
          <AuthFormField
            label={t.auth.name}
            value={name}
            onChange={(value) => {
              setName(value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
              if (formError) setFormError(null);
            }}
            error={fieldErrors.name}
            placeholder={t.auth.namePlaceholder}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus()}
            colors={colors}
            isRTL={isRTL}
          />
          <AuthFormField
            ref={emailRef}
            label={t.auth.email}
            value={email}
            onChange={(value) => {
              setEmail(value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              if (formError) setFormError(null);
            }}
            error={fieldErrors.email}
            placeholder={t.auth.emailPlaceholder}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => phoneRef.current?.focus()}
            colors={colors}
            isRTL={isRTL}
          />
          <AuthFormField
            ref={phoneRef}
            label={t.auth.phone}
            value={phone}
            onChange={(value) => {
              setPhone(value);
              if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
              if (formError) setFormError(null);
            }}
            error={fieldErrors.phone}
            placeholder={phonePlaceholder}
            keyboardType="phone-pad"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
            colors={colors}
            isRTL={isRTL}
          />
          <AuthFormField
            ref={passwordRef}
            label={t.auth.password}
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              if (formError) setFormError(null);
            }}
            error={fieldErrors.password}
            placeholder={t.auth.passwordMinPlaceholder}
            secure
            returnKeyType="go"
            onSubmitEditing={() => {
              if (!loading) void submit();
            }}
            colors={colors}
            isRTL={isRTL}
          />

          {!isDoctor ? (
            <CountrySelectField
              label={t.auth.countryOfResidence}
              value={country}
              codes={PATIENT_COUNTRY_CODES}
              onChange={(code) => {
                setCountry(code);
                if (fieldErrors.country) {
                  setFieldErrors((prev) => ({ ...prev, country: undefined }));
                }
              }}
              error={fieldErrors.country}
              isRTL={isRTL}
              disabled={loading}
            />
          ) : (
            <DoctorSignupMarketField
              isRTL={isRTL}
              disabled={loading}
              error={fieldErrors.country}
              onMarketChange={() => {
                if (fieldErrors.country) {
                  setFieldErrors((prev) => ({ ...prev, country: undefined }));
                }
              }}
            />
          )}

          {isDoctor && (
            <View style={{ gap: 12, marginTop: 4 }}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                {t.auth.speciality}
              </Text>
              <View style={[styles.specialityRow, { flexDirection: dir }]}>
                {specialities.map((spec) => {
                  const active = specialityId === spec.id;
                  const label = specialityLabel(spec, locale);
                  return (
                    <Pressable
                      key={spec.id}
                      onPress={() => {
                        setSpecialityId(spec.id);
                        if (fieldErrors.specialityId) {
                          setFieldErrors((prev) => ({ ...prev, specialityId: undefined }));
                        }
                      }}
                      style={[
                        styles.specialityChip,
                        {
                          backgroundColor: active ? `${colors.primary}18` : colors.muted,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? colors.primary : colors.foreground, fontWeight: "700", fontSize: 13 }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {fieldErrors.specialityId ? (
                <Text style={{ color: colors.destructive, fontSize: 12, fontWeight: "600" }}>
                  {fieldErrors.specialityId}
                </Text>
              ) : null}
              <EgpPriceInput
                value={consultationPrice}
                onChange={setConsultationPrice}
                label={t.auth.consultationPrice}
              />
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                {t.auth.documentsOptional}
              </Text>
              <DocUploadRow
                label={t.auth.graduationCert}
                file={graduationCert}
                onPick={() => pickDocument("graduationCert", t.auth.graduationCert)}
                onClear={() => setGraduationCert(null)}
                colors={colors}
                dir={dir}
                notUploadedLabel={t.auth.notUploadedOptional}
                uploadLabel={t.auth.upload}
              />
              <DocUploadRow
                label={t.auth.workLicense}
                file={workPermit}
                onPick={() => pickDocument("workPermit", t.auth.workLicense)}
                onClear={() => setWorkPermit(null)}
                colors={colors}
                dir={dir}
                notUploadedLabel={t.auth.notUploadedOptional}
                uploadLabel={t.auth.upload}
              />
            </View>
          )}

          {!isDoctor ? (
            <View style={{ gap: 6 }}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: medicalRecordsConsent }}
                onPress={() => {
                  setMedicalRecordsConsent((prev) => !prev);
                  if (fieldErrors.medicalRecordsConsent) {
                    setFieldErrors((prev) => ({ ...prev, medicalRecordsConsent: undefined }));
                  }
                  if (formError) setFormError(null);
                }}
                style={[
                  styles.consentRow,
                  { flexDirection: dir, alignItems: "flex-start" },
                ]}
              >
                <View
                  style={[
                    styles.consentBox,
                    {
                      borderColor: fieldErrors.medicalRecordsConsent
                        ? colors.destructive
                        : medicalRecordsConsent
                          ? colors.primary
                          : colors.border,
                      backgroundColor: medicalRecordsConsent
                        ? colors.primary
                        : colors.card,
                    },
                  ]}
                >
                  {medicalRecordsConsent ? (
                    <Check size={14} color="#fff" strokeWidth={3} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.consentText,
                    {
                      color: colors.foreground,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {t.auth.medicalRecordsConsentLabel}
                </Text>
              </Pressable>
              {fieldErrors.medicalRecordsConsent ? (
                <Text style={{ color: colors.destructive, fontSize: 12, fontWeight: "600" }}>
                  {fieldErrors.medicalRecordsConsent}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              { opacity: loading ? 0.7 : pressed ? 0.92 : 1 },
            ]}
          >
            <LinearGradient
              colors={loading ? ["#94A3B8", "#94A3B8"] : ["#3057F2", "#1B9AAA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>{t.auth.signUp}</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/auth/login")}
            style={{ paddingVertical: 8, alignItems: "center" }}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              {t.auth.hasAccountLogIn}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={{ paddingVertical: 6, alignItems: "center" }}
            accessibilityRole="link"
            accessibilityLabel={t.tabs.home}
          >
            <Text
              style={{
                color: colors.foreground,
                fontWeight: "700",
                fontSize: 14,
                textDecorationLine: "underline",
              }}
            >
              {t.tabs.home}
            </Text>
          </Pressable>
        </View>
      </KeyboardSafeScrollView>
    </View>
  );
}

function RoleChip({
  active,
  onPress,
  label,
  Icon,
  colors,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  Icon: typeof UserRound;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.roleChip,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Icon size={18} color={active ? "#fff" : colors.foreground} />
      <Text style={{ color: active ? "#fff" : colors.foreground, fontWeight: "700" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function DocUploadRow({
  label,
  file,
  onPick,
  onClear,
  colors,
  dir,
  notUploadedLabel,
  uploadLabel,
}: {
  label: string;
  file: LocalFile | null;
  onPick: () => void;
  onClear: () => void;
  colors: ReturnType<typeof useColors>;
  dir: "row" | "row-reverse";
  notUploadedLabel: string;
  uploadLabel: string;
}) {
  return (
    <View style={[styles.docRow, { borderColor: colors.border, backgroundColor: colors.card, flexDirection: dir }]}>
      <FileText size={20} color={colors.primary} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{label}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }} numberOfLines={1}>
          {file ? file.fileName : notUploadedLabel}
        </Text>
      </View>
      {file ? (
        <Pressable onPress={onClear} hitSlop={8}>
          <X size={18} color={colors.mutedForeground} />
        </Pressable>
      ) : (
        <Pressable onPress={onPick}>
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
            {uploadLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const AVATAR_SIZE = 90;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  screenWeb: { flex: 0, width: "100%", height: "auto" },
  topBar: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  body: {
    padding: 24,
    alignItems: "center",
    paddingBottom: Platform.OS === "web" ? 40 : 40,
  },
  bodyMobileWeb: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40 + WEB_MOBILE_AUTH_SIGNUP_EXTRA_BOTTOM_PADDING,
  },
  title: { fontSize: 28, fontWeight: "800" },
  sub: { fontSize: 14, marginTop: 4, textAlign: "center" },
  roleRow: { gap: 10, width: "100%" },
  roleChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  avatarWrap: {
    marginTop: 24,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: "relative",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  sectionLabel: { fontSize: 14, fontWeight: "800" },
  specialityRow: { flexWrap: "wrap", gap: 8 },
  specialityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  docRow: {
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  consentRow: {
    gap: 10,
    marginTop: 4,
  },
  consentBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  label: { fontSize: 13, fontWeight: "700" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#3057F2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  btnGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },
});

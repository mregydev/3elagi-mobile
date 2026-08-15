import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";

import { useRouter } from "expo-router";
import { Camera, FileText, LogOut, Plus, UserRound, X } from "lucide-react-native";
import { EgpPriceInput } from "@/components/EgpPriceInput";
import { DoctorAvailabilityEditor } from "@/components/DoctorAvailabilityEditor";
import { ProfileLanguageField } from "@/components/profile/ProfileLanguageField";
import { ProfileThemeField } from "@/components/profile/ProfileThemeField";
import { ProfileAiField } from "@/components/profile/ProfileAiField";
import { SpecialityMultiSelect } from "@/components/profile/SpecialityMultiSelect";
import { profileSaveChromeHeight, profileSaveDockBottomPad } from "@/components/profile/profileSaveChrome";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import { navigateToWelcome } from "@/domains/auth/navigation";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useMobileWebPageTitlePaddingTop } from "@/hooks/useMobileWebPageTitlePaddingTop";
import { useProfileEditor } from "@/hooks/useProfileEditor";
import { useWebLayout } from "@/hooks/useWebLayout";
import { webConfirm } from "@/utils/webConfirm";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  accessToken: string;
  role: string;
  isRTL: boolean;
  colors: ReturnType<typeof useColors>;
}

const VIDEO_DURATIONS = [
  { m: 30, en: "30 min", ar: "٣٠ دقيقة" },
  { m: 60, en: "1 hour", ar: "ساعة" },
  { m: 120, en: "2 hours", ar: "ساعتان" },
];

function gridColumns(isWide: boolean, isDesktop: boolean, isTablet: boolean) {
  if (isWide) return 3;
  if (isDesktop || isTablet) return 2;
  return 1;
}

function gridStyle(columns: number): ViewStyle {
  if (columns === 1) {
    return { flexDirection: "column", gap: 16 };
  }
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: 16,
  } as unknown as ViewStyle;
}

function spanStyle(columns: number, span: number): ViewStyle {
  if (columns <= 1 || span <= 1) return {};
  return { gridColumn: `span ${Math.min(span, columns)}` } as unknown as ViewStyle;
}

export function ProfileEditorWebView({ accessToken, role, isRTL, colors }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { isWide, isDesktop, isTablet } = useWebLayout();
  const mobileTitlePaddingTop = useMobileWebPageTitlePaddingTop();
  const insets = useSafeAreaInsets();
  const showLogout = !isDesktop;
  const columns = gridColumns(isWide, isDesktop, isTablet);
  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const saveChromeHeight = profileSaveChromeHeight({ withLogout: showLogout });
  const dockPadBottom = profileSaveDockBottomPad(insets.bottom);

  const editor = useProfileEditor({ accessToken, role, isRTL });
  const {
    loading,
    saving,
    account,
    name,
    setName,
    phone,
    setPhone,
    country,
    setCountry,
    birthDate,
    setBirthDate,
    professionalTitle,
    setProfessionalTitle,
    info,
    setInfo,
    location,
    setLocation,
    certifications,
    certUploading,
    addCertification,
    removeCertification,
    setCertificationDescription,
    specialities,
    specialityId,
    specialityIds,
    toggleSpeciality,
    consultationPrice,
    setConsultationPrice,
    videoConsultationPrice,
    setVideoConsultationPrice,
    videoConsultationMinutes,
    immediateCallEnabled,
    setImmediateCallEnabled,
    setVideoConsultationMinutes,
    digitalSignaturePreview,
    signatureUploading,
    pickDigitalSignature,
    clearDigitalSignature,
    iban,
    setIban,
    accountHolderFullName,
    setAccountHolderFullName,
    nationalId,
    setNationalId,
    isDoctor,
    displayPhoto,
    pickPhoto,
    save,
  } = editor;

  const roleLabel = isDoctor ? t.auth.doctor : t.auth.patient;
  const showSplitCards = columns >= 2;

  const handleLogout = () => {
    const confirmed = webConfirm(t.tabs.logout, t.tabs.logoutConfirm);
    if (!confirmed) return;
    logout();
    navigateToWelcome(router);
  };

  const actionButtons = (
    <View
      style={[
        showLogout ? styles.mobileActions : styles.footerInner,
        !showLogout && { maxWidth: WEB_MAX_WIDTH.profile, flexDirection: dir, gap: 10 },
      ]}
    >
      <Pressable
        onPress={() => void save()}
        disabled={saving}
        style={[
          styles.saveBtn,
          { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 },
          showLogout ? styles.mobileFullBtn : null,
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>{t.settings.saveChanges}</Text>
        )}
      </Pressable>
      {showLogout ? (
        <Pressable
          onPress={handleLogout}
          style={[
            styles.logoutBtn,
            styles.mobileFullBtn,
            { borderColor: colors.border, flexDirection: dir },
          ]}
        >
          <LogOut size={16} color="#ef4444" />
          <Text style={styles.logoutText}>{t.tabs.logout}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: saveChromeHeight + dockPadBottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { maxWidth: WEB_MAX_WIDTH.profile }]}>
          <View
            style={[
              styles.pageHeader,
              mobileTitlePaddingTop > 0 && { paddingTop: mobileTitlePaddingTop },
            ]}
          >
            <Text style={[styles.pageTitle, { color: colors.foreground, textAlign }]}>
              {t.settings.personalInfo}
            </Text>
            <Text style={[styles.pageSubtitle, { color: colors.mutedForeground, textAlign }]}>
              {t.settings.profileSubtitle}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              styles.heroCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.heroRow, { flexDirection: dir }]}>
              <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
                {displayPhoto ? (
                  <Image
                    source={{ uri: displayPhoto }}
                    style={[
                      styles.avatar,
                      { backgroundColor: colors.muted, borderColor: colors.border },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: colors.muted,
                        borderColor: colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <UserRound size={40} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
                  <Camera size={16} color="#fff" />
                </View>
              </Pressable>

              <View style={[styles.heroMeta, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.heroName, { color: colors.foreground, textAlign }]} numberOfLines={2}>
                  {name.trim() || (isRTL ? "مستخدم" : "User")}
                </Text>
                <Text
                  style={[styles.heroEmail, { color: colors.mutedForeground, textAlign }]}
                  numberOfLines={1}
                >
                  {account?.email}
                </Text>
                <View style={[styles.heroBadges, { flexDirection: dir }]}>
                  <View style={[styles.rolePill, { backgroundColor: `${colors.primary}14` }]}>
                    <Text style={[styles.rolePillText, { color: colors.primary }]}>{roleLabel}</Text>
                  </View>
                  <Text style={[styles.heroHint, { color: colors.mutedForeground }]}>
                    {isRTL ? "اضغط على الصورة لتغييرها" : "Click photo to update"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.cardsRow,
              showSplitCards && [styles.cardsRowSplit, { flexDirection: dir }],
            ]}
          >
            <View
              style={[
                styles.card,
                showSplitCards && styles.cardHalf,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground, textAlign }]}>
                {t.settings.personalInfo}
              </Text>
              <View style={gridStyle(columns === 3 && !isDoctor ? 3 : Math.min(columns, 2))}>
                <View style={spanStyle(columns, 1)}>
                  <ProfileField
                    label={isRTL ? "الاسم" : "Name"}
                    value={name}
                    onChangeText={setName}
                    colors={colors}
                    isRTL={isRTL}
                  />
                </View>
                <View style={spanStyle(columns, 1)}>
                  <ProfileField
                    label={isRTL ? "الهاتف" : "Phone"}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    colors={colors}
                    isRTL={isRTL}
                  />
                </View>
                {!isDoctor ? (
                  <View style={spanStyle(columns, 1)}>
                    <ProfileField
                      label={isRTL ? "تاريخ الميلاد" : "Birth date"}
                      value={birthDate}
                      onChangeText={setBirthDate}
                      placeholder="YYYY-MM-DD"
                      colors={colors}
                      isRTL={isRTL}
                    />
                  </View>
                ) : (
                  <View style={spanStyle(columns, 1)}>
                    <ProfileField
                      label={isRTL ? "البريد الإلكتروني" : "Email"}
                      value={account?.email ?? ""}
                      editable={false}
                      colors={colors}
                      isRTL={isRTL}
                    />
                  </View>
                )}
                {!isDoctor ? (
                  <View style={spanStyle(columns, columns >= 3 ? 2 : 1)}>
                    <ProfileField
                      label={isRTL ? "البريد الإلكتروني" : "Email"}
                      value={account?.email ?? ""}
                      editable={false}
                      colors={colors}
                      isRTL={isRTL}
                    />
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground, textAlign }]}>
              {t.settings.preferences}
            </Text>
            <View style={{ gap: 16 }}>
              <ProfileLanguageField embedded wideCards />
              <ProfileThemeField />
              <ProfileAiField />
            </View>
          </View>

          {isDoctor ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground, textAlign }]}>
                {t.settings.doctorTitle}
              </Text>
              <View style={gridStyle(Math.min(columns, 2))}>
                <View style={spanStyle(Math.min(columns, 2), 1)}>
                  <ProfileField
                    label={isRTL ? "المسمى الوظيفي" : "Professional title"}
                    value={professionalTitle}
                    onChangeText={setProfessionalTitle}
                    colors={colors}
                    isRTL={isRTL}
                  />
                </View>
                <View style={spanStyle(Math.min(columns, 2), 1)}>
                  <EgpPriceInput
                    variant="field"
                    value={consultationPrice}
                    onChange={setConsultationPrice}
                    label={t.auth.consultationPrice}
                  />
                </View>
              </View>
              <View style={styles.stackedField}>
                <ProfileField
                  label={isRTL ? "الموقع" : "Location"}
                  value={location}
                  onChangeText={setLocation}
                  placeholder={isRTL ? "المدينة، العنوان" : "City, address"}
                  colors={colors}
                  isRTL={isRTL}
                />
              </View>
              <View style={styles.stackedField}>
                <ProfileField
                  label={isRTL ? "نبذة عن الطبيب" : "About / doctor info"}
                  value={info}
                  onChangeText={setInfo}
                  placeholder={
                    isRTL ? "خبرات، اهتمامات طبية..." : "Experience, focus areas..."
                  }
                  multiline
                  colors={colors}
                  isRTL={isRTL}
                />
              </View>
              <Text style={[styles.sectionLabel, { color: colors.foreground, textAlign }]}>
                {isRTL ? "التخصصات" : "Specialities"}
              </Text>
              <SpecialityMultiSelect
                specialities={specialities}
                selectedIds={specialityIds}
                onToggle={toggleSpeciality}
                isRTL={isRTL}
                locale={locale}
                colors={colors}
              />

              <Text style={[styles.sectionLabel, { color: colors.foreground, textAlign }]}>
                {t.settings.digitalSignature}
              </Text>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 13,
                  textAlign,
                  lineHeight: 18,
                  marginBottom: 4,
                }}
              >
                {t.settings.signatureHint}
              </Text>
              {digitalSignaturePreview ? (
                <View style={[styles.signaturePreviewWrap, { borderColor: colors.border }]}>
                  <Image
                    source={{ uri: digitalSignaturePreview }}
                    style={styles.signaturePreview}
                    resizeMode="contain"
                  />
                  <Pressable
                    onPress={clearDigitalSignature}
                    style={[styles.signatureClear, { flexDirection: dir }]}
                    accessibilityRole="button"
                    accessibilityLabel={isRTL ? "حذف التوقيع" : "Remove signature"}
                  >
                    <X size={16} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>
                      {isRTL ? "إزالة" : "Remove"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                onPress={() => void pickDigitalSignature()}
                disabled={signatureUploading}
                style={[
                  styles.certAddBtn,
                  { borderColor: colors.primary, flexDirection: dir },
                ]}
              >
                {signatureUploading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <Plus size={18} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: "700" }}>
                      {digitalSignaturePreview
                        ? isRTL
                          ? "استبدال الصورة"
                          : "Replace image"
                        : t.settings.pickImage}
                    </Text>
                  </>
                )}
              </Pressable>

              <Text style={[styles.sectionLabel, { color: colors.foreground, textAlign }]}>
                {isRTL ? "الشهادات" : "Certifications"}
              </Text>
              {certifications.map((cert, i) => (
                <View
                  key={cert.url}
                  style={[styles.certCard, { borderColor: colors.border }]}
                >
                  <View style={[styles.certHead, { flexDirection: dir }]}>
                    <FileText size={18} color={colors.primary} />
                    <Text
                      style={[styles.certName, { color: colors.foreground, textAlign }]}
                      numberOfLines={1}
                    >
                      {certFileName(cert.url, i)}
                    </Text>
                    <Pressable
                      onPress={() => removeCertification(cert.url)}
                      accessibilityRole="button"
                      accessibilityLabel={isRTL ? "حذف" : "Remove"}
                    >
                      <X size={18} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                  <AppTextInput
                    value={cert.description}
                    onChangeText={(v) => setCertificationDescription(cert.url, v)}
                    placeholder={
                      isRTL ? "وصف الشهادة (اختياري)" : "Certificate description (optional)"
                    }
                    placeholderTextColor={colors.mutedForeground}
                    style={[
                      styles.input,
                      {
                        color: colors.foreground,
                        borderColor: colors.border,
                        backgroundColor: colors.muted,
                        textAlign,
                      },
                    ]}
                  />
                </View>
              ))}
              <Pressable
                onPress={() => void addCertification()}
                disabled={certUploading}
                style={[
                  styles.certAddBtn,
                  { borderColor: colors.primary, flexDirection: dir },
                ]}
              >
                {certUploading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <Plus size={18} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: "700" }}>
                      {isRTL ? "إضافة شهادة" : "Add certification"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}

          {isDoctor ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground, textAlign }]}>
                {isRTL ? "البيانات البنكية" : "Bank details"}
              </Text>
              <View style={gridStyle(Math.min(columns, 2))}>
                <View style={spanStyle(Math.min(columns, 2), 2)}>
                  <ProfileField
                    label={isRTL ? "الاسم الكامل لصاحب الحساب" : "Account holder full name"}
                    value={accountHolderFullName}
                    onChangeText={setAccountHolderFullName}
                    placeholder={isRTL ? "كما هو مسجل في البنك" : "As registered at the bank"}
                    colors={colors}
                    isRTL={isRTL}
                  />
                </View>
                <View style={spanStyle(Math.min(columns, 2), 1)}>
                  <ProfileField
                    label={isRTL ? "رقم الحساب / IBAN" : "IBAN"}
                    value={iban}
                    onChangeText={setIban}
                    placeholder="EGxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    autoCapitalize="characters"
                    colors={colors}
                    isRTL={isRTL}
                  />
                </View>
                <View style={spanStyle(Math.min(columns, 2), 1)}>
                  <ProfileField
                    label={isRTL ? "الرقم القومي" : "National ID"}
                    value={nationalId}
                    onChangeText={setNationalId}
                    placeholder={isRTL ? "14 رقمًا" : "14-digit national ID"}
                    keyboardType="number-pad"
                    colors={colors}
                    isRTL={isRTL}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {isDoctor && accessToken ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <DoctorAvailabilityEditor isRTL={isRTL} token={accessToken} embedded />
            </View>
          ) : null}

          {isDoctor ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground, textAlign }]}>
                {isRTL ? "مدة استشارة الفيديو" : "Video consultation duration"}
              </Text>
              <View style={{ flexDirection: dir, gap: 8, flexWrap: "wrap" }}>
                {VIDEO_DURATIONS.map((opt) => {
                  const on = videoConsultationMinutes === opt.m;
                  return (
                    <Pressable
                      key={opt.m}
                      onPress={() => setVideoConsultationMinutes(opt.m)}
                      style={[
                        styles.durationChip,
                        {
                          backgroundColor: on ? `${colors.primary}18` : colors.muted,
                          borderColor: on ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: on ? colors.primary : colors.foreground,
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        {isRTL ? opt.ar : opt.en}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ marginTop: 12 }}>
                <EgpPriceInput
                  variant="field"
                  value={videoConsultationPrice}
                  onChange={setVideoConsultationPrice}
                  label={t.auth.videoConsultationPrice}
                />
              </View>
              <View
                style={{
                  flexDirection: dir,
                  alignItems: "center",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontWeight: "700",
                      fontSize: 14,
                      textAlign,
                    }}
                  >
                    {t.auth.immediateCalls}
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 12,
                      lineHeight: 17,
                      textAlign,
                    }}
                  >
                    {t.auth.immediateCallsHint}
                  </Text>
                </View>
                <Switch
                  value={immediateCallEnabled}
                  onValueChange={setImmediateCallEnabled}
                  trackColor={{ false: colors.border, true: `${colors.primary}88` }}
                  thumbColor={immediateCallEnabled ? colors.primary : undefined}
                />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <SafeAreaView
        edges={["bottom"]}
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        {actionButtons}
      </SafeAreaView>
    </View>
  );
}

function certFileName(url: string, index: number): string {
  try {
    const raw = decodeURIComponent(url.split("?")[0].split("/").pop() ?? "");
    // Uploads are stored as `<uuid>-<original>`; drop the uuid prefix.
    const cleaned = raw.replace(/^[0-9a-f-]{36}-/i, "");
    if (cleaned) return cleaned;
  } catch {
    // fall through to generic label
  }
  return `Certificate ${index + 1}`;
}

function ProfileField({
  label,
  value,
  onChangeText,
  editable = true,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline = false,
  colors,
  isRTL,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  editable?: boolean;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <AppTextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            color: editable ? colors.foreground : colors.mutedForeground,
            borderColor: colors.border,
            backgroundColor: editable ? colors.muted : `${colors.muted}88`,
            textAlign: isRTL ? "right" : "left",
            textAlignVertical: multiline ? "top" : "center",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "stretch",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  container: {
    width: "100%",
    alignSelf: "center",
    gap: 20,
  },
  pageHeader: {
    paddingHorizontal: 4,
    paddingBottom: 4,
    gap: 6,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 640,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 4,
  },
  heroCard: {
    paddingVertical: 28,
  },
  heroRow: {
    alignItems: "center",
    gap: 24,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroMeta: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  heroName: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
  },
  heroEmail: {
    fontSize: 15,
    fontWeight: "600",
  },
  heroBadges: {
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  heroHint: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardsRow: {
    gap: 20,
  },
  cardsRowSplit: {
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  cardHalf: {
    flex: 1,
    minWidth: 320,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 10,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 104,
    paddingTop: 12,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  stackedField: {
    marginTop: 16,
  },
  certCard: {
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  certHead: {
    alignItems: "center",
    gap: 10,
  },
  certName: { flex: 1, fontSize: 14, fontWeight: "600" },
  certAddBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
  },
  signaturePreviewWrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: "center",
    marginTop: 4,
  },
  signaturePreview: {
    width: "100%",
    height: 110,
  },
  signatureClear: {
    alignItems: "center",
    gap: 6,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  footerInner: {
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  mobileActions: {
    width: "100%",
    gap: 10,
  },
  mobileFullBtn: {
    width: "100%",
    minWidth: 0,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 14 },
  saveBtn: {
    minWidth: 168,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});

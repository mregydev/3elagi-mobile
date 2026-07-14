import { router } from "expo-router";
import { Camera, FileText, LogOut, Plus, UserRound, X } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
import { AppHeader } from "@/components/AppHeader";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { EgpPriceInput } from "@/components/EgpPriceInput";
import { DoctorAvailabilityEditor } from "@/components/DoctorAvailabilityEditor";
import { ProfileLanguageField } from "@/components/profile/ProfileLanguageField";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useProfileEditor } from "@/hooks/useProfileEditor";
import { useI18n } from "@/hooks/useI18n";

const AVATAR_SIZE = 76;

const VIDEO_DURATIONS = [
  { m: 30, en: "30 min", ar: "٣٠ دقيقة" },
  { m: 60, en: "1 hour", ar: "ساعة" },
  { m: 120, en: "2 hours", ar: "ساعتان" },
];

export function ProfileEditor({
  accessToken,
  role,
  isRTL,
  colors,
  showLogout = true,
}: {
  accessToken: string;
  role: string;
  isRTL: boolean;
  colors: ReturnType<typeof useColors>;
  showLogout?: boolean;
}) {
  const logout = useAuthStore((s) => s.logout);
  const { t } = useI18n();
  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  const editor = useProfileEditor({ accessToken, role, isRTL });
  const {
    loading,
    saving,
    account,
    name,
    setName,
    phone,
    setPhone,
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
    setSpecialityId,
    consultationPrice,
    setConsultationPrice,
    videoConsultationPrice,
    setVideoConsultationPrice,
    videoConsultationMinutes,
    setVideoConsultationMinutes,
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

  const displayName = name.trim() || (isRTL ? "مستخدم" : "Your name");
  const displayEmail = account?.email ?? (isRTL ? "—" : "—");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : (
        <KeyboardSafeScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          bottomOffset={32}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            <View
              style={[
                styles.profileHeaderCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Pressable
                onPress={pickPhoto}
                style={styles.avatarWrap}
                accessibilityRole="button"
                accessibilityLabel={isRTL ? "تغيير الصورة" : "Change profile photo"}
              >
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
                    <UserRound size={34} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
                  <Camera size={14} color="#fff" />
                </View>
              </Pressable>

              <Text style={[styles.profileName, { color: colors.foreground, textAlign }]}>
                {displayName}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.mutedForeground, textAlign }]}>
                {displayEmail}
              </Text>
              <Text style={[styles.avatarHint, { color: colors.mutedForeground, textAlign }]}>
                {isRTL ? "اضغط على الصورة للتغيير" : "Tap photo to update"}
              </Text>
            </View>

            <SectionCard
              title={isRTL ? "المعلومات الشخصية" : "Personal information"}
              colors={colors}
              textAlign={textAlign}
            >
              <Field
                label={isRTL ? "الاسم" : "Name"}
                value={name}
                onChangeText={setName}
                colors={colors}
                isRTL={isRTL}
              />
              <Field
                label={isRTL ? "الهاتف" : "Phone"}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                colors={colors}
                isRTL={isRTL}
              />
              {!isDoctor ? (
                <Field
                  label={isRTL ? "تاريخ الميلاد" : "Birth date"}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="YYYY-MM-DD"
                  colors={colors}
                  isRTL={isRTL}
                />
              ) : null}
            </SectionCard>

            {isDoctor ? (
              <SectionCard
                title={isRTL ? "الملف المهني" : "Professional profile"}
                colors={colors}
                textAlign={textAlign}
              >
                <Field
                  label={isRTL ? "المسمى الوظيفي" : "Professional title"}
                  value={professionalTitle}
                  onChangeText={setProfessionalTitle}
                  colors={colors}
                  isRTL={isRTL}
                />
                <Field
                  label={isRTL ? "الموقع" : "Location"}
                  value={location}
                  onChangeText={setLocation}
                  placeholder={isRTL ? "المدينة، العنوان" : "City, address"}
                  colors={colors}
                  isRTL={isRTL}
                />
                <Field
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
                <View style={styles.block}>
                  <Text
                    style={[styles.fieldLabel, { color: colors.mutedForeground, textAlign }]}
                  >
                    {isRTL ? "التخصص" : "Speciality"}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.specialityRow, { flexDirection: dir }]}
                  >
                    {specialities.map((spec) => {
                      const active = specialityId === spec.id;
                      const label = isRTL ? spec.nameAr : spec.nameEn;
                      return (
                        <Pressable
                          key={spec.id}
                          onPress={() => setSpecialityId(spec.id)}
                          style={[
                            styles.specialityChip,
                            {
                              backgroundColor: active ? `${colors.primary}18` : colors.muted,
                              borderColor: active ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: active ? colors.primary : colors.foreground,
                              fontWeight: "700",
                              fontSize: 13,
                            }}
                            numberOfLines={1}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
                <EgpPriceInput
                  value={consultationPrice}
                  onChange={setConsultationPrice}
                  label={t.auth.consultationPrice}
                  compact
                />
              </SectionCard>
            ) : null}

            {isDoctor ? (
              <SectionCard
                title={isRTL ? "البيانات البنكية" : "Bank details"}
                colors={colors}
                textAlign={textAlign}
              >
                <Field
                  label={isRTL ? "الاسم الكامل لصاحب الحساب" : "Account holder full name"}
                  value={accountHolderFullName}
                  onChangeText={setAccountHolderFullName}
                  placeholder={isRTL ? "كما هو مسجل في البنك" : "As registered at the bank"}
                  colors={colors}
                  isRTL={isRTL}
                />
                <Field
                  label={isRTL ? "رقم الحساب / IBAN" : "IBAN"}
                  value={iban}
                  onChangeText={setIban}
                  placeholder="EGxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  autoCapitalize="characters"
                  colors={colors}
                  isRTL={isRTL}
                />
                <Field
                  label={isRTL ? "الرقم القومي" : "National ID"}
                  value={nationalId}
                  onChangeText={setNationalId}
                  placeholder={isRTL ? "14 رقمًا" : "14-digit national ID"}
                  keyboardType="number-pad"
                  colors={colors}
                  isRTL={isRTL}
                />
              </SectionCard>
            ) : null}

            {isDoctor ? (
              <SectionCard
                title={isRTL ? "الشهادات" : "Certifications"}
                colors={colors}
                textAlign={textAlign}
              >
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
                        hitSlop={8}
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
                          backgroundColor: colors.background,
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
              </SectionCard>
            ) : null}

            {isDoctor ? (
              <Pressable
                onPress={() => router.push("/(tabs)/intake")}
                style={[styles.sectionLink, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.primary, fontWeight: "700", textAlign }}>
                  {isRTL ? "منشئ فحوصات المتابعة" : "Follow-up exam builder"}
                </Text>
              </Pressable>
            ) : null}

            {isDoctor ? (
              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <DoctorAvailabilityEditor isRTL={isRTL} token={accessToken} embedded />
              </View>
            ) : null}

            {isDoctor ? (
              <SectionCard
                title={isRTL ? "مدة استشارة الفيديو" : "Video consultation duration"}
                colors={colors}
                textAlign={textAlign}
              >
                <View style={[{ flexDirection: dir, gap: 8, flexWrap: "wrap" }]}>
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
                <EgpPriceInput
                  value={videoConsultationPrice}
                  onChange={setVideoConsultationPrice}
                  label={t.auth.videoConsultationPrice}
                  compact
                />
              </SectionCard>
            ) : null}

            <SectionCard
              title={isRTL ? "التفضيلات" : "Preferences"}
              colors={colors}
              textAlign={textAlign}
            >
              <ProfileLanguageField embedded wideCards />
            </SectionCard>

            <View style={styles.actions}>
              <Pressable
                onPress={() => void save()}
                disabled={saving}
                style={[
                  styles.actionBtn,
                  styles.saveBtn,
                  { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isRTL ? "حفظ التغييرات" : "Save changes"}
                  </Text>
                )}
              </Pressable>

              {showLogout ? (
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
                          onPress: () => {
                            logout();
                            router.replace("/welcome");
                          },
                        },
                      ],
                    )
                  }
                  style={[
                    styles.actionBtn,
                    styles.logoutBtn,
                    { borderColor: colors.border, flexDirection: dir },
                  ]}
                >
                  <LogOut size={16} color="#ef4444" />
                  <Text style={styles.logoutText}>{isRTL ? "تسجيل الخروج" : "Log out"}</Text>
                </Pressable>
              ) : null}
            </View>
        </KeyboardSafeScrollView>
      )}
    </View>
  );
}

function SectionCard({
  title,
  children,
  colors,
  textAlign,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
  textAlign: "left" | "right";
}) {
  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
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

function Field({
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
  const textAlign = isRTL ? "right" : "left";

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground, textAlign }]}>
        {label}
      </Text>
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
            backgroundColor: editable ? colors.background : colors.muted,
            textAlign,
            textAlignVertical: multiline ? "top" : "center",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, minHeight: 0 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 14,
  },
  profileHeaderCard: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 6,
  },
  avatarWrap: { position: "relative", marginBottom: 4 },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    marginTop: 4,
  },
  profileEmail: {
    fontSize: 14,
    lineHeight: 20,
  },
  avatarHint: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  sectionBody: {
    gap: 14,
  },
  sectionLink: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  block: {
    gap: 8,
  },
  specialityRow: {
    gap: 8,
    paddingVertical: 2,
  },
  specialityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 46,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: 12,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  certCard: {
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    paddingVertical: 12,
  },
  actions: {
    gap: 10,
  },
  actionBtn: {
    width: "100%",
    alignSelf: "stretch",
  },
  saveBtn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  logoutBtn: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 14 },
});

import { router } from "expo-router";
import { Camera, LogOut } from "lucide-react-native";
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
import { AppHeader } from "@/components/AppHeader";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { MessagePricePicker } from "@/components/MessagePricePicker";
import { ProfileLanguageField } from "@/components/profile/ProfileLanguageField";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useProfileEditor } from "@/hooks/useProfileEditor";

const AVATAR_SIZE = 76;

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
    specialities,
    specialityId,
    setSpecialityId,
    messagePrice,
    setMessagePrice,
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
                <Image
                  source={{
                    uri:
                      displayPhoto ||
                      "https://api.dicebear.com/9.x/avataaars/png?seed=anon",
                  }}
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                />
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
                <MessagePricePicker
                  value={messagePrice}
                  onChange={setMessagePrice}
                  isRTL={isRTL}
                  dir={dir}
                  compact
                  label={isRTL ? "سعر الرسالة (نقاط)" : "Message price (points)"}
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

function Field({
  label,
  value,
  onChangeText,
  editable = true,
  placeholder,
  keyboardType,
  colors,
  isRTL,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  editable?: boolean;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad";
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
}) {
  const textAlign = isRTL ? "right" : "left";

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground, textAlign }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            color: editable ? colors.foreground : colors.mutedForeground,
            borderColor: colors.border,
            backgroundColor: editable ? colors.background : colors.muted,
            textAlign,
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

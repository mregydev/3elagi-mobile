import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { Camera, LogOut, UserRound } from "lucide-react-native";
import { MessagePricePicker } from "@/components/MessagePricePicker";
import { ProfileLanguageField } from "@/components/profile/ProfileLanguageField";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import { navigateToWelcome } from "@/domains/auth/navigation";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useProfileEditor } from "@/hooks/useProfileEditor";
import { useWebLayout } from "@/hooks/useWebLayout";
import { webConfirm } from "@/utils/webConfirm";

interface Props {
  accessToken: string;
  role: string;
  isRTL: boolean;
  colors: ReturnType<typeof useColors>;
}

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
  const { t } = useI18n();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { isWide, isDesktop, isTablet } = useWebLayout();
  const tabBarHeight = useBottomTabBarHeight();
  const showLogout = !isDesktop;
  const columns = gridColumns(isWide, isDesktop, isTablet);
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
          showLogout && { paddingBottom: tabBarHeight + 12 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { maxWidth: WEB_MAX_WIDTH.profile }]}>
          <View style={styles.pageHeader}>
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

            {!isDoctor ? (
              <View
                style={[
                  styles.card,
                  showSplitCards && styles.cardHalf,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.foreground, textAlign }]}>
                  {t.settings.preferences}
                </Text>
                <ProfileLanguageField embedded />
              </View>
            ) : null}
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
                <View style={[spanStyle(Math.min(columns, 2), 1), styles.messagePriceCell]}>
                  <MessagePricePicker
                    value={messagePrice}
                    onChange={setMessagePrice}
                    isRTL={isRTL}
                    dir={dir}
                    label={isRTL ? "سعر الرسالة (نقاط)" : "Message price (points)"}
                    hint={isRTL ? "من 1 إلى 5 نقاط لكل رسالة" : "From 1 to 5 points per message"}
                  />
                </View>
              </View>
              <Text style={[styles.sectionLabel, { color: colors.foreground, textAlign }]}>
                {isRTL ? "التخصص" : "Speciality"}
              </Text>
              <View style={[styles.specialityRow, { flexDirection: dir }]}>
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
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
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
                {t.settings.preferences}
              </Text>
              <ProfileLanguageField embedded />
            </View>
          ) : null}

          {showLogout ? actionButtons : null}
        </View>
      </ScrollView>

      {!showLogout ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          {actionButtons}
        </View>
      ) : null}
    </View>
  );
}

function ProfileField({
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
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
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
            backgroundColor: editable ? colors.muted : `${colors.muted}88`,
            textAlign: isRTL ? "right" : "left",
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  container: {
    width: "100%",
    gap: 20,
  },
  pageHeader: {
    paddingHorizontal: 4,
    paddingTop: 8,
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
  specialityRow: {
    flexWrap: "wrap",
    gap: 8,
  },
  specialityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  messagePriceCell: {
    justifyContent: "flex-end",
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
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingVertical: 16,
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
    paddingTop: 4,
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

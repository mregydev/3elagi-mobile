import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminPagePadding } from "@/constants/adminLayout";
import { MarketingSectionBuilder } from "@/components/admin/MarketingSectionBuilder";
import { MarketingEmailPreview } from "@/components/admin/MarketingEmailPreview";
import {
  fetchAdminDoctorWelcomeTemplate,
  fetchAdminDoctors,
  sendAdminDoctorWelcomeEmailBatch,
  type AdminDoctorRow,
  type MarketingEmailLanguage,
  type MarketingEmailTheme,
} from "@/domains/admin/api";
import { DEFAULT_DOCTOR_WELCOME_PASSWORD } from "@/domains/admin/constants";
import { parseCommaEmails } from "@/domains/admin/parseCommaList";
import type { MarketingEmailSection } from "@/domains/admin/marketingSections";
import {
  DEFAULT_MARKETING_EMAIL_THEME,
  MARKETING_EMAIL_THEMES,
  MARKETING_THEME_LABELS,
  MARKETING_THEME_PALETTES,
} from "@/domains/admin/marketingThemes";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { confirmAction } from "@/utils/confirmAction";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const LANGUAGES: { code: MarketingEmailLanguage; label: string; hint: string }[] = [
  { code: "en", label: "English", hint: "Left-to-right" },
  { code: "ar", label: "Arabic", hint: "Right-to-left" },
  { code: "es", label: "Spanish", hint: "Left-to-right" },
  { code: "de", label: "German", hint: "Left-to-right" },
];

type BuilderTab = "edit" | "preview";

function sectionsHaveContent(sections: MarketingEmailSection[]): boolean {
  return sections.some((section) => {
    if (section.html?.trim()) return true;
    if (section.title?.trim()) return true;
    if (section.items?.some((item) => item.trim())) return true;
    if (section.buttonLabel?.trim() || section.buttonUrl?.trim()) return true;
    if (section.type === "screenshots") return true;
    return false;
  });
}

export default function AdminDoctorWelcomeEmailWeb() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const pagePadding = adminPagePadding(width <= 767);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [doctors, setDoctors] = useState<AdminDoctorRow[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [emailsText, setEmailsText] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<MarketingEmailLanguage>("en");
  const [themeColor, setThemeColor] = useState<MarketingEmailTheme>(
    DEFAULT_MARKETING_EMAIL_THEME,
  );
  const [sections, setSections] = useState<MarketingEmailSection[]>([]);
  const [bodyDir, setBodyDir] = useState<"ltr" | "rtl">("ltr");
  const [subjectPreview, setSubjectPreview] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [sending, setSending] = useState(false);
  const [builderTab, setBuilderTab] = useState<BuilderTab>("edit");
  const sectionsDirtyRef = useRef(false);

  const previewName = doctorName.trim() || "Doctor";

  const loadTemplate = useCallback(
    async (
      lang: MarketingEmailLanguage,
      theme: MarketingEmailTheme,
      force = false,
    ) => {
      if (!accessToken) return;
      if (sectionsDirtyRef.current && !force) {
        const ok = await confirmAction(
          "Replace your current email sections with the default template for this language and theme?",
        );
        if (!ok) return;
      }

      setLoadingTemplate(true);
      try {
        const template = await fetchAdminDoctorWelcomeTemplate(accessToken, lang, theme);
        setSections(template.sections);
        setBodyDir(template.dir);
        setSubjectPreview(template.subjectTemplate);
        setThemeColor(template.themeColor ?? theme);
        sectionsDirtyRef.current = false;
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : "Failed to load template");
      } finally {
        setLoadingTemplate(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    void loadTemplate(language, themeColor, true);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    setLoadingDoctors(true);
    fetchAdminDoctors(accessToken)
      .then((rows) => setDoctors(rows))
      .catch((e) =>
        showErrorToast(e instanceof Error ? e.message : "Failed to load doctors"),
      )
      .finally(() => setLoadingDoctors(false));
  }, [accessToken]);

  const selectDoctor = useCallback((doctorId: string) => {
    setSelectedDoctorId(doctorId);
    if (!doctorId) {
      setDoctorName("");
      setEmailsText("");
      setPassword("");
      return;
    }
    const doctor = doctors.find((row) => row.id === doctorId);
    if (!doctor) return;
    setDoctorName(doctor.name);
    setEmailsText(doctor.email?.trim() ?? "");
    setPassword(doctor.welcome_password?.trim() || DEFAULT_DOCTOR_WELCOME_PASSWORD);
  }, [doctors]);

  const parsedEmails = parseCommaEmails(emailsText);
  const primaryEmail = parsedEmails[0] ?? "";

  const pickLanguage = (code: MarketingEmailLanguage) => {
    if (code === language) return;
    setLanguage(code);
    void loadTemplate(code, themeColor);
  };

  const pickTheme = (theme: MarketingEmailTheme) => {
    if (theme === themeColor) return;
    if (sectionsDirtyRef.current) {
      setThemeColor(theme);
      return;
    }
    setThemeColor(theme);
    void loadTemplate(language, theme);
  };

  const resetTemplate = async () => {
    const ok = await confirmAction(
      "Reset email sections to the default template for this language?",
    );
    if (!ok) return;
    void loadTemplate(language, themeColor, true);
  };

  const send = async () => {
    if (!accessToken || sending) return;

    const name = doctorName.trim();
    const recipientEmails = parseCommaEmails(emailsText);
    const loginPassword = password;

    if (!selectedDoctorId) {
      showErrorToast("Select a doctor from the list");
      return;
    }
    if (!name || name.length < 2) {
      showErrorToast("Doctor name is missing");
      return;
    }
    if (!recipientEmails.length) {
      showErrorToast("Enter at least one valid email (comma-separated for multiple)");
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      showErrorToast("Password is missing for this doctor account");
      return;
    }
    if (!sections.length || !sectionsHaveContent(sections)) {
      showErrorToast("Add at least one section with content");
      return;
    }

    const langLabel = LANGUAGES.find((l) => l.code === language)?.label ?? language;
    const recipientLabel =
      recipientEmails.length === 1
        ? recipientEmails[0]
        : `${recipientEmails.length} recipients (${recipientEmails.join(", ")})`;
    const confirmed = await confirmAction(
      `Send the welcome email with login credentials to ${recipientLabel} in ${langLabel}?`,
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const result = await sendAdminDoctorWelcomeEmailBatch(accessToken, {
        name,
        emails: recipientEmails,
        password: loginPassword,
        language,
        sections,
        themeColor,
      });
      if (result.sent === result.total) {
        showSuccessToast(`Welcome email sent to ${result.sent} recipient(s)`);
      } else {
        showErrorToast(
          `Sent ${result.sent}/${result.total}`,
          result.results
            .filter((row) => !row.ok)
            .map((row) => `${row.email}: ${row.error ?? "failed"}`)
            .join("; "),
        );
      }
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const inputStyle = [
    styles.fieldInput,
    {
      backgroundColor: colors.background,
      borderColor: colors.border,
      color: colors.foreground,
    },
  ];

  return (
    <AdminShell
      title="Welcome email"
      subtitle="Send a welcome email with login credentials to a doctor whose account you already created. Enter their email and password, customize the template, then send."
    >
      <ScrollView
        nestedScrollEnabled={builderTab === "preview"}
        contentContainerStyle={[styles.scroll, { padding: pagePadding }]}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Login credentials
          </Text>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Pick a doctor — name and password are filled from the account. Add comma-separated
            emails to send the same welcome message to multiple addresses.
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Doctor
          </Text>
          {loadingDoctors ? (
            <ActivityIndicator color={colors.primary} style={{ alignSelf: "flex-start" }} />
          ) : Platform.OS === "web" ? (
            <select
              value={selectedDoctorId}
              onChange={(event) => selectDoctor(event.target.value)}
              style={{
                width: "100%",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.foreground,
                padding: "12px 14px",
                fontSize: 14,
              }}
            >
              <option value="">Select a doctor…</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                  {doctor.email ? ` (${doctor.email})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.doctorPicker}>
              {doctors.map((doctor) => {
                const active = selectedDoctorId === doctor.id;
                return (
                  <Pressable
                    key={doctor.id}
                    onPress={() => selectDoctor(doctor.id)}
                    style={[
                      styles.doctorChip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? `${colors.primary}14` : colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? colors.primary : colors.foreground,
                        fontWeight: active ? "800" : "600",
                        fontSize: 13,
                      }}
                    >
                      {doctor.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Doctor name
          </Text>
          <AppTextInput
            value={doctorName}
            editable={false}
            placeholder="Select a doctor above"
            autoCapitalize="words"
            style={[...inputStyle, styles.readonlyInput]}
          />

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Email(s)
          </Text>
          <AppTextInput
            value={emailsText}
            onChangeText={setEmailsText}
            placeholder="doctor@example.com, assistant@clinic.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            multiline
            style={[...inputStyle, styles.emailsInput]}
          />
          {parsedEmails.length > 1 ? (
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              {parsedEmails.length} recipients detected
            </Text>
          ) : null}

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Password
          </Text>
          <AppTextInput
            value={password}
            editable={false}
            placeholder="Select a doctor above"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            style={[...inputStyle, styles.readonlyInput]}
          />
          {selectedDoctorId && !doctors.find((d) => d.id === selectedDoctorId)?.welcome_password ? (
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Using default password — only accounts created after this update store the exact
              password.
            </Text>
          ) : null}

          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Email language
          </Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((item) => {
              const active = language === item.code;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => pickLanguage(item.code)}
                  style={({ pressed }) => [
                    styles.langChip,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active
                        ? `${colors.primary}14`
                        : pressed
                          ? colors.muted
                          : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langLabel,
                      {
                        color: active ? colors.primary : colors.foreground,
                        fontWeight: active ? "800" : "600",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={[styles.langHint, { color: colors.mutedForeground }]}>
                    {item.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Theme color
          </Text>
          <View style={styles.langRow}>
            {MARKETING_EMAIL_THEMES.map((theme) => {
              const active = themeColor === theme;
              const palette = MARKETING_THEME_PALETTES[theme];
              return (
                <Pressable
                  key={theme}
                  onPress={() => pickTheme(theme)}
                  style={({ pressed }) => [
                    styles.themeChip,
                    {
                      borderColor: active ? palette.brand : colors.border,
                      backgroundColor: active
                        ? `${palette.brand}14`
                        : pressed
                          ? colors.muted
                          : colors.background,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.themeSwatch,
                      { backgroundColor: palette.brand },
                    ]}
                  />
                  <Text
                    style={[
                      styles.langLabel,
                      {
                        color: active ? palette.brand : colors.foreground,
                        fontWeight: active ? "800" : "600",
                      },
                    ]}
                  >
                    {MARKETING_THEME_LABELS[theme]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.bodyHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Email sections
            </Text>
            <Pressable
              onPress={() => void resetTemplate()}
              style={({ pressed }) => [
                styles.resetBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.muted : colors.background,
                },
              ]}
            >
              <Text style={[styles.resetBtnText, { color: colors.foreground }]}>
                Reset template
              </Text>
            </Pressable>
          </View>

          {subjectPreview && builderTab === "edit" ? (
            <Text style={[styles.subjectPreview, { color: colors.mutedForeground }]}>
              Subject preview: {subjectPreview.replace("{{name}}", previewName)}
            </Text>
          ) : null}

          <View style={styles.tabRow}>
            {(
              [
                { id: "edit" as const, label: "Edit sections" },
                { id: "preview" as const, label: "Preview" },
              ] as const
            ).map((tab) => {
              const active = builderTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setBuilderTab(tab.id)}
                  style={({ pressed }) => [
                    styles.tabBtn,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active
                        ? `${colors.primary}14`
                        : pressed
                          ? colors.muted
                          : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.primary : colors.foreground,
                      fontWeight: active ? "800" : "600",
                      fontSize: 13,
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {loadingTemplate ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
          ) : builderTab === "edit" ? (
            <MarketingSectionBuilder
              sections={sections}
              onChange={(next) => {
                sectionsDirtyRef.current = true;
                setSections(next);
              }}
              dir={bodyDir}
            />
          ) : accessToken ? (
            <MarketingEmailPreview
              accessToken={accessToken}
              sections={sections}
              language={language}
              themeColor={themeColor}
              previewName={previewName}
              previewEmail={primaryEmail}
              previewPassword={password}
              previewKind="doctor-welcome"
              active={builderTab === "preview"}
            />
          ) : null}

          <Pressable
            onPress={() => void send()}
            disabled={sending || loadingTemplate}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: sending
                  ? `${colors.primary}99`
                  : pressed
                    ? `${colors.primary}e6`
                    : colors.primary,
                opacity: sending || loadingTemplate ? 0.85 : 1,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.sendBtnText, { color: colors.primaryForeground }]}>
                Send welcome email{parsedEmails.length > 1 ? ` (${parsedEmails.length})` : ""}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 48,
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === "web" ? "inherit" : undefined,
  },
  readonlyInput: {
    opacity: 0.92,
  },
  emailsInput: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  doctorPicker: {
    maxHeight: 44,
    marginBottom: 4,
  },
  doctorChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  langRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  langChip: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 120,
    cursor: "pointer" as "auto",
  },
  themeChip: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    cursor: "pointer" as "auto",
  },
  themeSwatch: {
    width: 18,
    height: 18,
    borderRadius: 999,
  },
  langLabel: {
    fontSize: 14,
  },
  langHint: {
    fontSize: 11,
    marginTop: 2,
  },
  bodyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  resetBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    cursor: "pointer" as "auto",
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  subjectPreview: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  tabBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    cursor: "pointer" as "auto",
  },
  sendBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as "auto",
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: "800",
  },
});

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
import { AdminShell } from "@/components/admin/AdminShell.web";
import { MarketingHtmlEditor } from "@/components/admin/MarketingHtmlEditor.web";
import {
  fetchAdminMarketingTemplate,
  sendAdminMarketingEmail,
  type MarketingEmailLanguage,
} from "@/domains/admin/api";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const LANGUAGES: { code: MarketingEmailLanguage; label: string; hint: string }[] = [
  { code: "en", label: "English", hint: "Left-to-right" },
  { code: "ar", label: "Arabic", hint: "Right-to-left" },
  { code: "es", label: "Spanish", hint: "Left-to-right" },
  { code: "de", label: "German", hint: "Left-to-right" },
];

export default function AdminMarketingWeb() {
  const colors = useColors();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState<MarketingEmailLanguage>("en");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyDir, setBodyDir] = useState<"ltr" | "rtl">("ltr");
  const [subjectPreview, setSubjectPreview] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [sending, setSending] = useState(false);
  const bodyDirtyRef = useRef(false);

  const loadTemplate = useCallback(
    async (lang: MarketingEmailLanguage, force = false) => {
      if (!accessToken) return;
      if (bodyDirtyRef.current && !force) {
        const ok =
          typeof window !== "undefined" &&
          window.confirm(
            "Switch language and replace the current email body with the default template?",
          );
        if (!ok) return;
      }

      setLoadingTemplate(true);
      try {
        const template = await fetchAdminMarketingTemplate(accessToken, lang);
        setBodyHtml(template.bodyHtml);
        setBodyDir(template.dir);
        setSubjectPreview(template.subjectTemplate);
        bodyDirtyRef.current = false;
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : "Failed to load template");
      } finally {
        setLoadingTemplate(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    void loadTemplate(language, true);
  }, [accessToken]);

  const pickLanguage = (code: MarketingEmailLanguage) => {
    if (code === language) return;
    setLanguage(code);
    void loadTemplate(code);
  };

  const resetTemplate = () => {
    const ok =
      typeof window === "undefined" ||
      window.confirm("Reset the email body to the default template for this language?");
    if (!ok) return;
    void loadTemplate(language, true);
  };

  const send = async () => {
    if (!accessToken || sending) return;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedBody = bodyHtml.trim();
    if (!trimmedName) {
      showErrorToast("Recipient name is required");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showErrorToast("Enter a valid email address");
      return;
    }
    if (!trimmedBody) {
      showErrorToast("Email body cannot be empty");
      return;
    }

    const langLabel = LANGUAGES.find((l) => l.code === language)?.label ?? language;
    const confirmed =
      typeof window !== "undefined" &&
      window.confirm(
        `Send the doctor invitation email to ${trimmedEmail} in ${langLabel}?`,
      );
    if (!confirmed) return;

    setSending(true);
    try {
      const result = await sendAdminMarketingEmail(accessToken, {
        name: trimmedName,
        email: trimmedEmail,
        language,
        bodyHtml: trimmedBody,
      });
      showSuccessToast(`Email sent to ${result.to}`);
      setName("");
      setEmail("");
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminShell
      title="Marketing"
      subtitle="Compose and send the doctor invitation email. Edit the HTML body, then send to a recipient."
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recipient
          </Text>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Doctor name
          </Text>
          <AppTextInput
            value={name}
            onChangeText={setName}
            placeholder="Dr. Ahmed Hassan"
            autoCapitalize="words"
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Email address
          </Text>
          <AppTextInput
            value={email}
            onChangeText={setEmail}
            placeholder="doctor@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />

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

          <View style={styles.bodyHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Email body
            </Text>
            <Pressable
              onPress={resetTemplate}
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

          {subjectPreview ? (
            <Text style={[styles.subjectPreview, { color: colors.mutedForeground }]}>
              Subject preview: {subjectPreview.replace("{{name}}", name.trim() || "Doctor")}
            </Text>
          ) : null}

          {loadingTemplate ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <MarketingHtmlEditor
              value={bodyHtml}
              onChange={(html) => {
                bodyDirtyRef.current = true;
                setBodyHtml(html);
              }}
              dir={bodyDir}
            />
          )}

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
                Send invitation email
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
    padding: 28,
    paddingBottom: 48,
    maxWidth: 960,
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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

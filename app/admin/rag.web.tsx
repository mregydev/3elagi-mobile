import { Redirect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FileText, Trash2, Upload } from "lucide-react-native";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import {
  createAdminRagDocument,
  createAdminRagText,
  deleteAdminRagSource,
  fetchAdminRagSources,
  uploadAdminRagFile,
  type AdminRagSourceRow,
} from "@/domains/admin/api";
import { getPostLogoutRoute } from "@/domains/auth/navigation";
import { useColors } from "@/hooks/useColors";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

function confirmAction(message: string): boolean {
  if (typeof window !== "undefined" && window.confirm) {
    return window.confirm(message);
  }
  return true;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminRagWeb() {
  const colors = useColors();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);

  const [sources, setSources] = useState<AdminRagSourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainingText, setTrainingText] = useState(false);
  const [trainingFile, setTrainingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<"uploading" | "processing" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const rows = await fetchAdminRagSources(accessToken);
      setSources(rows);
    } catch (e) {
      showErrorToast("Failed to load RAG sources", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isSignedIn(profile, accessToken)) {
    return <Redirect href="/auth/login" />;
  }

  if (role?.toLowerCase() !== "admin") {
    return <Redirect href="/welcome" />;
  }

  const handleTrainText = async () => {
    if (!accessToken) return;
    if (!textContent.trim()) {
      showErrorToast("Missing text", "Enter text before training.");
      return;
    }
    setTrainingText(true);
    try {
      const created = await createAdminRagText(accessToken, {
        title: textTitle.trim() || undefined,
        content: textContent,
      });
      setSources((prev) => [created, ...prev]);
      setTextTitle("");
      setTextContent("");
      showSuccessToast("Text added to RAG");
    } catch (e) {
      showErrorToast("Training failed", (e as Error).message);
    } finally {
      setTrainingText(false);
    }
  };

  const handleTrainFile = async () => {
    if (!accessToken) return;
    if (!selectedFile) {
      showErrorToast("Missing document", "Choose a PDF or DOCX file first.");
      return;
    }
    setTrainingFile(true);
    setUploadPhase("uploading");
    setUploadProgress(0);
    try {
      const uploaded = await uploadAdminRagFile(accessToken, selectedFile, ({ phase, percent }) => {
        setUploadPhase(phase);
        setUploadProgress(percent);
      });
      setUploadPhase("processing");
      setUploadProgress(100);
      const created = await createAdminRagDocument(accessToken, {
        title: fileTitle.trim() || undefined,
        file_url: uploaded.url,
        file_name: selectedFile.name,
        mime_type: selectedFile.type || undefined,
      });
      setSources((prev) => [created, ...prev]);
      setFileTitle("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showSuccessToast("Document added to RAG");
    } catch (e) {
      showErrorToast("Training failed", (e as Error).message);
    } finally {
      setTrainingFile(false);
      setUploadPhase(null);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (row: AdminRagSourceRow) => {
    if (!accessToken) return;
    const ok = confirmAction(`Remove "${row.title}" from the RAG system?`);
    if (!ok) return;
    setDeletingId(row.id);
    try {
      await deleteAdminRagSource(accessToken, row.id);
      setSources((prev) => prev.filter((item) => item.id !== row.id));
      showSuccessToast("Removed from RAG");
    } catch (e) {
      showErrorToast("Remove failed", (e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.foreground }]}>Admin — RAG Manager</Text>
          <View style={styles.navRow}>
            <Pressable
              onPress={() => router.push("/admin")}
              style={[styles.navBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>Doctors</Text>
            </Pressable>
            <View style={[styles.navBtn, { borderColor: colors.primary, backgroundColor: `${colors.primary}14` }]}>
              <Text style={{ color: colors.primary, fontWeight: "800" }}>RAG Sources</Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => {
            logout();
            router.replace(getPostLogoutRoute());
          }}
          style={[styles.logoutBtn, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.foreground, fontWeight: "700" }}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Add text knowledge</Text>
          <TextInput
            value={textTitle}
            onChangeText={setTextTitle}
            placeholder="Optional title"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <TextInput
            value={textContent}
            onChangeText={setTextContent}
            multiline
            placeholder="Paste platform guidance, FAQs, business rules, app behavior, or any useful text for the AI."
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.textarea,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />
          <Pressable
            disabled={trainingText}
            onPress={() => void handleTrainText()}
            style={[styles.primaryBtn, { opacity: trainingText ? 0.7 : 1 }]}
          >
            {trainingText ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Train text</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Add document knowledge</Text>
          <TextInput
            value={fileTitle}
            onChangeText={setFileTitle}
            placeholder="Optional title"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
            }}
          />
          <View style={styles.fileRow}>
            <Pressable
              onPress={() => fileInputRef.current?.click()}
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
            >
              <Upload size={16} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                Choose PDF or DOCX
              </Text>
            </Pressable>
            <Text style={{ color: colors.mutedForeground, flex: 1 }}>
              {selectedFile
                ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                : "No file selected"}
            </Text>
          </View>
          {trainingFile && uploadPhase ? (
            <View style={styles.progressWrap}>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${uploadProgress}%`,
                      backgroundColor: uploadPhase === "processing" ? "#16a34a" : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                {uploadPhase === "processing"
                  ? `Processing document… ${uploadProgress}%`
                  : `Uploading… ${uploadProgress}%`}
              </Text>
            </View>
          ) : null}
          <Pressable
            disabled={trainingFile}
            onPress={() => void handleTrainFile()}
            style={[styles.primaryBtn, { opacity: trainingFile ? 0.7 : 1 }]}
          >
            {trainingFile ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Train document</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Current RAG sources ({sources.length})
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : sources.length === 0 ? (
            <Text style={{ color: colors.mutedForeground }}>
              No extra RAG sources added yet.
            </Text>
          ) : (
            <View style={styles.list}>
              {sources.map((row) => {
                const busy = deletingId === row.id;
                return (
                  <View
                    key={row.id}
                    style={[styles.sourceRow, { borderColor: colors.border, backgroundColor: colors.background }]}
                  >
                    <View style={styles.sourceTop}>
                      <View style={styles.sourceMeta}>
                        <View style={[styles.kindChip, { backgroundColor: `${colors.primary}14` }]}>
                          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>
                            {row.kind === "document" ? "Document" : "Text"}
                          </Text>
                        </View>
                        <Text style={[styles.sourceTitle, { color: colors.foreground }]}>{row.title}</Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                          {new Date(row.created_at).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.rowActions}>
                        {row.file_url ? (
                          <Pressable
                            onPress={() => void Linking.openURL(row.file_url!)}
                            style={[styles.iconBtn, { borderColor: colors.border }]}
                          >
                            <FileText size={16} color={colors.foreground} />
                          </Pressable>
                        ) : null}
                        <Pressable
                          disabled={busy}
                          onPress={() => void handleDelete(row)}
                          style={[styles.iconBtn, { borderColor: "#ef444455", opacity: busy ? 0.6 : 1 }]}
                        >
                          {busy ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                          ) : (
                            <Trash2 size={16} color="#ef4444" />
                          )}
                        </Pressable>
                      </View>
                    </View>
                    {row.preview ? (
                      <Text style={{ color: colors.mutedForeground, lineHeight: 20 }}>
                        {row.preview}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: "100%" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  headerLeft: { gap: 10 },
  title: { fontSize: 22, fontWeight: "800" },
  navRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  navBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  content: { padding: 24, gap: 16, maxWidth: 960, width: "100%", alignSelf: "center" },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 180,
    fontSize: 14,
    textAlignVertical: "top",
  },
  primaryBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressWrap: { gap: 6 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  list: { gap: 12 },
  sourceRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  sourceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  sourceMeta: { flex: 1, gap: 6 },
  kindChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sourceTitle: { fontSize: 16, fontWeight: "800" },
  rowActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

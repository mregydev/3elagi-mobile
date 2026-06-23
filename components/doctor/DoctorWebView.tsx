import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Coins,
  MessageCircle,
  Star,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { DoctorProfilePhoto } from "@/components/doctor/DoctorProfilePhoto";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import { chatRepository } from "@/domains/chat/repository";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import {
  fetchDoctorReviewStatus,
  fetchDoctorReviews,
  fetchPublicDoctor,
  submitDoctorReview,
  type DoctorReviewItem,
  type DoctorReviewStatus,
  type PublicDoctorProfile,
} from "@/domains/doctor/api";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Star size={28} color="#f59e0b" fill={n <= value ? "#f59e0b" : "transparent"} />
        </Pressable>
      ))}
    </View>
  );
}

function ReviewCard({ item, isRTL, colors }: { item: DoctorReviewItem; isRTL: boolean; colors: ReturnType<typeof useColors> }) {
  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  return (
    <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.reviewCardHeader, { flexDirection: dir }]}>
        <Text style={{ color: colors.foreground, fontWeight: "700" }}>{item.patientName}</Text>
        <View style={styles.starMiniRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={12} color="#f59e0b" fill={n <= item.rating ? "#f59e0b" : "transparent"} />
          ))}
        </View>
      </View>
      {item.comment ? (
        <Text style={{ color: colors.mutedForeground, marginTop: 6, textAlign, lineHeight: 20 }}>
          {item.comment}
        </Text>
      ) : null}
    </View>
  );
}

function gridStyle(columns: number): ViewStyle {
  if (columns <= 1) {
    return { flexDirection: "column", gap: 12 };
  }
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: 16,
  } as unknown as ViewStyle;
}

export function DoctorWebView() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const { isDesktop, isTablet } = useWebLayout();
  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const { doctorId, userId } = useLocalSearchParams<{ doctorId: string; userId?: string }>();

  const [doctor, setDoctor] = useState<PublicDoctorProfile | null>(null);
  const [reviews, setReviews] = useState<DoctorReviewItem[]>([]);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingTotal, setRatingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState<DoctorReviewStatus | null>(null);

  const isPatient = role?.toLowerCase() === "patient";
  const reviewColumns = isDesktop ? 2 : 1;

  const load = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const [doc, rev, status] = await Promise.all([
        fetchPublicDoctor(doctorId),
        fetchDoctorReviews(doctorId),
        isPatient && accessToken
          ? fetchDoctorReviewStatus(doctorId, accessToken)
          : Promise.resolve(null),
      ]);
      setDoctor(doc);
      setReviews(rev.items);
      setRatingAvg(rev.average);
      setRatingTotal(rev.total);
      setReviewStatus(status);
      if (status?.existingReview) {
        setReviewRating(status.existingReview.rating);
        setReviewComment(status.existingReview.comment ?? "");
      }
    } catch (e) {
      Alert.alert(isRTL ? "خطأ" : "Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [doctorId, isRTL, isPatient, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isSignedIn(profile, accessToken)) {
      router.replace("/welcome");
    }
  }, [profile, accessToken]);

  const openChat = () => {
    const chatUserId = userId ?? doctor?.userId;
    if (!chatUserId || !doctor) return;
    chatRepository.cacheUsers([
      {
        id: chatUserId,
        name: doctor.name,
        photoUrl: doctor.photoUrl,
        presence: "offline",
        role: "doctor",
        specialty: doctor.specialty ?? doctor.professionalTitle ?? undefined,
        rating: doctor.ratingAverage,
        ratingTotal: doctor.ratingTotal,
        messagePrice: doctor.messagePrice,
        doctorEntityId: doctor.id,
      },
    ]);
    router.push(`/chat/${chatUserId}`);
  };

  const submitReview = async () => {
    if (!accessToken || !doctorId || !isPatient) return;
    setSubmitting(true);
    try {
      await submitDoctorReview(doctorId, accessToken, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewComment("");
      await load();
      Alert.alert(isRTL ? "شكرًا" : "Thank you", isRTL ? "تم إرسال تقييمك." : "Your review was submitted.");
    } catch (e) {
      Alert.alert(isRTL ? "تعذر الإرسال" : "Could not submit", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !doctor) {
    return (
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
      </View>
    );
  }

  const specialtyLabel = isRTL ? doctor.specialtyAr ?? doctor.specialty : doctor.specialty;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { maxWidth: WEB_MAX_WIDTH.content }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { flexDirection: dir }]}>
            {isRTL ? (
              <ArrowRight size={18} color={colors.primary} />
            ) : (
              <ArrowLeft size={18} color={colors.primary} />
            )}
            <Text style={[styles.backText, { color: colors.primary }]}>
              {isRTL ? "رجوع" : "Back"}
            </Text>
          </Pressable>

          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: colors.foreground, textAlign }]}>
              {doctor.name}
            </Text>
            {specialtyLabel ? (
              <Text style={[styles.pageSubtitle, { color: colors.mutedForeground, textAlign }]}>
                {specialtyLabel}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                flexDirection: isDesktop || isTablet ? dir : "column",
              },
            ]}
          >
            <View style={styles.heroAvatar}>
              <DoctorProfilePhoto
                photoUrl={doctor.photoUrl}
                userId={doctor.userId}
                size={isDesktop ? 96 : 88}
              />
            </View>

            <View
              style={[
                styles.heroBody,
                (isDesktop || isTablet) ? styles.heroBodyRow : styles.heroBodyStacked,
                { alignItems: isRTL ? "flex-end" : "flex-start" },
              ]}
            >
              {doctor.professionalTitle ? (
                <Text style={[styles.heroTitle, { color: colors.mutedForeground, textAlign }]}>
                  {doctor.professionalTitle}
                </Text>
              ) : null}

              <View style={[styles.statsGrid, gridStyle(isDesktop ? 2 : 1)]}>
                <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Star size={18} color="#f59e0b" fill="#f59e0b" />
                  <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 18 }}>
                    {ratingAvg > 0 ? ratingAvg.toFixed(1) : isRTL ? "جديد" : "New"}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign }}>
                    {ratingTotal} {isRTL ? "تقييم" : "reviews"}
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Coins size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 18 }}>
                    {doctor.messagePrice}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign }}>
                    {isRTL ? "نقطة/رسالة" : "pts/message"}
                  </Text>
                </View>
              </View>

              {doctor.description ? (
                <Text style={[styles.description, { color: colors.foreground, textAlign }]}>
                  {doctor.description}
                </Text>
              ) : null}

              <Pressable
                onPress={openChat}
                style={({ pressed }) => [
                  styles.chatBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.9 : 1,
                    flexDirection: dir,
                    alignSelf: isRTL ? "flex-end" : "flex-start",
                  },
                ]}
              >
                <MessageCircle size={20} color="#fff" />
                <Text style={styles.chatBtnText}>{isRTL ? "مراسلة الطبيب" : "Message doctor"}</Text>
              </Pressable>
            </View>
          </View>

          {isPatient && reviewStatus?.canReview ? (
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
                {reviewStatus.hasExistingReview
                  ? isRTL
                    ? "تعديل تقييمك"
                    : "Edit your review"
                  : isRTL
                    ? "أضف تقييمك"
                    : "Add your review"}
              </Text>
              <StarPicker value={reviewRating} onChange={setReviewRating} />
              <TextInput
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder={isRTL ? "تعليق اختياري…" : "Optional comment…"}
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    textAlign,
                    borderColor: colors.border,
                  },
                ]}
              />
              <Pressable
                onPress={() => void submitReview()}
                disabled={submitting}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: submitting ? 0.7 : 1,
                    alignSelf: isRTL ? "flex-end" : "flex-start",
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "800" }}>
                    {reviewStatus.hasExistingReview
                      ? isRTL
                        ? "تحديث التقييم"
                        : "Update review"
                      : isRTL
                        ? "إرسال التقييم"
                        : "Submit review"}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {isPatient && reviewStatus && !reviewStatus.canReview ? (
            <View style={[styles.hintCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={{ color: colors.mutedForeground, textAlign, lineHeight: 20 }}>
                {isRTL
                  ? "يمكنك تقييم الطبيب بعد أن يضيف تشخيصًا لك."
                  : "You can review this doctor after they add a diagnosis for you."}
              </Text>
            </View>
          ) : null}

          <View style={styles.reviewsSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
              {isRTL ? "التقييمات" : "Reviews"}
            </Text>
            {reviews.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, textAlign, paddingVertical: 20 }}>
                {isRTL ? "لا توجد تقييمات بعد" : "No reviews yet"}
              </Text>
            ) : (
              <View style={gridStyle(reviewColumns)}>
                {reviews.map((r) => (
                  <ReviewCard key={r.id} item={r} isRTL={isRTL} colors={colors} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 0, width: "100%" },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  scrollContentDesktop: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 48,
  },
  container: {
    width: "100%",
    gap: 24,
  },
  backBtn: { alignItems: "center", gap: 8, paddingVertical: 4, alignSelf: "flex-start" },
  backText: { fontSize: 14, fontWeight: "600" },
  pageHeader: { gap: 6, paddingHorizontal: 2 },
  pageTitle: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  pageSubtitle: { fontSize: 15, lineHeight: 22, maxWidth: 560 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 24,
    alignItems: "flex-start",
  },
  heroAvatar: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroBody: { gap: 16 },
  heroBodyRow: { flex: 1, minWidth: 0 },
  heroBodyStacked: { width: "100%" },
  heroTitle: { fontSize: 14, fontWeight: "600" },
  statsGrid: { width: "100%" },
  statCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  description: { fontSize: 15, lineHeight: 24 },
  chatBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 4,
  },
  chatBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  hintCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  starRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  input: {
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
  },
  submitBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 46,
  },
  reviewsSection: { gap: 14 },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  reviewCardHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  starMiniRow: { flexDirection: "row", gap: 2 },
});

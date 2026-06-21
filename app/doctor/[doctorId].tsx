import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, Coins, MessageCircle, Star } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
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
import { flexRow } from "@/utils/rtl";

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Star size={28} color="#f59e0b" fill={n <= value ? "#f59e0b" : "transparent"} />
        </Pressable>
      ))}
    </View>
  );
}

function ReviewRow({ item, isRTL }: { item: DoctorReviewItem; isRTL: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}>
        <Text style={{ color: colors.foreground, fontWeight: "700" }}>{item.patientName}</Text>
        <View style={{ flexDirection: "row", gap: 2 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={12} color="#f59e0b" fill={n <= item.rating ? "#f59e0b" : "transparent"} />
          ))}
        </View>
      </View>
      {item.comment ? (
        <Text style={{ color: colors.mutedForeground, marginTop: 6, textAlign: isRTL ? "right" : "left" }}>
          {item.comment}
        </Text>
      ) : null}
    </View>
  );
}

export default function DoctorProfileScreen() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const dir = flexRow(isRTL);
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

  const openChat = () => {
    const chatUserId = userId ?? doctor?.userId;
    if (!chatUserId) return;
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
  };<div data-expoimage="true" class="css-view-g5y9jx" style="overflow: hidden; border-width: 1px; width: 96px; height: 96px; border-radius: 48px; border-color: rgb(217, 226, 237); background-color: rgb(234, 239, 245);"></div>

  if (!isSignedIn(profile, accessToken)) {
    router.replace("/welcome");
    return null;
  }

  if (loading || !doctor) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const specialtyLabel = isRTL ? doctor.specialtyAr ?? doctor.specialty : doctor.specialty;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border, flexDirection: dir }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          {isRTL ? <ArrowRight size={22} color={colors.primary} /> : <ArrowLeft size={22} color={colors.primary} />}
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
          {doctor.name}
        </Text>
      </View>

      <KeyboardSafeScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Avatar uri={doctor.photoUrl} seed={doctor.userId} role="doctor" size={88} />
          <Text style={[styles.name, { color: colors.foreground }]}>{doctor.name}</Text>
          {specialtyLabel ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>{specialtyLabel}</Text>
          ) : null}
          <View style={[styles.statsRow, { flexDirection: dir }]}>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <Text style={{ color: colors.foreground, fontWeight: "800" }}>
                {ratingAvg > 0 ? ratingAvg.toFixed(1) : isRTL ? "جديد" : "New"}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                {ratingTotal} {isRTL ? "تقييم" : "reviews"}
              </Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Coins size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "800" }}>{doctor.messagePrice}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                {isRTL ? "نقطة/رسالة" : "pts/message"}
              </Text>
            </View>
          </View>
          {doctor.description ? (
            <Text style={{ color: colors.foreground, lineHeight: 22, textAlign: isRTL ? "right" : "left", marginTop: 8 }}>
              {doctor.description}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={openChat}
          style={({ pressed }) => [
            styles.chatBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1, flexDirection: dir },
          ]}
        >
          <MessageCircle size={20} color="#fff" />
          <Text style={styles.chatBtnText}>{isRTL ? "مراسلة الطبيب" : "Message doctor"}</Text>
        </Pressable>

        {isPatient && reviewStatus?.canReview ? (
          <View style={[styles.reviewForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
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
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            />
            <Pressable
              onPress={() => void submitReview()}
              disabled={submitting}
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
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
          <View style={[styles.reviewHint, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={{ color: colors.mutedForeground, textAlign: "center", lineHeight: 20 }}>
              {isRTL
                ? "يمكنك تقييم الطبيب بعد أن يضيف تشخيصًا لك."
                : "You can review this doctor after they add a diagnosis for you."}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
          {isRTL ? "التقييمات" : "Reviews"}
        </Text>
        {reviews.length === 0 ? (
          <Text style={{ color: colors.mutedForeground, textAlign: "center", paddingVertical: 20 }}>
            {isRTL ? "لا توجد تقييمات بعد" : "No reviews yet"}
          </Text>
        ) : (
          reviews.map((r) => <ReviewRow key={r.id} item={r} isRTL={isRTL} />)
        )}
      </KeyboardSafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  hero: { alignItems: "center", gap: 8 },
  name: { fontSize: 22, fontWeight: "800", marginTop: 8 },
  statsRow: { gap: 12, marginTop: 12, width: "100%" },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  chatBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  chatBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  reviewForm: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  reviewHint: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  input: {
    minHeight: 80,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  submitBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 46,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
});

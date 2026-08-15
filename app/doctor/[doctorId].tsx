import { router, useLocalSearchParams } from "expo-router";
import { MessageCircle, Star } from "lucide-react-native";
import { AppBackButton } from "@/components/nav/AppBackButton";
import { DoctorProfileFacts } from "@/components/doctor/DoctorProfileFacts";
import { cardShell, UI } from "@/constants/uiTokens";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppTextInput } from "@/components/AppTextInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { chatRepository } from "@/domains/chat/repository";
import { promptAuthForConsultation } from "@/domains/auth/guestBrowse";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { specialityLabel } from "@/domains/home/specialityLabel";
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
  const { isRTL, t, locale } = useI18n();
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
    if (!isSignedIn(profile, accessToken)) {
      promptAuthForConsultation(chatUserId ? `/chat/${chatUserId}` : null);
      return;
    }
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
        consultationPrice: doctor.consultationPrice,
        doctorEntityId: doctor.id,
        country: chatRepository.getUser(chatUserId)?.country,
        immediateCallEnabled: chatRepository.getUser(chatUserId)?.immediateCallEnabled,
        onCall: chatRepository.getUser(chatUserId)?.onCall,
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
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const specialtyLabelText = specialityLabel(
    {
      nameEn: doctor.specialty ?? doctor.professionalTitle ?? "",
      nameAr: doctor.specialtyAr,
    },
    locale,
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border, flexDirection: dir }]}>
        <AppBackButton
          color={colors.primary}
          hitSlop={12}
          fallback="/(tabs)"
          accessibilityLabel={isRTL ? "رجوع" : "Back"}
        />
        <Text style={[styles.headerTitle, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
          {doctor.name}
        </Text>
      </View>

      <KeyboardSafeScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}>
        <View
          style={[
            styles.heroRow,
            cardShell(colors.border, colors.card),
            { flexDirection: dir },
          ]}
        >
          <Avatar uri={doctor.photoUrl} seed={doctor.userId} role="doctor" size={64} />
          <View style={[styles.heroCopy, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
            <Text style={[styles.name, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {doctor.name}
            </Text>
            {specialtyLabelText ? (
              <Text style={[styles.specialty, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
                {specialtyLabelText}
              </Text>
            ) : null}
          </View>
        </View>

        <DoctorProfileFacts
          doctor={doctor}
          userId={userId}
          specialtyLabel={specialtyLabelText}
          ratingAvg={ratingAvg}
          ratingTotal={ratingTotal}
        />

        {doctor.description ? (
          <View style={[styles.sectionCard, cardShell(colors.border, colors.card)]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "نبذة" : "About"}
            </Text>
            <Text style={{ color: colors.foreground, lineHeight: 20, fontSize: 14, textAlign: isRTL ? "right" : "left" }}>
              {doctor.description}
            </Text>
          </View>
        ) : null}

        {isPatient && reviewStatus?.canReview ? (
          <View style={[styles.reviewForm, cardShell(colors.border, colors.card)]}>
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
            <AppTextInput
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

      <View
        style={[
          styles.stickyDock,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <Pressable
          onPress={openChat}
          style={({ pressed }) => [
            styles.chatBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1, flexDirection: dir },
          ]}
        >
          <MessageCircle size={20} color="#fff" />
          <Text style={styles.chatBtnText}>
            {isSignedIn(profile, accessToken)
              ? t.home.startConsultation
              : isRTL
                ? "سجّل الدخول لبدء الاستشارة"
                : "Sign in to start consultation"}
          </Text>
        </Pressable>
      </View>
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
  headerTitle: { fontSize: 17, fontWeight: "800" },
  content: { padding: 14, gap: 10 },
  heroRow: {
    padding: 12,
    gap: 12,
    alignItems: "center",
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: { fontSize: 18, fontWeight: "800" },
  specialty: { ...UI.type.subtitle },
  sectionCard: {
    padding: 12,
    gap: 6,
  },
  stickyDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  chatBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: UI.radius.chip,
    minHeight: 48,
  },
  chatBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  reviewForm: {
    padding: 12,
    gap: 10,
  },
  reviewHint: {
    borderWidth: 1,
    borderRadius: UI.radius.card,
    padding: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800" },
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

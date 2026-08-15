import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { DoctorProfileAboutSection } from "@/components/doctor/DoctorProfileAboutSection";
import { DoctorProfileLocationSection } from "@/components/doctor/DoctorProfileLocationSection";
import { DoctorProfileProfessionalSection } from "@/components/doctor/DoctorProfileProfessionalSection";
import { DoctorProfileReviewsSection } from "@/components/doctor/DoctorProfileReviewsSection";
import { UI } from "@/constants/uiTokens";
import type {
  DoctorReviewItem,
  DoctorReviewStatus,
  PublicDoctorProfile,
} from "@/domains/doctor/api";

type ReviewProps = {
  reviews: DoctorReviewItem[];
  reviewTotal: number;
  reviewStatus: DoctorReviewStatus | null;
  isPatient: boolean;
  reviewRating: number;
  onReviewRatingChange: (n: number) => void;
  reviewComment: string;
  onReviewCommentChange: (s: string) => void;
  submitting: boolean;
  onSubmitReview: () => void;
  reviewColumns?: number;
};

type Props = {
  doctor: PublicDoctorProfile;
  specialtyLabel: string;
  twoColumn?: boolean;
} & ReviewProps;

function columnStyle(twoColumn: boolean): ViewStyle {
  if (!twoColumn) {
    return { flexDirection: "column", gap: UI.space.md };
  }
  return {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.65fr) minmax(280px, 1fr)",
    gap: UI.space.md,
    alignItems: "start",
  } as unknown as ViewStyle;
}

export function DoctorProfileBody({
  doctor,
  specialtyLabel,
  twoColumn = false,
  ...reviewProps
}: Props) {
  const location = <DoctorProfileLocationSection clinic={doctor.clinic} />;

  return (
    <View style={columnStyle(twoColumn)}>
      <View style={styles.main}>
        <DoctorProfileAboutSection doctor={doctor} />
        <DoctorProfileProfessionalSection doctor={doctor} specialtyLabel={specialtyLabel} />
        {!twoColumn ? location : null}
        <DoctorProfileReviewsSection {...reviewProps} />
      </View>
      {twoColumn ? <View style={styles.side}>{location}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    gap: UI.space.md,
    minWidth: 0,
  },
  side: {
    minWidth: 0,
    gap: UI.space.md,
  },
});

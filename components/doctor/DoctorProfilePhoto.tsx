import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { defaultAvatarUrl } from "@/domains/chat/avatar";
import { useColors } from "@/hooks/useColors";

interface Props {
  /** Absolute URL from `photo_url` in the doctor profile API response. */
  photoUrl?: string | null;
  userId: string;
  size?: number;
}

/** Web doctor profile hero photo — uses API `photo_url` when provided. */
export function DoctorProfilePhoto({ photoUrl, userId, size = 96 }: Props) {
  const colors = useColors();
  const trimmed = photoUrl?.trim();
  const uri = trimmed || defaultAvatarUrl(userId, "doctor");

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Image
        key={uri}
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.border,
            backgroundColor: colors.muted,
          },
        ]}
        resizeMode="cover"
        accessibilityLabel="Doctor profile photo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    borderRadius: 999,
  },
  image: {
    borderWidth: 1,
  },
});

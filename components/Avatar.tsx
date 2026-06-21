import { defaultAvatarUrl, resolveAvatarUrl } from "@/domains/chat/avatar";
import type { Presence } from "@/domains/chat/types";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  uri?: string | null;
  seed?: string;
  role?: "doctor" | "patient";
  size?: number;
  presence?: Presence;
  /** Messenger-style green ring for the “Active now” strip */
  highlightOnline?: boolean;
}

const dotColor = (
  p: Presence | undefined,
  success: string,
  warning: string,
  offline: string,
) => {
  if (p === "online") return success;
  if (p === "away") return warning;
  return offline;
};

export function Avatar({
  uri,
  seed = "anon",
  role,
  size = 52,
  presence,
  highlightOnline = false,
}: Props) {
  const colors = useColors();
  const dot = Math.max(14, Math.round(size * 0.28));
  const resolvedUri = resolveAvatarUrl(uri, seed, role);
  const [imageUri, setImageUri] = useState(resolvedUri);

  useEffect(() => {
    setImageUri(resolvedUri);
  }, [resolvedUri]);

  const showDot = presence === "online" || presence === "away";
  const showOfflineDot = presence === "offline";
  const isOnlineHighlight = highlightOnline && presence === "online";

  return (
    <View
      style={[
        styles.wrap,
        isOnlineHighlight && {
          padding: 3,
          borderRadius: size / 2 + 3,
          borderWidth: 2.5,
          borderColor: colors.success,
        },
      ]}
    >
      <View style={{ width: size, height: size }}>
        <Image
          source={{ uri: imageUri }}
          onError={() => setImageUri(defaultAvatarUrl(seed, role))}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
        {showDot || showOfflineDot ? (
          <View
            style={[
              styles.dot,
              {
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                backgroundColor: dotColor(
                  presence,
                  colors.success,
                  colors.warning,
                  colors.mutedForeground,
                ),
                borderColor: colors.card,
                borderWidth: 3.5,
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
});

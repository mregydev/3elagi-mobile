import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthHeroMedia } from "@/components/auth/AuthHeroMedia";
import { KeyboardSafeScrollView } from "@/components/KeyboardSafeScrollView";
import { Logo3elagi } from "@/components/Logo3elagi";
import { useResolvedTheme } from "@/hooks/useColors";

const CARD_WIDTH_RATIO = 0.9;
/** Breathing room between the brand mark and the card. */
const LOGO_GAP = 6;

interface Props {
  children: React.ReactNode;
}

/**
 * Native auth shell — hero photo, brand mark, and a frosted card docked to the
 * bottom, shared by login, signup and the password/verification screens.
 *
 * Scrolling lives here rather than in each screen (see AuthFormBody): that lets
 * the card size itself to the form instead of carrying a fixed height, which is
 * what left dead space under short forms. A tall form grows until it fills the
 * space and then scrolls.
 * (Web keeps its own hero — see AuthLoginBackground.web.tsx.)
 */
export function AuthLoginBackground({ children }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const logoHeight = Math.min(48, width * 0.14);
  // The card was frosted white regardless of theme, so in dark mode the form's
  // light text landed on a near-white sheet.
  const isDark = useResolvedTheme() === "dark";

  return (
    <View style={styles.page}>
      <AuthHeroMedia overlayOpacity={0.48} />

      <View style={[styles.brand, { paddingTop: insets.top + 4 }]}>
        <Logo3elagi height={logoHeight} centered />
      </View>

      <KeyboardSafeScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 12 },
        ]}
        bottomOffset={32}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              width: width * CARD_WIDTH_RATIO,
              borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.6)",
            },
          ]}
        >
          {/* Frosted, not solid: the hero stays visible behind the form. */}
          <BlurView
            intensity={70}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.tint,
              { backgroundColor: isDark ? "rgba(15,20,25,0.82)" : "rgba(255,255,255,0.72)" },
            ]}
            pointerEvents="none"
          />
          {children}
        </View>
      </KeyboardSafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  brand: {
    alignItems: "center",
    paddingBottom: 4,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    // Docked to the bottom; a form taller than the screen pushes up and scrolls.
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: LOGO_GAP,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
});

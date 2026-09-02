import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  currentTourStep,
  currentTourSteps,
  tourRouteForStep,
  useProductTourStore,
} from "@/domains/onboarding/productTourStore";
import {
  measureAnchorOnWeb,
  useTourAnchorStore,
} from "@/domains/onboarding/tourAnchorStore";
import { useColors } from "@/hooks/useColors";

interface Props {
  onCompleteMain?: () => void;
  onCompleteProfile?: () => void;
}

const SPOT_PAD = 8;

function SpotlightBackdrop({
  anchorId,
  onSkip,
}: {
  anchorId: string;
  onSkip: () => void;
}) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const storedRect = useTourAnchorStore((s) => s.rects[anchorId]);
  const rect =
    storedRect ??
    (Platform.OS === "web" ? measureAnchorOnWeb(anchorId) : null);

  if (!rect || rect.width < 1 || rect.height < 1) {
    return <Pressable style={styles.fullDim} onPress={onSkip} accessibilityRole="button" />;
  }

  const x = Math.max(0, rect.x - SPOT_PAD);
  const y = Math.max(0, rect.y - SPOT_PAD);
  const w = Math.min(screenW - x, rect.width + SPOT_PAD * 2);
  const h = Math.min(screenH - y, rect.height + SPOT_PAD * 2);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={[styles.dim, { top: 0, left: 0, width: screenW, height: y }]} onPress={onSkip} />
      <Pressable
        style={[styles.dim, { top: y + h, left: 0, width: screenW, height: screenH - y - h }]}
        onPress={onSkip}
      />
      <Pressable style={[styles.dim, { top: y, left: 0, width: x, height: h }]} onPress={onSkip} />
      <Pressable
        style={[styles.dim, { top: y, left: x + w, width: screenW - x - w, height: h }]}
        onPress={onSkip}
      />
      <View
        pointerEvents="none"
        style={[styles.spotRing, { top: y, left: x, width: w, height: h }]}
      />
    </View>
  );
}

/** Spotlight-style tooltip tour for new doctors. */
export function ProductTourOverlay({ onCompleteMain, onCompleteProfile }: Props) {
  const colors = useColors();
  const active = useProductTourStore((s) => s.active);
  const phase = useProductTourStore((s) => s.phase);
  const stepIndex = useProductTourStore((s) => s.stepIndex);
  const next = useProductTourStore((s) => s.next);
  const skip = useProductTourStore((s) => s.skip);
  const testPatientUserId = useProductTourStore((s) => s.testPatientUserId);

  const step = currentTourStep(phase, stepIndex);
  const totalSteps = currentTourSteps(phase).length;

  const route = useMemo(
    () => tourRouteForStep(step, testPatientUserId),
    [step, testPatientUserId],
  );

  useEffect(() => {
    if (!active || !route) return;
    router.push(route as "/(tabs)/history");
  }, [active, step?.id, route]);

  useEffect(() => {
    if (!active || !step) return;
    const setRect = useTourAnchorStore.getState().setRect;
    const tick = () => {
      if (Platform.OS === "web") {
        const rect = measureAnchorOnWeb(step.anchor);
        if (rect) setRect(step.anchor, rect);
      }
    };
    tick();
    const id = setInterval(tick, 400);
    return () => clearInterval(id);
  }, [active, step?.anchor, step?.id]);

  if (!active || !step) return null;

  const finish = () => {
    if (phase === "profile") onCompleteProfile?.();
    else onCompleteMain?.();
    skip();
  };

  const onPrimary = () => {
    if (stepIndex + 1 >= totalSteps) {
      finish();
      return;
    }
    next();
  };

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={skip}
      statusBarTranslucent
    >
      <View style={[styles.overlay, Platform.OS === "web" && styles.overlayWeb]}>
        <SpotlightBackdrop anchorId={step.anchor} onSkip={skip} />
        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          pointerEvents="box-none"
        >
          <Text style={[styles.kicker, { color: colors.primary }]}>
            {phase === "profile" ? "Profile tour" : "Getting started"} · {stepIndex + 1}/
            {totalSteps}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{step.title}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{step.body}</Text>
          <View style={styles.actions}>
            <Pressable onPress={finish} style={styles.skipBtn}>
              <Text style={{ color: colors.mutedForeground, fontWeight: "700" }}>Skip tour</Text>
            </Pressable>
            <Pressable
              onPress={onPrimary}
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>
                {step.waitForTap ? "Next" : "Got it"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
    paddingBottom: Platform.OS === "web" ? 32 : 48,
  },
  overlayWeb: {
    // Above sidebar, FAB, and other fixed chrome on web.
    zIndex: 100000,
    position: "fixed" as "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  dim: {
    position: "absolute",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  spotRing: {
    position: "absolute",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3057f2",
    shadowColor: "#3057f2",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 10,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
    zIndex: 2,
  },
  kicker: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  title: { fontSize: 18, fontWeight: "800" },
  body: { fontSize: 14, lineHeight: 21 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 4, cursor: "pointer" as "auto" },
  nextBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    cursor: "pointer" as "auto",
  },
});

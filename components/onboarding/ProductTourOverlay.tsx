import { router, type Href } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
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
  onSkip?: () => void;
}

const SPOT_PAD = 8;
const CARD_MAX_WIDTH = 360;
const CARD_GAP = 14;

function resolveAnchorRect(anchorId: string) {
  const storedRect = useTourAnchorStore.getState().rects[anchorId];
  if (storedRect && storedRect.width > 0 && storedRect.height > 0) return storedRect;
  if (Platform.OS === "web") return measureAnchorOnWeb(anchorId);
  return null;
}

function SpotlightBackdrop({ anchorId }: { anchorId: string }) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const storedRect = useTourAnchorStore((s) => s.rects[anchorId]);
  const rect = storedRect ?? (Platform.OS === "web" ? measureAnchorOnWeb(anchorId) : null);

  if (!rect || rect.width < 1 || rect.height < 1) {
    return <View style={styles.fullDim} pointerEvents="auto" />;
  }

  const x = Math.max(0, rect.x - SPOT_PAD);
  const y = Math.max(0, rect.y - SPOT_PAD);
  const w = Math.min(screenW - x, rect.width + SPOT_PAD * 2);
  const h = Math.min(screenH - y, rect.height + SPOT_PAD * 2);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.dim, { top: 0, left: 0, width: screenW, height: y }]} pointerEvents="auto" />
      <View
        style={[styles.dim, { top: y + h, left: 0, width: screenW, height: screenH - y - h }]}
        pointerEvents="auto"
      />
      <View style={[styles.dim, { top: y, left: 0, width: x, height: h }]} pointerEvents="auto" />
      <View
        style={[styles.dim, { top: y, left: x + w, width: screenW - x - w, height: h }]}
        pointerEvents="auto"
      />
      <View
        pointerEvents="none"
        style={[styles.spotRing, { top: y, left: x, width: w, height: h }]}
      />
    </View>
  );
}

function tooltipStyle(
  anchorId: string,
  screenW: number,
  screenH: number,
): ViewStyle {
  const rect = resolveAnchorRect(anchorId);
  if (!rect || rect.width < 1 || rect.height < 1) {
    return {
      alignSelf: "center",
      width: "100%",
      maxWidth: CARD_MAX_WIDTH,
      marginTop: "auto" as unknown as number,
    };
  }

  const spotX = Math.max(0, rect.x - SPOT_PAD);
  const spotY = Math.max(0, rect.y - SPOT_PAD);
  const spotW = rect.width + SPOT_PAD * 2;
  const spotH = rect.height + SPOT_PAD * 2;
  const cardW = Math.min(CARD_MAX_WIDTH, screenW - 32);
  let left = spotX + spotW / 2 - cardW / 2;
  left = Math.max(16, Math.min(left, screenW - cardW - 16));

  const estCardH = 190;
  const belowY = spotY + spotH + CARD_GAP;
  const fitsBelow = belowY + estCardH < screenH - 24;
  const top = fitsBelow
    ? belowY
    : Math.max(24, spotY - estCardH - CARD_GAP);

  return {
    position: "absolute",
    left,
    top,
    width: cardW,
    maxWidth: CARD_MAX_WIDTH,
    zIndex: 3,
  };
}

/** Spotlight-style tooltip tour for new doctors. */
export function ProductTourOverlay({ onCompleteMain, onCompleteProfile, onSkip }: Props) {
  const colors = useColors();
  const { width: screenW, height: screenH } = useWindowDimensions();
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
    router.push(route as Href);
  }, [active, route, step?.id]);

  useEffect(() => {
    if (!active || !step) return;
    const setRect = useTourAnchorStore.getState().setRect;
    const tick = () => {
      const rect = resolveAnchorRect(step.anchor);
      if (rect) setRect(step.anchor, rect);
    };
    tick();
    const id = setInterval(tick, 350);
    return () => clearInterval(id);
  }, [active, step?.anchor, step?.id]);

  if (!active || !step) return null;

  const finish = () => {
    if (phase === "profile") onCompleteProfile?.();
    else onCompleteMain?.();
    skip();
  };

  const handleSkip = () => {
    if (phase === "profile") onCompleteProfile?.();
    else onSkip?.();
    skip();
  };

  const onPrimary = () => {
    if (step.waitForTap) return;
    if (stepIndex + 1 >= totalSteps) {
      finish();
      return;
    }
    next();
  };

  const cardPosition = tooltipStyle(step.anchor, screenW, screenH);

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={handleSkip}
      statusBarTranslucent
    >
      <View
        style={[styles.overlay, Platform.OS === "web" && styles.overlayWeb]}
        pointerEvents="box-none"
      >
        <SpotlightBackdrop anchorId={step.anchor} />
        <View
          style={[styles.card, cardPosition, { backgroundColor: colors.card, borderColor: colors.border }]}
          pointerEvents="auto"
        >
          <Text style={[styles.kicker, { color: colors.primary }]}>
            {phase === "profile" ? "Profile tour" : "Getting started"} · {stepIndex + 1}/
            {totalSteps}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{step.title}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{step.body}</Text>
          {step.waitForTap ? (
            <Text style={[styles.hint, { color: colors.primary }]}>
              Click the highlighted item to continue
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable onPress={handleSkip} style={styles.skipBtn}>
              <Text style={{ color: colors.mutedForeground, fontWeight: "700" }}>Skip tour</Text>
            </Pressable>
            {!step.waitForTap ? (
              <Pressable
                onPress={onPrimary}
                style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Got it</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 16,
  },
  overlayWeb: {
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
    padding: 18,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  kicker: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  title: { fontSize: 18, fontWeight: "800" },
  body: { fontSize: 14, lineHeight: 21 },
  hint: { fontSize: 13, fontWeight: "700", marginTop: 2 },
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

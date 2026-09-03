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
const CARD_MAX_WIDTH = 320;
const CARD_GAP = 12;
const ARROW_SIZE = 10;
const EST_CARD_HEIGHT = 108;

type ArrowDirection = "up" | "down";

interface TooltipLayout {
  left: number;
  top: number;
  width: number;
  arrowDirection: ArrowDirection;
  arrowOffset: number;
}

function resolveAnchorRect(anchorId: string) {
  const storedRect = useTourAnchorStore.getState().rects[anchorId];
  if (storedRect && storedRect.width > 0 && storedRect.height > 0) return storedRect;
  if (Platform.OS === "web") return measureAnchorOnWeb(anchorId);
  return null;
}

function computeTooltipLayout(
  anchorId: string,
  screenW: number,
  screenH: number,
): TooltipLayout | null {
  const rect = resolveAnchorRect(anchorId);
  if (!rect || rect.width < 1 || rect.height < 1) return null;

  const spotX = Math.max(0, rect.x - SPOT_PAD);
  const spotY = Math.max(0, rect.y - SPOT_PAD);
  const spotW = rect.width + SPOT_PAD * 2;
  const spotH = rect.height + SPOT_PAD * 2;
  const cardW = Math.min(CARD_MAX_WIDTH, screenW - 32);
  const targetCenterX = spotX + spotW / 2;

  let left = targetCenterX - cardW / 2;
  left = Math.max(16, Math.min(left, screenW - cardW - 16));

  const belowY = spotY + spotH + CARD_GAP + ARROW_SIZE;
  const fitsBelow = belowY + EST_CARD_HEIGHT < screenH - 24;
  const arrowDirection: ArrowDirection = fitsBelow ? "up" : "down";
  const top = fitsBelow
    ? belowY
    : Math.max(24, spotY - EST_CARD_HEIGHT - CARD_GAP - ARROW_SIZE);

  const arrowOffset = Math.max(20, Math.min(cardW - 20, targetCenterX - left));

  return { left, top, width: cardW, arrowDirection, arrowOffset };
}

function TooltipArrow({
  direction,
  offset,
  fill,
  border,
}: {
  direction: ArrowDirection;
  offset: number;
  fill: string;
  border: string;
}) {
  const pointingUp = direction === "up";
  const edgeStyle = pointingUp
    ? {
        borderLeftWidth: ARROW_SIZE,
        borderRightWidth: ARROW_SIZE,
        borderBottomWidth: ARROW_SIZE,
        borderLeftColor: "transparent" as const,
        borderRightColor: "transparent" as const,
        borderBottomColor: fill,
      }
    : {
        borderLeftWidth: ARROW_SIZE,
        borderRightWidth: ARROW_SIZE,
        borderTopWidth: ARROW_SIZE,
        borderLeftColor: "transparent" as const,
        borderRightColor: "transparent" as const,
        borderTopColor: fill,
      };

  const borderEdgeStyle = pointingUp
    ? {
        borderLeftWidth: ARROW_SIZE + 1,
        borderRightWidth: ARROW_SIZE + 1,
        borderBottomWidth: ARROW_SIZE + 1,
        borderLeftColor: "transparent" as const,
        borderRightColor: "transparent" as const,
        borderBottomColor: border,
      }
    : {
        borderLeftWidth: ARROW_SIZE + 1,
        borderRightWidth: ARROW_SIZE + 1,
        borderTopWidth: ARROW_SIZE + 1,
        borderLeftColor: "transparent" as const,
        borderRightColor: "transparent" as const,
        borderTopColor: border,
      };

  const containerStyle = pointingUp
    ? { top: -ARROW_SIZE, left: offset - ARROW_SIZE }
    : { bottom: -ARROW_SIZE, left: offset - ARROW_SIZE };

  return (
    <View style={[styles.arrowHost, containerStyle]} pointerEvents="none">
      <View style={[styles.arrowBorder, borderEdgeStyle]} />
      <View
        style={[
          styles.arrowFill,
          edgeStyle,
          pointingUp ? { marginTop: 1 } : { marginTop: -1 },
        ]}
      />
    </View>
  );
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
  const anchorRect = useTourAnchorStore((s) =>
    step ? s.rects[step.anchor] : undefined,
  );

  const route = useMemo(
    () => tourRouteForStep(step, testPatientUserId),
    [step, testPatientUserId],
  );

  const layout = useMemo(
    () => (step ? computeTooltipLayout(step.anchor, screenW, screenH) : null),
    [step, screenW, screenH, anchorRect],
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

  const cardShellStyle = layout
    ? {
        position: "absolute" as const,
        left: layout.left,
        top: layout.top,
        width: layout.width,
        zIndex: 3,
      }
    : {
        alignSelf: "center" as const,
        width: "100%" as const,
        maxWidth: CARD_MAX_WIDTH,
        marginTop: "auto" as unknown as number,
      };

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
        <View style={cardShellStyle} pointerEvents="box-none">
          {layout ? (
            <TooltipArrow
              direction={layout.arrowDirection}
              offset={layout.arrowOffset}
              fill={colors.card}
              border={colors.border}
            />
          ) : null}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            pointerEvents="auto"
          >
            <Text style={[styles.message, { color: colors.foreground }]}>{step.message}</Text>
            <View style={styles.actions}>
              <Pressable onPress={handleSkip} style={styles.skipBtn}>
                <Text style={{ color: colors.mutedForeground, fontWeight: "700" }}>
                  Skip tour
                </Text>
              </Pressable>
              <Text style={[styles.stepCount, { color: colors.mutedForeground }]}>
                {stepIndex + 1} / {totalSteps}
              </Text>
              {!step.waitForTap ? (
                <Pressable
                  onPress={onPrimary}
                  style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>
                    Next
                  </Text>
                </Pressable>
              ) : null}
            </View>
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
  arrowHost: {
    position: "absolute",
    width: ARROW_SIZE * 2,
    height: ARROW_SIZE,
    zIndex: 2,
  },
  arrowBorder: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  arrowFill: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  message: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "center",
  },
  stepCount: { fontSize: 12, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  skipBtn: { paddingVertical: 6, paddingHorizontal: 4, cursor: "pointer" as "auto" },
  nextBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    cursor: "pointer" as "auto",
  },
});

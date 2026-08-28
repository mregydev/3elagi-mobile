import { router } from "expo-router";
import { RefreshCw, RotateCcw } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo3elagi } from "@/components/Logo3elagi";
import { LOGO_HEIGHT } from "@/constants/brand";
import {
  DEMO_ENABLED,
  DEMO_SLOT_LABELS,
  DEMO_SLOTS,
  type DemoSlot,
} from "@/constants/demo";
import {
  fetchDemoPanelSessions,
  type DemoPanelSessions,
} from "@/domains/auth/demoApi";
import { encodeSessionTransfer } from "@/domains/auth/sessionTransfer";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { alignText, flexRow } from "@/utils/rtl";

const H_PAD = 16;
const PANEL_GAP = 20;
const HEADER_BLOCK = 96;

type PanelFrameProps = {
  slot: DemoSlot;
  src: string | null;
  label: string;
  width: number;
  height: number;
  isRTL: boolean;
  focused: boolean;
  ready: boolean;
  colors: ReturnType<typeof useColors>;
  onFocus: () => void;
  onReload: () => void;
  onIframeRef: (node: HTMLIFrameElement | null) => void;
};

function PanelContent({
  src,
  label,
  colors,
  onIframeRef,
}: {
  src: string | null;
  label: string;
  colors: ReturnType<typeof useColors>;
  onIframeRef: (node: HTMLIFrameElement | null) => void;
}) {
  if (src) {
    return (
      // eslint-disable-next-line react/no-unknown-property
      <iframe
        ref={(node) => onIframeRef(node as HTMLIFrameElement | null)}
        title={label}
        src={src}
        style={styles.iframe as unknown as import("react-native").ViewStyle}
      />
    );
  }
  return (
    <View style={styles.panelLoading}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function PanelToolbar({
  label,
  isRTL,
  focused,
  ready,
  colors,
  onFocus,
  onReload,
}: {
  label: string;
  isRTL: boolean;
  focused: boolean;
  ready: boolean;
  colors: ReturnType<typeof useColors>;
  onFocus: () => void;
  onReload: () => void;
}) {
  const dir = flexRow(isRTL);

  return (
    <View style={styles.panelToolbar}>
      <View style={[styles.panelTitleRow, { flexDirection: dir }]}>
        <View style={[styles.panelTitleLead, { flexDirection: dir }]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: ready ? "#22c55e" : colors.mutedForeground },
            ]}
          />
          <Pressable onPress={onFocus}>
            <Text
              style={[
                styles.panelLabel,
                {
                  color: focused ? colors.primary : colors.foreground,
                  textAlign: alignText(isRTL),
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel="Reload panel"
          onPress={onReload}
          style={({ pressed, hovered }) => [
            styles.iconBtn,
            {
              borderColor: colors.border,
              backgroundColor: pressed || hovered ? colors.muted : colors.card,
            },
          ]}
        >
          <RotateCcw size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

function PhoneDeviceFrame({
  slot,
  src,
  label,
  width,
  height,
  isRTL,
  focused,
  ready,
  colors,
  onFocus,
  onReload,
  onIframeRef,
}: PanelFrameProps) {
  const bezel = "#1a1a1e";
  const screenRadius = Math.min(22, width * 0.06);

  return (
    <View
      style={[
        styles.panelColumn,
        { width, height },
        focused && { transform: [{ scale: 1.01 }] },
      ]}
    >
      <PanelToolbar
        label={label}
        isRTL={isRTL}
        focused={focused}
        ready={ready}
        colors={colors}
        onFocus={onFocus}
        onReload={onReload}
      />
      <Pressable onPress={onFocus} style={{ flex: 1, minHeight: 0 }}>
        <View
          style={[
            styles.phoneShell,
            {
              backgroundColor: bezel,
              borderColor: focused ? colors.primary : "#2a2a30",
              shadowOpacity: focused ? 0.38 : 0.28,
            },
          ]}
        >
          <View style={styles.phoneSideButtonLeft} />
          <View style={styles.phoneSideButtonRight} />
          <View style={[styles.phoneScreenWrap, { borderRadius: screenRadius }]}>
            <View style={styles.phoneNotchRow}>
              <View style={styles.phoneNotch} />
            </View>
            <View style={[styles.phoneScreen, { backgroundColor: colors.background }]}>
              <PanelContent
                src={src}
                label={label}
                colors={colors}
                onIframeRef={onIframeRef}
              />
            </View>
            <View style={styles.phoneHomeRow}>
              <View style={styles.phoneHomeIndicator} />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function LaptopDeviceFrame({
  slot,
  src,
  label,
  width,
  height,
  isRTL,
  focused,
  ready,
  colors,
  onFocus,
  onReload,
  onIframeRef,
}: PanelFrameProps) {
  const lidHeight = height - 28;
  const bezel = "#2b2b30";
  const baseWidth = width + 24;

  return (
    <View
      style={[
        styles.panelColumn,
        { width, height },
        focused && { transform: [{ scale: 1.005 }] },
      ]}
    >
      <PanelToolbar
        label={label}
        isRTL={isRTL}
        focused={focused}
        ready={ready}
        colors={colors}
        onFocus={onFocus}
        onReload={onReload}
      />
      <Pressable onPress={onFocus} style={{ flex: 1, minHeight: 0 }}>
        <View style={styles.laptopStack}>
          <View
            style={[
              styles.laptopLid,
              {
                width,
                height: lidHeight,
                backgroundColor: bezel,
                borderColor: focused ? colors.primary : "#3f3f46",
                shadowOpacity: focused ? 0.32 : 0.22,
              },
            ]}
          >
            <View style={styles.laptopCameraRow}>
              <View style={styles.laptopCamera} />
            </View>
            <View style={[styles.laptopScreen, { backgroundColor: colors.background }]}>
              <PanelContent
                src={src}
                label={label}
                colors={colors}
                onIframeRef={onIframeRef}
              />
            </View>
          </View>
          <View
            style={[
              styles.laptopBase,
              {
                width: baseWidth,
                backgroundColor: "#3f3f46",
                borderColor: focused ? colors.primary : "#52525b",
              },
            ]}
          >
            <View style={styles.laptopTrackpad} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function PanelFrame(props: PanelFrameProps) {
  if (props.slot === "mobile") {
    return <PhoneDeviceFrame {...props} />;
  }
  return <LaptopDeviceFrame {...props} />;
}

function embedUrl(origin: string, slot: DemoSlot, session: DemoPanelSessions[DemoSlot]) {
  const st = encodeURIComponent(encodeSessionTransfer(session));
  return `${origin}/demo/embed/${slot}?_st=${st}`;
}

export default function DemoScreen() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { width: vw, height: vh } = useWindowDimensions();
  const dir = flexRow(isRTL);
  const textAlign = alignText(isRTL);
  const iframeRefs = useRef<Partial<Record<DemoSlot, HTMLIFrameElement>>>({});
  const sessionsRef = useRef<DemoPanelSessions | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusedPanel, setFocusedPanel] = useState<DemoSlot>("mobile");
  const [panelSrc, setPanelSrc] = useState<Record<DemoSlot, string | null>>({
    mobile: null,
    laptop: null,
  });

  const layout = useMemo(() => {
    const usableW = Math.max(vw - H_PAD * 2 - PANEL_GAP, 320);
    const usableH = Math.max(
      vh - insets.top - insets.bottom - HEADER_BLOCK - 12,
      400,
    );
    return {
      mobileWidth: usableW / 3,
      laptopWidth: (usableW * 2) / 3,
      panelHeight: usableH,
    };
  }, [vw, vh, insets.top, insets.bottom]);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const applySessions = useCallback(
    (sessions: DemoPanelSessions) => {
      sessionsRef.current = sessions;
      setPanelSrc({
        mobile: embedUrl(origin, "mobile", sessions.mobile),
        laptop: embedUrl(origin, "laptop", sessions.laptop),
      });
    },
    [origin],
  );

  const loadPanels = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPanelSrc({ mobile: null, laptop: null });
    iframeRefs.current = {};
    try {
      const sessions = await fetchDemoPanelSessions();
      applySessions(sessions);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [applySessions]);

  const reloadPanel = useCallback(
    (slot: DemoSlot) => {
      const sessions = sessionsRef.current;
      if (!sessions) {
        void loadPanels();
        return;
      }
      setPanelSrc((prev) => ({ ...prev, [slot]: null }));
      iframeRefs.current[slot] = undefined;
      requestAnimationFrame(() => {
        setPanelSrc((prev) => ({
          ...prev,
          [slot]: embedUrl(origin, slot, sessions[slot]),
        }));
      });
    },
    [loadPanels, origin],
  );

  useEffect(() => {
    if (!DEMO_ENABLED) {
      setError(
        isRTL
          ? "مسار العرض التجريبي غير مفعّل."
          : "Demo route is disabled on this build.",
      );
      setLoading(false);
      return;
    }
    void loadPanels();
  }, [isRTL, loadPanels]);

  if (!DEMO_ENABLED) {
    return (
      <View style={[styles.page, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
        <Text style={{ color: colors.foreground, textAlign: "center", padding: 24 }}>
          {isRTL ? "العرض التجريبي غير متاح." : "Demo is not enabled."}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.page,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
          height: vh,
        },
      ]}
    >
      <View style={[styles.header, { flexDirection: dir, paddingHorizontal: H_PAD }]}>
        <Pressable
          onPress={() => void loadPanels()}
          style={({ pressed, hovered }) => [
            styles.logoBtn,
            { opacity: pressed || hovered ? 0.85 : 1 },
          ]}
        >
          <Logo3elagi height={LOGO_HEIGHT.header} markOnly />
        </Pressable>

        <View style={{ flex: 1, gap: 2, minWidth: 0, paddingHorizontal: 8 }}>
          <Text style={[styles.title, { color: colors.foreground, textAlign }]} numberOfLines={1}>
            {isRTL ? "عرض تفاعلي — مريض وطبيب" : "Live demo — patient & doctor"}
          </Text>
          <Text
            style={[styles.subtitle, { color: colors.mutedForeground, textAlign }]}
            numberOfLines={2}
          >
            {isRTL
              ? "كل جهاز له جلسة مستقلة — لا حاجة لتسجيل الدخول."
              : "Each device has its own session — no login required."}
          </Text>
        </View>

        <View style={[styles.headerActions, { flexDirection: dir }]}>
          <Pressable
            onPress={() => void loadPanels()}
            disabled={loading}
            style={({ pressed, hovered }) => [
              styles.reloadBtn,
              {
                flexDirection: dir,
                borderColor: colors.border,
                backgroundColor: pressed || hovered ? colors.muted : colors.card,
                opacity: loading ? 0.6 : 1,
              },
            ]}
          >
            <RefreshCw size={14} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
              {loading ? (isRTL ? "…" : "…") : isRTL ? "تحديث" : "Reload"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={({ pressed, hovered }) => [
              styles.exitBtn,
              {
                borderColor: colors.border,
                backgroundColor: pressed || hovered ? colors.muted : "transparent",
              },
            ]}
          >
            <Text style={{ color: colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>
              {isRTL ? "خروج" : "Exit"}
            </Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <View
          style={[
            styles.errorBox,
            {
              borderColor: colors.destructive,
              backgroundColor: `${colors.destructive}12`,
              marginHorizontal: H_PAD,
            },
          ]}
        >
          <Text style={{ color: colors.destructive, textAlign, fontWeight: "600", fontSize: 13 }}>
            {error}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.panelsRow,
          {
            flexDirection: dir,
            paddingHorizontal: H_PAD,
            height: layout.panelHeight,
          },
        ]}
      >
        {DEMO_SLOTS.map((slot) => (
          <PanelFrame
            key={slot}
            slot={slot}
            src={panelSrc[slot]}
            label={isRTL ? DEMO_SLOT_LABELS[slot].ar : DEMO_SLOT_LABELS[slot].en}
            width={slot === "mobile" ? layout.mobileWidth : layout.laptopWidth}
            height={layout.panelHeight}
            isRTL={isRTL}
            focused={focusedPanel === slot}
            ready={!!panelSrc[slot]}
            colors={colors}
            onFocus={() => setFocusedPanel(slot)}
            onReload={() => reloadPanel(slot)}
            onIframeRef={(node) => {
              if (node) iframeRefs.current[slot] = node;
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: HEADER_BLOCK - 12,
    marginBottom: 8,
  },
  logoBtn: {
    padding: 4,
    borderRadius: 12,
  },
  headerActions: {
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 13, lineHeight: 18 },
  reloadBtn: {
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exitBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  panelsRow: {
    gap: PANEL_GAP,
    alignItems: "stretch",
    justifyContent: "center",
    width: "100%",
  },
  panelColumn: {
    gap: 8,
    minHeight: 0,
  },
  panelToolbar: {
    gap: 6,
  },
  panelTitleRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  panelTitleLead: {
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  panelLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  iconBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    cursor: "pointer" as "auto",
  },

  phoneShell: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 36,
    padding: 10,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    cursor: "pointer" as "auto",
  },
  phoneSideButtonLeft: {
    position: "absolute",
    left: -3,
    top: "22%",
    width: 3,
    height: 48,
    borderRadius: 2,
    backgroundColor: "#3f3f46",
  },
  phoneSideButtonRight: {
    position: "absolute",
    right: -3,
    top: "18%",
    width: 3,
    height: 32,
    borderRadius: 2,
    backgroundColor: "#3f3f46",
  },
  phoneScreenWrap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  phoneNotchRow: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 4,
    backgroundColor: "#000",
  },
  phoneNotch: {
    width: 84,
    height: 22,
    borderRadius: 14,
    backgroundColor: "#0a0a0a",
  },
  phoneScreen: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  phoneHomeRow: {
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#000",
  },
  phoneHomeIndicator: {
    width: 96,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  laptopStack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 0,
  },
  laptopLid: {
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 10,
    paddingBottom: 8,
    flex: 1,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    cursor: "pointer" as "auto",
  },
  laptopCameraRow: {
    alignItems: "center",
    marginBottom: 6,
  },
  laptopCamera: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#52525b",
  },
  laptopScreen: {
    flex: 1,
    minHeight: 0,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#18181b",
  },
  laptopBase: {
    height: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 2,
    borderTopWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  laptopTrackpad: {
    width: "18%",
    height: 4,
    borderRadius: 999,
    backgroundColor: "#52525b",
    marginTop: 2,
  },

  iframe: {
    borderWidth: 0,
    width: "100%",
    height: "100%",
  },
  panelLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
});

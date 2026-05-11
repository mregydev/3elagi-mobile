import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import type { Locale } from "@/domains/i18n/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

// ─── Flag components ──────────────────────────────────────────────────────────

/** Egypt – pure View strips, zero SVG, works on every platform */
function EgyptFlag({ w, h, r = 4 }: { w: number; h: number; r?: number }) {
  const stripe = h / 3;
  return (
    <View style={{ width: w, height: h, borderRadius: r, overflow: "hidden" }}>
      <View style={{ width: w, height: stripe, backgroundColor: "#CE1126" }} />
      <View style={{ width: w, height: stripe, backgroundColor: "#FFFFFF" }} />
      <View style={{ width: w, height: stripe, backgroundColor: "#000000" }} />
    </View>
  );
}

/** UK – SVG with internal ClipPath rounding (no wrapper overflow needed) */
function UKFlag({ w, h, r = 4 }: { w: number; h: number; r?: number }) {
  const vw = 60, vh = 30;
  const rx = (r / w) * vw;
  const ry = (r / h) * vh;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${vw} ${vh}`}>
      <Defs>
        <ClipPath id="ukClip">
          <Rect x="0" y="0" width={vw} height={vh} rx={rx} ry={ry} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#ukClip)">
        <Rect fill="#012169" width="60" height="30" />
        <Path d="M0,0 L60,30"  stroke="#fff"     strokeWidth="10" />
        <Path d="M60,0 L0,30"  stroke="#fff"     strokeWidth="10" />
        <Path d="M0,0 L60,30"  stroke="#C8102E"  strokeWidth="4"  />
        <Path d="M60,0 L0,30"  stroke="#C8102E"  strokeWidth="4"  />
        <Rect x="24" y="0"  width="12" height="30" fill="#fff"     />
        <Rect x="0"  y="9"  width="60" height="12" fill="#fff"     />
        <Rect x="26" y="0"  width="8"  height="30" fill="#C8102E"  />
        <Rect x="0"  y="11" width="60" height="8"  fill="#C8102E"  />
      </G>
    </Svg>
  );
}

function Flag({ locale, w, h, r }: { locale: Locale; w: number; h: number; r?: number }) {
  return locale === "ar"
    ? <EgyptFlag w={w} h={h} r={r} />
    : <UKFlag    w={w} h={h} r={r} />;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const OPTIONS: { locale: Locale; label: string; sublabel: string }[] = [
  { locale: "ar", label: "العربية", sublabel: "Arabic"       },
  { locale: "en", label: "English", sublabel: "الإنجليزية"  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function LanguageSwitch({ compact: _compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Trigger ── */}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: pressed || open ? colors.muted : colors.card,
            borderColor: open ? colors.primary : colors.border,
          },
        ]}
      >
        {/* Flag bordered so Egypt white stripe is always visible */}
        <View style={[styles.triggerBorder, { borderColor: colors.border }]}>
          <Flag locale={locale} w={T_W} h={T_H} r={3} />
        </View>
        <View style={[styles.btnDivider, { backgroundColor: colors.border }]} />
        <Text style={[styles.btnLabel, { color: colors.foreground }]}>
          {locale === "ar" ? "ع" : "EN"}
        </Text>
      </Pressable>

      {/* ── Centered modal ── */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Language · اللغة
            </Text>
            <View style={[styles.sheetLine, { backgroundColor: colors.border }]} />

            {OPTIONS.map((opt, i) => {
              const selected = opt.locale === locale;
              return (
                <Pressable
                  key={opt.locale}
                  onPress={() => { setLocale(opt.locale); setOpen(false); }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    i < OPTIONS.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                    pressed  && { backgroundColor: colors.muted },
                    selected && { backgroundColor: colors.primary + "10" },
                  ]}
                >
                  <View style={[styles.popupBorder, {
                    borderColor: selected ? colors.primary : colors.border,
                  }]}>
                    <Flag locale={opt.locale} w={P_W} h={P_H} r={5} />
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.optionLabel, {
                      color: selected ? colors.primary : colors.foreground,
                    }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionSub, { color: colors.mutedForeground }]}>
                      {opt.sublabel}
                    </Text>
                  </View>

                  <View style={[styles.ring, { borderColor: selected ? colors.primary : colors.border }]}>
                    {selected && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Sizes ────────────────────────────────────────────────────────────────────

const T_W = 34, T_H = 21;   // trigger flag
const P_W = 48, P_H = 28;   // popup flag

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
  },
  /** thin border so Egypt's white stripe has a visible edge */
  triggerBorder: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  btnDivider: { width: 1, height: 13 },
  btnLabel: { fontSize: 13, fontWeight: "800", letterSpacing: 0.4 },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  sheet: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 14,
  },
  sheetTitle: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 15,
    letterSpacing: 0.2,
  },
  sheetLine: { height: StyleSheet.hairlineWidth },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  popupBorder: {
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: "hidden",
  },
  optionLabel: { fontSize: 16, fontWeight: "700" },
  optionSub:   { fontSize: 12 },
  ring: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
});

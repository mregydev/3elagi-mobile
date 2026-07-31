import { ChevronDown, ChevronUp } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LANGUAGE_OPTIONS } from "@/components/language/LanguageFlags";
import { LanguageLocaleIcon } from "@/components/language/LanguageLocaleIcon";
import type { Locale } from "@/domains/i18n/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

type Props = {
  compact?: boolean;
  showLabel?: boolean;
  value?: Locale;
  onChange?: (locale: Locale) => void;
  /** Open above the trigger — use in sidebar/footer. */
  placement?: "top" | "bottom";
  /** Full-width trigger with chevron on the trailing edge. */
  fullWidth?: boolean;
};

type MenuPos = {
  top: number;
  left: number;
  width: number;
};

const MENU_MIN_WIDTH = 220;
const MENU_ITEM_HEIGHT = 56;
const IS_WEB = Platform.OS === "web";
const VIEWPORT_PADDING = 8;
const GAP = 6;

function estimatedMenuHeight(): number {
  return LANGUAGE_OPTIONS.length * MENU_ITEM_HEIGHT + 2;
}

/** Viewport-relative box — reliable inside nested Modals (side drawer). */
function measureTriggerInViewport(
  node: View | null,
  cb: (x: number, y: number, width: number, height: number) => void,
): void {
  if (!node) return;

  if (IS_WEB) {
    const host = node as unknown as HTMLElement & {
      getBoundingClientRect?: () => DOMRect;
      measureInWindow?: (
        callback: (x: number, y: number, width: number, height: number) => void,
      ) => void;
    };

    const el =
      typeof host.getBoundingClientRect === "function"
        ? host
        : ((host as unknown as { _node?: HTMLElement })._node ?? null);

    if (el && typeof el.getBoundingClientRect === "function") {
      const rect = el.getBoundingClientRect();
      cb(rect.left, rect.top, rect.width, rect.height);
      return;
    }
  }

  node.measureInWindow((x, y, width, height) => {
    cb(x, y, width, height);
  });
}

function computeMenuPos(
  x: number,
  y: number,
  width: number,
  height: number,
  opts: { fullWidth: boolean; isRTL: boolean; opensUp: boolean },
): MenuPos {
  const menuWidth = opts.fullWidth ? width : Math.max(MENU_MIN_WIDTH, width);
  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : menuWidth + 32;
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 800;
  const menuHeight = estimatedMenuHeight();

  let left = opts.fullWidth
    ? x
    : opts.isRTL
      ? x
      : x + width - menuWidth;
  left = Math.max(
    VIEWPORT_PADDING,
    Math.min(left, viewportWidth - menuWidth - VIEWPORT_PADDING),
  );

  let top = opts.opensUp ? y - menuHeight - GAP : y + height + GAP;

  // Keep the menu on-screen; prefer staying above the trigger when possible.
  if (opts.opensUp) {
    if (top < VIEWPORT_PADDING) {
      const below = y + height + GAP;
      top =
        below + menuHeight <= viewportHeight - VIEWPORT_PADDING
          ? below
          : VIEWPORT_PADDING;
    }
  } else if (top + menuHeight > viewportHeight - VIEWPORT_PADDING) {
    const above = y - menuHeight - GAP;
    top = above >= VIEWPORT_PADDING ? above : VIEWPORT_PADDING;
  }

  return { top, left, width: menuWidth };
}

export function LanguageDropdown({
  compact = false,
  showLabel = false,
  value,
  onChange,
  placement = "bottom",
  fullWidth = false,
}: Props) {
  const colors = useColors();
  const { locale: storeLocale, setLocale, isRTL } = useI18n();
  const locale = value ?? storeLocale;
  const applyLocale = onChange ?? setLocale;
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const triggerRef = useRef<View>(null);
  const iconSize = compact ? 28 : 34;
  const current =
    LANGUAGE_OPTIONS.find((option) => option.locale === locale) ??
    LANGUAGE_OPTIONS[1];
  const opensUp = placement === "top";
  const ChevronIcon = opensUp ? ChevronUp : ChevronDown;

  const openMenu = () => {
    const apply = () => {
      measureTriggerInViewport(triggerRef.current, (x, y, width, height) => {
        setMenuPos(
          computeMenuPos(x, y, width, height, {
            fullWidth,
            isRTL,
            opensUp,
          }),
        );
        setOpen(true);
      });
    };

    // Nested drawer Modals need a frame for DOM layout to settle.
    if (IS_WEB && typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => requestAnimationFrame(apply));
      return;
    }
    apply();
  };

  const closeMenu = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    if (!IS_WEB || typeof window === "undefined") return;

    const reposition = () => {
      measureTriggerInViewport(triggerRef.current, (x, y, width, height) => {
        setMenuPos(
          computeMenuPos(x, y, width, height, {
            fullWidth,
            isRTL,
            opensUp,
          }),
        );
      });
    };

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, fullWidth, isRTL, opensUp]);

  const selectLocale = (next: Locale) => {
    closeMenu();
    applyLocale(next);
  };

  const menu = (
    <View
      style={[
        styles.menu,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const active = locale === option.locale;
        return (
          <Pressable
            key={option.locale}
            accessibilityRole="menuitem"
            accessibilityState={{ selected: active }}
            onPress={() => selectLocale(option.locale)}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.menuItem,
              {
                flexDirection: isRTL ? "row-reverse" : "row",
                backgroundColor: active
                  ? `${colors.primary}12`
                  : pressed || hovered
                    ? colors.muted
                    : "transparent",
              },
            ]}
          >
            <LanguageLocaleIcon
              locale={option.locale}
              size={iconSize}
              selected={active}
            />
            <View style={styles.menuText}>
              <Text
                style={[
                  styles.menuLabel,
                  {
                    color: colors.foreground,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {option.label}
              </Text>
              <Text
                style={[
                  styles.menuSub,
                  {
                    color: colors.mutedForeground,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {option.sublabel}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.wrap, fullWidth && styles.wrapFullWidth]}>
      {/* Outer View ref: reliable getBoundingClientRect inside nested drawer Modals. */}
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={current.label}
          onPress={openMenu}
          style={[
            styles.trigger,
            fullWidth && styles.triggerFullWidth,
            {
              flexDirection: isRTL ? "row-reverse" : "row",
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <View
            style={[
              styles.triggerLeading,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <LanguageLocaleIcon locale={locale} size={iconSize} selected />
            {showLabel ? (
              <Text
                style={[styles.triggerLabel, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {current.label}
              </Text>
            ) : null}
          </View>
          <ChevronIcon size={compact ? 14 : 16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType={IS_WEB ? "none" : "fade"}
        onRequestClose={closeMenu}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeMenu}
            accessibilityRole="button"
            accessibilityLabel="Close language menu"
          />
          {menuPos ? (
            <View
              pointerEvents="box-none"
              style={[
                styles.menuFixed,
                {
                  top: menuPos.top,
                  left: menuPos.left,
                  width: menuPos.width,
                },
              ]}
            >
              {menu}
            </View>
          ) : !IS_WEB ? (
            <View style={styles.modalCenter} pointerEvents="box-none">
              <View
                style={[
                  styles.modalCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {menu}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    zIndex: 20,
  },
  wrapFullWidth: {
    width: "100%",
  },
  trigger: {
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    cursor: "pointer" as "auto",
  },
  triggerFullWidth: {
    width: "100%",
    borderRadius: 12,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerLeading: {
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  triggerLabel: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  menuFixed: {
    position: "absolute",
    zIndex: 2,
  },
  modalCenter: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    zIndex: 2,
  },
  menu: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    cursor: "pointer" as "auto",
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  menuSub: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
});

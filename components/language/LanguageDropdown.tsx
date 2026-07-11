import { ChevronDown, ChevronUp } from "lucide-react-native";
import React, { useEffect, useId, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  FLAG_RATIO,
  Flag,
  FlagFrame,
  LANGUAGE_OPTIONS,
} from "@/components/language/LanguageFlags";
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

type WebMenuPos = {
  top: number;
  left: number;
  width: number;
};

const MENU_MIN_WIDTH = 220;
const MENU_ITEM_HEIGHT = 56;
const IS_WEB = Platform.OS === "web";

function estimatedMenuHeight(): number {
  return LANGUAGE_OPTIONS.length * MENU_ITEM_HEIGHT + 2;
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
  const [webMenuPos, setWebMenuPos] = useState<WebMenuPos | null>(null);
  const triggerRef = useRef<View>(null);
  const clipSuffix = useId().replace(/:/g, "");
  const flagW = compact ? 24 : 30;
  const flagH = Math.round(flagW / FLAG_RATIO);
  const current =
    LANGUAGE_OPTIONS.find((option) => option.locale === locale) ??
    LANGUAGE_OPTIONS[1];
  const opensUp = placement === "top";
  const ChevronIcon = opensUp ? ChevronUp : ChevronDown;

  const openMenu = () => {
    if (IS_WEB && triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        const menuWidth = fullWidth
          ? width
          : Math.max(MENU_MIN_WIDTH, width);
        const viewportWidth =
          typeof window !== "undefined" ? window.innerWidth : menuWidth;
        const padding = 8;
        let left = fullWidth
          ? x
          : isRTL
            ? x
            : x + width - menuWidth;
        left = Math.max(
          padding,
          Math.min(left, viewportWidth - menuWidth - padding),
        );

        const menuHeight = estimatedMenuHeight();
        let top =
          opensUp
            ? y - menuHeight - 6
            : y + height + 6;
        if (opensUp && top < padding) {
          top = y + height + 6;
        }

        setWebMenuPos({ top, left, width: menuWidth });
        setOpen(true);
      });
      return;
    }
    setWebMenuPos(null);
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      setWebMenuPos(null);
    }
  }, [open]);

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
            <FlagFrame w={flagW} h={flagH} selected={active} colors={colors}>
              <Flag
                locale={option.locale}
                w={flagW}
                h={flagH}
                clipSuffix={`menu-${option.locale}-${clipSuffix}`}
              />
            </FlagFrame>
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
      <Pressable
        ref={triggerRef}
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
          <FlagFrame w={flagW} h={flagH} selected colors={colors}>
            <Flag
              locale={locale}
              w={flagW}
              h={flagH}
              clipSuffix={`trigger-${clipSuffix}`}
            />
          </FlagFrame>
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
          {IS_WEB && webMenuPos ? (
            <View
              pointerEvents="box-none"
              style={[
                styles.menuWebFixed,
                {
                  top: webMenuPos.top,
                  left: webMenuPos.left,
                  width: webMenuPos.width,
                },
              ]}
            >
              {menu}
            </View>
          ) : null}
          {!IS_WEB ? (
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
  menuWebFixed: {
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

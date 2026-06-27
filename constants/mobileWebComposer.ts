import { StyleSheet } from "react-native";

/** Tiny gap between composer and bottom tab bar / screen edge on mobile web. */
export const MOBILE_WEB_COMPOSER_FOOTER_GAP = 4;

export const MOBILE_WEB_COMPOSER_BTN = 40;

export const mobileWebComposerStyles = StyleSheet.create({
  shell: {
    paddingHorizontal: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  input: {
    flex: 1,
    minHeight: MOBILE_WEB_COMPOSER_BTN,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    lineHeight: 20,
    borderRadius: 20,
    borderWidth: 0,
    minWidth: 0,
  },
  iconBtn: {
    width: MOBILE_WEB_COMPOSER_BTN,
    height: MOBILE_WEB_COMPOSER_BTN,
    borderRadius: MOBILE_WEB_COMPOSER_BTN / 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

import { useWindowDimensions } from "react-native";
import { WEB_BREAKPOINTS } from "@/constants/webLayout";

export function useWebLayout() {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= WEB_BREAKPOINTS.tablet;
  const isDesktop = width >= WEB_BREAKPOINTS.desktop;
  const isWide = width >= WEB_BREAKPOINTS.wide;

  const gridColumns = isWide ? 4 : isDesktop ? 3 : isTablet ? 3 : 2;

  return {
    width,
    height,
    isTablet,
    isDesktop,
    isWide,
    gridColumns,
  };
}

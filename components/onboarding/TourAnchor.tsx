import React, { useCallback, useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  View,
  type LayoutChangeEvent,
  type ViewProps,
} from "react-native";
import {
  measureAnchorOnWeb,
  useTourAnchorStore,
} from "@/domains/onboarding/tourAnchorStore";
import {
  currentTourStep,
  useProductTourStore,
  type TourAnchor as TourAnchorId,
} from "@/domains/onboarding/productTourStore";

type Props = ViewProps & {
  id: TourAnchorId | string;
  onPress?: () => void;
  children: React.ReactNode;
  /** Wrap with Pressable so tour taps fire onPress + advance. */
  pressable?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
};

/** Registers a layout rect for the product tour spotlight. */
export function TourAnchor({
  id,
  onPress,
  children,
  pressable = false,
  testID,
  onLayout: onLayoutProp,
  ...rest
}: Props) {
  const setRect = useTourAnchorStore((s) => s.setRect);
  const advanceOnAnchorTap = useProductTourStore((s) => s.advanceOnAnchorTap);
  const viewRef = useRef<View>(null);

  const publishRect = useCallback(() => {
    if (Platform.OS === "web") {
      const rect = measureAnchorOnWeb(String(testID ?? id));
      if (rect) setRect(String(id), rect);
      return;
    }
    viewRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) setRect(String(id), { x, y, width, height });
    });
  }, [id, setRect, testID]);

  useEffect(() => {
    publishRect();
    if (Platform.OS !== "web") return;
    const onResize = () => publishRect();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [publishRect]);

  const onLayout = (e: LayoutChangeEvent) => {
    onLayoutProp?.(e);
    requestAnimationFrame(() => publishRect());
  };

  const handlePress = () => {
    onPress?.();
    advanceOnAnchorTap(String(id) as TourAnchorId);
  };

  const resolvedTestId = testID ?? String(id);

  if (pressable) {
    return (
      <Pressable
        ref={viewRef as React.Ref<View>}
        testID={resolvedTestId}
        onLayout={onLayout}
        onPress={handlePress}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View ref={viewRef} testID={resolvedTestId} onLayout={onLayout} {...rest}>
      {children}
    </View>
  );
}

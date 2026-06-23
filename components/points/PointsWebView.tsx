import { Coins, Plus, TrendingDown, TrendingUp, Zap } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { router } from "expo-router";
import { PointsPieChart } from "@/components/PointsPieChart";
import { WEB_MAX_WIDTH } from "@/constants/webLayout";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { usePointsPage } from "@/hooks/usePointsPage";
import { useWebLayout } from "@/hooks/useWebLayout";

function gridColumns(isWide: boolean, isDesktop: boolean, isTablet: boolean) {
  if (isWide) return 3;
  if (isDesktop || isTablet) return 2;
  return 1;
}

function gridStyle(columns: number): ViewStyle {
  if (columns === 1) {
    return { flexDirection: "column", gap: 16 };
  }
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: 20,
  } as unknown as ViewStyle;
}

function SectionLabel({
  children,
  textAlign,
  color,
}: {
  children: string;
  textAlign: "left" | "right";
  color: string;
}) {
  return (
    <Text style={[styles.sectionLabel, { color, textAlign }]}>{children}</Text>
  );
}

function DashboardCard({
  testID,
  style,
  children,
}: {
  testID: string;
  style?: ViewStyle | (ViewStyle | undefined | false)[];
  children: React.ReactNode;
}) {
  return (
    <View testID={testID} style={[styles.dashboardCard, style]}>
      {children}
    </View>
  );
}

const QUICK_POINT_AMOUNTS = [10, 25, 50, 100] as const;

function AddPointsCard({
  amountText,
  setAmountText,
  parseAmount,
  colors,
  isRTL,
  useSplitLayout,
}: {
  amountText: string;
  setAmountText: (value: string) => void;
  parseAmount: () => number | null;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
  useSplitLayout: boolean;
}) {
  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  const handleContinue = () => {
    const amount = parseAmount();
    if (!amount) return;
    router.push(`/points/checkout?amount=${amount}`);
  };

  return (
    <DashboardCard
      testID="points-add-card"
      style={[
        styles.addCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.addCardInner,
          useSplitLayout && [styles.addCardInnerSplit, { flexDirection: dir }],
        ]}
      >
        <View style={styles.addCardIntro}>
          <View style={[styles.addCardTitleRow, { flexDirection: dir }]}>
            <View style={[styles.addCardIcon, { backgroundColor: `${colors.primary}14` }]}>
              <Plus size={18} color={colors.primary} />
            </View>
            <Text style={[styles.addCardTitle, { color: colors.foreground, textAlign }]}>
              {isRTL ? "إضافة نقاط" : "Add points"}
            </Text>
          </View>
          <Text style={[styles.addCardHint, { color: colors.mutedForeground, textAlign }]}>
            {isRTL
              ? "اختر مبلغًا سريعًا أو أدخل عدد النقاط، ثم تابع إلى صفحة الدفع."
              : "Pick a quick amount or enter a custom value, then continue to checkout."}
          </Text>

          <View style={[styles.quickAmountRow, { flexDirection: dir }]}>
            {QUICK_POINT_AMOUNTS.map((amount) => {
              const selected = amountText === String(amount);
              return (
                <Pressable
                  key={amount}
                  onPress={() => setAmountText(String(amount))}
                  style={[
                    styles.quickAmountChip,
                    {
                      backgroundColor: selected ? `${colors.primary}14` : colors.background,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? colors.primary : colors.foreground,
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    {amount}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.addCardForm, useSplitLayout && styles.addCardFormSplit]}>
          <View style={styles.addFieldBlock}>
            <Text style={[styles.addFieldLabel, { color: colors.foreground, textAlign }]}>
              {isRTL ? "عدد النقاط" : "Points amount"}
            </Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="number-pad"
              placeholder={isRTL ? "مثال: 50" : "e.g. 50"}
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.addInput,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  textAlign,
                },
              ]}
            />
          </View>

          <Pressable
            onPress={handleContinue}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.addSubmitBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.92 : hovered ? 0.96 : 1,
                flexDirection: dir,
              },
            ]}
          >
            <Plus size={18} color="#fff" />
            <Text style={styles.addSubmitText}>
              {isRTL ? "متابعة للدفع" : "Continue to checkout"}
            </Text>
          </Pressable>
        </View>
      </View>
    </DashboardCard>
  );
}

export function PointsWebView() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const { isWide, isDesktop, isTablet } = useWebLayout();
  const columns = gridColumns(isWide, isDesktop, isTablet);
  const useSplitLayout = isDesktop || isTablet;
  const dir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  const {
    loading,
    displaySummary,
    summary,
    amountText,
    setAmountText,
    parseAmount,
  } = usePointsPage(isRTL);

  const chartSize = isWide ? 280 : isDesktop ? 252 : 220;
  const containerGap = useSplitLayout ? 28 : 20;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          useSplitLayout && styles.scrollContentDesktop,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.container,
            { maxWidth: WEB_MAX_WIDTH.wide, gap: containerGap },
          ]}
        >
          <View
            style={[
              styles.pageHeader,
              useSplitLayout && styles.pageHeaderDesktop,
              { borderBottomColor: colors.border },
            ]}
          >
            <View style={[styles.titleRow, { flexDirection: dir }]}>
              <View style={[styles.titleIcon, { backgroundColor: `${colors.primary}14` }]}>
                <Coins size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.pageTitle, { color: colors.foreground, textAlign }]}>
                  {isRTL ? "نقاط الرسائل" : "Message points"}
                </Text>
                <Text style={[styles.pageSubtitle, { color: colors.mutedForeground, textAlign }]}>
                  {isRTL
                    ? "كل رسالة للمساعد الذكي تستهلك نقطة واحدة. أضف نقاطًا لمواصلة استخدام المساعد."
                    : "Each AI assistant message costs 1 point. Top up your balance to keep using the assistant."}
                </Text>
              </View>
            </View>
          </View>

          {loading && !summary ? (
            <ActivityIndicator style={{ marginTop: 64 }} color={colors.primary} />
          ) : (
            <>
              <View style={styles.sectionBlock}>
                <SectionLabel
                  textAlign={textAlign}
                  color={colors.mutedForeground}
                >
                  {isRTL ? "نظرة عامة" : "Overview"}
                </SectionLabel>
                <View
                  style={[
                    styles.topRow,
                    useSplitLayout && [styles.topRowSplit, { flexDirection: dir }],
                  ]}
                >
                  <DashboardCard
                    testID="points-balance-card"
                    style={[
                      styles.balanceCard,
                      useSplitLayout ? styles.balanceCardSplit : undefined,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        ...(isRTL
                          ? { borderRightWidth: 4, borderRightColor: colors.primary }
                          : { borderLeftWidth: 4, borderLeftColor: colors.primary }),
                      },
                    ]}
                  >
                    <Text
                      style={[styles.balanceEyebrow, { color: colors.mutedForeground, textAlign }]}
                    >
                      {isRTL ? "الرصيد الحالي" : "Current balance"}
                    </Text>
                    <Text
                      style={[
                        styles.balanceValue,
                        isWide && styles.balanceValueWide,
                        { color: colors.primary, textAlign },
                      ]}
                    >
                      {displaySummary.message_points}
                    </Text>
                    <Text style={[styles.balanceUnit, { color: colors.foreground, textAlign }]}>
                      {isRTL ? "نقطة متاحة للرسائل" : "points available for messages"}
                    </Text>
                    <View style={[styles.balanceMeta, { flexDirection: dir }]}>
                      <View style={[styles.metaPill, { backgroundColor: `${colors.primary}10` }]}>
                        <Zap size={14} color={colors.primary} />
                        <Text style={[styles.metaPillText, { color: colors.primary }]}>
                          {isRTL ? "1 نقطة / رسالة AI" : "1 point / AI message"}
                        </Text>
                      </View>
                    </View>
                  </DashboardCard>

                  <DashboardCard
                    testID="points-chart-card"
                    style={[
                      styles.chartCard,
                      useSplitLayout ? styles.chartCardSplit : undefined,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.cardTitle, { color: colors.foreground, textAlign }]}>
                      {isRTL ? "توزيع الاستخدام" : "Usage breakdown"}
                    </Text>
                    <PointsPieChart summary={displaySummary} isRTL={isRTL} size={chartSize} />
                  </DashboardCard>
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <SectionLabel textAlign={textAlign} color={colors.mutedForeground}>
                  {isRTL ? "ملخص النشاط" : "Activity summary"}
                </SectionLabel>
                <View style={gridStyle(columns)}>
                  <StatCard
                    testID="points-stat-card"
                    icon={TrendingUp}
                    label={isRTL ? "إجمالي المُشترى" : "Total purchased"}
                    value={displaySummary.points_purchased_total}
                    accent={colors.foreground}
                    colors={colors}
                    isRTL={isRTL}
                    isWide={isWide}
                  />
                  <StatCard
                    testID="points-stat-card"
                    icon={TrendingDown}
                    label={isRTL ? "إجمالي المستخدم" : "Total used"}
                    value={displaySummary.points_spent_total}
                    accent={colors.mutedForeground}
                    colors={colors}
                    isRTL={isRTL}
                    isWide={isWide}
                  />
                  <StatCard
                    testID="points-stat-card"
                    icon={Zap}
                    label={isRTL ? "تكلفة رسالة AI" : "Per AI message"}
                    value={1}
                    suffix={isRTL ? "نقطة" : "pt"}
                    accent={colors.primary}
                    colors={colors}
                    isRTL={isRTL}
                    isWide={isWide}
                  />
                </View>
              </View>

              <View style={[styles.sectionBlock, styles.addSectionBlock]}>
                <SectionLabel textAlign={textAlign} color={colors.mutedForeground}>
                  {isRTL ? "إضافة نقاط" : "Add points"}
                </SectionLabel>
                <AddPointsCard
                  amountText={amountText}
                  setAmountText={setAmountText}
                  parseAmount={parseAmount}
                  colors={colors}
                  isRTL={isRTL}
                  useSplitLayout={useSplitLayout}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({
  testID,
  icon: Icon,
  label,
  value,
  suffix,
  accent,
  colors,
  isRTL,
  isWide,
}: {
  testID: string;
  icon: typeof Coins;
  label: string;
  value: number;
  suffix?: string;
  accent: string;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
  isWide: boolean;
}) {
  const dir = isRTL ? "row-reverse" : "row";

  return (
    <View
      testID={testID}
      style={[
        styles.dashboardCard,
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statTop, { flexDirection: dir }]}>
        <View style={[styles.statIconWrap, { backgroundColor: `${accent}14` }]}>
          <Icon size={16} color={accent} />
        </View>
        <Text
          style={[styles.statLabel, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.statValue,
          isWide && styles.statValueWide,
          { color: accent, textAlign: isRTL ? "right" : "left" },
        ]}
      >
        {value}
        {suffix ? ` ${suffix}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  scrollContentDesktop: {
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 48,
  },
  container: {
    width: "100%",
  },
  pageHeader: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  pageHeaderDesktop: {
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  titleRow: {
    alignItems: "flex-start",
    gap: 16,
  },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    maxWidth: 720,
  },
  sectionBlock: {
    gap: 16,
  },
  addSectionBlock: {
    marginTop: 8,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  topRow: {
    gap: 20,
  },
  topRowSplit: {
    alignItems: "stretch",
  },
  dashboardCard: {
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  balanceCard: {
    padding: 28,
    gap: 8,
  },
  balanceCardSplit: {
    flex: 1.15,
    minWidth: 320,
  },
  balanceEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  balanceValue: {
    fontSize: 52,
    fontWeight: "800",
    lineHeight: 58,
    marginTop: 6,
  },
  balanceValueWide: {
    fontSize: 64,
    lineHeight: 70,
  },
  balanceUnit: {
    fontSize: 16,
    fontWeight: "600",
  },
  balanceMeta: {
    marginTop: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chartCard: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  chartCardSplit: {
    flex: 0.85,
    minWidth: 300,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    alignSelf: "stretch",
    marginBottom: 4,
  },
  statCard: {
    padding: 20,
    gap: 12,
  },
  statTop: {
    alignItems: "center",
    gap: 10,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 30,
    fontWeight: "800",
  },
  statValueWide: {
    fontSize: 34,
  },
  addCard: {
    padding: 0,
    overflow: "hidden",
  },
  addCardInner: {
    padding: 28,
    gap: 24,
  },
  addCardInnerSplit: {
    alignItems: "stretch",
    gap: 32,
  },
  addCardIntro: {
    flex: 1,
    gap: 16,
    minWidth: 0,
  },
  addCardTitleRow: {
    alignItems: "center",
    gap: 12,
  },
  addCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addCardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
  },
  addCardHint: {
    fontSize: 15,
    lineHeight: 22,
  },
  quickAmountRow: {
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  quickAmountChip: {
    minWidth: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as "auto",
  },
  addCardForm: {
    gap: 16,
  },
  addCardFormSplit: {
    flex: 1,
    minWidth: 280,
    maxWidth: 360,
    justifyContent: "center",
  },
  addFieldBlock: {
    gap: 8,
  },
  addFieldLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  addInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700",
    minHeight: 52,
  },
  addSubmitBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer" as "auto",
  },
  addSubmitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});

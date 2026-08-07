import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { promptAuthForConsultation } from "@/domains/auth/guestBrowse";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AiAssistantHomeCard } from "@/components/assistant/AiAssistantHomeCard";
import { AppHeader } from "@/components/AppHeader";
import { CircledCountryFlag } from "@/components/country/CircledCountryFlag";
import { DoctorChatRoster } from "@/components/DoctorChatRoster";
import { HomeBannerVideo } from "@/components/HomeBannerVideo";
import { SpecialityGrid } from "@/components/SpecialityBrowse";
import { patientCountryLabel } from "@/constants/patientCountries";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import {
  fetchDoctorsBySpeciality,
  fetchSpecialities,
  mergeDoctorIntoRoster,
  type Speciality,
  type SpecialityDoctor,
  type SpecialityDoctorRow,
} from "@/domains/home/api";
import {
  getDomainMarketCountry,
  resolveBrowseMarketCountry,
} from "@/domains/market/resolveMarketCountry";
import { onDoctorRegistered } from "@/domains/presence/socket";
import { BRAND_SCROLL_NATIVE_ID } from "@/components/web/globalWebStyles";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

function ChatsHomeBrowse() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const signedIn = isSignedIn(profile, accessToken);
  const profileCountry = useAuthStore((s) => s.profile?.country);
  const marketCountry = resolveBrowseMarketCountry(profileCountry);
  const domainMarket = getDomainMarketCountry();
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [selectedSpeciality, setSelectedSpeciality] = useState<Speciality | null>(
    null,
  );
  const [doctors, setDoctors] = useState<SpecialityDoctor[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHome = useCallback(async () => {
    setLoadingHome(true);
    setError(null);
    try {
      setSpecialities(await fetchSpecialities());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load home data");
    } finally {
      setLoadingHome(false);
    }
  }, []);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  useFocusEffect(
    useCallback(() => {
      // Only fetch when we have nothing yet — refetching on every tab focus
      // caused a network round-trip + re-render that made the home tab feel
      // like it hung when switching back to it.
      if (!selectedSpeciality && specialities.length === 0) void loadHome();
    }, [loadHome, selectedSpeciality, specialities.length]),
  );

  useEffect(() => {
    if (!selectedSpeciality) return;
    let cancelled = false;
    (async () => {
      setLoadingDoctors(true);
      setDoctors([]);
      setError(null);
      try {
        const rows = await fetchDoctorsBySpeciality(
          selectedSpeciality.id,
          marketCountry,
        );
        if (!cancelled) setDoctors(rows);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load doctors");
        }
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSpeciality?.id, marketCountry]);

  useEffect(() => {
    if (!selectedSpeciality) return;

    onDoctorRegistered((payload: SpecialityDoctorRow) => {
      setDoctors((current) =>
        mergeDoctorIntoRoster(
          current,
          payload,
          selectedSpeciality.id,
          marketCountry,
        ),
      );
      setLoadingDoctors(false);
    });

    return () => onDoctorRegistered(null);
  }, [selectedSpeciality?.id, marketCountry]);

  const openDoctorProfile = useCallback(
    (doctorUserId: string, doctorEntityId?: string) => {
      if (!doctorEntityId) {
        if (!signedIn) {
          promptAuthForConsultation(router, isRTL);
          return;
        }
        router.push(`/chat/${doctorUserId}`);
        return;
      }
      router.push({
        pathname: "/doctor/[doctorId]",
        params: { doctorId: doctorEntityId, userId: doctorUserId },
      });
    },
    [isRTL, signedIn],
  );

  if (loadingHome && specialities.length === 0) {
    return (
      <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
    );
  }

  if (error && specialities.length === 0 && !selectedSpeciality) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: "#ef4444", textAlign: "center", paddingHorizontal: 24 }}>
          {error}
        </Text>
        <Pressable
          onPress={() => void loadHome()}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginTop: 12 }]}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {isRTL ? "إعادة المحاولة" : "Retry"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (selectedSpeciality) {
    return (
      <DoctorChatRoster
        speciality={selectedSpeciality}
        doctors={doctors}
        loading={loadingDoctors}
        isRTL={isRTL}
        marketCountry={marketCountry}
        onBack={() => {
          setSelectedSpeciality(null);
          setDoctors([]);
          setError(null);
        }}
        onSelectDoctor={openDoctorProfile}
      />
    );
  }

  return (
    <ScrollView
      nativeID={BRAND_SCROLL_NATIVE_ID}
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator
      refreshControl={
        <RefreshControl refreshing={loadingHome} onRefresh={() => void loadHome()} />
      }
    >
      {signedIn ? <AiAssistantHomeCard /> : null}
      <HomeBannerVideo />
      {domainMarket ? (
        <View
          style={[
            styles.marketBanner,
            {
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}33`,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <CircledCountryFlag country={domainMarket} size={28} />
          <Text style={[styles.marketBannerText, { color: colors.foreground }]}>
            {isRTL
              ? `أطباء ${patientCountryLabel(domainMarket, true)} فقط`
              : `Showing doctors from ${patientCountryLabel(domainMarket, false)} only`}
          </Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.empty}>
          <Text style={{ color: "#ef4444", textAlign: "center", paddingHorizontal: 24 }}>
            {error}
          </Text>
          <Pressable
            onPress={() => void loadHome()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginTop: 12 }]}
          >
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {isRTL ? "إعادة المحاولة" : "Retry"}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {specialities.length === 0 && !loadingHome && !error ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            {isRTL ? "لا توجد تخصصات متاحة" : "No specialities available"}
          </Text>
        </View>
      ) : (
        <SpecialityGrid
          specialities={specialities}
          isRTL={isRTL}
          onSelect={setSelectedSpeciality}
        />
      )}
    </ScrollView>
  );
}

export default function ChatsTab() {
  const colors = useColors();
  const { isDesktop } = useWebLayout();
  const showHeader = Platform.OS !== "web" || !isDesktop;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {showHeader ? <AppHeader /> : null}
      <ChatsHomeBrowse />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  empty: { alignItems: "center", paddingVertical: 60 },
  marketBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  marketBannerText: { fontSize: 14, fontWeight: "700", flex: 1 },
});

import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CircledCountryFlag } from "@/components/country/CircledCountryFlag";
import { DoctorChatRoster } from "@/components/DoctorChatRoster";
import { SpecialityGrid } from "@/components/SpecialityBrowse";
import { BRAND_SCROLL_NATIVE_ID } from "@/components/web/globalWebStyles";
import {
  patientCountryLabel,
  type MarketCountryCode,
} from "@/constants/patientCountries";
import { promptAuthForConsultation } from "@/domains/auth/guestBrowse";
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
import { onDoctorRegistered } from "@/domains/presence/socket";
import { useHardwareBackHandler } from "@/hooks/useHardwareBackHandler";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

type Props = {
  marketCountry: MarketCountryCode;
  /** Show a flag + country banner above specialities. */
  showMarketBanner?: boolean;
  onBackFromSpeciality?: () => void;
};

/** Speciality grid → doctor roster for a fixed market (EG / JO). */
export function MarketDoctorsBrowse({
  marketCountry,
  showMarketBanner = true,
}: Props) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const signedIn = isSignedIn(profile, accessToken);
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
      const next = await fetchSpecialities();
      setSpecialities(next);
      setSelectedSpeciality((prev) =>
        prev && next.some((s) => s.id === prev.id) ? prev : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load specialities");
    } finally {
      setLoadingHome(false);
    }
  }, [marketCountry]);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  useEffect(() => {
    if (!selectedSpeciality) return;
    let cancelled = false;
    (async () => {
      setLoadingDoctors(true);
      setDoctors([]);
      setError(null);
      try {
        const rows = await fetchDoctorsBySpeciality(selectedSpeciality.id);
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
        mergeDoctorIntoRoster(current, payload, selectedSpeciality.id),
      );
    });
    return () => onDoctorRegistered(null);
  }, [selectedSpeciality?.id, marketCountry]);

  // Same as the home tab: the roster is state, so hardware back needs handling
  // here or it falls through to the global handler and leaves the screen.
  const clearSpeciality = useCallback(() => {
    setSelectedSpeciality(null);
    setDoctors([]);
    setError(null);
  }, []);

  useHardwareBackHandler(() => {
    if (!selectedSpeciality) return false;
    clearSpeciality();
    return true;
  }, !!selectedSpeciality);

  const openDoctorProfile = useCallback(
    (doctorUserId: string, doctorEntityId?: string) => {
      if (!signedIn) {
        promptAuthForConsultation(`/chat/${doctorUserId}`);
        return;
      }
      if (!doctorEntityId) {
        router.push({
          pathname: "/chat/[id]",
          // Remembered for the no-history case: back returns to the doctor list.
          params: { id: doctorUserId, from: "doctors" },
        });
        return;
      }
      router.push({
        pathname: "/doctor/[doctorId]",
        params: { doctorId: doctorEntityId, userId: doctorUserId },
      });
    },
    [signedIn],
  );

  const startConsultationWithDoctor = useCallback(
    (doctorUserId: string) => {
      if (!signedIn) {
        promptAuthForConsultation(`/chat/${doctorUserId}`);
        return;
      }
      router.push({
        pathname: "/chat/[id]",
        params: { id: doctorUserId, from: "doctors" },
      });
    },
    [signedIn],
  );

  if (loadingHome && specialities.length === 0) {
    return (
      <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
    );
  }

  if (selectedSpeciality) {
    return (
      <DoctorChatRoster
        speciality={selectedSpeciality}
        doctors={doctors}
        loading={loadingDoctors}
        isRTL={isRTL}
        onBack={clearSpeciality}
        onSelectDoctor={openDoctorProfile}
        onStartConsultation={startConsultationWithDoctor}
      />
    );
  }

  const countryName = patientCountryLabel(marketCountry, isRTL);

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
      {showMarketBanner ? (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}33`,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <CircledCountryFlag country={marketCountry} size={28} />
          <Text style={[styles.bannerText, { color: colors.foreground }]}>
            {isRTL ? `أطباؤنا في ${countryName}` : `Our doctors in ${countryName}`}
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
          fullHeight
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  empty: { alignItems: "center", paddingVertical: 60 },
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  bannerText: { fontSize: 15, fontWeight: "700", flex: 1 },
});

import { useFocusEffect } from "@react-navigation/native";
import { Redirect, router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import { AdvertisementCarousel } from "@/components/AdvertisementCarousel";
import { AiAssistantHomeCard } from "@/components/assistant/AiAssistantHomeCard";
import { AppHeader } from "@/components/AppHeader";
import { DoctorChatRoster } from "@/components/DoctorChatRoster";
import { SpecialityGrid } from "@/components/SpecialityBrowse";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import {
  fetchAdvertisements,
  fetchDoctorsBySpeciality,
  fetchSpecialities,
  mergeDoctorIntoRoster,
  type Advertisement,
  type Speciality,
  type SpecialityDoctor,
  type SpecialityDoctorRow,
} from "@/domains/home/api";
import { onDoctorRegistered } from "@/domains/presence/socket";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";

function ChatsHomeBrowse() {
  const colors = useColors();
  const { isRTL } = useI18n();
  const [ads, setAds] = useState<Advertisement[]>([]);
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
      const [adRows, specRows] = await Promise.all([
        fetchAdvertisements(),
        fetchSpecialities(),
      ]);
      setAds(adRows);
      setSpecialities(specRows);
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
      if (!selectedSpeciality) void loadHome();
    }, [loadHome, selectedSpeciality]),
  );

  const openSpeciality = useCallback(async (speciality: Speciality) => {
    setSelectedSpeciality(speciality);
    setLoadingDoctors(true);
    setDoctors([]);
    setError(null);
    try {
      const rows = await fetchDoctorsBySpeciality(speciality.id);
      setDoctors(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load doctors");
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSpeciality) return;

    onDoctorRegistered((payload: SpecialityDoctorRow) => {
      setDoctors((current) =>
        mergeDoctorIntoRoster(current, payload, selectedSpeciality.id),
      );
      setLoadingDoctors(false);
    });

    return () => onDoctorRegistered(null);
  }, [selectedSpeciality?.id]);

  const openDoctorProfile = useCallback(
    (doctorUserId: string, doctorEntityId?: string) => {
      if (!doctorEntityId) {
        router.push(`/chat/${doctorUserId}`);
        return;
      }
      router.push({
        pathname: "/doctor/[doctorId]",
        params: { doctorId: doctorEntityId, userId: doctorUserId },
      });
    },
    [],
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
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={loadingHome} onRefresh={() => void loadHome()} />
      }
    >
      <AiAssistantHomeCard />
      <AdvertisementCarousel items={ads} isRTL={isRTL} />
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
          onSelect={(s) => void openSpeciality(s)}
        />
      )}
    </ScrollView>
  );
}

export default function ChatsTab() {
  const colors = useColors();
  const { isDesktop } = useWebLayout();
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const showHeader = Platform.OS !== "web" || !isDesktop;

  if (!isSignedIn(profile, accessToken) || !role) {
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {showHeader ? <AppHeader logoMarginTop={8} /> : null}
      <ChatsHomeBrowse />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  empty: { alignItems: "center", paddingVertical: 60 },
});

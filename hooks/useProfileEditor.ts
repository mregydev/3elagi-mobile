import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { fetchSpecialities, type Speciality } from "@/domains/home/api";
import {
  fetchAccountProfile,
  updateAccountProfile,
  type AccountProfile,
} from "@/domains/auth/profile-api";
import { useAuthStore } from "@/domains/auth/store";
import { uploadFile } from "@/domains/medical/api";

interface Options {
  accessToken: string;
  role: string;
  isRTL: boolean;
}

export function useProfileEditor({ accessToken, role, isRTL }: Options) {
  const setProfile = useAuthStore((s) => s.setProfile);
  const isDoctor = role.toLowerCase() === "doctor";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [specialityId, setSpecialityId] = useState("");
  const [messagePrice, setMessagePrice] = useState(1);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [photoDirty, setPhotoDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAccountProfile(accessToken, role);
      setAccount(data);
      setName(data.name);
      setPhone(data.phone);
      setBirthDate(data.birthDate ?? "");
      setProfessionalTitle(data.professionalTitle ?? "");
      setSpecialityId(data.specialityId ?? "");
      setMessagePrice(data.messagePrice ?? 1);
      setPhotoUrl(data.photoUrl);
      setPhotoUri(null);
      setPhotoDirty(false);
    } catch (e) {
      Alert.alert(isRTL ? "خطأ" : "Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, role, isRTL]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isDoctor) return;
    void fetchSpecialities()
      .then(setSpecialities)
      .catch(() => setSpecialities([]));
  }, [isDoctor]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        isRTL ? "الإذن مطلوب" : "Permission required",
        isRTL ? "يرجى السماح بالوصول إلى الصور." : "Please allow photo library access.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoDirty(true);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert(isRTL ? "الاسم مطلوب" : "Name required");
      return false;
    }
    if (isDoctor && !specialityId) {
      Alert.alert(
        isRTL ? "التخصص مطلوب" : "Speciality required",
        isRTL ? "اختر تخصصك الطبي." : "Please select your medical speciality.",
      );
      return false;
    }
    setSaving(true);
    try {
      let nextPhotoUrl = photoUrl ?? null;
      if (photoDirty && photoUri) {
        const uploaded = await uploadFile(
          photoUri,
          "image/jpeg",
          `avatar-${Date.now()}.jpg`,
          accessToken,
        );
        nextPhotoUrl = uploaded.url;
      }

      const updated = await updateAccountProfile(accessToken, role, {
        name,
        phone,
        birthDate: birthDate.trim() || undefined,
        professionalTitle: isDoctor ? professionalTitle : undefined,
        specialityId: isDoctor ? specialityId : undefined,
        messagePrice: isDoctor ? messagePrice : undefined,
        photoUrl: photoDirty ? nextPhotoUrl : undefined,
      });

      setProfile(updated);
      setPhotoUrl(updated.avatarUrl);
      setPhotoUri(null);
      setPhotoDirty(false);
      Alert.alert(isRTL ? "تم الحفظ" : "Saved", isRTL ? "تم تحديث ملفك." : "Profile updated.");
      return true;
    } catch (e) {
      Alert.alert(isRTL ? "فشل الحفظ" : "Save failed", (e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    account,
    name,
    setName,
    phone,
    setPhone,
    birthDate,
    setBirthDate,
    professionalTitle,
    setProfessionalTitle,
    specialities,
    specialityId,
    setSpecialityId,
    messagePrice,
    setMessagePrice,
    isDoctor,
    displayPhoto: photoUri ?? photoUrl,
    pickPhoto,
    save,
  };
}

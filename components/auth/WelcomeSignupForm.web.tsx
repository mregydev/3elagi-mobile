import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, FileText, Stethoscope, UserRound, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MessagePricePicker } from "@/components/MessagePricePicker";
import { fetchSpecialities, type Speciality } from "@/domains/home/api";
import { useAuthStore } from "@/domains/auth/store";
import type { SignupFile, SignupRole } from "@/domains/auth/types";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { flexRow } from "@/utils/rtl";

type LocalFile = SignupFile & { label: string };

interface Props {
  onSwitchToLogin: () => void;
}

export function WelcomeSignupForm({ onSwitchToLogin }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const signup = useAuthStore((s) => s.signup);
  const loading = useAuthStore((s) => s.loading);

  const [role, setRole] = useState<SignupRole>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<SignupFile | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [graduationCert, setGraduationCert] = useState<LocalFile | null>(null);
  const [workPermit, setWorkPermit] = useState<LocalFile | null>(null);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [specialityId, setSpecialityId] = useState("");
  const [messagePrice, setMessagePrice] = useState(1);

  const isDoctor = role === "doctor";

  useEffect(() => {
    if (!isDoctor) return;
    void fetchSpecialities()
      .then((rows) => {
        setSpecialities(rows);
        if (rows[0] && !specialityId) setSpecialityId(rows[0].id);
      })
      .catch(() => setSpecialities([]));
  }, [isDoctor, specialityId]);

  const pickPhoto = () => {
    Alert.alert(t.auth.profilePhoto, t.auth.chooseSource, [
      {
        text: t.auth.gallery,
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setPhotoPreview(asset.uri);
            setPhoto({
              uri: asset.uri,
              mimeType: asset.mimeType ?? "image/jpeg",
              fileName: asset.fileName ?? `avatar-${Date.now()}.jpg`,
            });
          }
        },
      },
      { text: t.common.cancel, style: "cancel" },
    ]);
  };

  const pickDocument = async (kind: "graduationCert" | "workPermit", label: string) => {
    Alert.alert(label, t.auth.chooseFileType, [
      {
        text: t.auth.photo,
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.9,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const file: LocalFile = {
              uri: asset.uri,
              mimeType: asset.mimeType ?? "image/jpeg",
              fileName: asset.fileName ?? `${kind}-${Date.now()}.jpg`,
              label,
            };
            if (kind === "graduationCert") setGraduationCert(file);
            else setWorkPermit(file);
          }
        },
      },
      {
        text: "PDF",
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: "application/pdf",
            copyToCacheDirectory: true,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const file: LocalFile = {
              uri: asset.uri,
              mimeType: asset.mimeType ?? "application/pdf",
              fileName: asset.name,
              label,
            };
            if (kind === "graduationCert") setGraduationCert(file);
            else setWorkPermit(file);
          }
        },
      },
      { text: t.common.cancel, style: "cancel" },
    ]);
  };

  const submit = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      Alert.alert(t.auth.missingInfo, t.auth.missingInfoMsg);
      return;
    }
    if (isDoctor && !specialityId) {
      Alert.alert(t.auth.specialityRequired, t.auth.specialityRequiredMsg);
      return;
    }
    try {
      await signup({
        role,
        name,
        email,
        phone,
        password,
        photo: photo ?? undefined,
        graduationCert: isDoctor ? graduationCert ?? undefined : undefined,
        workPermit: isDoctor ? workPermit ?? undefined : undefined,
        specialityId: isDoctor ? specialityId : undefined,
        messagePrice: isDoctor ? messagePrice : undefined,
      });
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert(t.auth.signupFailed, (e as Error).message);
    }
  };

  return (
    <View style={styles.form}>
      <View style={[styles.roleRow, { flexDirection: dir }]}>
        <RoleChip
          active={role === "patient"}
          onPress={() => setRole("patient")}
          label={t.auth.patient}
          Icon={UserRound}
          colors={colors}
        />
        <RoleChip
          active={role === "doctor"}
          onPress={() => setRole("doctor")}
          label={t.auth.doctor}
          Icon={Stethoscope}
          colors={colors}
        />
      </View>

      <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
        {photoPreview ? (
          <Image source={{ uri: photoPreview }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
            <Camera size={28} color={colors.mutedForeground} />
          </View>
        )}
        <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
          <Camera size={13} color="#fff" />
        </View>
      </Pressable>

      <Field
        label={t.auth.name}
        value={name}
        onChange={setName}
        placeholder={t.auth.namePlaceholder}
        colors={colors}
        isRTL={isRTL}
      />
      <Field
        label={t.auth.email}
        value={email}
        onChange={setEmail}
        placeholder={t.auth.emailPlaceholder}
        autoCapitalize="none"
        keyboardType="email-address"
        colors={colors}
        isRTL={isRTL}
      />
      <Field
        label={t.auth.phone}
        value={phone}
        onChange={setPhone}
        placeholder={t.auth.phonePlaceholder}
        keyboardType="phone-pad"
        colors={colors}
        isRTL={isRTL}
      />
      <Field
        label={t.auth.password}
        value={password}
        onChange={setPassword}
        placeholder={t.auth.passwordMinPlaceholder}
        secure
        colors={colors}
        isRTL={isRTL}
      />

      {isDoctor ? (
        <View style={styles.doctorBlock}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            {t.auth.speciality}
          </Text>
          <View style={[styles.specialityRow, { flexDirection: dir }]}>
            {specialities.map((spec) => {
              const active = specialityId === spec.id;
              const label = isRTL ? spec.nameAr : spec.nameEn;
              return (
                <Pressable
                  key={spec.id}
                  onPress={() => setSpecialityId(spec.id)}
                  style={[
                    styles.specialityChip,
                    {
                      backgroundColor: active ? `${colors.primary}18` : colors.muted,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.primary : colors.foreground,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <MessagePricePicker
            value={messagePrice}
            onChange={setMessagePrice}
            isRTL={isRTL}
            dir={dir}
            label={t.auth.messagePrice}
            hint={t.auth.messagePriceHint}
          />
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            {t.auth.documentsOptional}
          </Text>
          <DocUploadRow
            label={t.auth.graduationCert}
            file={graduationCert}
            onPick={() => pickDocument("graduationCert", t.auth.graduationCert)}
            onClear={() => setGraduationCert(null)}
            colors={colors}
            dir={dir}
            notUploadedLabel={t.auth.notUploadedOptional}
            uploadLabel={t.auth.upload}
          />
          <DocUploadRow
            label={t.auth.workLicense}
            file={workPermit}
            onPick={() => pickDocument("workPermit", t.auth.workLicense)}
            onClear={() => setWorkPermit(null)}
            colors={colors}
            dir={dir}
            notUploadedLabel={t.auth.notUploadedOptional}
            uploadLabel={t.auth.upload}
          />
        </View>
      ) : null}

      <Pressable
        onPress={submit}
        disabled={loading}
        style={[
          styles.btn,
          { backgroundColor: loading ? colors.mutedForeground : colors.primary },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{t.auth.signUp}</Text>
        )}
      </Pressable>

      <Pressable onPress={onSwitchToLogin} style={styles.switchLink}>
        <Text style={{ color: colors.primary, fontWeight: "600" }}>
          {t.auth.hasAccountLogIn}
        </Text>
      </Pressable>
    </View>
  );
}

function RoleChip({
  active,
  onPress,
  label,
  Icon,
  colors,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  Icon: typeof UserRound;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.roleChip,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Icon size={18} color={active ? "#fff" : colors.foreground} />
      <Text style={{ color: active ? "#fff" : colors.foreground, fontWeight: "700" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function DocUploadRow({
  label,
  file,
  onPick,
  onClear,
  colors,
  dir,
  notUploadedLabel,
  uploadLabel,
}: {
  label: string;
  file: LocalFile | null;
  onPick: () => void;
  onClear: () => void;
  colors: ReturnType<typeof useColors>;
  dir: "row" | "row-reverse";
  notUploadedLabel: string;
  uploadLabel: string;
}) {
  return (
    <View
      style={[
        styles.docRow,
        { borderColor: colors.border, backgroundColor: colors.card, flexDirection: dir },
      ]}
    >
      <FileText size={20} color={colors.primary} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{label}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }} numberOfLines={1}>
          {file ? file.fileName : notUploadedLabel}
        </Text>
      </View>
      {file ? (
        <Pressable onPress={onClear} hitSlop={8}>
          <X size={18} color={colors.mutedForeground} />
        </Pressable>
      ) : (
        <Pressable onPress={onPick}>
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
            {uploadLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  secure,
  colors,
  isRTL,
  placeholder,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences";
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        placeholder={placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...rest}
      />
    </View>
  );
}

const AVATAR_SIZE = 80;

const styles = StyleSheet.create({
  form: { width: "100%", gap: 12, alignItems: "center" },
  field: { gap: 6, width: "100%" },
  roleRow: { gap: 10, width: "100%" },
  roleChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    cursor: "pointer" as "auto",
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: "relative",
    marginVertical: 4,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  doctorBlock: { width: "100%", gap: 12 },
  sectionLabel: { fontSize: 14, fontWeight: "800" },
  specialityRow: { flexWrap: "wrap", gap: 8 },
  specialityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    cursor: "pointer" as "auto",
  },
  docRow: {
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: { fontSize: 13, fontWeight: "700" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    marginTop: 8,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    cursor: "pointer" as "auto",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  switchLink: {
    paddingVertical: 8,
    alignItems: "center",
    cursor: "pointer" as "auto",
  },
});

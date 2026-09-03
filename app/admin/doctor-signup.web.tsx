import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { AdminShell } from "@/components/admin/AdminShell.web";
import {
  defaultDoctorWelcomeEmailState,
  DoctorWelcomeEmailPanel,
} from "@/components/admin/DoctorWelcomeEmailPanel.web";
import { WelcomeSignupForm } from "@/components/auth/WelcomeSignupForm";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export default function AdminDoctorSignupWeb() {
  const router = useRouter();
  const [welcomeEmail, setWelcomeEmail] = useState(defaultDoctorWelcomeEmailState);

  return (
    <AdminShell
      title="Add doctor"
      subtitle="Create a doctor account. They are approved immediately and can start using the app."
    >
      <ScrollView contentContainerStyle={styles.content}>
        <WelcomeSignupForm
          adminDoctorMode
          welcomeEmail={welcomeEmail}
          onSwitchToLogin={() => router.push("/admin")}
          onAdminDoctorCreated={(result) => {
            if (result?.welcomeEmailOk === false) {
              showErrorToast(
                result.welcomeEmailError ?? "Doctor created but welcome email failed",
              );
            } else if (welcomeEmail.enabled) {
              showSuccessToast("Doctor created, approved, and welcome email sent");
            } else {
              showSuccessToast("Doctor account created and approved");
            }
            router.push("/admin");
          }}
        />
        <DoctorWelcomeEmailPanel
          value={welcomeEmail}
          onChange={setWelcomeEmail}
        />
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 28,
    paddingBottom: 48,
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
});

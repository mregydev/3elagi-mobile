import SignupScreen from "./signup.tsx";
import { AuthScreenRoot } from "@/components/auth/AuthScreenRoot.web";
import { WebAuthFrame } from "@/components/web/WebAuthFrame";
import { useI18n } from "@/hooks/useI18n";

export default function SignupScreenWeb() {
  const { t } = useI18n();

  return (
    <WebAuthFrame
      scrollForm
      eyebrow={t.auth.signUpEyebrow}
      headline={t.auth.signUpHeadline}
      description={t.auth.signUpDescription}
    >
      <AuthScreenRoot>
        <SignupScreen />
      </AuthScreenRoot>
    </WebAuthFrame>
  );
}

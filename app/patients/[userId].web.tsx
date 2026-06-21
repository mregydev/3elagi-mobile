import PatientProfileScreen from "./[userId].tsx";
import { WebStackScreen } from "@/components/web/WebStackScreen";

export default function PatientProfileScreenWeb() {
  return (
    <WebStackScreen maxWidth={960}>
      <PatientProfileScreen />
    </WebStackScreen>
  );
}

import firebase from "@react-native-firebase/app";

export function isFirebaseReady(): boolean {
  return firebase.apps.length > 0;
}

export function getFirebaseProjectId(): string | null {
  try {
    return firebase.app().options.projectId ?? null;
  } catch {
    return null;
  }
}

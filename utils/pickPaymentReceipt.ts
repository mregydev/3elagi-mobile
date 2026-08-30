import * as DocumentPicker from "expo-document-picker";

/** Opens the receipt picker — call synchronously from a press handler (web). */
export async function pickPaymentReceipt() {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ["image/*", "application/pdf"],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets[0]) return null;
  return picked.assets[0];
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export type SignupRole = "patient" | "doctor";

export interface SignupFile {
  uri: string;
  mimeType: string;
  fileName: string;
}

export interface SignupInput extends Credentials {
  role: SignupRole;
  name: string;
  phone?: string;
  photo?: SignupFile;
  graduationCert?: SignupFile;
  workPermit?: SignupFile;
  specialityId?: string;
  consultationPrice?: number;
  medicalRecordsStorageConsent?: boolean;
}

export type DoctorApprovalStatus = "pending" | "approved" | "rejected";

export type PreferredLocale = "ar" | "en" | "de" | "es";

export interface AuthSession {
  accessToken: string;
  role: string;
  userId: string;
  profile: PatientProfile;
  preferredLocale?: PreferredLocale | null;
  /** Set when role is doctor */
  doctorId?: string;
  /** Set when role is doctor */
  specialty?: string;
  /** Doctor speciality catalog id */
  specialityId?: string;
  /** Doctor approval status from API */
  doctorApprovalStatus?: DoctorApprovalStatus | null;
}

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
  messagePrice?: number;
}

export interface AuthSession {
  accessToken: string;
  role: string;
  userId: string;
  profile: PatientProfile;
  /** Set when role is doctor */
  doctorId?: string;
  /** Set when role is doctor */
  specialty?: string;
  /** Doctor speciality catalog id */
  specialityId?: string;
}

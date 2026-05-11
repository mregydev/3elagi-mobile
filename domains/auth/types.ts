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

export interface SignupInput extends Credentials {
  name: string;
  phone?: string;
}

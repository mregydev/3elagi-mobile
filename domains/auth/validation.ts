import type { Translations } from "@/constants/translations";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export interface SignupFieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  specialityId?: string;
}

export function hasFieldErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

export function validateLoginFields(
  email: string,
  password: string,
  t: Translations["auth"],
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) errors.email = t.fieldRequired;
  else if (!EMAIL_RE.test(trimmedEmail)) errors.email = t.invalidEmail;

  if (!password) errors.password = t.fieldRequired;

  return errors;
}

export function validateSignupFields(
  input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    isDoctor: boolean;
    specialityId: string;
  },
  t: Translations["auth"],
): SignupFieldErrors {
  const errors: SignupFieldErrors = {};

  if (!input.name.trim()) errors.name = t.fieldRequired;

  const trimmedEmail = input.email.trim();
  if (!trimmedEmail) errors.email = t.fieldRequired;
  else if (!EMAIL_RE.test(trimmedEmail)) errors.email = t.invalidEmail;

  if (!input.phone.trim()) errors.phone = t.fieldRequired;

  if (!input.password) errors.password = t.fieldRequired;
  else if (input.password.length < 6) errors.password = t.passwordTooShort;

  if (input.isDoctor && !input.specialityId) {
    errors.specialityId = t.specialityRequiredMsg;
  }

  return errors;
}

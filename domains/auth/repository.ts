import type { Credentials, PatientProfile, SignupInput } from "./types";

const fakeUsers: Record<string, { password: string; profile: PatientProfile }> = {
  "demo@3elagi.com": {
    password: "demo1234",
    profile: {
      id: "u-demo",
      name: "Demo Patient",
      email: "demo@3elagi.com",
      phone: "01000000000",
      avatarUrl:
        "https://api.dicebear.com/9.x/avataaars/png?seed=demo&backgroundColor=b6e3f4",
      createdAt: new Date().toISOString(),
    },
  },
};

function delay(ms = 400) {
  return new Promise((r) => setTimeout(r, ms));
}

export const authRepository = {
  async login(creds: Credentials): Promise<PatientProfile> {
    await delay();
    const rec = fakeUsers[creds.email.trim().toLowerCase()];
    if (!rec || rec.password !== creds.password) {
      throw new Error("Invalid email or password");
    }
    return rec.profile;
  },
  async signup(input: SignupInput): Promise<PatientProfile> {
    await delay();
    const email = input.email.trim().toLowerCase();
    if (fakeUsers[email]) throw new Error("Account already exists");
    const profile: PatientProfile = {
      id: `u-${Date.now()}`,
      name: input.name.trim() || "Patient",
      email,
      phone: input.phone,
      avatarUrl: `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(
        email,
      )}`,
      createdAt: new Date().toISOString(),
    };
    fakeUsers[email] = { password: input.password, profile };
    return profile;
  },
};

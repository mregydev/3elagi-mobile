# 3elagi Mobile

Standalone Expo (React Native) app — patient-facing mobile client for the 3elagi clinic platform.

## Requirements

- Node.js 20+
- npm, pnpm or yarn
- Expo Go app on your phone (for the easiest preview)

## Install & run

```bash
npm install            # or: pnpm install / yarn
npm run start          # opens Expo dev server, prints a QR code
```

Then:
- **Android:** open Expo Go and scan the QR
- **iOS:** open the Camera app and scan the QR
- **Web:** press `w` in the terminal, or run `npm run web`

## Demo account

The app ships with a built-in demo profile:

- email: `demo@3elagi.com`
- password: `demo1234`

## Build

- Web bundle: `npm run build:web`  →  `dist/`
- Native (Android APK / iOS): use [EAS Build](https://docs.expo.dev/build/introduction/) — `npx eas build -p android --profile preview`. Update `eas.json` and add an `extra.eas.projectId` in `app.json` first.

## Project layout

```
app/             expo-router routes (tabs, chat, medical, auth, etc.)
components/     shared UI (AppHeader, Avatar, Logo3elagi, LanguageSwitch, …)
domains/        zustand stores (auth, medical, chat, i18n)
hooks/          useColors, useI18n
constants/      colors, theme tokens
assets/         images & fonts
```

## Notes

This is a self-contained copy — no monorepo, no Replit env vars, no proxy.
The `dev` server binds to localhost on the default Expo port (8081).

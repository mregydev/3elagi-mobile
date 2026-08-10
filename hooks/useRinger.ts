import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { useEffect } from "react";
import { Platform } from "react-native";

const SOUNDS = {
  /** Caller side: the classic 440+480 Hz ringback, 2s on / 3s off. */
  ringback: require("@/assets/sounds/ringback.wav"),
  /** Callee side: rising chime, like a phone ringing. */
  ringtone: require("@/assets/sounds/ringtone.wav"),
} as const;

/**
 * Loops a call ring while `active`. Failures are swallowed on purpose — a
 * blocked autoplay or a busy audio session must never break the call itself.
 */
export function useRinger(kind: keyof typeof SOUNDS, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    let sound: Audio.Sound | null = null;
    let cancelled = false;

    void (async () => {
      try {
        if (Platform.OS !== "web") {
          // Ring through the silent switch, and duck other audio rather than kill it.
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            interruptionModeIOS: InterruptionModeIOS.DuckOthers,
            interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: false,
          });
        }
        const created = await Audio.Sound.createAsync(SOUNDS[kind], {
          isLooping: true,
          shouldPlay: true,
          volume: 0.9,
        });
        if (cancelled) {
          await created.sound.unloadAsync();
          return;
        }
        sound = created.sound;
      } catch {
        // no ring is better than a crash
      }
    })();

    return () => {
      cancelled = true;
      void sound?.unloadAsync().catch(() => {});
    };
  }, [kind, active]);
}

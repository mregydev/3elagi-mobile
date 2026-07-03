import { Audio as ExpoAudio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Buffer } = require("buffer") as typeof import("buffer");
  return Buffer.from(bytes).toString("base64");
}

async function prepareNativeAudioMode() {
  await ExpoAudio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
  });
}

export class NativeAssistantRecorder {
  private recording: ExpoAudio.Recording | null = null;
  private startedAt = 0;

  get active() {
    return !!this.recording;
  }

  async start(): Promise<void> {
    const { status } = await ExpoAudio.requestPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Microphone permission is required for voice chat.");
    }
    await prepareNativeAudioMode();
    const { recording } = await ExpoAudio.Recording.createAsync(
      ExpoAudio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    this.recording = recording;
    this.startedAt = Date.now();
  }

  async stop(): Promise<{ base64: string; mimeType: string }> {
    const recording = this.recording;
    if (!recording) throw new Error("Recorder not started");

    const durationMs = Date.now() - this.startedAt;
    await recording.stopAndUnloadAsync();
    this.recording = null;
    await prepareNativeAudioMode();

    if (durationMs < 800) {
      throw new Error("Recording too short. Hold the mic a little longer.");
    }

    const uri = recording.getURI();
    if (!uri) throw new Error("Could not save recording.");

    const mimeType =
      Platform.OS === "ios"
        ? "audio/mp4"
        : uri.endsWith(".3gp")
          ? "audio/3gpp"
          : "audio/mp4";
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return { base64, mimeType };
  }

  async cancel(): Promise<void> {
    if (!this.recording) return;
    try {
      await this.recording.stopAndUnloadAsync();
    } catch {
      /* ignore */
    }
    this.recording = null;
  }
}

export async function playAssistantTtsBuffer(
  audioBuffer: ArrayBuffer,
  callbacks: {
    onStart?: () => void;
    onProgress?: (ratio: number) => void;
    onEnd?: () => void;
    onError?: (message: string) => void;
  },
): Promise<() => void> {
  if (Platform.OS === "web") {
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new window.Audio(url);
    audio.onplay = () => callbacks.onStart?.();
    audio.ontimeupdate = () => {
      if (audio.duration > 0) {
        callbacks.onProgress?.(audio.currentTime / audio.duration);
      }
    };
    audio.onended = () => {
      URL.revokeObjectURL(url);
      callbacks.onProgress?.(1);
      callbacks.onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      callbacks.onError?.("Could not play voice response.");
    };
    await audio.play();
    return () => {
      audio.pause();
      URL.revokeObjectURL(url);
    };
  }

  await ExpoAudio.setAudioModeAsync({ playsInSilentModeIOS: true });
  const path = `${FileSystem.cacheDirectory}assistant-tts-${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(path, arrayBufferToBase64(audioBuffer), {
    encoding: FileSystem.EncodingType.Base64,
  });
  const { sound } = await ExpoAudio.Sound.createAsync({ uri: path });
  sound.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded) return;
    if (status.isPlaying) callbacks.onStart?.();
    if (status.durationMillis && status.positionMillis != null) {
      callbacks.onProgress?.(status.positionMillis / status.durationMillis);
    }
    if (status.didJustFinish) {
      callbacks.onProgress?.(1);
      void sound.unloadAsync();
      callbacks.onEnd?.();
    }
  });
  await sound.playAsync();
  callbacks.onStart?.();
  return async () => {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {
      /* ignore */
    }
  };
}

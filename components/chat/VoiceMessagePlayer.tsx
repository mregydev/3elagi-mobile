import { Audio, type AVPlaybackStatus } from "expo-av";
import { Pause, Play } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  uri: string | null | undefined;
  pending?: boolean;
  color: string;
  trackColor: string;
  fillColor: string;
  isRTL: boolean;
  rowDir: "row" | "row-reverse";
  onLongPress?: () => void;
};

function formatMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** WhatsApp-style voice bubble: play/pause + scrubbable progress. */
export function VoiceMessagePlayer({
  uri,
  pending,
  color,
  trackColor,
  fillColor,
  isRTL,
  rowDir,
  onLongPress,
}: Props) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const trackWidthRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  useEffect(() => {
    return () => {
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) void sound.unloadAsync();
    };
  }, []);

  const onStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMs(status.positionMillis ?? 0);
    if (status.durationMillis) setDurationMs(status.durationMillis);
    if (status.didJustFinish) {
      setPlaying(false);
      setPositionMs(0);
      void soundRef.current?.setPositionAsync(0);
    } else {
      setPlaying(status.isPlaying);
    }
  };

  const ensureSound = async () => {
    if (!uri) return null;
    if (soundRef.current) return soundRef.current;
    setLoading(true);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, progressUpdateIntervalMillis: 100 },
        onStatus,
      );
      soundRef.current = sound;
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        setDurationMs(status.durationMillis);
      }
      return sound;
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = async () => {
    if (!uri || pending) return;
    try {
      const sound = await ensureSound();
      if (!sound) return;
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await sound.pauseAsync();
        setPlaying(false);
        return;
      }
      if (
        status.didJustFinish ||
        (status.durationMillis &&
          status.positionMillis >= status.durationMillis - 40)
      ) {
        await sound.setPositionAsync(0);
        setPositionMs(0);
      }
      await sound.playAsync();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setLoading(false);
    }
  };

  const seekTo = async (ratio: number) => {
    const sound = soundRef.current;
    if (!sound || !durationMs) return;
    const next = Math.max(0, Math.min(1, ratio)) * durationMs;
    try {
      await sound.setPositionAsync(next);
      setPositionMs(next);
    } catch {
      /* ignore */
    }
  };

  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;
  const timeLabel =
    playing || positionMs > 0
      ? formatMs(positionMs)
      : durationMs > 0
        ? formatMs(durationMs)
        : "0:00";

  return (
    <View style={[styles.row, { flexDirection: rowDir }]}>
      <Pressable
        onPress={() => void togglePlay()}
        onLongPress={onLongPress}
        delayLongPress={400}
        disabled={pending || !uri || loading}
        hitSlop={8}
        style={styles.playBtn}
      >
        {pending || loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : playing ? (
          <Pause size={18} color={color} fill={color} />
        ) : (
          <Play size={18} color={color} fill={color} />
        )}
      </Pressable>

      <View style={styles.trackBlock}>
        <Pressable
          onLongPress={onLongPress}
          delayLongPress={400}
          onPress={(e) => {
            const x = e.nativeEvent.locationX;
            const w = trackWidthRef.current || 1;
            const ratio = isRTL ? 1 - x / w : x / w;
            void seekTo(ratio);
          }}
          onLayout={(e) => {
            trackWidthRef.current = e.nativeEvent.layout.width;
          }}
          style={[styles.track, { backgroundColor: trackColor }]}
        >
          <View
            style={[
              styles.fill,
              {
                backgroundColor: fillColor,
                width: `${Math.max(progress * 100, playing ? 2 : 0)}%`,
                [isRTL ? "right" : "left"]: 0,
              },
            ]}
          />
          <View
            style={[
              styles.knob,
              {
                backgroundColor: fillColor,
                [isRTL ? "right" : "left"]: `${Math.max(progress * 100 - 2, 0)}%`,
              },
            ]}
          />
        </Pressable>
        <Text style={[styles.time, { color, textAlign: isRTL ? "right" : "left" }]}>
          {pending ? (isRTL ? "جاري الإرسال…" : "Sending…") : timeLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    gap: 10,
    minWidth: 180,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  trackBlock: {
    flex: 1,
    gap: 4,
    minWidth: 120,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: "visible",
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  knob: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    top: -4,
  },
  time: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.85,
  },
});

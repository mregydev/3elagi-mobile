export type SpeechRecognitionAlternative = {
  transcript: string;
  confidence?: number;
};

export type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal?: boolean;
      length?: number;
      [index: number]: SpeechRecognitionAlternative;
    };
  };
};

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isWebSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

function readAlternative(
  result: SpeechRecognitionResultEvent["results"][number],
  altIndex = 0,
): SpeechRecognitionAlternative {
  if (!result) return { transcript: "" };
  const direct = result[altIndex];
  if (direct?.transcript !== undefined) {
    return {
      transcript: direct.transcript,
      confidence: direct.confidence,
    };
  }
  const legacy = (
    result as {
      item?: (index: number) => {
        transcript?: string;
        confidence?: number;
      };
    }
  ).item?.(altIndex);
  return {
    transcript: legacy?.transcript ?? "",
    confidence: legacy?.confidence,
  };
}

function readResultText(
  result: SpeechRecognitionResultEvent["results"][number],
): string {
  return readAlternative(result, 0).transcript;
}

/** Rebuild from the full results array — required for continuous mode. */
function rebuildTranscriptFromEvent(
  event: SpeechRecognitionResultEvent,
  state: { final: string; interim: string },
) {
  let final = "";
  let interim = "";
  for (let i = 0; i < event.results.length; i += 1) {
    const result = event.results[i];
    const text = readResultText(result);
    if (result?.isFinal) {
      final += text;
    } else {
      interim += text;
    }
  }
  state.final = final;
  state.interim = interim;
}

function getFullTranscript(state: { final: string; interim: string }) {
  return (state.final + state.interim).trim();
}

export type WebSpeechSession = {
  getTranscript: () => string;
  /** Stop listening and wait for the browser to flush the final transcript. */
  stop: () => Promise<string>;
  abort: () => void;
};

export function createWebSpeechSession(options: {
  lang: string;
  continuous?: boolean;
  onStart?: () => void;
  /** Called as transcript grows (final + interim) — UI preview only. */
  onTranscript?: (text: string) => void;
  /** Fired when the browser ends the session on its own (non-continuous pause). */
  onNaturalEnd?: (text: string) => void;
  /** Fired when recognition ends (including after explicit stop completes). */
  onEnd?: () => void;
  onError: (message: string) => void;
}): WebSpeechSession | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = options.lang;
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = true;

  const transcriptState = { final: "", interim: "" };
  let stopPromise: Promise<string> | null = null;
  let explicitlyStopped = false;

  const notifyTranscript = () => {
    options.onTranscript?.(getFullTranscript(transcriptState));
  };

  recognition.onstart = () => options.onStart?.();

  // Do NOT attach onspeechstart / onsoundstart — they fire on non-speech noise.
  recognition.onresult = (event) => {
    rebuildTranscriptFromEvent(event, transcriptState);
    notifyTranscript();
  };

  recognition.onerror = (event) => {
    options.onError(event.error ?? "Speech recognition failed");
  };

  recognition.onend = () => {
    if (!explicitlyStopped) {
      options.onNaturalEnd?.(getFullTranscript(transcriptState));
    }
    options.onEnd?.();
  };

  const stop = (): Promise<string> => {
    if (stopPromise) return stopPromise;

    explicitlyStopped = true;
    stopPromise = new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve(getFullTranscript(transcriptState));
      };

      const prevOnResult = recognition.onresult;
      const prevOnEnd = recognition.onend;

      recognition.onresult = (event) => {
        prevOnResult?.(event);
      };

      recognition.onend = () => {
        prevOnEnd?.();
        options.onEnd?.();
        setTimeout(finish, 150);
      };

      try {
        recognition.stop();
      } catch {
        finish();
        return;
      }

      setTimeout(finish, 2500);
    });

    return stopPromise;
  };

  const abort = () => {
    explicitlyStopped = true;
    try {
      recognition.abort();
    } catch {
      /* ignore */
    }
  };

  recognition.start();

  return { getTranscript: () => getFullTranscript(transcriptState), stop, abort };
}

/** @deprecated Use createWebSpeechSession. Kept for compatibility. */
export function startWebSpeechRecognition(options: {
  lang: string;
  continuous?: boolean;
  onStart?: () => void;
  onResult: (text: string) => void;
  onError: (message: string) => void;
  onEnd?: () => void;
}): SpeechRecognitionLike | null {
  const session = createWebSpeechSession({
    lang: options.lang,
    continuous: options.continuous,
    onStart: options.onStart,
    onTranscript: options.onResult,
    onError: options.onError,
  });
  if (!session) return null;
  return { stop: () => void session.stop(), abort: () => session.abort() };
}

export function stopWebSpeechRecognition(
  recognition: SpeechRecognitionLike | null,
) {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch {
    try {
      recognition.abort();
    } catch {
      /* ignore */
    }
  }
}

export class WebMediaRecorderSession {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.start();
  }

  async stop(): Promise<{ blob: Blob; mimeType: string }> {
    const recorder = this.recorder;
    const stream = this.stream;
    if (!recorder) throw new Error("Recorder not started");

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        stream?.getTracks().forEach((track) => track.stop());
        const mimeType = recorder.mimeType || "audio/webm";
        resolve({
          blob: new Blob(this.chunks, { type: mimeType }),
          mimeType,
        });
      };
      recorder.onerror = () => reject(new Error("Recording failed"));
      recorder.stop();
    });
  }
}

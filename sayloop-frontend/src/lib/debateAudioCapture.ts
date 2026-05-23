/** In-memory debate audio for Whisper transcription (not stored in sessionStorage). */

const MIN_AUDIO_BYTES = 256;

let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let activeSessionId: string | null = null;
let mimeType = 'audio/webm';

function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return 'audio/webm';
}

/** MIME without codecs=opus for uploads (Whisper + some proxies). */
export function normalizeAudioMime(type: string): string {
  const base = (type || 'audio/webm').split(';')[0].trim();
  return base.startsWith('audio/') ? base : 'audio/webm';
}

function buildBlob(): Blob | null {
  if (chunks.length === 0) return null;
  const type = normalizeAudioMime(mimeType);
  const blob = new Blob(chunks, { type });
  return blob.size >= MIN_AUDIO_BYTES ? blob : null;
}

export function startDebateRecording(sessionId: string, stream: MediaStream) {
  const audioTracks = stream.getAudioTracks();
  if (!audioTracks.length) {
    console.warn('[debate-audio] no audio tracks on stream');
    return;
  }

  stopDebateRecordingSync();
  activeSessionId = String(sessionId);
  chunks = [];
  mimeType = pickMimeType();

  const audioOnly = new MediaStream(audioTracks);
  try {
    mediaRecorder = new MediaRecorder(audioOnly, { mimeType });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.start(1000);
  } catch (err) {
    console.warn('[debate-audio] could not start recorder', err);
    mediaRecorder = null;
  }
}

function stopDebateRecordingSync() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      if (mediaRecorder.state === 'recording') {
        try {
          mediaRecorder.requestData();
        } catch {
          /* ignore */
        }
      }
      mediaRecorder.stop();
    } catch {
      /* ignore */
    }
  }
  mediaRecorder = null;
}

export function getRecordedBlobSync(): Blob | null {
  return buildBlob();
}

export function stopDebateRecording(): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      const blob = buildBlob();
      chunks = [];
      mediaRecorder = null;
      activeSessionId = null;
      resolve(blob);
      return;
    }

    const recorder = mediaRecorder;
    const finish = () => {
      const blob = buildBlob();
      chunks = [];
      mediaRecorder = null;
      activeSessionId = null;
      resolve(blob);
    };

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      finish();
    };

    recorder.onstop = done;

    try {
      if (recorder.state === 'recording') {
        try {
          recorder.requestData();
        } catch {
          /* ignore */
        }
      }
      recorder.stop();
    } catch {
      done();
    }

    window.setTimeout(done, 2500);
  });
}

export function getActiveRecordingSessionId() {
  return activeSessionId;
}

/** In-memory debate audio for Whisper transcription (not stored in sessionStorage). */

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

export function startDebateRecording(sessionId: string, stream: MediaStream) {
  const audioTracks = stream.getAudioTracks();
  if (!audioTracks.length) return;

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
    mediaRecorder.start(2500);
  } catch (err) {
    console.warn('[debate-audio] could not start recorder', err);
    mediaRecorder = null;
  }
}

function stopDebateRecordingSync() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch {
      /* ignore */
    }
  }
  mediaRecorder = null;
}

export function stopDebateRecording(): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      const blob =
        chunks.length > 0 ? new Blob(chunks, { type: mimeType }) : null;
      chunks = [];
      activeSessionId = null;
      resolve(blob && blob.size > 800 ? blob : null);
      return;
    }

    const recorder = mediaRecorder;
    recorder.onstop = () => {
      const blob = chunks.length > 0 ? new Blob(chunks, { type: mimeType }) : null;
      chunks = [];
      mediaRecorder = null;
      activeSessionId = null;
      resolve(blob && blob.size > 800 ? blob : null);
    };

    try {
      recorder.stop();
    } catch {
      resolve(null);
    }
  });
}

export function getActiveRecordingSessionId() {
  return activeSessionId;
}

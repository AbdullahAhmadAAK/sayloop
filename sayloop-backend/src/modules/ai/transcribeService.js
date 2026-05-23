const OpenAI = require('openai');
const { toFile } = require('openai/uploads');

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === 'your_key_here') {
    return null;
  }
  return new OpenAI({ apiKey: key });
}

function normalizeMimeType(mimeType) {
  const base = String(mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
  if (base === 'audio/webm' || base === 'audio/mp4' || base === 'audio/mpeg' || base === 'audio/wav') {
    return base;
  }
  if (base.startsWith('audio/')) return base;
  return 'audio/webm';
}

function extensionForMime(mime) {
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
}

/**
 * @param {Buffer} buffer
 * @param {string} mimeType
 */
async function transcribeDebateAudio(buffer, mimeType = 'audio/webm') {
  const openai = getOpenAI();
  if (!openai) {
    const err = new Error(
      'Speech analysis is unavailable: OPENAI_API_KEY is not set on the server. Add it to AWS .env and restart the backend.',
    );
    err.status = 503;
    throw err;
  }

  if (!buffer || buffer.length < 256) {
    return { text: '', source: 'empty' };
  }

  const mime = normalizeMimeType(mimeType);
  const ext = extensionForMime(mime);
  const file = await toFile(buffer, `debate.${ext}`, { type: mime });

  try {
    const result = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
    });

    const text = (result.text || '').trim();
    return { text, source: 'whisper' };
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('Invalid file format') || msg.includes('corrupted')) {
      const err2 = new Error(
        'Could not read the debate recording. Try Chrome/Edge, allow the microphone, and speak for the full minute.',
      );
      err2.status = 400;
      throw err2;
    }
    const err3 = new Error(`Whisper transcription failed: ${msg}`);
    err3.status = 502;
    throw err3;
  }
}

function isOpenAIConfigured() {
  return Boolean(getOpenAI());
}

module.exports = { transcribeDebateAudio, isOpenAIConfigured, normalizeMimeType };

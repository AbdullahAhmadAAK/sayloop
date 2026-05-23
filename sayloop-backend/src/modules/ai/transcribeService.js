const OpenAI = require('openai');
const { toFile } = require('openai/uploads');

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/**
 * @param {Buffer} buffer
 * @param {string} mimeType
 */
async function transcribeDebateAudio(buffer, mimeType = 'audio/webm') {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OPENAI_API_KEY is not configured on the server');
  }

  if (!buffer || buffer.length < 800) {
    return { text: '', source: 'empty' };
  }

  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const file = await toFile(buffer, `debate.${ext}`, { type: mimeType });

  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  });

  const text = (result.text || '').trim();
  return { text, source: 'whisper' };
}

module.exports = { transcribeDebateAudio };

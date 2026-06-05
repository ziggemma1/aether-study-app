import api from './api.js';

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const response = await api.post('/materials/speech', { text });
    return response.data.audio || null;
  } catch (error) {
    console.error("Error generating speech client-side:", error);
    return null;
  }
}

export function playAudio(base64Data: string) {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  audioContext.decodeAudioData(bytes.buffer, (buffer) => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  }, (e) => {
    console.error("Error decoding audio data:", e);
  });
}

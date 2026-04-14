import { GoogleGenAI } from "@google/genai";

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = (ai as any).getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Read this summary clearly: ${text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const response = await result.response;
    const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (audioPart?.inlineData?.data) {
      return audioPart.inlineData.data;
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
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
    console.error("Error decoding audio data", e);
  });
}

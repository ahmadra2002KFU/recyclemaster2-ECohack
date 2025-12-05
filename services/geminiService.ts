import { GoogleGenAI, Type, GenerateContentResponse, LiveSession, LiveServerMessage, Modality, Blob } from "@google/genai";
import { decode, encode, decodeAudioData } from '../utils/audioUtils';

let ai: GoogleGenAI;
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export async function getDeviceSettingsForMaterial(prompt: string, imageBase64?: string): Promise<{ temperature: number; extrusionSpeed: number; shredderSpeed: number; pullingSpeed: number; }> {
  if (!ai) throw new Error("API key not configured.");
  
  const parts: any[] = [{ text: prompt }];

  if (imageBase64) {
    parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            systemInstruction: `You are an expert AI for a material recycling machine called RecycleMaster. Your task is to determine the optimal settings for recycling a given material. Analyze the user's text description and/or image. Respond ONLY with a JSON object with the keys "temperature" (in Celsius, integer), "extrusionSpeed" (as a percentage, integer 0-100), "shredderSpeed" (as a percentage, integer 0-100), and "pullingSpeed" (as a percentage, integer 0-100). Do not add any other text or markdown formatting. Example material: PLA plastic. Example response: {"temperature": 210, "extrusionSpeed": 45, "shredderSpeed": 60, "pullingSpeed": 50}`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    temperature: { type: Type.INTEGER, description: 'Melting temperature in Celsius' },
                    extrusionSpeed: { type: Type.INTEGER, description: 'Extrusion speed as a percentage' },
                    shredderSpeed: { type: Type.INTEGER, description: 'Shredder speed as a percentage' },
                    pullingSpeed: { type: Type.INTEGER, description: 'Pulling speed as a percentage' }
                },
                required: ['temperature', 'extrusionSpeed', 'shredderSpeed', 'pullingSpeed']
            },
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error getting device settings from Gemini:", error);
    throw new Error("Failed to get AI-powered settings. Please try again.");
  }
}

export class LiveChatSession {
    private sessionPromise: Promise<LiveSession> | null = null;
    private inputAudioContext: AudioContext | null = null;
    private outputAudioContext: AudioContext | null = null;
    private nextStartTime = 0;
    private audioSources = new Set<AudioBufferSourceNode>();

    connect(onMessage: (message: LiveServerMessage) => void, onError: (e: ErrorEvent) => void, onClose: (e: CloseEvent) => void, onOpen:()=>void) {
        if (!ai) throw new Error("API key not configured.");
        if (this.sessionPromise) return;

        // FIX: Cast window to `any` to support vendor-prefixed webkitAudioContext for broader browser compatibility.
        this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        this.sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: async () => {
                    // FIX: Cast window to `any` to support vendor-prefixed webkitAudioContext for broader browser compatibility.
                    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const source = this.inputAudioContext.createMediaStreamSource(stream);
                    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = this.createPcmBlob(inputData);
                        this.sessionPromise?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(this.inputAudioContext.destination);
                    onOpen();
                },
                onmessage: async (message: LiveServerMessage) => {
                    onMessage(message);
                    await this.handleAudio(message);
                    if (message.serverContent?.interrupted) {
                       this.interruptAudio();
                    }
                },
                onerror: onError,
                onclose: onClose,
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction: 'You are a friendly and helpful AI assistant for 3D printing and filament recycling. Keep your answers concise and helpful.',
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
        });
    }
    
    private createPcmBlob(data: Float32Array): Blob {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    }

    private async handleAudio(message: LiveServerMessage) {
      if (!this.outputAudioContext) return;
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
        if (base64Audio) {
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputAudioContext.destination);
            source.addEventListener('ended', () => {
                this.audioSources.delete(source);
            });
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.audioSources.add(source);
        }
    }
    
    private interruptAudio() {
        for (const source of this.audioSources.values()) {
            source.stop();
            this.audioSources.delete(source);
        }
        this.nextStartTime = 0;
    }

    async disconnect() {
        const session = await this.sessionPromise;
        session?.close();
        this.inputAudioContext?.close();
        this.outputAudioContext?.close();
        this.sessionPromise = null;
        this.interruptAudio();
    }
}

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Activity, Radio, Volume2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array, PCM_SAMPLE_RATE, OUTPUT_SAMPLE_RATE } from '../utils/audioUtils';

interface VoiceAgentProps {
  contextDescription: string; // Context about what the user is seeing
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ contextDescription }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null); // To store the active session
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Helper to stop all audio
  const stopAudio = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    
    // Stop playing audio
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close session
    if (sessionRef.current) {
       // There isn't a direct close method exposed on the session object easily in all versions, 
       // but disconnecting the audio context effectively kills the loop.
       // We rely on re-creating the connection next time.
       sessionRef.current = null;
    }
  };

  const startSession = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      const apiKey = process.env.API_KEY || '';
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });

      // 1. Setup Audio Output Context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      
      // 2. Setup Audio Input
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: PCM_SAMPLE_RATE });
      const inputCtx = inputContextRef.current;
      const source = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Use ScriptProcessor for raw PCM access (standard for Gemini Live demos)
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // 3. Connect to Gemini Live
      const systemInstruction = `
        Anda adalah "Lumina", asisten suara profesional untuk sistem ERP.
        Berbicaralah dalam Bahasa Indonesia yang fasih, sopan, dan bernada profesional (seperti konsultan bisnis eksekutif).
        Tugas Anda adalah menjelaskan apa yang ada di layar pengguna dan memberikan wawasan strategis.
        Jawablah dengan ringkas, padat, dan langsung pada intinya (cocok untuk interaksi suara).
        
        Konteks Pengguna Saat Ini:
        ${contextDescription}
        
        Jika pengguna bertanya "Apa ini?", jelaskan berdasarkan konteks di atas.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setIsConnecting(false);
            setIsActive(true);

            // Start processing microphone data
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Response
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio) {
              setIsSpeaking(true);
              if (!audioContextRef.current) return;
              
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                base64ToUint8Array(base64Audio),
                ctx,
                OUTPUT_SAMPLE_RATE
              );

              const sourceNode = ctx.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(ctx.destination);
              
              sourceNode.addEventListener('ended', () => {
                sourcesRef.current.delete(sourceNode);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              });

              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(sourceNode);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(node => node.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            console.log("Session Closed");
            handleDisconnect();
          },
          onerror: (err) => {
            console.error("Session Error", err);
            setError("Koneksi terputus.");
            handleDisconnect();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start voice agent:", err);
      setError("Gagal mengakses mikrofon atau API.");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    stopAudio();
    setIsActive(false);
    setIsConnecting(false);
    setIsSpeaking(false);
  };

  const toggleSession = () => {
    if (isActive || isConnecting) {
      handleDisconnect();
    } else {
      startSession();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Update System Instruction if context changes while active (Re-connection would be ideal for full context switch, 
  // but for now we rely on the user asking about the new screen or simply restarting the session if major context shifts).
  // Note: Gemini Live currently doesn't support updating system instruction mid-session easily without sending a text prompt to update context.
  // We will assume the user starts the agent on the screen they want to discuss.

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-rose-500/90 text-white px-4 py-2 rounded-lg text-sm shadow-lg animate-fade-in mb-2">
          {error}
        </div>
      )}

      {/* Visualizer Panel (When Active) */}
      {isActive && (
        <div className="bg-slate-900/90 backdrop-blur-md border border-indigo-500/30 p-4 rounded-2xl shadow-2xl w-72 animate-slide-up">
           <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                 <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-500'}`}></div>
                    {isSpeaking && <div className="absolute top-0 left-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>}
                 </div>
                 <span className="text-indigo-100 font-semibold text-sm">Lumina AI Live</span>
              </div>
              <button onClick={handleDisconnect} className="text-slate-400 hover:text-white">
                 <X className="w-4 h-4" />
              </button>
           </div>
           
           <div className="h-16 bg-slate-800/50 rounded-lg flex items-center justify-center overflow-hidden relative">
              {isSpeaking ? (
                <div className="flex items-center space-x-1 h-8">
                   {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-1 bg-indigo-400 rounded-full animate-visualizer" style={{
                         height: `${Math.random() * 100}%`,
                         animationDuration: `${0.2 + Math.random() * 0.3}s`
                      }}></div>
                   ))}
                </div>
              ) : (
                 <div className="text-xs text-slate-500 font-medium flex items-center">
                    <Volume2 className="w-3 h-3 mr-2" /> Mendengarkan...
                 </div>
              )}
           </div>
           
           <div className="mt-3 text-[10px] text-slate-400 text-center leading-tight">
              Berbicara dalam Bahasa Indonesia. Tanyakan tentang data di layar ini.
           </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={toggleSession}
        disabled={isConnecting}
        className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${
           isActive 
             ? 'bg-rose-500 hover:bg-rose-600 rotate-0' 
             : 'bg-gradient-to-br from-indigo-600 to-blue-600 hover:scale-110'
        }`}
      >
        {isActive ? (
           <MicOff className="w-6 h-6 text-white" />
        ) : (
           <>
             {isConnecting ? (
               <Activity className="w-6 h-6 text-white animate-spin" />
             ) : (
               <Radio className="w-6 h-6 text-white" />
             )}
             
             {/* Pulse Effect when idle */}
             {!isActive && !isConnecting && (
                <span className="absolute w-full h-full rounded-full bg-indigo-500 opacity-20 animate-ping group-hover:opacity-40"></span>
             )}
           </>
        )}
      </button>
    </div>
  );
};

export default VoiceAgent;
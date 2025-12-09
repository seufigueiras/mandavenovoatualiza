import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { DEMO_RESTAURANT_ID } from '../constants';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  restaurantId: string;
  isLoading: boolean;
  signOut: () => Promise<void>;
  playNewOrderAlert: () => void;
  stopAlert: () => void;
  audioEnabled: boolean;
  enableAudio: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  restaurantId: DEMO_RESTAURANT_ID,
  isLoading: true,
  signOut: async () => {},
  playNewOrderAlert: () => {},
  stopAlert: () => {},
  audioEnabled: false,
  enableAudio: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>(DEMO_RESTAURANT_ID);
  const [isLoading, setIsLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Habilitar áudio (chamado quando usuário clica)
  const enableAudio = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Toca um bip de confirmação (som mais agudo e alto)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1200; // Mais agudo
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.6, audioContext.currentTime); // Mais alto
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
      
      setAudioEnabled(true);
    } catch (e) {
      console.log("Erro ao habilitar áudio:", e);
    }
  };

  // Função para tocar alerta (repete a cada 5 segundos)
  const playNewOrderAlert = () => {
    if (!audioEnabled) return;

    if (intervalRef.current) {
      return;
    }

    // Função para tocar o bip (estilo toque de telefone clássico)
    const playBeep = () => {
      try {
        const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioContext.currentTime;
        
        // Padrão de telefone: dois tons alternados rapidamente
        const createPhoneRing = (startTime: number) => {
          // Tom ALTO (1000Hz)
          const osc1 = audioContext.createOscillator();
          const gain1 = audioContext.createGain();
          osc1.connect(gain1);
          gain1.connect(audioContext.destination);
          osc1.frequency.value = 1000;
          osc1.type = 'sine';
          gain1.gain.setValueAtTime(1.0, startTime);
          gain1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
          osc1.start(startTime);
          osc1.stop(startTime + 0.15);
          
          // Tom BAIXO (700Hz) - sobreposto criando efeito
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.value = 700;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(1.0, startTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
          osc2.start(startTime);
          osc2.stop(startTime + 0.15);
        };
        
        // 6 rings de telefone (tipo DRRRIIING! DRRRIIING! DRRRIIING!)
        createPhoneRing(now);           // Ring 1
        createPhoneRing(now + 0.25);    // Ring 2
        createPhoneRing(now + 0.5);     // Ring 3
        createPhoneRing(now + 0.75);    // Ring 4
        createPhoneRing(now + 1.0);     // Ring 5
        createPhoneRing(now + 1.25);    // Ring 6
        
      } catch (e) {
        console.log("Erro ao tocar áudio:", e);
      }
    };

    // Toca uma primeira vez
    playBeep();

    // Repete a cada 5 segundos
    intervalRef.current = setInterval(() => {
      if (audioEnabled) {
        playBeep();
      }
    }, 5000);
  };

  // Função para parar o alerta
  const stopAlert = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setRestaurantId(DEMO_RESTAURANT_ID);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setRestaurantId(DEMO_RESTAURANT_ID);
      } else {
        stopAlert();
      }
    });

    return () => {
      subscription.unsubscribe();
      stopAlert();
    };
  }, []);

  const signOut = async () => {
    stopAlert();
    await supabase.auth.signOut();
    setRestaurantId(DEMO_RESTAURANT_ID);
  };

  return (
    <AuthContext.Provider value={{ session, restaurantId, isLoading, signOut, playNewOrderAlert, stopAlert, audioEnabled, enableAudio }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
import { useState, useCallback, useEffect } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

const LANG_MAP: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  mg: 'fr-FR', // Malagasy not natively supported, fallback to French
};

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript || '';
    setTranscript(text);
    if (event.isFinal) {
      setIsListening(false);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setError(event.error);
    setIsListening(false);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  const startListening = useCallback(async (lang: string = 'fr') => {
    try {
      setError(null);
      setTranscript('');

      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        setError('permission_denied');
        return;
      }

      const mappedLang = LANG_MAP[lang] || 'fr-FR';

      ExpoSpeechRecognitionModule.start({
        lang: mappedLang,
        interimResults: true,
        requiresOnDeviceRecognition: false,
      });

      setIsListening(true);
    } catch (err) {
      setError('start_failed');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Ignore stop errors
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

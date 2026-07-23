import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const VoiceInputButton = ({ 
  onInterimTranscript, 
  onFinalTranscript, 
  onTranscript,
  onError, 
  disabled = false 
}) => {
  const { language } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  
  // Refs for callbacks
  const onInterimRef = useRef(onInterimTranscript);
  const onFinalRef = useRef(onFinalTranscript || onTranscript);
  const onErrorRef = useRef(onError);
  const languageRef = useRef(language);

  useEffect(() => {
    onInterimRef.current = onInterimTranscript;
    onFinalRef.current = onFinalTranscript || onTranscript;
    onErrorRef.current = onError;
    languageRef.current = language;
  }, [onInterimTranscript, onFinalTranscript, onTranscript, onError, language]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
    
    return () => {
      stopRecording();
    };
  }, []);

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (onInterimRef.current) {
      onInterimRef.current('');
    }
  };

  const startRecognition = (isRetry = false) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Create a completely fresh instance on every start to prevent Chrome state bugs
    const rec = new SpeechRecognition();
    // Fall back to single-shot recognition if retrying after a network error
    rec.continuous = !isRetry;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    
    const lang = languageRef.current;
    if (lang === 'ta') {
      rec.lang = 'ta-IN';
    } else if (lang === 'hi') {
      rec.lang = 'hi-IN';
    } else {
      rec.lang = 'en-IN';
    }

    rec.onstart = () => {
      console.log(`SpeechRecognition: started (continuous=${!isRetry})`);
      setIsRecording(true);
      if (onErrorRef.current) onErrorRef.current('');
    };

    rec.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      console.log(`SpeechRecognition: result - interim: "${interimTranscript}", final: "${finalTranscript}"`);
      
      if (onInterimRef.current) {
        onInterimRef.current(interimTranscript);
      }
      
      if (finalTranscript && onFinalRef.current) {
        onFinalRef.current(finalTranscript);
      }

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      if ((finalTranscript || interimTranscript).trim().length > 0) {
        silenceTimerRef.current = setTimeout(() => {
          stopRecording();
        }, 3000);
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopRecording();
      
      // If continuous mode fails with a network error, try retrying once in single-shot mode
      if (event.error === 'network' && !isRetry) {
        console.warn('Network error in continuous mode. Attempting speech recognition in single-shot mode...');
        setTimeout(() => {
          startRecognition(true);
        }, 300);
        return;
      }
      
      if (onErrorRef.current) {
        if (event.error === 'not-allowed') {
          onErrorRef.current('Microphone access denied. Please check permissions.');
        } else if (event.error === 'network') {
          onErrorRef.current('Network error: Browser speech services are unavailable. Please use text input.');
        } else if (event.error === 'no-speech') {
          // Ignore
        } else {
          onErrorRef.current(`Voice Error: ${event.error}`);
        }
      }
    };

    rec.onend = () => {
      stopRecording();
    };

    recognitionRef.current = rec;

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Failed to start speech recognition", e);
      stopRecording();
    }
  };

  const handleToggleRecord = () => {
    if (onErrorRef.current) onErrorRef.current('');
    
    if (isRecording) {
      stopRecording();
      return;
    }
    
    startRecognition(false);
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className="px-3 py-2.5 rounded-full bg-surfaceVariant text-onSurfaceVariant/40 cursor-not-allowed flex items-center justify-center transition-all"
        title="Voice input unsupported"
      >
        <Mic className="w-[18px] h-[18px]" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggleRecord}
      disabled={disabled && !isRecording}
      className={`px-3 py-2.5 rounded-full flex items-center justify-center transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        isRecording
          ? 'bg-error text-onError animate-pulse shadow-sm min-w-[70px] gap-1.5'
          : 'bg-surfaceVariant hover:bg-surfaceVariant/80 text-onSurface shadow-sm'
      }`}
      aria-label={isRecording ? "Stop recording voice" : "Start recording voice"}
      title={isRecording ? "Click to stop recording" : "Click to speak"}
    >
      {isRecording ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current" />
          <span className="text-xs font-bold font-sans uppercase tracking-wider">Stop</span>
        </>
      ) : (
        <Mic className="w-[18px] h-[18px]" />
      )}
    </button>
  );
};

export default VoiceInputButton;


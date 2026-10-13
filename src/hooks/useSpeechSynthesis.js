import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing Web Speech API SpeechSynthesis
 * with Telugu voice detection, fallback handling, sequential step speech,
 * and play/pause/resume/stop lifecycle management.
 */
export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [hasTeluguVoice, setHasTeluguVoice] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [rate, setRate] = useState(0.95); // Slightly deliberate speed for clear learning

  // Keep references to prevent garbage collection of utterances
  const utteranceRef = useRef(null);
  const stepsQueueRef = useRef([]);
  const currentStepRef = useRef(0);

  // Check browser support and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);

        // Find Telugu voice (te-IN or te)
        const teluguVoice = available.find(
          (v) => v.lang === 'te-IN' || v.lang.toLowerCase().startsWith('te')
        );

        // Indian English voice fallback
        const indianEnglishVoice = available.find(
          (v) => v.lang === 'en-IN' || (v.lang.startsWith('en') && v.name.includes('India'))
        );

        // General fallback
        const defaultVoice = available.find((v) => v.default) || available[0] || null;

        if (teluguVoice) {
          setHasTeluguVoice(true);
          setSelectedVoice(teluguVoice);
        } else {
          setHasTeluguVoice(false);
          // Default to Indian English or system default if Telugu voice is missing
          setSelectedVoice(indianEnglishVoice || defaultVoice);
        }
      };

      updateVoices();

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stepsQueueRef.current = [];
    currentStepRef.current = 0;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStepIndex(-1);
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const playQueueItemRef = useRef(null);

  // Internal helper to speak a single item in queue
  const playQueueItem = useCallback(
    (index) => {
      const queue = stepsQueueRef.current;
      if (index >= queue.length) {
        stop();
        return;
      }

      currentStepRef.current = index;
      setCurrentStepIndex(index);

      const item = queue[index];
      const textToSpeak = item.text;

      // Cancel previous utterance
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = 'te-IN';
      }

      utterance.rate = rate;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        // Proceed to next step
        if (stepsQueueRef.current.length > 0 && currentStepRef.current + 1 < stepsQueueRef.current.length) {
          playQueueItemRef.current?.(currentStepRef.current + 1);
        } else {
          stop();
        }
      };

      utterance.onerror = (e) => {
        // 'interrupted' or 'canceled' are expected when user stops
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech synthesis error:', e);
        }
        stop();
      };

      window.speechSynthesis.speak(utterance);
    },
    [selectedVoice, rate, stop]
  );

  playQueueItemRef.current = playQueueItem;

  /**
   * Speak an array of steps or custom text
   * @param {Array<{ stepNumber: number, title: string, explanation: string }> | string} content
   * @param {number} [startAtIndex=0]
   */
  const speak = useCallback(
    (content, startAtIndex = 0) => {
      if (!isSupported || !content) return;

      // Stop any existing speech
      stop();

      let queue = [];
      if (typeof content === 'string') {
        queue = [{ index: 0, text: content }];
      } else if (Array.isArray(content)) {
        queue = content.map((step, idx) => ({
          index: idx,
          text: `Step ${step.stepNumber || idx + 1}. ${step.title}. ${step.explanation}`,
        }));
      }

      if (queue.length === 0) return;

      stepsQueueRef.current = queue;
      setIsPlaying(true);
      setIsPaused(false);

      const validStart = Math.max(0, Math.min(startAtIndex, queue.length - 1));
      playQueueItem(validStart);
    },
    [isSupported, stop, playQueueItem]
  );

  const speakStep = useCallback(
    (step, stepIndex = 0) => {
      if (!step) return;
      speak([{ stepNumber: step.stepNumber || stepIndex + 1, title: step.title, explanation: step.explanation }], 0);
    },
    [speak]
  );

  return {
    isSupported,
    voices,
    hasTeluguVoice,
    selectedVoice,
    setSelectedVoice,
    isPlaying,
    isPaused,
    currentStepIndex,
    rate,
    setRate,
    speak,
    speakStep,
    pause,
    resume,
    stop,
  };
}

export default useSpeechSynthesis;

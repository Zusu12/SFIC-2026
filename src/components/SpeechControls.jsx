import React from 'react';
import { Play, Pause, Square, Volume2, VolumeX, AlertCircle } from 'lucide-react';

export function SpeechControls({
  speech,
  steps,
  disabled = false,
}) {
  const {
    isSupported,
    hasTeluguVoice,
    voices,
    selectedVoice,
    setSelectedVoice,
    isPlaying,
    isPaused,
    rate,
    setRate,
    speak,
    pause,
    resume,
    stop,
    currentStepIndex,
  } = speech;

  if (!isSupported) {
    return (
      <div className="flex items-center space-x-2 text-xs text-[#8B949E] bg-[#161B22] px-3 py-1.5 rounded-md border border-[#30363D]">
        <VolumeX className="w-3.5 h-3.5 text-[#8B949E]" />
        <span>Audio synthesis is not supported on this browser.</span>
      </div>
    );
  }

  const handlePlayToggle = () => {
    if (isPlaying) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      speak(steps, 0);
    }
  };

  const isControlsDisabled = disabled || !steps || steps.length === 0;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-md bg-[#161B22] border border-[#30363D] text-xs">
      {/* Left: Global Audio Playback Buttons */}
      <div className="flex items-center space-x-2">
        {/* Play / Pause Button */}
        <button
          type="button"
          onClick={handlePlayToggle}
          disabled={isControlsDisabled}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-btn font-medium text-xs transition-colors ${
            isControlsDisabled
              ? 'bg-[#238636]/40 text-[#8B949E] cursor-not-allowed'
              : isPlaying && !isPaused
              ? 'bg-[#1C2128] hover:bg-[#30363D]/50 text-[#E6EDF3] border border-[#30363D]'
              : 'bg-[#238636] hover:bg-[#2EA043] text-white'
          }`}
          aria-label={
            isPlaying
              ? isPaused
                ? 'Resume Audio'
                : 'Pause Audio'
              : 'Listen to Explanation (Vinandi)'
          }
        >
          {isPlaying && !isPaused ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Aapandi (Pause)</span>
            </>
          ) : isPlaying && isPaused ? (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Malli Vinandi (Resume)</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Vinandi (Listen)</span>
            </>
          )}
        </button>

        {/* Stop Button */}
        {isPlaying && (
          <button
            type="button"
            onClick={stop}
            className="p-1.5 rounded-btn bg-[#1C2128] hover:bg-[#30363D]/50 text-[#8B949E] hover:text-[#F85149] border border-[#30363D] transition-colors"
            title="Stop Speech"
            aria-label="Stop playback"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Status Indicator */}
        {isPlaying && (
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-[#1C2128] border border-[#30363D] text-[11px] text-[#8B949E]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPaused ? 'bg-[#8B949E]' : 'bg-[#3FB950] animate-pulse'
              }`}
            />
            <span className="text-[#E6EDF3]">
              {isPaused
                ? 'Paused'
                : `Playing Step ${currentStepIndex >= 0 ? currentStepIndex + 1 : 1} of ${
                    steps.length
                  }`}
            </span>
          </div>
        )}
      </div>

      {/* Right: Voice Status & Fallback Picker */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {hasTeluguVoice ? (
          <div className="flex items-center space-x-1 text-[#3FB950] bg-[#1C2128] border border-[#30363D] px-2 py-1 rounded text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950]" />
            <span>Telugu Voice (te-IN)</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-[#8B949E] bg-[#1C2128] border border-[#30363D] px-2 py-1 rounded text-[11px]">
            <AlertCircle className="w-3 h-3 text-[#8B949E]" />
            <span>No Telugu voice. Fallback:</span>
          </div>
        )}

        {/* Voice Selector */}
        {voices.length > 0 && (
          <select
            value={selectedVoice ? selectedVoice.name : ''}
            onChange={(e) => {
              const voice = voices.find((v) => v.name === e.target.value);
              if (voice) setSelectedVoice(voice);
            }}
            disabled={isControlsDisabled}
            className="bg-[#0D1117] text-[#8B949E] hover:text-[#E6EDF3] text-[11px] rounded px-2 py-1 border border-[#30363D] focus:border-[#58A6FF] focus:outline-none max-w-[170px] truncate"
            title="Speech voice selector"
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        )}

        {/* Speed Adjustment */}
        <div className="flex items-center space-x-0.5 bg-[#0D1117] p-0.5 rounded border border-[#30363D] text-[11px]">
          {[0.8, 1.0, 1.2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRate(s)}
              disabled={isControlsDisabled}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                Math.abs(rate - s) < 0.05
                  ? 'bg-[#1C2128] text-[#E6EDF3] font-medium'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpeechControls;

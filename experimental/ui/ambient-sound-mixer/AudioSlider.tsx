import React from "react";
import { AudioSliderProps } from "./types";

export const AudioSlider: React.FC<AudioSliderProps> = ({ label, value, disabled, onChange, testId }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="audio-slider" data-testid={testId ? `${testId}-container` : undefined}>
      <div className="audio-slider-header">
        <span className="audio-slider-label">{label}</span>
        <span className="audio-slider-value" data-testid={testId ? `${testId}-value` : undefined}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        aria-label={label}
        data-testid={testId}
      />
    </div>
  );
};

import React from 'react';
import { AspectRatio, VideoOptions } from '../types';

interface OptionsPanelProps {
  options: VideoOptions;
  setOptions: React.Dispatch<React.SetStateAction<VideoOptions>>;
  disabled: boolean;
}

const OptionButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    disabled: boolean;
    children: React.ReactNode;
}> = ({ onClick, isActive, disabled, children }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive
                    ? 'bg-brand-purple text-white'
                    : 'bg-brand-bg-dark text-brand-text-secondary hover:bg-brand-border'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {children}
        </button>
    );
};

export const OptionsPanel: React.FC<OptionsPanelProps> = ({ options, setOptions, disabled }) => {
  const handleOptionChange = <K extends keyof VideoOptions,>(key: K, value: VideoOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-4 bg-brand-bg-dark rounded-lg">
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">Aspect Ratio</label>
        <div className="flex space-x-2">
            <OptionButton onClick={() => handleOptionChange('aspectRatio', AspectRatio.SIXTEEN_NINE)} isActive={options.aspectRatio === AspectRatio.SIXTEEN_NINE} disabled={disabled}>16:9</OptionButton>
            <OptionButton onClick={() => handleOptionChange('aspectRatio', AspectRatio.NINE_SIXTEEN)} isActive={options.aspectRatio === AspectRatio.NINE_SIXTEEN} disabled={disabled}>9:16</OptionButton>
        </div>
      </div>
    </div>
  );
};
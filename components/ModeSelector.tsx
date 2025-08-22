import React from 'react';
import { GenerationMode } from '../types';

interface ModeSelectorProps {
  mode: GenerationMode;
  setMode: (mode: GenerationMode) => void;
  disabled: boolean;
}

const ModeButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  disabled: boolean;
  children: React.ReactNode;
}> = ({ onClick, isActive, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex-1 ${
      isActive
        ? 'bg-brand-purple text-white'
        : 'bg-brand-bg-dark text-brand-text-secondary hover:bg-brand-border'
    } disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode, disabled }) => {
  return (
    <div className="mb-6">
       <div className="flex w-full max-w-xs mx-auto p-1 bg-brand-bg-dark rounded-lg border border-brand-border">
          <ModeButton onClick={() => setMode(GenerationMode.SINGLE)} isActive={mode === GenerationMode.SINGLE} disabled={disabled}>Single Scene</ModeButton>
          <ModeButton onClick={() => setMode(GenerationMode.STORYBOARD)} isActive={mode === GenerationMode.STORYBOARD} disabled={disabled}>Storyboard</ModeButton>
        </div>
    </div>
  );
};

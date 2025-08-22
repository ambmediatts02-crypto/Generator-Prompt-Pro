import React from 'react';
import { DirectorStyle } from '../types';

interface DirectorStyleSelectorProps {
  currentStyle: DirectorStyle;
  setStyle: (style: DirectorStyle) => void;
  disabled: boolean;
}

const styleOptions: { style: DirectorStyle; label: string }[] = [
    { style: DirectorStyle.NONE, label: 'Default' },
    { style: DirectorStyle.CINEMATIC_NOIR, label: 'Cinematic Noir' },
    { style: DirectorStyle.VIBRANT_ENERGETIC, label: 'Vibrant & Energetic' },
    { style: DirectorStyle.DREAMY_ETHEREAL, label: 'Dreamy & Ethereal' },
    { style: DirectorStyle.GRITTY_REALISTIC, label: 'Gritty & Realistic' },
    { style: DirectorStyle.EPIC_SWEEPING, label: 'Epic & Sweeping' },
];

export const DirectorStyleSelector: React.FC<DirectorStyleSelectorProps> = ({ currentStyle, setStyle, disabled }) => {
    return (
        <div>
            <h2 className="text-xl font-semibold text-brand-text mb-2">3. Choose Director's Style (Optional)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {styleOptions.map(({ style, label }) => (
                    <button
                        key={style}
                        onClick={() => setStyle(style)}
                        disabled={disabled}
                        className={`p-3 text-sm text-center font-medium rounded-md transition-all duration-200 ${
                            currentStyle === style
                                ? 'bg-brand-purple text-white ring-2 ring-offset-2 ring-offset-brand-bg-light ring-brand-purple'
                                : 'bg-brand-bg-dark text-brand-text-secondary hover:bg-brand-border'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                       {label}
                    </button>
                ))}
            </div>
        </div>
    );
};
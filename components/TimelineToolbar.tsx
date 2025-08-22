
import React from 'react';
import { ScissorsIcon, MoveIcon } from './icons';

interface TimelineToolbarProps {
    activeTool: 'select' | 'split';
    onSetTool: (tool: 'select' | 'split') => void;
}

const ToolButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ label, isActive, onClick, children }) => (
    <button
        onClick={onClick}
        title={label}
        className={`p-2 rounded-md transition-colors ${isActive ? 'bg-brand-purple text-white' : 'text-brand-text-secondary hover:bg-brand-border'}`}
    >
        {children}
    </button>
);

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({ activeTool, onSetTool }) => {
    return (
        <header className="p-2 border-b border-brand-border flex items-center justify-between">
            <h4 className="text-sm font-semibold text-brand-text-secondary">Timeline</h4>
            <div className="flex items-center gap-2">
                <ToolButton label="Select Tool" isActive={activeTool === 'select'} onClick={() => onSetTool('select')}>
                    <MoveIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton label="Split Tool (Razor)" isActive={activeTool === 'split'} onClick={() => onSetTool('split')}>
                    <ScissorsIcon className="w-5 h-5" />
                </ToolButton>
            </div>
        </header>
    );
};

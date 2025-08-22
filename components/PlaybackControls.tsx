
import React from 'react';
import { PlayIcon, PauseIcon, RewindIcon } from './icons';

interface PlaybackControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onRewind: () => void;
    currentTime: number;
    duration: number;
}

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time * 100) % 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ isPlaying, onPlayPause, onRewind, currentTime, duration }) => {
    return (
        <div className="flex items-center gap-4 bg-brand-bg-dark/50 px-4 py-2 rounded-lg border border-brand-border">
            <button onClick={onRewind} title="Go to Start" className="p-2 text-brand-text-secondary hover:text-white transition-colors">
                <RewindIcon className="w-5 h-5" />
            </button>
            <button onClick={onPlayPause} title={isPlaying ? "Pause" : "Play"} className="p-2 bg-brand-purple text-white rounded-full hover:bg-brand-purple-light transition-colors">
                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
            <div className="text-sm font-mono text-brand-text-secondary">
                <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
};

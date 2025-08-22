
import React from 'react';
import { ZoomInIcon, ZoomOutIcon } from './icons';

interface TimelineZoomControlProps {
    zoom: number; // 0 to 1
    setZoom: (zoom: number) => void;
}

export const TimelineZoomControl: React.FC<TimelineZoomControlProps> = ({ zoom, setZoom }) => {
    return (
        <div className="absolute bottom-4 right-4 bg-brand-bg-light/80 backdrop-blur-sm p-2 rounded-lg border border-brand-border flex items-center gap-2 shadow-lg">
            <button
                onClick={() => setZoom(Math.max(0, zoom - 0.1))}
                className="p-1 rounded-md text-brand-text-secondary hover:bg-brand-border"
                title="Zoom Out"
            >
                <ZoomOutIcon className="w-5 h-5" />
            </button>
            <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-24 h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-purple"
            />
            <button
                onClick={() => setZoom(Math.min(1, zoom + 0.1))}
                className="p-1 rounded-md text-brand-text-secondary hover:bg-brand-border"
                title="Zoom In"
            >
                <ZoomInIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

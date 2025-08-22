

import React from 'react';
import type { MediaAsset, TimelineClip } from '../types';
import { ClapperboardIcon, MusicNoteIcon, FlipHorizontalIcon, FlipVerticalIcon, TrashIcon } from './icons';

interface InspectorPanelProps {
    clip: TimelineClip;
    asset: MediaAsset;
    onUpdateClip: (id: string, updates: Partial<TimelineClip>) => void;
    onUpdateClipDuration: (id: string, duration: number) => void;
    onDeleteClip: () => void;
}

const SliderControl: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    displayFormatter?: (value: number) => string;
}> = ({ label, value, onChange, min = 0, max = 1, step = 0.01, displayFormatter = (val) => `${Math.round(val * 100)}%` }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-brand-text-secondary">{label}</label>
            <span className="text-xs font-mono bg-brand-bg-dark px-1.5 py-0.5 rounded">{displayFormatter(value)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-purple"
        />
    </div>
);

const NumberInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    step?: number;
    className?: string;
}> = ({ label, value, onChange, step = 1, className="" }) => (
    <div className={`flex-1 ${className}`}>
        <label className="text-xs font-medium text-brand-text-secondary">{label}</label>
        <input
            type="number"
            step={step}
            value={value.toFixed(2)}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full p-1 mt-1 bg-brand-bg-dark border border-brand-border rounded-md text-sm text-center"
        />
    </div>
);


export const InspectorPanel: React.FC<InspectorPanelProps> = ({ clip, asset, onUpdateClip, onUpdateClipDuration, onDeleteClip }) => {
    
    const handleTransformChange = (transformUpdates: Partial<TimelineClip['transform']>) => {
        onUpdateClip(clip.id, {
            transform: {
                ...clip.transform,
                ...transformUpdates,
            },
        });
    };

    const handlePositionChange = (axis: 'x' | 'y', value: number) => {
        onUpdateClip(clip.id, {
            transform: {
                ...clip.transform,
                position: {
                    ...clip.transform.position,
                    [axis]: value,
                }
            }
        });
    };
    
    const handleFlip = (axis: 'horizontal' | 'vertical') => {
        onUpdateClip(clip.id, {
            transform: {
                ...clip.transform,
                flip: {
                    ...clip.transform.flip,
                    [axis]: !clip.transform.flip[axis],
                }
            }
        });
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
            <div className="space-y-6">
                <div className="flex items-start gap-3">
                     {asset.type === 'VIDEO' || asset.type === 'IMAGE' ? (
                        <ClapperboardIcon className="w-6 h-6 text-brand-purple-light flex-shrink-0 mt-1" />
                     ) : (
                        <MusicNoteIcon className="w-6 h-6 text-brand-purple-light flex-shrink-0 mt-1" />
                     )}
                     <div>
                        <p className="text-sm font-semibold text-brand-text break-all">{asset.name}</p>
                        <p className="text-xs text-brand-text-secondary">{asset.type} / {clip.duration.toFixed(2)}s</p>
                     </div>
                </div>

                <div className="space-y-4">
                    {asset.type === 'IMAGE' && (
                        <NumberInput
                            label="Duration (seconds)"
                            value={clip.duration}
                            onChange={(v) => onUpdateClipDuration(clip.id, Math.max(0.1, v))}
                            step={0.1}
                            className="w-1/2"
                        />
                    )}
                    {asset.type === 'AUDIO' && (
                         <SliderControl
                            label="Volume"
                            value={clip.volume}
                            onChange={(newValue) => onUpdateClip(clip.id, { volume: newValue })}
                        />
                    )}
                </div>
                
                {(asset.type === 'VIDEO' || asset.type === 'IMAGE') && (
                    <>
                        <div className="border-t border-brand-border -mx-4"></div>
                        <div className="space-y-4">
                             <SliderControl
                                label="Volume"
                                value={clip.volume}
                                onChange={(newValue) => onUpdateClip(clip.id, { volume: newValue })}
                            />
                            <SliderControl
                                label="Opacity"
                                value={clip.opacity}
                                onChange={(newValue) => onUpdateClip(clip.id, { opacity: newValue })}
                            />
                        </div>
                        <div className="border-t border-brand-border -mx-4"></div>
                         <details className="group" open>
                            <summary className="text-md font-semibold text-brand-text cursor-pointer list-none flex items-center justify-between">
                                Transformasi
                                <span className="transform transition-transform duration-200 group-open:rotate-90 text-brand-text-secondary">&#9656;</span>
                            </summary>
                            <div className="mt-4 space-y-4">
                                 <SliderControl
                                    label="Skala"
                                    value={clip.transform.scale}
                                    onChange={(newValue) => handleTransformChange({ scale: newValue })}
                                    min={0.1} max={3} step={0.01}
                                    displayFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                />
                                <SliderControl
                                    label="Rotasi"
                                    value={clip.transform.rotation}
                                    onChange={(newValue) => handleTransformChange({ rotation: newValue })}
                                    min={-180} max={180} step={1}
                                    displayFormatter={(val) => `${val.toFixed(0)}°`}
                                />
                                <div className="flex gap-2">
                                    <NumberInput label="Position X" value={clip.transform.position.x} onChange={(v) => handlePositionChange('x', v)} />
                                    <NumberInput label="Position Y" value={clip.transform.position.y} onChange={(v) => handlePositionChange('y', v)} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleFlip('horizontal')} title="Flip Horizontal" className={`flex-1 p-2 rounded-md transition-colors ${clip.transform.flip.horizontal ? 'bg-brand-purple' : 'bg-brand-bg-dark hover:bg-brand-border'}`}><FlipHorizontalIcon className="w-5 h-5 mx-auto" /></button>
                                    <button onClick={() => handleFlip('vertical')} title="Flip Vertical" className={`flex-1 p-2 rounded-md transition-colors ${clip.transform.flip.vertical ? 'bg-brand-purple' : 'bg-brand-bg-dark hover:bg-brand-border'}`}><FlipVerticalIcon className="w-5 h-5 mx-auto" /></button>
                                </div>
                            </div>
                        </details>
                    </>
                )}
            </div>
             <div className="mt-6">
                <button
                    onClick={onDeleteClip}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-red-900/50 text-red-300 rounded-md hover:bg-red-900/80 transition-colors"
                >
                    <TrashIcon className="w-4 h-4" />
                    Hapus Klip
                </button>
            </div>
        </div>
    );
};


import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { TimelineClip, MediaAsset } from '../types';
import { MusicNoteIcon } from './icons';

interface TimeRulerProps {
    duration: number;
    pixelsPerSecond: number;
}

const TimeRuler: React.FC<TimeRulerProps> = ({ duration, pixelsPerSecond }) => {
    const markers = useMemo(() => {
        const newMarkers = [];
        let interval = 5;
        if (pixelsPerSecond > 100) interval = 1;
        else if (pixelsPerSecond < 40) interval = 2;
        
        for (let i = 0; i <= duration + interval; i += interval) {
            newMarkers.push(i);
        }
        return newMarkers;
    }, [duration, pixelsPerSecond]);

    return (
        <div className="h-6 w-full bg-brand-bg-dark sticky top-0 z-20">
            <div className="relative h-full" style={{ width: `${Math.max(duration + 5, 15) * pixelsPerSecond}px`}}>
                {markers.map(time => (
                    <div key={time} className="absolute h-full" style={{ left: `${time * pixelsPerSecond}px`}}>
                        <div className="w-px h-full bg-brand-border"></div>
                        <span className="absolute top-0 left-1 text-xs text-brand-text-secondary">{time}s</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Playhead: React.FC<{ position: number; onScrub: (pos: number) => void; totalWidth: number }> = ({ position, onScrub, totalWidth }) => {
    const playheadRef = useRef<HTMLDivElement>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const timelineRef = useRef<HTMLElement | null>(null);
    
    useEffect(() => {
        timelineRef.current = playheadRef.current?.parentElement || null;
    }, []);

    const scrub = (clientX: number) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const scrollLeft = timelineRef.current.parentElement?.scrollLeft || 0;
        const newPosition = Math.max(0, clientX - rect.left + scrollLeft);
        onScrub(Math.min(newPosition, totalWidth));
    }
    
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsScrubbing(true);
        scrub(e.clientX);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if(isScrubbing) scrub(e.clientX);
        };
        const handleMouseUp = () => {
            setIsScrubbing(false);
        };

        if (isScrubbing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isScrubbing, onScrub, totalWidth]);

    return (
        <div
            ref={playheadRef}
            onMouseDown={handleMouseDown}
            style={{ left: `${position}px` }}
            className="absolute top-0 h-full w-0.5 bg-brand-purple z-30 cursor-col-resize"
        >
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-brand-purple rounded-full border-2 border-brand-bg-dark"></div>
        </div>
    );
};

interface MiniTimelineItemProps {
    clip: TimelineClip;
    asset: MediaAsset;
    left: number;
    width: number;
    onDragStart: (e: React.DragEvent, clip: TimelineClip) => void;
    onTrimStart: (e: React.MouseEvent, clip: TimelineClip, handle: 'left' | 'right') => void;
}

const MiniTimelineItem: React.FC<MiniTimelineItemProps> = ({ clip, asset, left, width, onDragStart, onTrimStart }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, clip)}
            style={{ left: `${left}px`, width: `${width}px` }}
            className="absolute top-0 h-full bg-brand-bg-light rounded-md border border-brand-border overflow-hidden group flex items-end p-1 cursor-grab active:cursor-grabbing"
        >
            {asset.type === 'VIDEO' || asset.type === 'IMAGE' ? (
                <img src={asset.thumbnailUrl} alt={asset.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
            ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-purple-900/30">
                    <MusicNoteIcon className="w-6 h-6 text-purple-300/70" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <p className="text-xs text-white font-semibold relative truncate">{asset.name}</p>
            
            <div 
                onMouseDown={(e) => onTrimStart(e, clip, 'left')}
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
            />
            <div 
                 onMouseDown={(e) => onTrimStart(e, clip, 'right')}
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
            />
        </div>
    );
};

interface MiniTimelineProps {
    clips: TimelineClip[];
    mediaAssets: MediaAsset[];
    onUpdate: (newClips: TimelineClip[]) => void;
    zoom: number;
    activeTool: 'select' | 'split';
    onSplitClip: (clip: TimelineClip, splitTime: number) => void;
    playheadPosition: number;
    onSetPlayheadPosition: (pos: number) => void;
    onAddAssetToProject: (asset: MediaAsset) => void;
}

export const MiniTimeline: React.FC<MiniTimelineProps> = (props) => {
    const { clips, mediaAssets, onUpdate, zoom, activeTool, onSplitClip, playheadPosition, onSetPlayheadPosition, onAddAssetToProject } = props;
    
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [trimmingClip, setTrimmingClip] = useState<{ clip: TimelineClip; handle: 'left' | 'right'; startX: number; originalClip: TimelineClip } | null>(null);
    const assetMap = useMemo(() => new Map(mediaAssets.map(asset => [asset.id, asset])), [mediaAssets]);
    const timelineContainerRef = useRef<HTMLDivElement>(null);

    const pixelsPerSecond = useMemo(() => {
        const minPps = 20;
        const maxPps = 300;
        return minPps + (maxPps - minPps) * zoom;
    }, [zoom]);

    const { repackedClips, totalDuration } = useMemo(() => {
        let currentPos = 0;
        const repacked = clips.map(c => {
            const newClip = { ...c, timelineStart: currentPos };
            currentPos += c.duration;
            return newClip;
        });
        return { repackedClips: repacked, totalDuration: currentPos };
    }, [clips]);

    const handleDragStart = (e: React.DragEvent, clip: TimelineClip) => {
        e.dataTransfer.setData('application/vfg-clip-internal', JSON.stringify(clip));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };
    
    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(null);

        const internalClipData = e.dataTransfer.getData('application/vfg-clip-internal');
        const hubAssetData = e.dataTransfer.getData('application/vfg-media-asset');

        let newClips = [...clips];

        if (internalClipData) {
            const draggedClip: TimelineClip = JSON.parse(internalClipData);
            newClips = clips.filter(c => c.id !== draggedClip.id);
            newClips.splice(index, 0, draggedClip);
        } else if (hubAssetData) {
            const asset: MediaAsset = JSON.parse(hubAssetData);
            if (asset.type === 'AUDIO') return;

            onAddAssetToProject(asset);

            const newClip: TimelineClip = {
                id: crypto.randomUUID(), mediaAssetId: asset.id, layer: 0,
                timelineStart: 0, duration: asset.duration, assetStart: 0,
                volume: 1, opacity: 1,
                transform: { scale: 1, rotation: 0, position: { x: 0, y: 0 }, flip: { horizontal: false, vertical: false } },
            };
            newClips.splice(index, 0, newClip);
        }
        onUpdate(newClips);
    };

    const handleTrimStart = (e: React.MouseEvent, clip: TimelineClip, handle: 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        setTrimmingClip({ clip, handle, startX: e.clientX, originalClip: { ...clip } });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!trimmingClip) return;
            const dx = e.clientX - trimmingClip.startX;
            const timeDelta = dx / pixelsPerSecond;
            const { originalClip, handle } = trimmingClip;
            const asset = assetMap.get(originalClip.mediaAssetId);
            if (!asset) return;

            let newDuration = originalClip.duration;
            let newAssetStart = originalClip.assetStart;

            if (handle === 'right') {
                newDuration = Math.max(0.1, originalClip.duration + timeDelta);
                if (originalClip.assetStart + newDuration > asset.duration) {
                    newDuration = asset.duration - originalClip.assetStart;
                }
            } else { // left handle
                const timeChange = Math.min(
                    Math.max(timeDelta, -originalClip.assetStart),
                    originalClip.duration - 0.1
                );
                newAssetStart = originalClip.assetStart + timeChange;
                newDuration = originalClip.duration - timeChange;
            }
            
            const updatedClips = clips.map(c => c.id === originalClip.id ? { ...c, duration: newDuration, assetStart: newAssetStart } : c);
            onUpdate(updatedClips);
        };
        const handleMouseUp = () => setTrimmingClip(null);

        if (trimmingClip) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [trimmingClip, clips, onUpdate, assetMap, pixelsPerSecond]);
    
    const handleContainerClick = () => {
        if (activeTool !== 'split') return;
        
        const splitTime = playheadPosition / pixelsPerSecond;
        const clipToSplit = repackedClips.find(c => splitTime > c.timelineStart && splitTime < (c.timelineStart + c.duration));
        
        if (clipToSplit) {
            onSplitClip(clipToSplit, splitTime);
        }
    };

    return (
        <div className="w-full h-full overflow-x-auto overflow-y-hidden bg-brand-bg-dark rounded-md relative flex flex-col" ref={timelineContainerRef}>
            <TimeRuler duration={totalDuration} pixelsPerSecond={pixelsPerSecond} />
            <div 
                className="flex-1 relative"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, clips.length)}
                onDragLeave={handleDragLeave}
                onClick={handleContainerClick}
            >
                <div className="relative h-full" style={{ width: `${Math.max(totalDuration * pixelsPerSecond, 300)}px` }}>
                    {repackedClips.map((clip, index) => {
                        const asset = assetMap.get(clip.mediaAssetId);
                        if (!asset) return null;
                        const left = clip.timelineStart * pixelsPerSecond;
                        const width = clip.duration * pixelsPerSecond;
                        return (
                            <React.Fragment key={clip.id}>
                                <DropZone index={index} onDrop={handleDrop} onDragOver={handleDragOver} isOver={dragOverIndex === index} left={left - 4} />
                                <MiniTimelineItem
                                    clip={clip}
                                    asset={asset}
                                    left={left}
                                    width={width}
                                    onDragStart={handleDragStart}
                                    onTrimStart={handleTrimStart}
                                />
                            </React.Fragment>
                        );
                    })}
                    <DropZone index={clips.length} onDrop={handleDrop} onDragOver={handleDragOver} isOver={dragOverIndex === clips.length} left={totalDuration * pixelsPerSecond} isLast />
                    <Playhead position={playheadPosition} onScrub={onSetPlayheadPosition} totalWidth={totalDuration * pixelsPerSecond} />
                </div>
            </div>
        </div>
    );
};

const DropZone: React.FC<{
    index: number;
    left: number;
    onDrop: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    isOver: boolean;
    isLast?: boolean;
}> = ({ index, left, onDrop, onDragOver, isOver, isLast = false }) => (
    <div
        onDrop={(e) => onDrop(e, index)}
        onDragOver={(e) => onDragOver(e, index)}
        style={{ left: `${left}px` }}
        className={`absolute top-0 h-full transition-all duration-200 ${isLast ? 'w-12' : 'w-2'} ${isOver ? 'bg-brand-purple w-12' : ''}`}
    />
);

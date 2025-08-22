

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Project, MediaAsset, TimelineClip, TimelineTransition, StockTransition } from '../types';
import { MusicNoteIcon, TrashIcon } from './icons';
import { TimelineToolbar } from './TimelineToolbar';

const TRACK_HEIGHT = 64; // Corresponds to h-16 in Tailwind
const EMPTY_DROP_ZONE_HEIGHT = 32; // h-8

// --- DRAG GHOST COMPONENT ---
const DragGhost: React.FC<{ asset: MediaAsset, width: number, position: {x: number, y: number} }> = ({ asset, width, position }) => {
    return (
        <div
            className="absolute top-0 left-0 h-14 bg-brand-bg-light rounded-md border-2 border-brand-purple pointer-events-none z-50 shadow-2xl flex items-end p-1"
            style={{
                width: `${width}px`,
                transform: `translate(${position.x}px, ${position.y}px)`
            }}
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
        </div>
    );
};


interface TimeRulerProps {
    duration: number;
    pixelsPerSecond: number;
}

const TimeRuler: React.FC<TimeRulerProps> = ({ duration, pixelsPerSecond }) => {
    const markers = useMemo(() => {
        const newMarkers = [];
        let interval = 5;
        if (pixelsPerSecond > 100) interval = 1;
        else if (pixelsPerSecond < 40) interval = 10;
        
        for (let i = 0; i <= duration + interval; i += interval) {
            newMarkers.push(i);
        }
        return newMarkers;
    }, [duration, pixelsPerSecond]);

    return (
        <div className="h-6 w-full bg-brand-bg-dark sticky top-0 z-20">
            <div className="relative h-full" style={{ width: `${Math.max(duration + 10, 30) * pixelsPerSecond}px`}}>
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


interface TimelineItemProps {
    clip: TimelineClip;
    asset: MediaAsset;
    isSelected: boolean;
    isGhost: boolean;
    onSelect: () => void;
    onDragStart: (e: React.MouseEvent<HTMLDivElement>, clip: TimelineClip, asset: MediaAsset, type: 'move' | 'trim-left' | 'trim-right') => void;
    pixelsPerSecond: number;
    isShifting: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ clip, asset, isSelected, isGhost, onSelect, onDragStart, pixelsPerSecond, isShifting }) => {
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        onSelect();
        
        const rect = e.currentTarget.getBoundingClientRect();
        const isLeftHandle = e.clientX < rect.left + 10;
        const isRightHandle = e.clientX > rect.right - 10;
        let type: 'move' | 'trim-left' | 'trim-right' = 'move';

        if (asset.type === 'VIDEO' && isLeftHandle) type = 'trim-left';
        else if (asset.type === 'VIDEO' && isRightHandle) type = 'trim-right';
        
        onDragStart(e, clip, asset, type);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            style={{
                left: `${clip.timelineStart * pixelsPerSecond}px`,
                width: `${clip.duration * pixelsPerSecond}px`,
            }}
            className={`absolute h-[85%] top-1/2 -translate-y-1/2 bg-brand-bg-light rounded-md border-2 overflow-hidden group 
                ${isShifting ? 'transition-all duration-300 ease-in-out' : ''}
                ${isSelected ? 'border-brand-purple ring-2 ring-brand-purple z-10' : 'border-brand-border hover:border-brand-purple/50'}
                ${isGhost ? 'opacity-40' : ''}
            `}
        >
             {asset.type === 'VIDEO' || asset.type === 'IMAGE' ? (
                <img src={asset.thumbnailUrl} alt={asset.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
            ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-purple-900/30">
                     <MusicNoteIcon className="w-6 h-6 text-purple-300/70" />
                </div>
            )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
             <p className="text-xs text-white font-semibold relative truncate p-1">{asset.name}</p>
             
             {asset.type === 'VIDEO' && <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"></div>}
             {asset.type === 'VIDEO' && <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"></div>}
        </div>
    );
};

interface TransitionDropZoneProps {
    fromClipId: string;
    toClipId: string;
    position: number;
    onAddTransition: (transition: Omit<TimelineTransition, 'id'>) => void;
    pixelsPerSecond: number;
}
const TransitionDropZone: React.FC<TransitionDropZoneProps> = ({ fromClipId, toClipId, position, onAddTransition, pixelsPerSecond }) => {
    const [isOver, setIsOver] = useState(false);
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'link';
    };
    const handleDragEnter = () => setIsOver(true);
    const handleDragLeave = () => setIsOver(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const data = e.dataTransfer.getData('application/vfg-transition');
        if (data) {
            const transition: StockTransition = JSON.parse(data);
            onAddTransition({
                fromClipId: fromClipId,
                toClipId: toClipId,
                type: transition.type,
                duration: 1, // default duration
            });
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ left: `${position * pixelsPerSecond - 8}px` }}
            className={`absolute top-0 h-full w-4 z-20 ${isOver ? 'bg-brand-purple/30' : ''}`}
        />
    );
};

interface TransitionItemProps {
    transition: TimelineTransition;
    fromClip: TimelineClip;
    onDelete: (id: string) => void;
    pixelsPerSecond: number;
}
const TransitionItem: React.FC<TransitionItemProps> = ({ transition, fromClip, onDelete, pixelsPerSecond }) => {
    const position = fromClip.timelineStart + fromClip.duration - (transition.duration / 2);
    return (
        <div
            style={{
                left: `${position * pixelsPerSecond}px`,
                width: `${transition.duration * pixelsPerSecond}px`
            }}
            className="absolute top-0 h-full bg-purple-500/50 border-x-2 border-purple-300 rounded-sm group flex items-center justify-center z-10"
        >
            <button
                onClick={() => onDelete(transition.id)}
                className="absolute p-0.5 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove Transition"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

interface TimelineLayerProps {
    layerId: number;
    clips: { clip: TimelineClip; asset: MediaAsset }[];
    transitions: TimelineTransition[];
    selectedClipId: string | null;
    isDragOver: boolean;
    placeholderPosition: { left: number; width: number } | null;
    isShifting: boolean;
    onSelect: (id: string) => void;
    onDragStart: (e: React.MouseEvent<HTMLDivElement>, clip: TimelineClip, asset: MediaAsset, type: 'move' | 'trim-left' | 'trim-right') => void;
    onAddTransition: (transition: Omit<TimelineTransition, 'id'>) => void;
    onDeleteTransition: (id: string) => void;
    pixelsPerSecond: number;
}
const TimelineLayer: React.FC<TimelineLayerProps> = ({ 
    layerId, clips, transitions, selectedClipId, isDragOver, placeholderPosition, isShifting,
    onSelect, onDragStart, onAddTransition, onDeleteTransition, pixelsPerSecond 
}) => {
    const sortedClips = useMemo(() => [...clips].sort((a,b) => a.clip.timelineStart - b.clip.timelineStart), [clips]);
    const clipMap = useMemo(() => new Map(clips.map(c => [c.clip.id, c.clip])), [clips]);

    const isVideoLayer = layerId >= 0;

    return (
        <div data-layer-id={layerId} className={`w-full h-16 border-b border-brand-border/50 relative flex items-center px-2 transition-colors duration-200 ${isDragOver ? 'bg-brand-purple/10' : ''}`}>
            <div className="relative w-full h-full">
                {clips.map(({ clip, asset }) => (
                    <TimelineItem
                        key={clip.id}
                        clip={clip}
                        asset={asset}
                        isSelected={clip.id === selectedClipId}
                        isGhost={false} // Ghosting is now handled by the main drag state
                        onSelect={() => onSelect(clip.id)}
                        onDragStart={onDragStart}
                        pixelsPerSecond={pixelsPerSecond}
                        isShifting={isShifting}
                    />
                ))}
                 {placeholderPosition !== null && (
                    <div
                        className="absolute h-[85%] top-1/2 -translate-y-1/2 bg-brand-border/50 rounded-md transition-all duration-100 ease-out"
                        style={{
                            left: `${placeholderPosition.left}px`,
                            width: `${placeholderPosition.width}px`,
                        }}
                    />
                )}
                {isVideoLayer && sortedClips.map((item, index) => {
                    if (index < sortedClips.length - 1) {
                        const fromClip = item.clip;
                        const toClip = sortedClips[index + 1].clip;
                        if (transitions.some(t => t.fromClipId === fromClip.id && t.toClipId === toClip.id)) return null;
                        return (
                             <TransitionDropZone
                                key={`${fromClip.id}-${toClip.id}`}
                                fromClipId={fromClip.id}
                                toClipId={toClip.id}
                                position={fromClip.timelineStart + fromClip.duration}
                                onAddTransition={onAddTransition}
                                pixelsPerSecond={pixelsPerSecond}
                            />
                        )
                    }
                    return null;
                })}
                {isVideoLayer && transitions.map(t => {
                    const fromClip = clipMap.get(t.fromClipId);
                    if (fromClip) {
                        return <TransitionItem key={t.id} transition={t} fromClip={fromClip} onDelete={onDeleteTransition} pixelsPerSecond={pixelsPerSecond} />;
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

const Playhead: React.FC<{ currentTime: number; duration: number; onScrub: (time: number) => void; pixelsPerSecond: number; }> = ({ currentTime, duration, onScrub, pixelsPerSecond }) => {
    const playheadRef = useRef<HTMLDivElement>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const timelineRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        timelineRef.current = playheadRef.current?.parentElement || null;
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsScrubbing(true);
        scrub(e.clientX);
    };

    const scrub = (clientX: number) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const scrollLeft = timelineRef.current.parentElement?.scrollLeft || 0;
        const newTime = Math.max(0, (clientX - rect.left + scrollLeft) / pixelsPerSecond);
        onScrub(Math.min(newTime, duration));
    }
    
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
    }, [isScrubbing, onScrub, duration, pixelsPerSecond]);

    return (
        <div
            ref={playheadRef}
            onMouseDown={handleMouseDown}
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
            className="absolute top-0 h-full w-0.5 bg-brand-purple z-30 cursor-col-resize"
        >
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-brand-purple rounded-full border-2 border-brand-bg-dark"></div>
        </div>
    );
};

interface DragState {
    type: 'move' | 'trim-left' | 'trim-right';
    clip: TimelineClip;
    asset: MediaAsset;
    startX: number;
    startY: number;
    originalClip: TimelineClip;
    ghostPosition: { x: number; y: number };
}

interface TimelineProps {
    project: Project;
    onSelect: (clipId: string | null) => void;
    selectedClipId: string | null;
    onSetTimeline: (newTimeline: TimelineClip[]) => void;
    onUpdateClip: (id: string, updates: Partial<TimelineClip>) => void;
    onAddTransition: (transition: Omit<TimelineTransition, 'id'>) => void;
    onDeleteTransition: (id: string) => void;
    currentTime: number;
    onSetCurrentTime: (time: number) => void;
    activeTool: 'select' | 'split';
    setActiveTool: (tool: 'select' | 'split') => void;
    totalDuration: number;
    pixelsPerSecond: number;
    onTrimPreview: (preview: { clipId: string; time: number } | null) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ 
    project, onSelect, selectedClipId, onSetTimeline, 
    onUpdateClip, onAddTransition, onDeleteTransition, currentTime, onSetCurrentTime, 
    activeTool, setActiveTool, totalDuration, pixelsPerSecond, onTrimPreview 
}) => {
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [dragOverLayer, setDragOverLayer] = useState<number | null>(null);
    const [placeholder, setPlaceholder] = useState<{ layer: number; left: number; width: number } | null>(null);
    const [isShifting, setIsShifting] = useState(false);
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const layerContainerRef = useRef<HTMLDivElement>(null);
    const layerRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

    const assetMap = useMemo(() => new Map(project.mediaAssets.map(asset => [asset.id, asset])), [project.mediaAssets]);

    const { layers, audioLayers, videoLayers } = useMemo(() => {
        const layerMap: { [layerId: number]: { clip: TimelineClip; asset: MediaAsset }[] } = {};
        for (const clip of project.editorTimeline) {
            const asset = assetMap.get(clip.mediaAssetId);
            if (asset) {
                if (!layerMap[clip.layer]) {
                    layerMap[clip.layer] = [];
                }
                layerMap[clip.layer].push({ clip, asset });
            }
        }
        const sortedLayers = Object.keys(layerMap).map(Number).sort((a,b) => b - a); // V layers on top
        const audioLayers = sortedLayers.filter(l => l < 0);
        const videoLayers = sortedLayers.filter(l => l >= 0);
        return { layers: layerMap, audioLayers, videoLayers };
    }, [project.editorTimeline, assetMap]);
    
    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, clip: TimelineClip, asset: MediaAsset, type: 'move' | 'trim-left' | 'trim-right') => {
        e.preventDefault();
        document.body.style.cursor = type === 'move' ? 'grabbing' : 'ew-resize';
        onSelect(clip.id);
        setDragState({
            type,
            clip,
            asset,
            startX: e.clientX,
            startY: e.clientY,
            originalClip: { ...clip },
            ghostPosition: { x: e.clientX - 30, y: e.clientY - 30 },
        });
    };

    const getTargetLayerFromY = (clientY: number): number | null => {
        const timelineRect = timelineContainerRef.current?.getBoundingClientRect();
        if (!timelineRect) return null;

        let cumulativeHeight = timelineRect.top + 60; // Start after ruler and top drop zone

        for (const layerId of videoLayers) {
            if (clientY >= cumulativeHeight && clientY < cumulativeHeight + TRACK_HEIGHT) {
                return layerId;
            }
            cumulativeHeight += TRACK_HEIGHT;
        }

        cumulativeHeight += EMPTY_DROP_ZONE_HEIGHT; // Middle drop zone

        for (const layerId of audioLayers) {
             if (clientY >= cumulativeHeight && clientY < cumulativeHeight + TRACK_HEIGHT) {
                return layerId;
            }
            cumulativeHeight += TRACK_HEIGHT;
        }
        
        // Check empty zones
        if (clientY > timelineRect.top && clientY < timelineRect.top + 60) return highestVideoLayer + 1;
        if (clientY > cumulativeHeight) return lowestAudioLayer - 1;

        return null;
    };


    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragState) return;

            const dx = e.clientX - dragState.startX;
            const newGhostPosition = { x: e.clientX - 30, y: e.clientY - 30 };
            
            setDragState(prev => prev ? ({ ...prev, ghostPosition: newGhostPosition }) : null);

            if (dragState.type === 'move') {
                 const targetLayer = getTargetLayerFromY(e.clientY);
                 setDragOverLayer(targetLayer);
                
                const { left } = (timelineContainerRef.current?.getBoundingClientRect() || { left: 0 });
                const { scrollLeft } = (timelineContainerRef.current || { scrollLeft: 0 });
                const mouseX = e.clientX - left + scrollLeft;
                const mouseTime = Math.max(0, mouseX / pixelsPerSecond);
                const { clip } = dragState;
                
                if (targetLayer !== null) {
                    setIsShifting(true);
                    if (targetLayer === 0) {
                        const otherClips = project.editorTimeline.filter(c => c.id !== clip.id && c.layer === 0).sort((a, b) => a.timelineStart - b.timelineStart);
                        let insertIndex = 0;
                        for (let i = 0; i < otherClips.length; i++) {
                            const otherClipMidpoint = otherClips[i].timelineStart + otherClips[i].duration / 2;
                            if (mouseTime > otherClipMidpoint) {
                               insertIndex = i + 1;
                            }
                        }
                        let placeholderStart = 0;
                        if (insertIndex > 0) {
                            const prevClip = otherClips[insertIndex - 1];
                            placeholderStart = prevClip.timelineStart + prevClip.duration;
                        }
                        setPlaceholder({ layer: 0, left: placeholderStart * pixelsPerSecond, width: clip.duration * pixelsPerSecond });
                    } else { // Freeform layers
                        setPlaceholder({ layer: targetLayer, left: mouseTime * pixelsPerSecond, width: clip.duration * pixelsPerSecond });
                    }
                } else {
                    setPlaceholder(null);
                }

            } else { // Trimming logic
                 const timeDelta = dx / pixelsPerSecond;
                 const { originalClip, asset } = dragState;
                 let previewTime: number | null = null;

                 if (dragState.type === 'trim-right') {
                    const newDuration = Math.max(0.1, originalClip.duration + timeDelta);
                    if (originalClip.assetStart + newDuration <= asset.duration) {
                        onUpdateClip(originalClip.id, { duration: newDuration });
                        previewTime = originalClip.assetStart + newDuration;
                    }
                 } else if (dragState.type === 'trim-left') {
                    const timeChange = Math.min(
                        Math.max(timeDelta, -originalClip.assetStart),
                        originalClip.duration - 0.1
                    );
                    
                    const newAssetStart = originalClip.assetStart + timeChange;
                    const newDuration = originalClip.duration - timeChange;
                    const newTimelineStart = originalClip.timelineStart + timeChange;
                    
                    onUpdateClip(originalClip.id, { 
                        assetStart: newAssetStart,
                        duration: newDuration,
                        timelineStart: newTimelineStart,
                    });
                    previewTime = newAssetStart;
                 }
                 if (previewTime !== null) {
                     onTrimPreview({ clipId: originalClip.id, time: previewTime });
                 }
            }
        };

        const handleMouseUp = () => {
            document.body.style.cursor = 'default';
            if (dragState) {
                if (dragState.type === 'move' && placeholder && dragOverLayer !== null) {
                    handleClipDrop(dragState.originalClip, dragOverLayer, placeholder.left / pixelsPerSecond);
                } else if (dragState.type.startsWith('trim')) {
                    onTrimPreview(null);
                }
            }
            setDragState(null);
            setDragOverLayer(null);
            setPlaceholder(null);
            setTimeout(() => setIsShifting(false), 50); // allow for animation to finish
        };

        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, project.editorTimeline, pixelsPerSecond, onUpdateClip, assetMap, onTrimPreview]);

    const handleClipDrop = (droppedClip: TimelineClip, targetLayer: number, timelineStart: number) => {
        const asset = assetMap.get(droppedClip.mediaAssetId);
        if (!asset) return;
        
        const isAudioAsset = asset.type === 'AUDIO';
        const isAudioLayer = targetLayer < 0;

        if ((isAudioAsset && !isAudioLayer) || (!isAudioAsset && isAudioLayer)) {
            return; // Invalid drop
        }

        const updatedClip = { ...droppedClip, layer: targetLayer, timelineStart };
        let newTimeline = project.editorTimeline.filter(c => c.id !== droppedClip.id);
        
        if (targetLayer === 0) { 
            const mainTrackClips = [...newTimeline.filter(c => c.layer === 0), updatedClip].sort((a,b) => a.timelineStart - b.timelineStart);
            let currentPos = 0;
            const repackedClips = mainTrackClips.map(c => {
                const newClip = { ...c, timelineStart: currentPos };
                currentPos += c.duration;
                return newClip;
            });
            newTimeline = [...newTimeline.filter(c => c.layer !== 0), ...repackedClips];
        } else {
            newTimeline.push(updatedClip);
        }

        onSetTimeline(newTimeline);
    };

    const handleSplit = () => {
        const clipToSplit = project.editorTimeline.find(c => currentTime > c.timelineStart && currentTime < (c.timelineStart + c.duration));
        if (!clipToSplit) return;
        
        const splitPoint = currentTime - clipToSplit.timelineStart;

        if (splitPoint < 0.1 || (clipToSplit.duration - splitPoint) < 0.1) return;
        
        const firstPart = { ...clipToSplit, duration: splitPoint };
        const secondPart = {
            ...clipToSplit,
            id: crypto.randomUUID(),
            timelineStart: currentTime,
            duration: clipToSplit.duration - splitPoint,
            assetStart: clipToSplit.assetStart + splitPoint
        };
        
        let newTimeline = project.editorTimeline.map(c => c.id === clipToSplit.id ? firstPart : c);
        // Shift other clips on the same layer to make space if it's the main track
        if (clipToSplit.layer === 0) {
            newTimeline = newTimeline.map(c => {
                if (c.layer === 0 && c.timelineStart >= currentTime) {
                    return { ...c, timelineStart: c.timelineStart + secondPart.duration };
                }
                return c;
            })
        }

        newTimeline.push(secondPart);
        onSetTimeline(newTimeline);
    };

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('[data-layer-id]')) {
            if (activeTool === 'split') handleSplit();
            return;
        }
        onSelect(null);
    };

    const highestVideoLayer = videoLayers.length > 0 ? Math.max(...videoLayers) : -1;
    const lowestAudioLayer = audioLayers.length > 0 ? Math.min(...audioLayers) : 0;
    
    return (
        <div className="flex-shrink-0 min-h-[256px] h-auto bg-brand-bg-dark border-t border-brand-border flex flex-col">
            {dragState && dragState.type === 'move' && (
                <DragGhost asset={dragState.asset} width={dragState.clip.duration * pixelsPerSecond} position={dragState.ghostPosition} />
            )}
            <TimelineToolbar activeTool={activeTool} onSetTool={setActiveTool} />
            <div 
                ref={timelineContainerRef}
                className="flex-1 overflow-auto relative"
                onClick={handleContainerClick}
            >
                <div className="relative h-full" style={{ width: `${Math.max(totalDuration + 10, 30) * pixelsPerSecond}px`}}>
                    <TimeRuler duration={totalDuration} pixelsPerSecond={pixelsPerSecond} />
                    <div ref={layerContainerRef} className="absolute top-6 bottom-0 left-0 right-0">
                         {/* Empty Drop Zones */}
                        <div data-layer-id={highestVideoLayer + 1} className={`h-8 w-full transition-colors duration-200 ${dragOverLayer === highestVideoLayer + 1 ? 'bg-brand-purple/10' : ''}`} />
                         {/* Video Layers */}
                        {videoLayers.map(layerId => (
                            <TimelineLayer
                                key={layerId}
                                layerId={layerId}
                                clips={layers[layerId] || []}
                                transitions={project.editorTransitions}
                                selectedClipId={selectedClipId}
                                isDragOver={dragOverLayer === layerId}
                                placeholderPosition={placeholder?.layer === layerId ? placeholder : null}
                                isShifting={isShifting && dragState?.type === 'move' && placeholder?.layer === layerId && layerId === 0}
                                onSelect={onSelect}
                                onDragStart={handleDragStart}
                                onAddTransition={onAddTransition}
                                onDeleteTransition={onDeleteTransition}
                                pixelsPerSecond={pixelsPerSecond}
                            />
                        ))}
                         {/* Middle Separator / Drop Zone for Main Track */}
                         <div data-layer-id={0} className={`h-8 w-full border-y-2 border-dashed border-brand-border/20 transition-colors duration-200 ${dragOverLayer === 0 && !videoLayers.includes(0) ? 'bg-brand-purple/10' : ''}`} />
                         {/* Audio Layers */}
                        {audioLayers.map(layerId => (
                            <TimelineLayer
                                key={layerId}
                                layerId={layerId}
                                clips={layers[layerId] || []}
                                transitions={[]}
                                selectedClipId={selectedClipId}
                                isDragOver={dragOverLayer === layerId}
                                placeholderPosition={placeholder?.layer === layerId ? placeholder : null}
                                isShifting={false}
                                onSelect={onSelect}
                                onDragStart={handleDragStart}
                                onAddTransition={onAddTransition}
                                onDeleteTransition={onDeleteTransition}
                                pixelsPerSecond={pixelsPerSecond}
                            />
                        ))}
                        <div data-layer-id={lowestAudioLayer - 1} className={`h-8 w-full transition-colors duration-200 ${dragOverLayer === lowestAudioLayer - 1 ? 'bg-brand-purple/10' : ''}`} />
                    </div>
                     <Playhead currentTime={currentTime} duration={totalDuration} onScrub={onSetCurrentTime} pixelsPerSecond={pixelsPerSecond} />
                </div>
            </div>
        </div>
    );
};

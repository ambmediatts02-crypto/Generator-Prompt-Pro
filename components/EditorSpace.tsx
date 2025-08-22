

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Project, MediaAsset, TimelineClip, SplitViewSlot, TimelineTransition } from '../types';
import { EditorLayout, AspectRatio } from '../types';
import { ArrowLeftIcon, BotMessageSquareIcon, CodeSlashIcon, SettingsIcon } from './icons';
import { CreativeHubPanel } from './CreativeHubPanel';
import { Timeline } from './Timeline';
import { CreativeDirectorPanel } from './CreativeDirectorPanel';
import { ExportModal } from './ExportModal';
import { SplitViewEditor, SplitViewPreview } from './SplitView';
import { PlaybackControls } from './PlaybackControls';
import { InspectorPanel } from './InspectorPanel';
import { TimelineZoomControl } from './TimelineZoomControl';

interface EditorSpaceProps {
    project: Project;
    onBack: () => void;
    onImportMedia: (files: File[]) => void;
    onSetTimeline: (newTimeline: TimelineClip[]) => void;
    onUpdateTimelineClip: (clipId: string, updates: Partial<TimelineClip>) => void;
    onUpdateTimelineClipDuration: (clipId: string, duration: number) => void;
    onDeleteClip: (clipId: string) => void;
    onSendEditorMessage: (message: string) => void;
    onAddAssetToProject: (asset: MediaAsset) => void;
    isEditorThinking: boolean;
    onExportVideo: () => void;
    isExporting: boolean;
    exportProgress: number;
    exportedVideoUrl: string | null;
    onSetEditorLayout: (layout: EditorLayout) => void;
    onSetEditorAspectRatio: (aspectRatio: AspectRatio) => void;
    onAddTransition: (transition: Omit<TimelineTransition, 'id'>) => void;
    onDeleteTransition: (id: string) => void;
    onUpdateSplitViewLane: (slot: SplitViewSlot, updates: Partial<{ clips: TimelineClip[], zoom: number }>) => void;
}


const TransformableMediaPreview: React.FC<{ 
    asset: MediaAsset, 
    clip: TimelineClip, 
    isPlaying: boolean, 
    currentTime: number,
    isSelected: boolean,
    onUpdateClip: (id: string, updates: Partial<TimelineClip>) => void;
    onSelect: (id: string) => void;
    onHover: (id: string | null) => void;
    isHovered: boolean;
    trimPreviewTime?: number | null;
}> = ({ asset, clip, isPlaying, currentTime, isSelected, onUpdateClip, onSelect, onHover, isHovered, trimPreviewTime }) => {
    const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<{ type: 'move' | 'scale', startX: number, startY: number, originalClip: TimelineClip } | null>(null);

    // Sync media element properties
    useEffect(() => {
        const media = mediaRef.current;
        if (!media || !clip) return;
        
        // Apply transform
        const { scale, rotation, position, flip } = clip.transform;
        media.style.transform = `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${flip.horizontal ? -scale : scale}, ${flip.vertical ? -scale : scale})`;
        media.style.opacity = `${clip.opacity}`;

        // Handle video playback
        if (asset.type === 'VIDEO' && media instanceof HTMLVideoElement) {
            media.volume = clip.volume;
            
            let internalTime;
            if (trimPreviewTime != null) {
                internalTime = trimPreviewTime;
            } else {
                internalTime = (currentTime - clip.timelineStart) + clip.assetStart;
            }
            
            if (Math.abs(media.currentTime - internalTime) > 0.2) {
                media.currentTime = internalTime;
            }

            if (isPlaying && trimPreviewTime == null && media.paused) {
                media.play().catch(e => { if (e.name !== 'AbortError') console.error("Video playback error:", e); });
            } else if ((!isPlaying || trimPreviewTime != null) && !media.paused) {
                media.pause();
            }
        }
    }, [clip, isPlaying, currentTime, asset, trimPreviewTime]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: 'move' | 'scale') => {
        if (!isSelected) return;
        e.preventDefault();
        e.stopPropagation();
        setDragState({ type, startX: e.clientX, startY: e.clientY, originalClip: { ...clip } });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragState || !containerRef.current) return;

            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;
            const { type, originalClip } = dragState;

            if (type === 'move') {
                const newPosition = {
                    x: originalClip.transform.position.x + dx,
                    y: originalClip.transform.position.y + dy,
                };
                onUpdateClip(clip.id, { transform: { ...originalClip.transform, position: newPosition } });
            } else if (type === 'scale') {
                 const newScale = originalClip.transform.scale + (dx / 100); // Adjust sensitivity
                 onUpdateClip(clip.id, { transform: { ...originalClip.transform, scale: Math.max(0.1, newScale) } });
            }
        };

        const handleMouseUp = () => {
            setDragState(null);
        };

        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, onUpdateClip, clip]);
    
    return (
        <div 
            ref={containerRef} 
            className="absolute inset-0 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onSelect(clip.id); }}
            onMouseEnter={() => onHover(clip.id)}
            onMouseLeave={() => onHover(null)}
        >
             {asset.type === 'VIDEO' ? (
                <video 
                    ref={mediaRef as React.Ref<HTMLVideoElement>}
                    src={asset.url} 
                    loop
                    muted={false}
                    className="w-full h-full object-contain"
                />
             ) : ( // Image
                <img
                    ref={mediaRef as React.Ref<HTMLImageElement>}
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-contain"
                />
             )}
            {isHovered && !isSelected && (
                <div className="absolute inset-0 border-2 border-white/50 pointer-events-none" />
            )}
            {isSelected && (
                <div 
                    className="absolute inset-0 border-2 border-brand-purple cursor-move"
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                    <div onMouseDown={(e) => handleMouseDown(e, 'scale')} className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-brand-purple rounded-full border-2 border-brand-bg-dark cursor-nwse-resize"></div>
                    <div onMouseDown={(e) => handleMouseDown(e, 'scale')} className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-brand-purple rounded-full border-2 border-brand-bg-dark cursor-nesw-resize"></div>
                    <div onMouseDown={(e) => handleMouseDown(e, 'scale')} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-purple rounded-full border-2 border-brand-bg-dark cursor-nesw-resize"></div>
                    <div onMouseDown={(e) => handleMouseDown(e, 'scale')} className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-brand-purple rounded-full border-2 border-brand-bg-dark cursor-nwse-resize"></div>
                </div>
            )}
        </div>
    )
}

// Manages a single audio element
const AudioClipPlayer: React.FC<{ asset: MediaAsset, clip: TimelineClip, isPlaying: boolean, currentTime: number }> = ({ asset, clip, isPlaying, currentTime }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = clip.volume;

        const isClipActive = currentTime >= clip.timelineStart && currentTime < clip.timelineStart + clip.duration;
        const shouldPlay = isPlaying && isClipActive;
        
        const internalTime = (currentTime - clip.timelineStart) + clip.assetStart;

        // Sync time if scrubbing or significantly out of sync
        if (!isPlaying || Math.abs(audio.currentTime - internalTime) > 0.2) {
            audio.currentTime = internalTime;
        }

        if (shouldPlay && audio.paused) {
            audio.play().catch(e => {
                if (e.name !== 'AbortError') console.error("Audio playback error:", e);
            });
        } else if (!shouldPlay && !audio.paused) {
            audio.pause();
        }
    }, [clip, isPlaying, currentTime, asset]);

    return <audio ref={audioRef} src={asset.url} loop />;
};

// Manages all audio clips on the timeline
const AudioTrackPlayer: React.FC<{
    timeline: TimelineClip[];
    mediaAssets: MediaAsset[];
    isPlaying: boolean;
    currentTime: number;
}> = ({ timeline, mediaAssets, isPlaying, currentTime }) => {
    const audioClips = useMemo(() => {
        const assetMap = new Map(mediaAssets.map(a => [a.id, a]));
        return timeline
            .filter(c => c.layer < 0) // Audio clips are on negative layers
            .map(clip => {
                const asset = assetMap.get(clip.mediaAssetId);
                return asset ? { clip, asset } : null;
            })
            .filter((item): item is { clip: TimelineClip; asset: MediaAsset } => !!item);
    }, [timeline, mediaAssets]);

    return (
        <>
            {audioClips.map(({ clip, asset }) => (
                <AudioClipPlayer 
                    key={clip.id} 
                    asset={asset} 
                    clip={clip} 
                    isPlaying={isPlaying} 
                    currentTime={currentTime} 
                />
            ))}
        </>
    );
};


export const EditorSpace: React.FC<EditorSpaceProps> = (props) => {
    const { 
        project, onBack, onImportMedia, onSetTimeline, onUpdateTimelineClip,
        onUpdateTimelineClipDuration, onDeleteClip, onSendEditorMessage,
        onAddAssetToProject, isEditorThinking, onExportVideo, isExporting,
        exportProgress, exportedVideoUrl, onSetEditorLayout, onSetEditorAspectRatio,
        onAddTransition, onDeleteTransition, onUpdateSplitViewLane
    } = props;
    
    const [selectedClipId, setSelectedClipId] = useState<string | null>(project.editorTimeline[0]?.id || null);
    const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);
    const [isMediaHubOpen, setIsMediaHubOpen] = useState(true);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'ai'>('ai');
    
    // Timeline State
    const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
    const [timelineCurrentTime, setTimelineCurrentTime] = useState(0);
    const [activeTool, setActiveTool] = useState<'select' | 'split'>('select');
    const [timelineZoom, setTimelineZoom] = useState(0.5); // 0 to 1
    const [trimPreview, setTrimPreview] = useState<{ clipId: string; time: number } | null>(null);
    
    // Split View State
    const [isSplitViewPlaying, setIsSplitViewPlaying] = useState(false);
    const [splitViewCurrentTime, setSplitViewCurrentTime] = useState(0);
    
    const timelineTotalDuration = useMemo(() => {
        return project.editorTimeline.reduce((max, clip) => {
            const clipEnd = clip.timelineStart + clip.duration;
            return clipEnd > max ? clipEnd : max;
        }, 0);
    }, [project.editorTimeline]);
    
    const splitViewTotalDuration = useMemo(() => {
        return Math.max(...Object.values(project.editorSplitViewLanes).map(lane =>
            lane.clips.reduce((total, clip) => total + clip.duration, 0)
        ));
    }, [project.editorSplitViewLanes]);

    // Playback loops
    useEffect(() => {
        let animationFrameId: number;
        if (project.editorLayout === EditorLayout.TIMELINE && isTimelinePlaying && !trimPreview) {
            const loop = () => {
                setTimelineCurrentTime(prev => {
                    const newTime = prev + 1/60;
                    if (newTime >= timelineTotalDuration) {
                        setIsTimelinePlaying(false);
                        return 0;
                    }
                    return newTime;
                });
                animationFrameId = requestAnimationFrame(loop);
            };
            animationFrameId = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [isTimelinePlaying, timelineTotalDuration, trimPreview, project.editorLayout]);
    
    useEffect(() => {
        let animationFrameId: number;
        if (project.editorLayout === EditorLayout.SPLIT_VIEW && isSplitViewPlaying) {
            const loop = () => {
                setSplitViewCurrentTime(prev => {
                    const newTime = prev + 1/60;
                    if (newTime >= splitViewTotalDuration) {
                        setIsSplitViewPlaying(false);
                        return 0;
                    }
                    return newTime;
                });
                animationFrameId = requestAnimationFrame(loop);
            };
            animationFrameId = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [isSplitViewPlaying, splitViewTotalDuration, project.editorLayout]);

    const selectedClip = useMemo(() => {
        return project.editorTimeline.find(c => c.id === selectedClipId) || null;
    }, [selectedClipId, project.editorTimeline]);

    const selectedAsset = useMemo(() => {
        if (!selectedClip) return null;
        return project.mediaAssets.find(a => a.id === selectedClip.mediaAssetId) || null;
    }, [selectedClip, project.mediaAssets]);

    // Smartly switch right panel tab based on selection
    useEffect(() => {
        if (selectedClipId && project.editorLayout === EditorLayout.TIMELINE) {
            setRightPanelTab('inspector');
        } else {
            setRightPanelTab('ai');
        }
    }, [selectedClipId, project.editorLayout]);
    
    // Keyboard listener for deleting clips
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedClipId || project.editorLayout !== EditorLayout.TIMELINE) return;

            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                onDeleteClip(selectedClipId);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedClipId, onDeleteClip, project.editorLayout]);

    const activeClipsForPreview = useMemo(() => {
      const assetMap = new Map(project.mediaAssets.map(a => [a.id, a]));
      
      if (trimPreview) {
        const trimClip = project.editorTimeline.find(c => c.id === trimPreview.clipId);
        const trimAsset = trimClip ? assetMap.get(trimClip.mediaAssetId) : null;
        if (trimClip && trimAsset) {
            return [{ clip: trimClip, asset: trimAsset, trimTime: trimPreview.time }];
        }
        return [];
      }

      return project.editorTimeline
        .filter(c => (c.layer >= 0) && 
                     timelineCurrentTime >= c.timelineStart &&
                     timelineCurrentTime < (c.timelineStart + c.duration))
        .map(clip => ({ clip, asset: assetMap.get(clip.mediaAssetId) }))
        .filter((item): item is { clip: TimelineClip; asset: MediaAsset } => !!item.asset)
        .sort((a, b) => a.clip.layer - b.clip.layer);
    }, [timelineCurrentTime, project.editorTimeline, project.mediaAssets, trimPreview]);
    
    useEffect(() => {
        if (selectedClipId && !project.editorTimeline.some(c => c.id === selectedClipId)) {
            setSelectedClipId(project.editorTimeline[0]?.id || null);
        }
    }, [project.editorTimeline, selectedClipId]);

    const isTimelineMode = project.editorLayout === EditorLayout.TIMELINE;

    const handlePlayPause = useCallback(() => {
        if (isTimelineMode) {
             if (timelineCurrentTime >= timelineTotalDuration) {
                setTimelineCurrentTime(0);
            }
            setIsTimelinePlaying(p => !p);
        } else {
            if (splitViewCurrentTime >= splitViewTotalDuration) {
                setSplitViewCurrentTime(0);
            }
            setIsSplitViewPlaying(p => !p);
        }
    }, [isTimelineMode, timelineCurrentTime, timelineTotalDuration, splitViewCurrentTime, splitViewTotalDuration]);

    const handleRewind = useCallback(() => {
        if (isTimelineMode) {
            setTimelineCurrentTime(0);
            setIsTimelinePlaying(false);
        } else {
            setSplitViewCurrentTime(0);
            setIsSplitViewPlaying(false);
        }
    }, [isTimelineMode]);

    const aspectRatioClasses = {
        [AspectRatio.SIXTEEN_NINE]: 'aspect-[16/9] w-full max-w-5xl',
        [AspectRatio.NINE_SIXTEEN]: 'aspect-[9/16] h-full max-h-[90%]',
        [AspectRatio.SQUARE]: 'aspect-square h-full max-h-[90%]',
    };

    const pixelsPerSecond = useMemo(() => {
        const minPps = 20;
        const maxPps = 300;
        return minPps + (maxPps - minPps) * timelineZoom;
    }, [timelineZoom]);

    return (
        <div className="h-screen bg-brand-bg-dark font-sans flex flex-col text-brand-text overflow-hidden">
            <AudioTrackPlayer 
                timeline={project.editorTimeline}
                mediaAssets={project.mediaAssets}
                isPlaying={isTimelinePlaying}
                currentTime={timelineCurrentTime}
            />
            <header className="flex-shrink-0 border-b border-brand-border p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                     <button 
                        onClick={onBack}
                        className="p-2 rounded-md hover:bg-brand-bg-light transition-colors"
                        title="Back to Generator"
                    >
                        <ArrowLeftIcon className="w-6 h-6 text-brand-text-secondary"/>
                    </button>
                    <div>
                        <h2 className="text-xl font-bold">
                           <span className="text-brand-text-secondary">Generator &gt;</span> Editor: <span className="text-brand-purple-light">{project.name}</span>
                        </h2>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-brand-bg-dark rounded-lg border border-brand-border">
                        <button 
                            onClick={() => onSetEditorLayout(EditorLayout.TIMELINE)}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${project.editorLayout === EditorLayout.TIMELINE ? 'bg-brand-purple text-white' : 'text-brand-text-secondary hover:bg-brand-border'}`}
                        >
                            Timeline
                        </button>
                         <button 
                            onClick={() => onSetEditorLayout(EditorLayout.SPLIT_VIEW)}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${project.editorLayout === EditorLayout.SPLIT_VIEW ? 'bg-brand-purple text-white' : 'text-brand-text-secondary hover:bg-brand-border'}`}
                        >
                            Split View
                        </button>
                    </div>
                     <div className="relative">
                        <button 
                            onClick={() => setIsSettingsOpen(prev => !prev)}
                            className="p-2 rounded-md hover:bg-brand-bg-light transition-colors"
                            title="Project Settings"
                        >
                            <SettingsIcon className="w-6 h-6 text-brand-text-secondary"/>
                        </button>
                        {isSettingsOpen && (
                             <div className="absolute top-full right-0 mt-2 w-48 bg-brand-bg-light border border-brand-border rounded-lg shadow-lg z-20 p-2">
                                <p className="text-xs font-semibold text-brand-text-secondary px-2 pb-1">ASPECT RATIO</p>
                                <button onClick={() => { onSetEditorAspectRatio(AspectRatio.SIXTEEN_NINE); setIsSettingsOpen(false); }} className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${project.editorAspectRatio === AspectRatio.SIXTEEN_NINE ? 'bg-brand-purple text-white' : 'hover:bg-brand-border'}`}>16:9 Landscape</button>
                                <button onClick={() => { onSetEditorAspectRatio(AspectRatio.NINE_SIXTEEN); setIsSettingsOpen(false); }} className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${project.editorAspectRatio === AspectRatio.NINE_SIXTEEN ? 'bg-brand-purple text-white' : 'hover:bg-brand-border'}`}>9:16 Vertical</button>
                                <button onClick={() => { onSetEditorAspectRatio(AspectRatio.SQUARE); setIsSettingsOpen(false); }} className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${project.editorAspectRatio === AspectRatio.SQUARE ? 'bg-brand-purple text-white' : 'hover:bg-brand-border'}`}>1:1 Square</button>
                            </div>
                        )}
                    </div>
                     <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="px-4 py-2 bg-brand-purple text-white font-semibold rounded-md hover:bg-brand-purple-light transition disabled:bg-gray-500 text-sm"
                        disabled={(isTimelineMode && project.editorTimeline.length === 0) || (!isTimelineMode && Object.values(project.editorSplitViewLanes).every(lane => lane.clips.length === 0))}
                    >
                        Export Video
                    </button>
                </div>
            </header>
            <div className="flex-1 flex overflow-hidden">
                <CreativeHubPanel 
                    projectAssets={project.mediaAssets}
                    onImport={onImportMedia}
                    isOpen={isMediaHubOpen}
                    setIsOpen={setIsMediaHubOpen}
                />
                
                <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out`} onClick={(e) => {
                     if (e.target === e.currentTarget) {
                        setSelectedClipId(null);
                     }
                }}>
                    <div className="flex-1 p-4 bg-black/20 min-h-0 flex flex-col items-center justify-center gap-4">
                       <div className={`relative bg-black rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${aspectRatioClasses[project.editorAspectRatio]}`}>
                           {project.editorLayout === EditorLayout.TIMELINE ? (
                                <>
                                  {activeClipsForPreview.length === 0 && <div className="w-full h-full flex items-center justify-center"><p className="text-brand-text-secondary">Timeline is empty or playhead is on an empty section.</p></div>}
                                  {activeClipsForPreview.map(({ clip, asset, trimTime }) => (
                                     <TransformableMediaPreview
                                        key={clip.id} 
                                        asset={asset!} 
                                        clip={clip} 
                                        isPlaying={isTimelinePlaying} 
                                        currentTime={timelineCurrentTime} 
                                        isSelected={selectedClipId === clip.id}
                                        onUpdateClip={onUpdateTimelineClip}
                                        onSelect={setSelectedClipId}
                                        onHover={setHoveredClipId}
                                        isHovered={hoveredClipId === clip.id}
                                        trimPreviewTime={trimTime}
                                    />
                                  ))}
                                </>
                           ) : (
                               <SplitViewPreview project={project} currentTime={splitViewCurrentTime} isPlaying={isSplitViewPlaying} />
                           )}
                       </div>
                        <PlaybackControls 
                            isPlaying={isTimelineMode ? isTimelinePlaying : isSplitViewPlaying}
                            onPlayPause={handlePlayPause}
                            onRewind={handleRewind}
                            currentTime={isTimelineMode ? timelineCurrentTime : splitViewCurrentTime}
                            duration={isTimelineMode ? timelineTotalDuration : splitViewTotalDuration}
                        />
                    </div>

                    {project.editorLayout === EditorLayout.TIMELINE ? (
                        <div className="relative">
                            <Timeline 
                                project={project}
                                onSelect={setSelectedClipId}
                                selectedClipId={selectedClipId}
                                onSetTimeline={onSetTimeline}
                                onUpdateClip={onUpdateTimelineClip}
                                onAddTransition={onAddTransition}
                                onDeleteTransition={onDeleteTransition}
                                currentTime={timelineCurrentTime}
                                onSetCurrentTime={setTimelineCurrentTime}
                                activeTool={activeTool}
                                setActiveTool={setActiveTool}
                                totalDuration={timelineTotalDuration}
                                pixelsPerSecond={pixelsPerSecond}
                                onTrimPreview={setTrimPreview}
                            />
                            <TimelineZoomControl
                                zoom={timelineZoom}
                                setZoom={setTimelineZoom}
                            />
                        </div>
                    ) : (
                        <SplitViewEditor
                            project={project}
                            onUpdateLane={onUpdateSplitViewLane}
                            onAddAssetToProject={onAddAssetToProject}
                        />
                    )}
                </main>
                
                 <aside className="w-80 h-full bg-brand-bg-light border-l border-brand-border flex-shrink-0 flex flex-col">
                    <div className="flex p-1 bg-brand-bg-dark rounded-t-lg border-b border-brand-border m-2">
                        <button
                             onClick={() => setRightPanelTab('inspector')}
                             disabled={!selectedClip || !isTimelineMode}
                             className={`flex-1 flex items-center justify-center gap-2 text-sm py-1.5 rounded-md transition-colors ${rightPanelTab === 'inspector' ? 'bg-brand-purple text-white' : 'text-brand-text-secondary hover:bg-brand-border'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <CodeSlashIcon className="w-4 h-4" /> Inspektur
                        </button>
                        <button
                            onClick={() => setRightPanelTab('ai')}
                            className={`flex-1 flex items-center justify-center gap-2 text-sm py-1.5 rounded-md transition-colors ${rightPanelTab === 'ai' ? 'bg-brand-purple text-white' : 'text-brand-text-secondary hover:bg-brand-border'}`}
                        >
                            <BotMessageSquareIcon className="w-4 h-4" /> AI Director
                        </button>
                    </div>

                    {rightPanelTab === 'inspector' && selectedClip && selectedAsset && isTimelineMode ? (
                        <InspectorPanel
                            clip={selectedClip}
                            asset={selectedAsset}
                            onUpdateClip={onUpdateTimelineClip}
                            onUpdateClipDuration={onUpdateTimelineClipDuration}
                            onDeleteClip={() => onDeleteClip(selectedClip.id)}
                        />
                    ) : (
                        <CreativeDirectorPanel
                            chatHistory={project.editorChatHistory}
                            onSendMessage={onSendEditorMessage}
                            isThinking={isEditorThinking}
                        />
                    )}
                 </aside>
            </div>
            <ExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                project={project}
                onExport={onExportVideo}
                isExporting={isExporting}
                exportProgress={exportProgress}
                exportedVideoUrl={exportedVideoUrl}
            />
        </div>
    );
};
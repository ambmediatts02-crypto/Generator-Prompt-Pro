

import React, { useState, useMemo } from 'react';
import type { Project, SplitViewSlot, TimelineClip, MediaAsset } from '../types';
import { MiniTimeline } from './MiniTimeline';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineZoomControl } from './TimelineZoomControl';

// --- Split View Preview ---
interface SplitViewPreviewProps {
    project: Project;
    currentTime: number;
    isPlaying: boolean;
}

const findActiveClipAndTime = (lane: TimelineClip[], currentTime: number): { clip: TimelineClip; timeInClip: number } | null => {
    let timeInLane = 0;
    for (const clip of lane) {
        if (currentTime >= timeInLane && currentTime < timeInLane + clip.duration) {
            return { clip, timeInClip: currentTime - timeInLane };
        }
        timeInLane += clip.duration;
    }
    return null;
}

const VideoSlot = React.memo(({ activeClipData, asset, isPlaying }: {
    activeClipData: { clip: TimelineClip; timeInClip: number } | null;
    asset: MediaAsset | null;
    isPlaying: boolean;
}) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
        const video = videoRef.current;
        if (!video || !activeClipData || !asset) return;
        
        const { clip, timeInClip } = activeClipData;
        video.volume = clip.volume;
        const internalTime = timeInClip + clip.assetStart;

        if (Math.abs(video.currentTime - internalTime) > 0.2) {
            video.currentTime = internalTime;
        }
        
        if (isPlaying && video.paused) {
            video.play().catch(e => console.error("Split view playback error:", e));
        } else if (!isPlaying && !video.paused) {
            video.pause();
        }

    }, [activeClipData, asset, isPlaying]);
    
    return (
        <div className="w-full flex-1 bg-black overflow-hidden relative">
            {asset?.type === 'VIDEO' && activeClipData && (
                <video
                    ref={videoRef}
                    key={asset.id}
                    src={asset.url}
                    muted={false} // CRITICAL FIX: Ensure audio is not muted
                    loop
                    preload="auto"
                    className="w-full h-full object-cover"
                />
            )}
             {asset?.type === 'IMAGE' && activeClipData && (
                <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                />
            )}
        </div>
    );
});

export const SplitViewPreview: React.FC<SplitViewPreviewProps> = ({ project, currentTime, isPlaying }) => {
    const { editorSplitViewLanes, mediaAssets } = project;
    const assetMap = new Map(mediaAssets.map(asset => [asset.id, asset]));

    const activeTopData = findActiveClipAndTime(editorSplitViewLanes.top.clips, currentTime);
    const activeMiddleData = findActiveClipAndTime(editorSplitViewLanes.middle.clips, currentTime);
    const activeBottomData = findActiveClipAndTime(editorSplitViewLanes.bottom.clips, currentTime);

    return (
        <div className="w-full h-full flex-1 bg-brand-bg-dark rounded-lg overflow-hidden flex flex-col shadow-lg border border-brand-border">
            <VideoSlot
                activeClipData={activeTopData}
                asset={activeTopData ? assetMap.get(activeTopData.clip.mediaAssetId) || null : null}
                isPlaying={isPlaying}
            />
            <VideoSlot
                activeClipData={activeMiddleData}
                asset={activeMiddleData ? assetMap.get(activeMiddleData.clip.mediaAssetId) || null : null}
                isPlaying={isPlaying}
            />
            <VideoSlot
                activeClipData={activeBottomData}
                asset={activeBottomData ? assetMap.get(activeBottomData.clip.mediaAssetId) || null : null}
                isPlaying={isPlaying}
            />
        </div>
    );
};


// --- Split View Editor Panel ---
interface SplitViewEditorProps {
    project: Project;
    onUpdateLane: (slot: SplitViewSlot, updates: Partial<{ clips: TimelineClip[], zoom: number }>) => void;
    onAddAssetToProject: (asset: MediaAsset) => void;
}


export const SplitViewEditor: React.FC<SplitViewEditorProps> = ({ project, onUpdateLane, onAddAssetToProject }) => {
    const [activeTab, setActiveTab] = useState<SplitViewSlot>('top');
    const [activeTool, setActiveTool] = useState<'select' | 'split'>('select');
    const [playheadPosition, setPlayheadPosition] = useState(0);

    const TabButton: React.FC<{ slot: SplitViewSlot, label: string }> = ({ slot, label }) => (
        <button
            onClick={() => setActiveTab(slot)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                activeTab === slot 
                ? 'text-brand-purple border-b-2 border-brand-purple' 
                : 'text-brand-text-secondary hover:text-white'
            }`}
        >
            {label}
        </button>
    );

    const activeLane = project.editorSplitViewLanes[activeTab];
    if (!activeLane) return null;

    const handleSplitClip = (clipToSplit: TimelineClip, splitTime: number) => {
        const splitPointInClip = splitTime - clipToSplit.timelineStart;
        if (splitPointInClip <= 0.1 || (clipToSplit.duration - splitPointInClip) <= 0.1) return;

        const firstPart = { ...clipToSplit, duration: splitPointInClip };
        const secondPart = {
            ...clipToSplit,
            id: crypto.randomUUID(),
            duration: clipToSplit.duration - splitPointInClip,
            assetStart: clipToSplit.assetStart + splitPointInClip
        };

        const currentClips = activeLane.clips;
        const clipIndex = currentClips.findIndex(c => c.id === clipToSplit.id);
        if (clipIndex === -1) return;

        const newClips = [...currentClips];
        // Replace the original clip with the two new parts
        newClips.splice(clipIndex, 1, firstPart, secondPart);
        onUpdateLane(activeTab, { clips: newClips });
    };
    
    return (
        <div className="flex-shrink-0 min-h-[256px] h-auto bg-brand-bg-dark border-t border-brand-border flex flex-col">
            <header className="flex items-center border-b border-brand-border px-2">
                <TabButton slot="top" label="Top Lane" />
                <TabButton slot="middle" label="Middle Lane" />
                <TabButton slot="bottom" label="Bottom Lane" />
            </header>
            <div className="flex-1 p-2 overflow-hidden flex flex-col">
                <TimelineToolbar activeTool={activeTool} onSetTool={setActiveTool} />
                <div className="flex-1 relative min-h-0">
                    <MiniTimeline
                        clips={activeLane.clips}
                        mediaAssets={project.mediaAssets}
                        onUpdate={(clips) => onUpdateLane(activeTab, { clips })}
                        zoom={activeLane.zoom}
                        activeTool={activeTool}
                        onSplitClip={handleSplitClip}
                        playheadPosition={playheadPosition}
                        onSetPlayheadPosition={setPlayheadPosition}
                        onAddAssetToProject={onAddAssetToProject}
                    />
                     <TimelineZoomControl
                        zoom={activeLane.zoom}
                        setZoom={(zoom) => onUpdateLane(activeTab, { zoom })}
                    />
                </div>
            </div>
        </div>
    );
};


import React, { useRef, useState } from 'react';
import type { MediaAsset, StockTransition } from '../types';
import { UploadIcon, GalleryHorizontalIcon, SparklesIcon, FilmIcon, MusicNoteIcon, LayersIcon } from './icons';
import { STOCK_AUDIO, STOCK_TRANSITIONS } from '../data/stockAssets';

interface CreativeHubPanelProps {
    projectAssets: MediaAsset[];
    onImport: (files: File[]) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const MediaItem: React.FC<{ asset: MediaAsset; }> = ({ asset }) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/vfg-media-asset', JSON.stringify(asset));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div 
            draggable
            onDragStart={handleDragStart}
            className={`relative aspect-video rounded-md overflow-hidden cursor-grab active:cursor-grabbing group border-2 border-transparent hover:border-brand-purple/50`}
        >
            {asset.type === 'VIDEO' || asset.type === 'IMAGE' ? (
                 <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-purple-900/30 flex items-center justify-center">
                    <MusicNoteIcon className="w-8 h-8 text-purple-300" />
                </div>
            )}
           
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            
            {asset.isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-2">
                    <SparklesIcon className="w-6 h-6 text-purple-300 animate-pulse" />
                    <p className="text-xs text-purple-200 mt-1">AI Analyzing...</p>
                </div>
            )}

            <div className="absolute bottom-1 left-2 right-2">
                <p className="text-xs font-semibold text-white truncate">{asset.name}</p>
                 <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${asset.source === 'AI' ? 'bg-purple-500' : asset.source === 'UPLOAD' ? 'bg-blue-500' : 'bg-green-500'}`}>
                    {asset.source}
                </span>
            </div>
        </div>
    );
};

const TransitionItem: React.FC<{ transition: StockTransition }> = ({ transition }) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/vfg-transition', JSON.stringify(transition));
        e.dataTransfer.effectAllowed = 'link';
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="h-20 bg-brand-bg-dark border border-brand-border rounded-md flex flex-col items-center justify-center cursor-grab active:cursor-grabbing group"
        >
            <LayersIcon className="w-6 h-6 text-brand-text-secondary group-hover:text-brand-purple transition-colors" />
            <p className="text-xs font-semibold text-brand-text-secondary mt-1">{transition.name}</p>
        </div>
    );
};


export const CreativeHubPanel: React.FC<CreativeHubPanelProps> = ({ projectAssets, onImport, isOpen, setIsOpen }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'media' | 'audio' | 'transitions'>('media');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            onImport(Array.from(event.target.files));
        }
        event.target.value = '';
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const projectMedia = projectAssets.filter(a => a.type === 'VIDEO' || a.type === 'IMAGE');
    const projectAudio = projectAssets.filter(a => a.type === 'AUDIO');

    const TabButton: React.FC<{ tab: 'media' | 'audio' | 'transitions'; children: React.ReactNode; }> = ({ tab, children }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 text-sm py-1 rounded-md transition-colors ${activeTab === tab ? 'bg-brand-purple text-white' : 'text-brand-text-secondary hover:bg-brand-border'}`}
        >
            {children}
        </button>
    );

    return (
        <aside 
            className={`relative h-full bg-brand-bg-light border-r border-brand-border flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-80' : 'w-16'}`}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <div className={`w-80 h-full flex flex-col transition-opacity duration-200 ${isOpen ? 'opacity-100 delay-200' : 'opacity-0 pointer-events-none'}`}>
                <header className="p-4 border-b border-brand-border flex-shrink-0">
                    <h3 className="text-lg font-bold">Creative Hub</h3>
                    <div className="mt-2">
                        <div className="flex bg-brand-bg-dark p-1 rounded-md border border-brand-border">
                            <TabButton tab="media"><FilmIcon className="w-4 h-4" /> Media</TabButton>
                            <TabButton tab="audio"><MusicNoteIcon className="w-4 h-4" /> Audio</TabButton>
                            <TabButton tab="transitions"><LayersIcon className="w-4 h-4" /> Transitions</TabButton>
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'media' && (
                        <div className="grid grid-cols-2 gap-3">
                            {projectMedia.map(asset => (
                                <MediaItem key={asset.id} asset={asset} />
                            ))}
                        </div>
                    )}
                    {activeTab === 'audio' && (
                         <div className="flex flex-col gap-4">
                            <div>
                                <h4 className="text-xs font-bold uppercase text-brand-text-secondary mb-2">Project Audio</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {projectAudio.map(asset => (
                                        <MediaItem key={asset.id} asset={asset} />
                                    ))}
                                </div>
                                {projectAudio.length === 0 && <p className="text-xs text-brand-text-secondary italic">No audio in project.</p>}
                            </div>
                             <div>
                                <h4 className="text-xs font-bold uppercase text-brand-text-secondary mb-2">Stock Music</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {STOCK_AUDIO.map(asset => (
                                        <MediaItem key={asset.id} asset={asset} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'transitions' && (
                        <div>
                             <h4 className="text-xs font-bold uppercase text-brand-text-secondary mb-2">Effects</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {STOCK_TRANSITIONS.map(t => <TransitionItem key={t.type} transition={t} />)}
                            </div>
                        </div>
                    )}
                </div>
                <footer className="p-4 border-t border-brand-border flex-shrink-0">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="video/*,audio/*,image/*"
                        multiple
                    />
                    <button
                        onClick={handleImportClick}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-bg-dark text-brand-text-secondary rounded-md hover:bg-brand-border transition-colors"
                    >
                        <UploadIcon className="w-5 h-5" />
                        Import Media
                    </button>
                </footer>
            </div>
            
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <GalleryHorizontalIcon className="w-8 h-8 text-brand-text-secondary" />
            </div>
        </aside>
    );
};

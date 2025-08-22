import React, { useState, useEffect, useRef } from 'react';
import type { Scene } from '../types';
import { GenerationStatus } from '../types';
import { EditIcon, SaveIcon, RefreshCwIcon, TrashIcon, MessageCircleIcon, XCircleIcon, ClapperboardIcon, VolumeUpIcon, PlayIcon, PauseIcon, AlertTriangleIcon } from './icons';
import { translateText } from '../services/geminiService';

interface SceneCardProps {
    scene: Scene;
    sceneNumber: number;
    onUpdate: (sceneId: string, updatedScene: Partial<Scene>) => void;
    onDelete: (sceneId: string) => void;
    onRegenerate: (sceneId: string) => void;
    isRegenerating: boolean;
    onGenerateVideo: (sceneId: string, sceneNumber: number) => void;
    onGenerateAudio: (sceneId: string, sceneNumber: number) => void;
}

const ControlButton: React.FC<{ onClick: () => void; children: React.ReactNode; label: string; className?: string; disabled?: boolean }> = 
    ({ onClick, children, label, className = '', disabled = false }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={`p-2 rounded-md transition-colors text-brand-text-secondary hover:bg-brand-border hover:text-brand-text disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {children}
        </button>
    );

const MiniAudioPlayer: React.FC<{ src: string }> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };
    
    useEffect(() => {
        const audioEl = audioRef.current;
        const handleEnded = () => setIsPlaying(false);
        if (audioEl) {
            audioEl.addEventListener('ended', handleEnded);
            return () => audioEl.removeEventListener('ended', handleEnded);
        }
    }, []);

    return (
        <div className="flex items-center gap-2">
            <audio ref={audioRef} src={src} preload="auto"></audio>
            <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-brand-purple hover:bg-brand-purple-light text-white transition"
                aria-label={isPlaying ? "Pause narration" : "Play narration"}
            >
                {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            </button>
        </div>
    );
};

export const SceneCard: React.FC<SceneCardProps> = ({
    scene,
    sceneNumber,
    onUpdate,
    onDelete,
    onRegenerate,
    isRegenerating,
    onGenerateVideo,
    onGenerateAudio,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedEnglish, setEditedEnglish] = useState(scene.english);
    const [editedIndonesian, setEditedIndonesian] = useState(scene.indonesian);
    const [editedVoiceOver, setEditedVoiceOver] = useState(scene.voiceOver_Indonesian || '');
    const [isSaving, setIsSaving] = useState(false);
    const [lastEditedField, setLastEditedField] = useState<'english' | 'indonesian' | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    
    const isGeneratingAnything = isRegenerating || scene.videoGenerationStatus === GenerationStatus.GENERATING || scene.audioGenerationStatus === GenerationStatus.GENERATING;

    useEffect(() => {
        if (!isEditing) {
            setEditedEnglish(scene.english);
            setEditedIndonesian(scene.indonesian);
            setEditedVoiceOver(scene.voiceOver_Indonesian || '');
        }
    }, [scene, isEditing]);

    const handleSave = async () => {
        setIsSaving(true);
        setEditError(null);
        try {
            let finalEnglish = editedEnglish;
            let finalIndonesian = editedIndonesian;

            if (lastEditedField === 'english') {
                finalIndonesian = await translateText(editedEnglish, 'english', 'indonesian');
            } else if (lastEditedField === 'indonesian') {
                finalEnglish = await translateText(editedIndonesian, 'indonesian', 'english');
            }
            
            onUpdate(scene.id, { 
                english: finalEnglish, 
                indonesian: finalIndonesian,
                voiceOver_Indonesian: editedVoiceOver || undefined
            });

            setIsEditing(false);
            setLastEditedField(null);
        } catch (err: any) {
            setEditError(err.message || "Translation failed.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedEnglish(scene.english);
        setEditedIndonesian(scene.indonesian);
        setEditedVoiceOver(scene.voiceOver_Indonesian || '');
        setIsEditing(false);
        setLastEditedField(null);
        setEditError(null);
    };

    return (
        <div className="bg-brand-bg-dark p-4 rounded-lg border border-brand-border">
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-brand-purple-light pt-2">Scene {sceneNumber}</h4>
                <div className="flex items-center gap-1">
                    {isEditing ? (
                        <>
                            <ControlButton onClick={handleSave} label="Save & Sync Changes" disabled={isSaving}>
                                {isSaving ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
                            </ControlButton>
                            <ControlButton onClick={handleCancel} label="Cancel Edit" disabled={isSaving}>
                                <XCircleIcon className="w-5 h-5" />
                            </ControlButton>
                        </>
                    ) : (
                        <>
                            <ControlButton onClick={() => onGenerateVideo(scene.id, sceneNumber)} label="Generate Video for this Scene" disabled={isGeneratingAnything}>
                                {scene.videoGenerationStatus === GenerationStatus.GENERATING ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : <ClapperboardIcon className="w-5 h-5" />}
                            </ControlButton>
                            <ControlButton onClick={() => setIsEditing(true)} label="Edit Scene" disabled={isGeneratingAnything}>
                                <EditIcon className="w-5 h-5" />
                            </ControlButton>
                            <ControlButton onClick={() => onRegenerate(scene.id)} label="Regenerate Scene" disabled={isGeneratingAnything}>
                                {isRegenerating ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : <RefreshCwIcon className="w-5 h-5" />}
                            </ControlButton>
                            <ControlButton onClick={() => onDelete(scene.id)} label="Delete Scene" className="hover:bg-red-900/50 hover:text-red-300" disabled={isGeneratingAnything}>
                                <TrashIcon className="w-5 h-5" />
                            </ControlButton>
                        </>
                    )}
                </div>
            </div>
            
             {/* Main Content Area */}
            {scene.videoGenerationStatus === GenerationStatus.SUCCESS && scene.videoUrl ? (
                 <div className="aspect-video w-full rounded-md overflow-hidden border border-brand-border mt-2">
                    <video src={scene.videoUrl} controls autoPlay loop muted className="w-full h-full bg-black" />
                </div>
            ) : (
                <div className="flex flex-col gap-3 text-sm text-brand-text-secondary">
                    {scene.videoGenerationStatus === GenerationStatus.GENERATING && (
                        <div className="flex flex-col items-center justify-center p-8 bg-brand-bg-light/50 rounded-md">
                             <RefreshCwIcon className="w-8 h-8 animate-spin text-brand-purple-light mb-2" />
                             <p className="text-sm font-semibold">Generating video, this may take a moment...</p>
                        </div>
                    )}
                    {scene.videoGenerationStatus === GenerationStatus.ERROR && (
                        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500 text-red-300 rounded-md">
                            <AlertTriangleIcon className="w-5 h-5" />
                            <p>Video generation failed for this scene.</p>
                        </div>
                    )}

                    {isEditing ? (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-brand-text-secondary mb-1 block">English</label>
                                <textarea value={editedEnglish} onChange={(e) => { setEditedEnglish(e.target.value); setLastEditedField('english'); setEditError(null); }} className="w-full h-24 p-2 bg-brand-bg-light border border-brand-purple rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none transition resize-y" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-brand-text-secondary mb-1 block">Indonesian</label>
                                <textarea value={editedIndonesian} onChange={(e) => { setEditedIndonesian(e.target.value); setLastEditedField('indonesian'); setEditError(null); }} className="w-full h-24 p-2 bg-brand-bg-light border border-brand-purple rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none transition resize-y" />
                            </div>
                            { (scene.voiceOver_Indonesian !== undefined || editedVoiceOver) &&
                              <div>
                                <label className="text-xs font-semibold text-brand-text-secondary mb-1 block flex items-center gap-1.5"><MessageCircleIcon className="w-3.5 h-3.5" /> Voice Over (Indonesian)</label>
                                <textarea value={editedVoiceOver} onChange={(e) => setEditedVoiceOver(e.target.value)} placeholder="Edit the voice-over script here..." className="w-full h-16 p-2 bg-brand-bg-light border border-brand-purple rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none transition resize-y" />
                            </div>
                            }
                            {editError && <p className="text-xs text-red-400 -mt-1">{editError}</p>}
                        </>
                    ) : (
                        <>
                            <p className="whitespace-pre-wrap">{scene.english}</p>
                            <p className="whitespace-pre-wrap italic opacity-80 mt-2">{scene.indonesian}</p>
                        </>
                    )}
                </div>
            )}
            
            {/* Voice-over Section */}
            {scene.voiceOver_Indonesian && !isEditing && (
                <div className="mt-3 pt-3 border-t border-brand-border/50 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 flex-1">
                        <MessageCircleIcon className="w-4 h-4 text-brand-purple-light flex-shrink-0 mt-0.5" />
                        <p className="whitespace-pre-wrap italic text-purple-200 text-sm">"{scene.voiceOver_Indonesian}"</p>
                    </div>
                    <div className="flex-shrink-0">
                        {scene.audioGenerationStatus === 'SUCCESS' && scene.audioUrl ? (
                            <MiniAudioPlayer src={scene.audioUrl} />
                        ) : (
                            <button
                                onClick={() => onGenerateAudio(scene.id, sceneNumber)}
                                disabled={isGeneratingAnything}
                                className="flex items-center gap-2 px-3 py-1 text-xs bg-brand-bg-dark text-brand-text-secondary hover:bg-brand-border rounded-md transition disabled:opacity-50"
                                title="Generate audio narration"
                            >
                                {scene.audioGenerationStatus === 'GENERATING' ? (
                                    <>
                                        <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <VolumeUpIcon className="w-4 h-4" />
                                        <span>Generate Audio</span>
                                    </>
                                )}
                            </button>
                        )}
                        {scene.audioGenerationStatus === 'ERROR' && (
                             <div className="flex items-center gap-1 text-xs text-red-400" title="Audio generation failed">
                                <AlertTriangleIcon className="w-4 h-4" />
                                <span>Error</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};
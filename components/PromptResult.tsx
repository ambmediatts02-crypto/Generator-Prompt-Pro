
import React, { useState, useEffect } from 'react';
import type { GeneratedPrompts, Scene } from '../types';
import { CopyIcon, CheckIcon, MusicIcon, SoundWaveIcon, EditIcon, SaveIcon, XCircleIcon, RefreshCwIcon } from './icons';
import { SceneCard } from './SceneCard';

interface PromptResultProps {
  prompts: GeneratedPrompts;
  onUpdateOverture: (indonesianText: string) => Promise<void>;
  isOvertureSaving: boolean;
  onRegenerateScene: (sceneId: string) => void;
  onUpdateScene: (sceneId: string, updatedScene: Partial<Scene>) => void;
  onDeleteScene: (sceneId: string) => void;
  regeneratingSceneId: string | null;
  onGenerateSceneVideo: (sceneId: string, sceneNumber: number) => void;
  onGenerateSceneAudio: (sceneId: string, sceneNumber: number) => void;
}

const ControlButton: React.FC<{ onClick: () => void; children: React.ReactNode; label: string; className?: string; disabled?: boolean }> = 
    ({ onClick, children, label, className = '', disabled = false }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={`flex items-center gap-2 px-3 py-1 text-sm bg-brand-bg-dark text-brand-text-secondary hover:bg-brand-border rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {children}
        </button>
    );

const FullScriptDisplay: React.FC<{ title: string; text: string; }> = ({ title, text }) => {
    const [copied, setCopied] = React.useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold text-brand-text">{title}</h4>
                <ControlButton onClick={handleCopy} label={`Copy full ${title} script`}>
                     {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                     {copied ? 'Copied!' : 'Copy'}
                </ControlButton>
            </div>
            <div className="bg-brand-bg-dark p-4 rounded-md border border-brand-border text-brand-text-secondary whitespace-pre-wrap text-sm max-h-72 overflow-y-auto">
                {text}
            </div>
        </div>
    );
};


export const PromptResult: React.FC<PromptResultProps> = ({ 
  prompts,
  onUpdateOverture,
  isOvertureSaving,
  onRegenerateScene,
  onUpdateScene,
  onDeleteScene,
  regeneratingSceneId,
  onGenerateSceneVideo,
  onGenerateSceneAudio,
}) => {
    const [isEditingOverture, setIsEditingOverture] = useState(false);
    const [editedIndonesianOverture, setEditedIndonesianOverture] = useState(prompts.overture.indonesian);
    const [copiedIndo, setCopiedIndo] = useState(false);

    useEffect(() => {
        if (!isEditingOverture) {
            setEditedIndonesianOverture(prompts.overture.indonesian);
        }
    }, [prompts.overture.indonesian, isEditingOverture]);

    const handleSaveOverture = async () => {
        await onUpdateOverture(editedIndonesianOverture);
        setIsEditingOverture(false);
    };

    const handleCancelOverture = () => {
        setEditedIndonesianOverture(prompts.overture.indonesian);
        setIsEditingOverture(false);
    };

    const fullEnglishPrompt = React.useMemo(() => {
        const sceneTexts = prompts.scenes.map((scene, index) => `Scene ${index + 1}: ${scene.english}`).join('\n\n');
        return `${prompts.overture.english}\n\n${sceneTexts}`;
    }, [prompts.overture.english, prompts.scenes]);

    const fullIndonesianPrompt = React.useMemo(() => {
        const sceneTexts = prompts.scenes.map((scene, index) => `Adegan ${index + 1}: ${scene.indonesian}`).join('\n\n');
        return `${prompts.overture.indonesian}\n\n${sceneTexts}`;
    }, [prompts.overture.indonesian, prompts.scenes]);

    const handleCopyIndo = () => {
        navigator.clipboard.writeText(fullIndonesianPrompt).then(() => {
            setCopiedIndo(true);
            setTimeout(() => setCopiedIndo(false), 2000);
        });
    };

  return (
    <div className="bg-brand-bg-light p-6 rounded-lg border border-brand-border shadow-lg flex flex-col gap-8">
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-brand-text">Generated Storyboard</h2>
        </div>
        
        <div className="mb-6 pb-6 border-b border-brand-border">
            <h3 className="text-xl font-bold text-brand-text mb-4">Master Prompt (The Final Script)</h3>
            <div className="flex flex-col gap-4">
                <FullScriptDisplay title="English" text={fullEnglishPrompt} />
                
                {isEditingOverture ? (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-md font-semibold text-brand-text">Editing Overture (Indonesian)</h4>
                            <div className="flex items-center gap-2">
                                <ControlButton onClick={handleSaveOverture} label="Save & Sync Overture" disabled={isOvertureSaving}>
                                    {isOvertureSaving ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                                    {isOvertureSaving ? 'Saving...' : 'Save'}
                                </ControlButton>
                                <ControlButton onClick={handleCancelOverture} label="Cancel Edit" disabled={isOvertureSaving}>
                                    <XCircleIcon className="w-4 h-4" /> Cancel
                                </ControlButton>
                            </div>
                        </div>
                         <textarea
                            value={editedIndonesianOverture}
                            onChange={(e) => setEditedIndonesianOverture(e.target.value)}
                            className="w-full h-40 p-3 bg-brand-bg-dark border border-brand-purple rounded-md focus:ring-1 focus:ring-brand-purple focus:outline-none transition resize-y text-brand-text-secondary text-sm"
                        />
                    </div>
                ) : (
                    <div>
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="text-md font-semibold text-brand-text">Indonesian</h4>
                            <div className="flex items-center gap-2">
                                <ControlButton onClick={handleCopyIndo} label="Copy Indonesian Overture" disabled={isEditingOverture}>
                                    {copiedIndo ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                                    {copiedIndo ? 'Copied!' : 'Copy'}
                                </ControlButton>
                                <ControlButton onClick={() => setIsEditingOverture(true)} label="Edit Indonesian Overture">
                                    <EditIcon className="w-4 h-4" /> Edit Overture
                                </ControlButton>
                            </div>
                        </div>
                        <div className="bg-brand-bg-dark p-4 rounded-md border border-brand-border text-brand-text-secondary whitespace-pre-wrap text-sm max-h-72 overflow-y-auto">
                            {fullIndonesianPrompt}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {/* Scenes Section */}
      <div>
        <h3 className="text-xl font-bold text-brand-text mb-4">Scenes (Interactive Editing)</h3>
        <div className="flex flex-col gap-4">
            {prompts.scenes.map((scene, index) => (
                <SceneCard 
                    key={scene.id}
                    scene={scene}
                    sceneNumber={index + 1}
                    onUpdate={onUpdateScene}
                    onDelete={onDeleteScene}
                    onRegenerate={onRegenerateScene}
                    isRegenerating={regeneratingSceneId === scene.id}
                    onGenerateVideo={onGenerateSceneVideo}
                    onGenerateAudio={onGenerateSceneAudio}
                />
            ))}
        </div>
      </div>

      {prompts.soundscape && (
        <div className="mt-2 pt-6 border-t border-brand-border">
            <h3 className="text-xl font-bold text-brand-text mb-4">Soundscape Suggestion</h3>
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <MusicIcon className="w-5 h-5 mt-1 text-brand-purple-light flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-brand-text-secondary">Music</h4>
                        <p className="text-brand-text-secondary text-sm">{prompts.soundscape.music}</p>
                    </div>
                </div>
                {prompts.soundscape.sfx && prompts.soundscape.sfx.length > 0 && (
                    <div className="flex items-start gap-3">
                        <SoundWaveIcon className="w-5 h-5 mt-1 text-brand-purple-light flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-brand-text-secondary">Sound Effects (SFX)</h4>
                            <ul className="list-disc list-inside text-brand-text-secondary text-sm space-y-1 mt-1">
                                {prompts.soundscape.sfx.map((effect, index) => (
                                    <li key={index}>{effect}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

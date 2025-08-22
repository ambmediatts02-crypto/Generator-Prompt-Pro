import React from 'react';
import { BaseImage, StoryboardImage, ObjectRole, DirectorStyle, ChatMessage } from '../types';
import { ImageUploader } from './ImageUploader';
import { XCircleIcon, PersonIcon, BoxIcon, LightbulbIcon, MessageCircleIcon } from './icons';
import { DirectorStyleSelector } from './DirectorStyleSelector';
import { ChatWindow } from './ChatWindow';

interface StoryboardEditorProps {
    mainBrief: string;
    setMainBrief: React.Dispatch<React.SetStateAction<string>>;
    backgroundImage: BaseImage | null;
    setBackgroundImage: (image: BaseImage | null) => void;
    objectImages: StoryboardImage[];
    setObjectImages: React.Dispatch<React.SetStateAction<StoryboardImage[]>>;
    updateObjectImageRole: (id: string, role: ObjectRole) => void;
    directorStyle: DirectorStyle;
    setDirectorStyle: (style: DirectorStyle) => void;
    onCreativeSpark: () => void;
    isSparking: boolean;
    disabled: boolean;
    dialogueMode: boolean;
    setDialogueMode: (mode: boolean) => void;
    chatHistory: ChatMessage[];
    onSendMessage: (message: string) => void;
    isChatting: boolean;
    onFinalizeScript: () => void;
    isFinalizingScript: boolean;
}

export const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ 
    mainBrief, setMainBrief, 
    backgroundImage, setBackgroundImage,
    objectImages, setObjectImages,
    updateObjectImageRole,
    directorStyle, setDirectorStyle,
    onCreativeSpark, isSparking,
    disabled,
    dialogueMode, setDialogueMode,
    chatHistory, onSendMessage, isChatting,
    onFinalizeScript, isFinalizingScript
}) => {

    const handleNewObjectImages = (newImages: BaseImage[]) => {
        if (newImages.length > 0) {
            const newStoryboardImages: StoryboardImage[] = newImages.map(img => ({
                ...img,
                role: ObjectRole.PERSON
            }));
            setObjectImages(prev => [...prev, ...newStoryboardImages].slice(0, 5));
        }
    };
    
    const removeObjectImage = (id: string) => {
        setObjectImages(prev => prev.filter(img => img.id !== id));
    };

    const handleBackgroundImageUpload = (images: BaseImage[]) => {
        setBackgroundImage(images[0] || null);
    };
    
    const handleAddSuggestionToBrief = (suggestion: string) => {
        setMainBrief(prev => `${prev}\n\n- ${suggestion}`);
        setDialogueMode(false);
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-xl font-semibold text-brand-text mb-4">1. Add Images (Set, Actors & Props)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-md font-medium text-brand-text-secondary">Background Image (The Set)</h3>
                        <div className="h-40">
                            {backgroundImage ? (
                                <div className="relative w-full h-full group">
                                    <img src={`data:${backgroundImage.mimeType};base64,${backgroundImage.base64}`} alt="Background" className="w-full h-full object-cover rounded-md" />
                                    <button
                                        onClick={() => setBackgroundImage(null)}
                                        disabled={disabled}
                                        className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100 disabled:hidden"
                                        aria-label="Remove background image"
                                    >
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            ) : (
                                <ImageUploader 
                                    onImageUpload={handleBackgroundImageUpload} 
                                    disabled={disabled} 
                                    containerClassName="h-40"
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                         <h3 className="text-md font-medium text-brand-text-secondary">Object Images (Actors & Props)</h3>
                         <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                            {objectImages.map((img) => (
                                <div key={img.id} className="flex flex-col">
                                    <div className="relative group w-full h-24">
                                        <img src={`data:${img.mimeType};base64,${img.base64}`} alt={`Object image ${img.id}`} className="w-full h-full object-cover rounded-md" />
                                         <button
                                            onClick={() => removeObjectImage(img.id)}
                                            disabled={disabled}
                                            className="absolute top-1 right-1 p-0.5 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-opacity opacity-0 group-hover:opacity-100 disabled:hidden"
                                            aria-label="Remove object image"
                                          >
                                            <XCircleIcon className="w-5 h-5" />
                                          </button>
                                    </div>
                                    <div className="flex justify-center gap-2 mt-2">
                                        <button 
                                            onClick={() => updateObjectImageRole(img.id, ObjectRole.PERSON)} 
                                            className={`p-1.5 rounded-full transition-colors ${img.role === ObjectRole.PERSON ? 'bg-brand-purple text-white' : 'bg-brand-bg-light text-white/80 hover:bg-brand-purple'}`} 
                                            aria-label="Tag as Person">
                                            <PersonIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => updateObjectImageRole(img.id, ObjectRole.PROP)} 
                                            className={`p-1.5 rounded-full transition-colors ${img.role === ObjectRole.PROP ? 'bg-brand-purple text-white' : 'bg-brand-bg-light text-white/80 hover:bg-brand-purple'}`} 
                                            aria-label="Tag as Prop">
                                            <BoxIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {objectImages.length < 5 && (
                                <div className="w-full h-24">
                                    <ImageUploader 
                                        onImageUpload={handleNewObjectImages}
                                        disabled={disabled || objectImages.length >= 5}
                                        containerClassName="h-24"
                                        multiple={true}
                                    />
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            </div>
            
            <div>
                 <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-brand-text">2. Write Main Brief (The Script)</h2>
                     <div className="flex items-center gap-2">
                        <button
                            onClick={onCreativeSpark}
                            disabled={disabled || isSparking || dialogueMode}
                            className="flex items-center gap-2 px-3 py-1 text-sm bg-brand-bg-dark text-brand-text-secondary hover:bg-brand-border rounded-md transition disabled:opacity-50"
                            title="Get a creative suggestion"
                        >
                            <LightbulbIcon className={`w-4 h-4 ${isSparking ? 'text-yellow-300 animate-pulse' : ''}`} />
                            {isSparking ? 'Thinking...' : 'Creative Spark'}
                        </button>
                        <button
                            onClick={() => setDialogueMode(!dialogueMode)}
                            disabled={disabled}
                            className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition ${dialogueMode ? 'bg-brand-purple text-white' : 'bg-brand-bg-dark text-brand-text-secondary hover:bg-brand-border'}`}
                            title={dialogueMode ? "Switch to Script Mode" : "Switch to Dialogue Mode"}
                        >
                           <MessageCircleIcon className="w-4 h-4" />
                            {dialogueMode ? 'Script Mode' : 'Dialogue Mode'}
                        </button>
                    </div>
                </div>
                {dialogueMode ? (
                    <ChatWindow 
                        history={chatHistory}
                        onSendMessage={onSendMessage}
                        isChatting={isChatting}
                        onAddSuggestion={handleAddSuggestionToBrief}
                        onFinalizeScript={onFinalizeScript}
                        isFinalizingScript={isFinalizingScript}
                    />
                ) : (
                    <textarea
                        value={mainBrief}
                        onChange={(e) => setMainBrief(e.target.value)}
                        placeholder="e.g., Direct a scene where the person holds the prop. The mood should be mysterious..."
                        className="w-full h-32 p-3 bg-brand-bg-dark border border-brand-border rounded-md focus:ring-2 focus:ring-brand-purple focus:outline-none transition resize-none text-brand-text-secondary"
                        disabled={disabled}
                    />
                )}
            </div>

            <DirectorStyleSelector 
                currentStyle={directorStyle} 
                setStyle={setDirectorStyle} 
                disabled={disabled} 
            />
        </div>
    );
};
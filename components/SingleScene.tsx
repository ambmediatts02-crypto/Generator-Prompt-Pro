import React from 'react';
import { BaseImage, VideoOptions } from '../types';
import { ImageUploader } from './ImageUploader';
import { OptionsPanel } from './OptionsPanel';
import { XCircleIcon } from './icons';

interface SingleSceneEditorProps {
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    referenceImage: BaseImage | null;
    setReferenceImage: (image: BaseImage | null) => void;
    options: VideoOptions;
    setOptions: React.Dispatch<React.SetStateAction<VideoOptions>>;
    disabled: boolean;
}

export const SingleSceneEditor: React.FC<SingleSceneEditorProps> = ({
    prompt,
    setPrompt,
    referenceImage,
    setReferenceImage,
    options,
    setOptions,
    disabled
}) => {
    const handleImageUpload = (images: BaseImage[]) => {
        setReferenceImage(images[0] || null);
    };

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Left Panel: Prompt and Options */}
            <div className="flex-1 flex flex-col gap-6">
                <div>
                    <h2 className="text-xl font-semibold text-brand-text mb-2">1. Write Prompt</h2>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A majestic lion roaring on a rocky cliff at sunset."
                        className="w-full h-32 p-3 bg-brand-bg-dark border border-brand-border rounded-md focus:ring-2 focus:ring-brand-purple focus:outline-none transition resize-y text-brand-text-secondary"
                        disabled={disabled}
                        aria-label="Video prompt"
                    />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-brand-text mb-2">2. Set Options</h2>
                    <OptionsPanel options={options} setOptions={setOptions} disabled={disabled} />
                </div>
            </div>

            {/* Right Panel: Image Uploader */}
            <div className="md:w-1/3 flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-brand-text mb-2">3. Add Image (Optional)</h2>
                <div className="h-56">
                    {referenceImage ? (
                        <div className="relative w-full h-full group">
                            <img
                                src={`data:${referenceImage.mimeType};base64,${referenceImage.base64}`}
                                alt="Reference"
                                className="w-full h-full object-cover rounded-md"
                            />
                            <button
                                onClick={() => setReferenceImage(null)}
                                disabled={disabled}
                                className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100 disabled:hidden"
                                aria-label="Remove reference image"
                            >
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                    ) : (
                        <ImageUploader
                            onImageUpload={handleImageUpload}
                            disabled={disabled}
                            containerClassName="h-full"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
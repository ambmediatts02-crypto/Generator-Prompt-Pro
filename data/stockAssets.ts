import type { MediaAsset, StockTransition } from '../types';
import { TransitionType } from '../types';

// Placeholder data for stock audio assets. In a real app, these URLs would point to actual audio files.
const placeholderUrl = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTG93IFDeltaSBUb24=";

export const STOCK_AUDIO: MediaAsset[] = [
    {
        id: 'stock-music-1',
        type: 'AUDIO',
        source: 'STOCK',
        name: 'Lofi Chill Beat',
        url: placeholderUrl,
        thumbnailUrl: '', // Audio has no thumbnail
        createdAt: Date.now(),
        duration: 125, // in seconds
        aiAnalysis: 'A relaxing, downtempo lofi hip-hop track with a simple piano melody and soft drum beat.'
    },
    {
        id: 'stock-music-2',
        type: 'AUDIO',
        source: 'STOCK',
        name: 'Upbeat Corporate',
        url: placeholderUrl,
        thumbnailUrl: '',
        createdAt: Date.now(),
        duration: 95,
        aiAnalysis: 'An optimistic and motivational corporate track with ukulele, clapping, and a positive vibe.'
    },
    {
        id: 'stock-music-3',
        type: 'AUDIO',
        source: 'STOCK',
        name: 'Epic Cinematic',
        url: placeholderUrl,
        thumbnailUrl: '',
        createdAt: Date.now(),
        duration: 180,
        aiAnalysis: 'A powerful and sweeping orchestral piece, suitable for trailers or dramatic scenes. Features strings and brass.'
    },
     {
        id: 'stock-sfx-1',
        type: 'AUDIO',
        source: 'STOCK',
        name: 'Button Click SFX',
        url: placeholderUrl,
        thumbnailUrl: '',
        createdAt: Date.now(),
        duration: 1.5,
        aiAnalysis: 'A simple, clean sound effect of a digital button click.'
    }
];

export const STOCK_TRANSITIONS: StockTransition[] = [
    {
        type: TransitionType.CROSS_DISSOLVE,
        name: 'Cross Dissolve'
    }
];

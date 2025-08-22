
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import type { Project, MediaAsset, Scene } from '../types';

function getValue<T>(key: string, initialValue: T | (() => T)): T {
  const savedValue = localStorage.getItem(key);
  
  if (savedValue !== null && savedValue !== 'undefined') {
    try {
      return JSON.parse(savedValue);
    } catch (error) {
       console.error(`Error parsing JSON from localStorage key "${key}":`, savedValue, error);
    }
  }
  
  return initialValue instanceof Function ? initialValue() : initialValue;
}

// This function strips large, non-serializable, or temporary data from a project object before storage.
function sanitizeProjectForStorage(project: Project): Partial<Project> {
  // Create a deep copy to prevent mutating the live application state.
  // This is a safe way to handle nested objects for JSON-compatible data.
  const projectToStore = JSON.parse(JSON.stringify(project));

  // Nullify fields containing large base64 strings or temporary blob URLs.
  projectToStore.singleReferenceImage = null;
  projectToStore.backgroundImage = null;
  projectToStore.objectImages = [];
  projectToStore.generatedVideoUrl = null;

  // Clean media assets: preserve metadata but remove URLs.
  projectToStore.mediaAssets = project.mediaAssets.map((asset: MediaAsset) => ({
    ...asset,
    url: '', // This was a blob URL, which is invalid on page reload anyway.
    thumbnailUrl: '', // This was a large base64 data URL.
    isObjectURL: false,
  }));

  // Clean scenes within generated prompts.
  if (projectToStore.generatedPrompts && projectToStore.generatedPrompts.scenes) {
    projectToStore.generatedPrompts.scenes = projectToStore.generatedPrompts.scenes.map((scene: Scene) => ({
      ...scene,
      videoUrl: undefined,
      audioUrl: undefined,
    }));
  }

  return projectToStore;
}


export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => getValue(key, initialValue));

  useEffect(() => {
    try {
        let valueToStore = value;

        // Special handling for the 'projects' key to prevent localStorage quota errors.
        if (key === 'projects' && Array.isArray(value)) {
            // We assume `value` is an array of Project-like objects.
            // This will strip out large data like base64 images and blob URLs before saving.
            valueToStore = value.map(p => sanitizeProjectForStorage(p as unknown as Project)) as T;
        }

        localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

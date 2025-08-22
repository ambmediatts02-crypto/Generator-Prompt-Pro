


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, GenerationStatus, GenerationMode, DirectorStyle, Scene, ChatMessage, ChatSession, AppView, MediaAsset, AspectRatio, VideoOptions, TimelineClip, ObjectRole, BaseImage, StoryboardImage, EditorLayout, SplitViewSlot, TimelineTransition } from './types';
import { LOADING_MESSAGES } from './constants';
import { generateVideo, pollVideoStatus, fetchVideoBlob, generatePromptFromStoryboard, getCreativeSpark, regenerateScene, translateText, sendChatMessage, summarizeAndTitleChat, generateAudioNarration, getEditorAction, analyzeMultipleVideoContents } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { StoryboardEditor } from './components/StoryboardEditor';
import { Loader } from './components/Loader';
import { PromptResult } from './components/PromptResult';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ChatHistorySidebar } from './components/ChatHistorySidebar';
import { MenuIcon, FolderIcon, FilmIcon } from './components/icons';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { EditorSpace } from './components/EditorSpace';
import { generateVideoThumbnail, getVideoDuration } from './utils/mediaUtils';
import { SingleSceneEditor } from './components/SingleScene';
import { VideoResult } from './components/VideoResult';

const createNewProject = (name: string): Project => ({
  id: crypto.randomUUID(),
  name: name,
  createdAt: Date.now(),
  mode: GenerationMode.STORYBOARD,
  singlePrompt: '',
  singleReferenceImage: null,
  generatedVideoUrl: null,
  singleSceneOptions: {
    aspectRatio: AspectRatio.SIXTEEN_NINE,
  },
  mainBrief: '',
  backgroundImage: null,
  objectImages: [],
  directorStyle: DirectorStyle.NONE,
  generatedPrompts: null,
  mediaAssets: [],
  editorTimeline: [],
  editorTransitions: [],
  editorAspectRatio: AspectRatio.NINE_SIXTEEN,
  editorChatHistory: [],
  editorLayout: EditorLayout.TIMELINE,
  editorSplitViewLanes: { 
    top: { clips: [], zoom: 0.5 }, 
    middle: { clips: [], zoom: 0.5 }, 
    bottom: { clips: [], zoom: 0.5 } 
  },
});


// A simple error boundary to catch the configuration error on startup.
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
       return (
          <div className="h-screen bg-brand-bg-dark flex items-center justify-center p-4">
            <ErrorDisplay error={this.state.error} />
          </div>
        );
    }
    return this.props.children;
  }
}


const App: React.FC = () => {
  // --- Persisted State ---
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [activeProjectId, setActiveProjectId] = useLocalStorage<string | null>('active-project-id', null);
  const [chatSessions, setChatSessions] = useLocalStorage<ChatSession[]>('chat-sessions', []);
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>('active-chat-id', null);

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [appView, setAppView] = useState<AppView>(AppView.GENERATOR);
  
  // --- Common State ---
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
  const [error, setError] = useState<Error | null>(null);
  
  // --- Local UI State ---
  const [isSparking, setIsSparking] = useState<boolean>(false);
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null);
  const [isOvertureSaving, setIsOvertureSaving] = useState<boolean>(false);
  const [dialogueMode, setDialogueMode] = useState<boolean>(false);
  const [isChatting, setIsChatting] = useState<boolean>(false);
  const [isFinalizingScript, setIsFinalizingScript] = useState<boolean>(false);
  const [isEditorThinking, setIsEditorThinking] = useState<boolean>(false);

  // --- Editor Export State ---
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);


  // --- Derived State for Active Project ---
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  const updateActiveProject = useCallback((updater: ((p: Project) => Partial<Project>) | Partial<Project>) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
            const updates = typeof updater === 'function' ? updater(p) : updater;
            return { ...p, ...updates };
        }
        return p;
    }));
  }, [activeProjectId, setProjects]);


  // --- Derived State for Active Chat ---
  const activeChatSession = useMemo(() => {
    return chatSessions.find(s => s.id === activeChatId) || null;
  }, [chatSessions, activeChatId]);

  const setChatHistory = (updater: React.SetStateAction<ChatMessage[]>) => {
    if (!activeChatId) return;
    setChatSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === activeChatId) {
          const newHistory = typeof updater === 'function' ? updater(session.history) : updater;
          return { ...session, history: newHistory };
        }
        return session;
      })
    );
  };

  // --- Effects ---
  useEffect(() => {
    if (projects.length > 0 && !projects.some(p => p.id === activeProjectId)) {
      setActiveProjectId(projects[0].id);
    } else if (projects.length === 0) {
      const firstProject = createNewProject('My First Project');
      setProjects([firstProject]);
      setActiveProjectId(firstProject.id);
    }
  }, [projects, activeProjectId, setActiveProjectId, setProjects]);
  
  useEffect(() => {
    if (chatSessions.length > 0 && !chatSessions.some(s => s.id === activeChatId)) {
      setActiveChatId(chatSessions[0].id);
    } else if (chatSessions.length === 0) {
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: 'New Chat',
        history: [],
        isPinned: false,
        createdAt: Date.now(),
      };
      setChatSessions([newSession]);
      setActiveChatId(newSession.id);
    }
  }, [chatSessions, activeChatId, setActiveChatId, setChatSessions]);

  useEffect(() => {
    if (activeProject?.mode === GenerationMode.STORYBOARD) {
        setIsSidebarOpen(dialogueMode);
    } else {
        setIsSidebarOpen(false);
    }
  }, [dialogueMode, activeProject?.mode]);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (generationStatus === GenerationStatus.GENERATING) {
      const messages = activeProject?.mode === GenerationMode.STORYBOARD 
        ? ["Analyzing cast and props...", "Adopting Director's Style...", "Writing the final script...", "Designing the soundscape..."] 
        : LOADING_MESSAGES;
      let messageIndex = 0;
      setLoadingMessage(messages[0]);
      interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setLoadingMessage(messages[messageIndex]);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [generationStatus, activeProject?.mode]);


  // --- Project Management Handlers ---
  const handleCreateProject = useCallback(() => {
    const newProject = createNewProject(`Project ${projects.length + 1}`);
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setIsProjectModalOpen(false);
    setAppView(AppView.GENERATOR);
  }, [projects, setProjects, setActiveProjectId]);

  const handleSelectProject = useCallback((id: string) => {
    setActiveProjectId(id);
    setIsProjectModalOpen(false);
  }, [setActiveProjectId]);

  const handleDeleteProject = useCallback((id: string) => {
    const projectToDelete = projects.find(p => p.id === id);
    if (projectToDelete) {
        projectToDelete.mediaAssets.forEach(asset => {
            if (asset.isObjectURL && asset.url.startsWith('blob:')) {
                URL.revokeObjectURL(asset.url);
            }
        });
    }

    setProjects(prev => {
      const remainingProjects = prev.filter(p => p.id !== id);
      if (activeProjectId === id) {
        setActiveProjectId(remainingProjects[0]?.id || null);
      }
      return remainingProjects;
    });
  }, [projects, activeProjectId, setProjects, setActiveProjectId]);

  const handleRenameProject = useCallback((id: string, newName: string) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, name: newName.trim() } : p)));
  }, [setProjects]);


  // --- Chat Session Management ---
  const handleNewChat = useCallback((switchToDialogue = true) => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      history: [],
      isPinned: false,
      createdAt: Date.now(),
    };
    setChatSessions(prev => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    if (switchToDialogue) {
        setDialogueMode(true);
    }
  }, [setChatSessions, setActiveChatId]);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setDialogueMode(true);
  }, [setActiveChatId]);

  const handleDeleteChat = useCallback((id: string) => {
    setChatSessions(prev => {
      const remainingSessions = prev.filter(s => s.id !== id);
      if (activeChatId === id) {
        setActiveChatId(remainingSessions[0]?.id || null);
      }
      return remainingSessions;
    });
  }, [activeChatId, setChatSessions, setActiveChatId]);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    setChatSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle.trim() } : s));
  }, [setChatSessions]);

  const handlePinChat = useCallback((id: string, isPinned: boolean) => {
    setChatSessions(prev => prev.map(s => s.id === id ? { ...s, isPinned } : s));
  }, [setChatSessions]);


  // --- Core Functionality Handlers ---
  const resetStateForMode = useCallback((newMode: GenerationMode) => {
    setError(null);
    setGenerationStatus(GenerationStatus.IDLE);
    setDialogueMode(false);
    updateActiveProject({ 
        mode: newMode,
        generatedVideoUrl: null,
        generatedPrompts: null,
        directorStyle: DirectorStyle.NONE
    });
    if (newMode === GenerationMode.SINGLE) {
        setIsSidebarOpen(false);
    }
  }, [updateActiveProject]);

  const updateObjectImageRole = useCallback((id: string, role: ObjectRole) => {
    updateActiveProject(p => ({
        objectImages: p.objectImages.map(img => img.id === id ? { ...img, role } : img)
    }));
  }, [updateActiveProject]);
  
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !activeChatSession || !activeProject) return;

    const userMessage: ChatMessage = { role: 'user', text: message };
    const newHistory = [...activeChatSession.history, userMessage];
    
    setChatHistory(newHistory);
    setIsChatting(true);
    setError(null);

    try {
        const responseText = await sendChatMessage(
            newHistory,
            activeProject.backgroundImage,
            activeProject.objectImages
        );
        const modelMessage: ChatMessage = { role: 'model', text: responseText };
        setChatHistory(prev => [...prev, modelMessage]);
    } catch (err: any) {
        setError(err as Error);
        // Revert user message on error
        setChatHistory(prev => prev.slice(0, -1));
    } finally {
        setIsChatting(false);
    }
  }, [activeChatSession, activeProject, setChatHistory]);
  
  const handleFinalizeScript = useCallback(async () => {
    if (!activeChatSession || activeChatSession.history.length === 0) return;
    setIsFinalizingScript(true);
    setError(null);
    try {
      const { brief, title } = await summarizeAndTitleChat(activeChatSession.history);
      updateActiveProject({ mainBrief: brief });
      if (title && (activeChatSession.title === 'New Chat' || !activeChatSession.title)) {
        handleRenameChat(activeChatSession.id, title);
      }
      setDialogueMode(false);
    } catch (err: any) {
      setError(err as Error);
    } finally {
      setIsFinalizingScript(false);
    }
  }, [activeChatSession, updateActiveProject, handleRenameChat]);

  const handleCreativeSpark = useCallback(async () => {
    if (!activeProject?.mainBrief.trim()) {
      setError(new Error("Write a brief first to get a Creative Spark."));
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsSparking(true);
    setError(null);
    try {
        const spark = await getCreativeSpark(activeProject.mainBrief);
        updateActiveProject({ mainBrief: `${activeProject.mainBrief}\n\n${spark}` });
    } catch (err: any) {
        setError(err as Error);
    } finally {
        setIsSparking(false);
    }
  }, [activeProject, updateActiveProject]);

  const handleGeneration = useCallback(async () => {
    if (!activeProject) return;
    setError(null);
    setGenerationStatus(GenerationStatus.GENERATING);
    updateActiveProject({ generatedVideoUrl: null, generatedPrompts: null });

    try {
        if (activeProject.mode === GenerationMode.SINGLE) {
           if (!activeProject.singlePrompt.trim()) {
                throw new Error("Please enter a prompt to generate a video.");
            }
            const operation = await generateVideo(
                activeProject.singlePrompt,
                activeProject.singleSceneOptions,
                activeProject.singleReferenceImage
            );
            
            const finalOperation = await pollVideoStatus(operation, () => {});

            const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) throw new Error("Video generation succeeded but no download link was found.");
            
            const videoUrl = await fetchVideoBlob(downloadLink);
            updateActiveProject({ generatedVideoUrl: videoUrl });
            setGenerationStatus(GenerationStatus.SUCCESS);
        } else {
            const prompts = await generatePromptFromStoryboard(
                activeProject.mainBrief, 
                activeProject.backgroundImage, 
                activeProject.objectImages, 
                activeProject.directorStyle
            );
            updateActiveProject({ generatedPrompts: prompts });
            setGenerationStatus(GenerationStatus.SUCCESS);
        }
    } catch(err: any) {
        setError(err as Error);
        setGenerationStatus(GenerationStatus.ERROR);
    }
  }, [activeProject, updateActiveProject]);
  
  const handleUpdateOverture = useCallback(async (indonesianText: string) => {
    if (!activeProject?.generatedPrompts) return;
    setIsOvertureSaving(true);
    try {
        const englishText = await translateText(indonesianText, 'indonesian', 'english');
        updateActiveProject(p => ({
            generatedPrompts: p.generatedPrompts ? {
                ...p.generatedPrompts,
                overture: { english: englishText, indonesian: indonesianText }
            } : null
        }));
    } catch (err: any) {
        setError(err as Error);
    } finally {
        setIsOvertureSaving(false);
    }
  }, [activeProject, updateActiveProject]);

  const handleRegenerateScene = useCallback(async (sceneIdToRegenerate: string) => {
    if (!activeProject?.generatedPrompts) return;
    setRegeneratingSceneId(sceneIdToRegenerate);
    setError(null);
    try {
        const newSceneData = await regenerateScene({
            sceneIdToRegenerate,
            mainBrief: activeProject.mainBrief,
            backgroundImage: activeProject.backgroundImage,
            objectImages: activeProject.objectImages,
            directorStyle: activeProject.directorStyle,
            overture: activeProject.generatedPrompts.overture,
            allScenes: activeProject.generatedPrompts.scenes
        });
        updateActiveProject(p => {
            if (!p.generatedPrompts) return {};
            const newScenes = p.generatedPrompts.scenes.map(s => s.id === sceneIdToRegenerate ? { ...s, ...newSceneData, videoUrl: undefined, videoGenerationStatus: GenerationStatus.IDLE, audioUrl: undefined, audioGenerationStatus: GenerationStatus.IDLE } : s);
            return { generatedPrompts: { ...p.generatedPrompts, scenes: newScenes } };
        });
    } catch (err: any) {
        setError(err as Error);
    } finally {
        setRegeneratingSceneId(null);
    }
  }, [activeProject, updateActiveProject]);

  const handleUpdateScene = useCallback((sceneId: string, updatedScene: Partial<Scene>) => {
    updateActiveProject(p => {
        if (!p.generatedPrompts) return {};
        const newScenes = p.generatedPrompts.scenes.map(s => s.id === sceneId ? { ...s, ...updatedScene } : s);
        return { generatedPrompts: { ...p.generatedPrompts, scenes: newScenes } };
    });
  }, [updateActiveProject]);
  
  const handleDeleteScene = useCallback((sceneId: string) => {
    updateActiveProject(p => {
        if (!p.generatedPrompts) return {};
        const newScenes = p.generatedPrompts.scenes.filter(s => s.id !== sceneId);
        return { generatedPrompts: { ...p.generatedPrompts, scenes: newScenes } };
    });
  }, [updateActiveProject]);

  const handleGenerateSceneVideo = useCallback(async (sceneId: string, sceneNumber: number) => {
    if (!activeProject?.generatedPrompts) return;
    const scene = activeProject.generatedPrompts.scenes.find(s => s.id === sceneId);
    if (!scene) {
        setError(new Error("Scene not found"));
        return;
    }
    setError(null);
    handleUpdateScene(sceneId, { videoGenerationStatus: GenerationStatus.GENERATING });

    try {
        const operation = await generateVideo(scene.english, { aspectRatio: AspectRatio.SIXTEEN_NINE }, null);
        const finalOperation = await pollVideoStatus(operation, () => {});

        const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation succeeded but no download link was found.");
        
        const videoUrl = await fetchVideoBlob(downloadLink);
        
        const newAsset: MediaAsset = {
            id: crypto.randomUUID(),
            type: 'VIDEO',
            source: 'AI',
            name: `Scene ${sceneNumber} Video`,
            thumbnailUrl: videoUrl, // placeholder, will be generated
            url: videoUrl,
            createdAt: Date.now(),
            duration: 10, // Placeholder duration
            isObjectURL: true,
        };
        
        // Generate a real thumbnail and get duration
        const blob = await fetch(videoUrl).then(res => res.blob());
        const file = new File([blob], `${newAsset.name}.mp4`, { type: blob.type });
        newAsset.thumbnailUrl = await generateVideoThumbnail(file);
        newAsset.duration = await getVideoDuration(file);


        updateActiveProject(p => {
            if (!p.generatedPrompts) return {};
            const newScenes = p.generatedPrompts.scenes.map(s => s.id === sceneId ? { ...s, videoGenerationStatus: GenerationStatus.SUCCESS, videoUrl, mediaAssetId: newAsset.id } : s);
            return {
                generatedPrompts: { ...p.generatedPrompts, scenes: newScenes },
                mediaAssets: [...p.mediaAssets, newAsset],
            };
        });

    } catch (err: any) {
        console.error("Error generating scene video:", err);
        setError(err as Error);
        handleUpdateScene(sceneId, { videoGenerationStatus: GenerationStatus.ERROR });
    }
  }, [activeProject, updateActiveProject, handleUpdateScene]);

  const handleGenerateSceneAudio = useCallback(async (sceneId: string, sceneNumber: number) => {
      if (!activeProject?.generatedPrompts) return;
      const scene = activeProject.generatedPrompts.scenes.find(s => s.id === sceneId);
      if (!scene?.voiceOver_Indonesian) {
          setError(new Error("No voice-over text found for this scene."));
          return;
      }
      setError(null);
      handleUpdateScene(sceneId, { audioGenerationStatus: GenerationStatus.GENERATING });
      
      try {
          const audioUrl = await generateAudioNarration(scene.voiceOver_Indonesian);
          const duration = await getVideoDuration(audioUrl);

          const newAsset: MediaAsset = {
            id: crypto.randomUUID(),
            type: 'AUDIO',
            source: 'AI',
            name: `Scene ${sceneNumber} Narration`,
            thumbnailUrl: '', // No thumbnail for audio
            url: audioUrl,
            createdAt: Date.now(),
            duration: duration,
            isObjectURL: true,
          };

          updateActiveProject(p => {
            if (!p.generatedPrompts) return {};
            const newScenes = p.generatedPrompts.scenes.map(s => s.id === sceneId ? { ...s, audioGenerationStatus: GenerationStatus.SUCCESS, audioUrl, mediaAssetId: newAsset.id } : s);
            return {
                generatedPrompts: { ...p.generatedPrompts, scenes: newScenes },
                mediaAssets: [...p.mediaAssets, newAsset],
            };
        });

      } catch (err: any) {
          console.error("Error generating scene audio:", err);
          setError(err as Error);
          handleUpdateScene(sceneId, { audioGenerationStatus: GenerationStatus.ERROR });
      }
  }, [activeProject, updateActiveProject, handleUpdateScene]);

  const handleGoToEditor = useCallback(async () => {
      if (!activeProject?.generatedPrompts) {
          setAppView(AppView.EDITOR);
          return;
      }

      let videoTimelinePos = 0;
      let audioTimelinePos = 0;

      const timelineFromScenes = activeProject.generatedPrompts.scenes
          .reduce((acc: TimelineClip[], scene) => {
              const mediaAsset = activeProject.mediaAssets.find(a => a.id === scene.mediaAssetId);
              if (mediaAsset) {
                  if (mediaAsset.type === 'VIDEO' || mediaAsset.type === 'IMAGE') {
                      acc.push({
                          id: crypto.randomUUID(),
                          mediaAssetId: mediaAsset.id,
                          layer: 0,
                          timelineStart: videoTimelinePos,
                          duration: mediaAsset.duration,
                          assetStart: 0,
                          volume: 1,
                          opacity: 1,
                          transform: {
                            scale: 1,
                            rotation: 0,
                            position: { x: 0, y: 0 },
                            flip: { horizontal: false, vertical: false },
                          },
                      });
                      videoTimelinePos += mediaAsset.duration;
                  } else if (mediaAsset.type === 'AUDIO') {
                      acc.push({
                          id: crypto.randomUUID(),
                          mediaAssetId: mediaAsset.id,
                          layer: -1,
                          timelineStart: audioTimelinePos,
                          duration: mediaAsset.duration,
                          assetStart: 0,
                          volume: 1,
                          opacity: 1,
                           transform: {
                            scale: 1,
                            rotation: 0,
                            position: { x: 0, y: 0 },
                            flip: { horizontal: false, vertical: false },
                          },
                      });
                      audioTimelinePos += mediaAsset.duration;
                  }
              }
              return acc;
          }, []);
      
      updateActiveProject({ editorTimeline: timelineFromScenes });
      setAppView(AppView.EDITOR);
  }, [activeProject, updateActiveProject]);


  const handleBackToGenerator = useCallback(() => {
      setAppView(AppView.GENERATOR);
  }, []);
  
  const handleImportMedia = useCallback(async (files: File[]) => {
    if (!activeProject || files.length === 0) return;
    setError(null);

    const newAssets: MediaAsset[] = [];
    const newClips: TimelineClip[] = [];
    
    // Get current timeline to append to it
    const currentTimeline = activeProject.editorTimeline;
    let mainTrackEnd = currentTimeline
        .filter(c => c.layer === 0)
        .reduce((max, c) => Math.max(max, c.timelineStart + c.duration), 0);
    
    let firstAudioLayer = Math.min(-1, ...currentTimeline.filter(c => c.layer < 0).map(c => c.layer));
    if (firstAudioLayer > -1) firstAudioLayer = -1;

    let audioTrackEnd = currentTimeline
        .filter(c => c.layer === firstAudioLayer)
        .reduce((max, c) => Math.max(max, c.timelineStart + c.duration), 0);

    for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const isAudio = file.type.startsWith('audio/');
        const isImage = file.type.startsWith('image/');
        
        if (isVideo || isAudio || isImage) {
            try {
                const thumbnailUrl = isVideo || isImage ? await generateVideoThumbnail(file) : '';
                const duration = isImage ? 5 : await getVideoDuration(file);
                const objectURL = URL.createObjectURL(file);
                
                let type: 'VIDEO' | 'AUDIO' | 'IMAGE' = 'VIDEO';
                if(isAudio) type = 'AUDIO';
                if(isImage) type = 'IMAGE';

                const newAsset: MediaAsset = {
                    id: crypto.randomUUID(),
                    type,
                    source: 'UPLOAD',
                    name: file.name,
                    thumbnailUrl,
                    url: objectURL,
                    createdAt: Date.now(),
                    duration,
                    isObjectURL: true,
                    isAnalyzing: isVideo,
                };
                newAssets.push(newAsset);
                
                // Automatically add the new asset to the timeline
                const newClip: TimelineClip = {
                     id: crypto.randomUUID(),
                     mediaAssetId: newAsset.id,
                     layer: type === 'AUDIO' ? firstAudioLayer : 0,
                     timelineStart: type === 'AUDIO' ? audioTrackEnd : mainTrackEnd,
                     duration: newAsset.duration,
                     assetStart: 0,
                     volume: 1,
                     opacity: 1,
                     transform: {
                         scale: 1,
                         rotation: 0,
                         position: { x: 0, y: 0 },
                         flip: { horizontal: false, vertical: false },
                     },
                };
                newClips.push(newClip);
                
                if (type === 'AUDIO') {
                    audioTrackEnd += newAsset.duration;
                } else {
                    mainTrackEnd += newAsset.duration;
                }

            } catch (err) {
                console.error("Failed to process imported file:", file.name, err);
                setError(new Error(`Could not process file: ${file.name}`));
            }
        }
    }

    if (newAssets.length === 0) return;

    updateActiveProject(p => ({
        mediaAssets: [...p.mediaAssets, ...newAssets],
        editorTimeline: [...p.editorTimeline, ...newClips],
    }));
    
    const assetsToAnalyze = newAssets.filter(a => a.type === 'VIDEO');
    if (assetsToAnalyze.length === 0) return;

    try {
        const analysisPayload = assetsToAnalyze.map(asset => ({
            id: asset.id,
            thumbnailBase64: asset.thumbnailUrl,
        }));

        const analysisResults = await analyzeMultipleVideoContents(analysisPayload);
        const resultsMap = new Map(analysisResults.map(r => [r.assetId, r.description]));

        updateActiveProject(p => ({
            mediaAssets: p.mediaAssets.map(asset => {
                if (resultsMap.has(asset.id)) {
                    return {
                        ...asset,
                        aiAnalysis: resultsMap.get(asset.id),
                        isAnalyzing: false,
                    };
                }
                if (assetsToAnalyze.some(a => a.id === asset.id)) {
                    return { ...asset, isAnalyzing: false };
                }
                return asset;
            })
        }));

    } catch (err: any) {
        console.error("Batch analysis failed:", err);
        setError(err as Error);
        updateActiveProject(p => ({
            mediaAssets: p.mediaAssets.map(asset => 
                assetsToAnalyze.some(na => na.id === asset.id)
                ? { ...asset, aiAnalysis: 'Analysis failed.', isAnalyzing: false }
                : asset
            )
        }));
    }
}, [activeProject, updateActiveProject]);

  const handleSetTimeline = useCallback((newTimeline: TimelineClip[]) => {
      updateActiveProject({ editorTimeline: newTimeline });
  }, [updateActiveProject]);

  const handleUpdateTimelineClip = useCallback((clipId: string, updates: Partial<TimelineClip>) => {
    updateActiveProject(p => ({
      editorTimeline: p.editorTimeline.map(clip => 
        clip.id === clipId ? { ...clip, ...updates } : clip
      )
    }));
  }, [updateActiveProject]);
  
   const handleUpdateTimelineClipDuration = useCallback((clipId: string, newDuration: number) => {
    updateActiveProject(p => ({
        editorTimeline: p.editorTimeline.map(clip =>
            clip.id === clipId ? { ...clip, duration: newDuration } : clip
        )
    }));
  }, [updateActiveProject]);

  const handleDeleteClip = useCallback((clipId: string) => {
    updateActiveProject(p => ({
        editorTimeline: p.editorTimeline.filter(c => c.id !== clipId),
        editorTransitions: p.editorTransitions.filter(t => t.fromClipId !== clipId && t.toClipId !== clipId),
    }));
  }, [updateActiveProject]);


  const handleSetEditorLayout = useCallback((layout: EditorLayout) => {
      updateActiveProject({ editorLayout: layout });
  }, [updateActiveProject]);

  const handleSetEditorAspectRatio = useCallback((aspectRatio: AspectRatio) => {
      updateActiveProject({ editorAspectRatio: aspectRatio });
  }, [updateActiveProject]);

  const handleAddTransition = useCallback((transition: Omit<TimelineTransition, 'id'>) => {
      const newTransition: TimelineTransition = {
          ...transition,
          id: crypto.randomUUID(),
      };
      updateActiveProject(p => ({
          editorTransitions: [...p.editorTransitions, newTransition]
      }));
  }, [updateActiveProject]);

  const handleDeleteTransition = useCallback((id: string) => {
    updateActiveProject(p => ({
        editorTransitions: p.editorTransitions.filter(t => t.id !== id)
    }));
  }, [updateActiveProject]);

  const handleUpdateSplitViewLane = useCallback((slot: SplitViewSlot, updates: Partial<{ clips: TimelineClip[], zoom: number }>) => {
    updateActiveProject(p => ({
      editorSplitViewLanes: {
        ...p.editorSplitViewLanes,
        [slot]: {
            ...p.editorSplitViewLanes[slot],
            ...updates,
        },
      }
    }));
  }, [updateActiveProject]);
  
  const handleAddAssetToProject = useCallback((asset: MediaAsset) => {
    updateActiveProject(p => {
        // Avoid duplicates if user clicks multiple times
        if (p.mediaAssets.some(a => a.id === asset.id)) {
            return {};
        }
        return {
            mediaAssets: [...p.mediaAssets, asset]
        };
    });
  }, [updateActiveProject]);

  const handleSendEditorMessage = useCallback(async (message: string) => {
    if (!activeProject || !message.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: message };
    updateActiveProject(p => ({ editorChatHistory: [...p.editorChatHistory, userMessage] }));
    setIsEditorThinking(true);
    setError(null);

    try {
        const action = await getEditorAction(
            message,
            activeProject.mediaAssets,
            activeProject.editorTimeline.map(c => c.mediaAssetId)
        );

        let newTimeline = [...activeProject.editorTimeline];
        let responseText = action.responseText;
        
        console.log("AI Action received:", action);

        if (action.action === 'SET_EDITOR_LAYOUT') {
             if (action.payload.layout === 'TIMELINE' || action.payload.layout === 'SPLIT_VIEW') {
                    handleSetEditorLayout(action.payload.layout);
                } else {
                    responseText = "Sorry, I can only switch to 'TIMELINE' or 'SPLIT_VIEW' layouts.";
                }
        }

        updateActiveProject({ editorTimeline: newTimeline });
        
        const modelMessage: ChatMessage = { role: 'model', text: responseText };
        updateActiveProject(p => ({ editorChatHistory: [...p.editorChatHistory, modelMessage] }));

    } catch (err: any) {
        const modelMessage: ChatMessage = { role: 'model', text: err.message || "Sorry, I couldn't process that request." };
        updateActiveProject(p => ({ editorChatHistory: [...p.editorChatHistory, modelMessage] }));
        setError(err as Error);
    } finally {
        setIsEditorThinking(false);
    }
  }, [activeProject, updateActiveProject, handleSetEditorLayout]);

   const handleExportVideo = useCallback(async () => {
    if (!activeProject) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportedVideoUrl(null);
    
    const steps = [10, 30, 60, 85, 100];
    for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setExportProgress(step);
    }

    const firstVideoClip = activeProject.editorTimeline.find(c => c.layer >= 0);
    const firstVideoAsset = firstVideoClip ? activeProject.mediaAssets.find(a => a.id === firstVideoClip.mediaAssetId) : null;
    
    if (firstVideoAsset) {
        setExportedVideoUrl(firstVideoAsset.url);
    } else {
        setError(new Error("No video found in the project to export."));
    }

    setIsExporting(false);
  }, [activeProject]);

  // --- Render Logic ---
  const isGenerating = generationStatus === GenerationStatus.GENERATING;
  const buttonText = activeProject?.mode === GenerationMode.SINGLE ? 'Generate Video' : 'Generate Prompt';
  const isButtonDisabled = isGenerating ||
    (activeProject?.mode === GenerationMode.SINGLE && !activeProject?.singlePrompt.trim()) ||
    (activeProject?.mode === GenerationMode.STORYBOARD && !activeProject?.mainBrief.trim() && !dialogueMode);
    
  if (error && !error.message.includes("Configuration Error")) {
      setTimeout(() => setError(null), 5000);
  }

  if (!activeProject) {
    return (
        <div className="h-screen bg-brand-bg-dark flex items-center justify-center">
            <Loader message="Initializing..." />
        </div>
    );
  }

  if (appView === AppView.EDITOR) {
    return (
        <EditorSpace 
            project={activeProject}
            onBack={handleBackToGenerator}
            onImportMedia={handleImportMedia}
            onSetTimeline={handleSetTimeline}
            onUpdateTimelineClip={handleUpdateTimelineClip}
            onUpdateTimelineClipDuration={handleUpdateTimelineClipDuration}
            onDeleteClip={handleDeleteClip}
            onSendEditorMessage={handleSendEditorMessage}
            onAddAssetToProject={handleAddAssetToProject}
            isEditorThinking={isEditorThinking}
            onExportVideo={handleExportVideo}
            isExporting={isExporting}
            exportProgress={exportProgress}
            exportedVideoUrl={exportedVideoUrl}
            onSetEditorLayout={handleSetEditorLayout}
            onSetEditorAspectRatio={handleSetEditorAspectRatio}
            onAddTransition={handleAddTransition}
            onDeleteTransition={handleDeleteTransition}
            onUpdateSplitViewLane={handleUpdateSplitViewLane}
        />
    )
  }

  return (
    <div className="h-screen bg-brand-bg-dark font-sans flex text-brand-text">
        {activeProject.mode === GenerationMode.STORYBOARD && (
             <ChatHistorySidebar 
                isOpen={isSidebarOpen}
                sessions={chatSessions}
                activeSessionId={activeChatId}
                onSelectSession={handleSelectChat}
                onNewChat={() => handleNewChat(true)}
                onRenameSession={handleRenameChat}
                onPinSession={handlePinChat}
                onDeleteSession={handleDeleteChat}
                onClose={() => setIsSidebarOpen(false)}
            />
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
             <header className="flex-shrink-0 border-b border-brand-border p-4 flex justify-center items-center relative">
                 {activeProject.mode === GenerationMode.STORYBOARD && (
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="absolute top-1/2 -translate-y-1/2 left-4 p-2 rounded-md hover:bg-brand-bg-light transition-colors z-20"
                        title={isSidebarOpen ? "Close Menu" : "Open Menu"}
                    >
                        <MenuIcon className="w-6 h-6 text-brand-text-secondary"/>
                    </button>
                )}
                <Header />
                 <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2 z-20">
                    <button 
                        onClick={handleGoToEditor}
                        className="p-2 rounded-md hover:bg-brand-bg-light transition-colors"
                        title="Ruang Editor"
                    >
                        <FilmIcon className="w-6 h-6 text-brand-text-secondary"/>
                    </button>
                    <button 
                        onClick={() => setIsProjectModalOpen(true)}
                        className="p-2 rounded-md hover:bg-brand-bg-light transition-colors"
                        title="Manage Projects"
                    >
                        <FolderIcon className="w-6 h-6 text-brand-text-secondary"/>
                    </button>
                 </div>
             </header>

            <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                <div className="max-w-6xl mx-auto flex flex-col gap-8">
                    {/* Controls Section */}
                    <div className="bg-brand-bg-light p-6 rounded-lg border border-brand-border shadow-lg">
                        <ModeSelector mode={activeProject.mode} setMode={resetStateForMode} disabled={isGenerating} />
                        {activeProject.mode === GenerationMode.STORYBOARD ? (
                            <StoryboardEditor 
                                mainBrief={activeProject.mainBrief}
                                setMainBrief={(v) => updateActiveProject({ mainBrief: typeof v === 'function' ? v(activeProject.mainBrief) : v })}
                                backgroundImage={activeProject.backgroundImage}
                                setBackgroundImage={(img: BaseImage | null) => updateActiveProject({ backgroundImage: img })}
                                objectImages={activeProject.objectImages}
                                setObjectImages={(v) => updateActiveProject({ objectImages: typeof v === 'function' ? v(activeProject.objectImages) : v })}
                                updateObjectImageRole={updateObjectImageRole}
                                directorStyle={activeProject.directorStyle}
                                setDirectorStyle={(style: DirectorStyle) => updateActiveProject({ directorStyle: style })}
                                onCreativeSpark={handleCreativeSpark}
                                isSparking={isSparking}
                                disabled={isGenerating}
                                dialogueMode={dialogueMode}
                                setDialogueMode={setDialogueMode}
                                chatHistory={activeChatSession?.history || []}
                                onSendMessage={handleSendMessage}
                                isChatting={isChatting}
                                onFinalizeScript={handleFinalizeScript}
                                isFinalizingScript={isFinalizingScript}
                            />
                        ) : (
                            <SingleSceneEditor
                                prompt={activeProject.singlePrompt}
                                setPrompt={(v) => updateActiveProject({ singlePrompt: typeof v === 'function' ? v(activeProject.singlePrompt) : v })}
                                referenceImage={activeProject.singleReferenceImage}
                                setReferenceImage={(img: BaseImage | null) => updateActiveProject({ singleReferenceImage: img })}
                                options={activeProject.singleSceneOptions}
                                setOptions={(opts) => updateActiveProject(p => ({ singleSceneOptions: typeof opts === 'function' ? opts(p.singleSceneOptions) : opts }))}
                                disabled={isGenerating}
                            />
                        )}
                        <div className="mt-8">
                            <button
                                onClick={handleGeneration}
                                disabled={isButtonDisabled}
                                className="w-full py-3 px-6 bg-brand-purple text-white font-bold rounded-lg hover:bg-brand-purple-light transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                            >
                                {buttonText}
                            </button>
                        </div>
                    </div>

                    {/* Output Section */}
                    {isGenerating && <Loader message={loadingMessage} />}
                    {error && <ErrorDisplay error={error} />}
                    
                    {generationStatus === GenerationStatus.SUCCESS && activeProject.generatedVideoUrl && activeProject.mode === GenerationMode.SINGLE && (
                        <VideoResult 
                            videoUrl={activeProject.generatedVideoUrl}
                            prompt={activeProject.singlePrompt}
                        />
                    )}

                    {generationStatus === GenerationStatus.SUCCESS && activeProject.generatedPrompts && activeProject.mode === GenerationMode.STORYBOARD && (
                        <PromptResult 
                            prompts={activeProject.generatedPrompts}
                            onUpdateOverture={handleUpdateOverture}
                            isOvertureSaving={isOvertureSaving}
                            onRegenerateScene={handleRegenerateScene}
                            onUpdateScene={handleUpdateScene}
                            onDeleteScene={handleDeleteScene}
                            regeneratingSceneId={regeneratingSceneId}
                            onGenerateSceneVideo={handleGenerateSceneVideo}
                            onGenerateSceneAudio={handleGenerateSceneAudio}
                        />
                    )}
                    
                </div>
            </main>
        </div>
        <ProjectManagerModal 
            isOpen={isProjectModalOpen}
            onClose={() => setIsProjectModalOpen(false)}
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onRenameProject={handleRenameProject}
            onDeleteProject={handleDeleteProject}
        />
    </div>
  );
};

const WrappedApp = () => (
    <AppErrorBoundary>
        <App />
    </AppErrorBoundary>
);

export default WrappedApp;
import React, { useState, useRef, useEffect } from 'react';
import type { Project } from '../types';
import { XCircleIcon, PlusIcon, EditIcon, TrashIcon } from './icons';

interface ProjectManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    activeProjectId: string | null;
    onSelectProject: (id: string) => void;
    onCreateProject: () => void;
    onRenameProject: (id: string, newName: string) => void;
    onDeleteProject: (id: string) => void;
}

const ProjectItem: React.FC<{
    project: Project;
    isActive: boolean;
    onSelect: () => void;
    onRename: (newName: string) => void;
    onDelete: () => void;
}> = ({ project, isActive, onSelect, onRename, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(project.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleRename = () => {
        if (name.trim() && name.trim() !== project.name) {
            onRename(name.trim());
        } else {
            setName(project.name);
        }
        setIsEditing(false);
    };

    return (
        <div className={`group flex items-center justify-between p-3 rounded-lg transition-colors ${isActive ? 'bg-brand-purple' : 'bg-brand-bg-light hover:bg-brand-border'}`}>
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    className="flex-1 bg-transparent border-b border-brand-purple-light text-brand-text outline-none"
                />
            ) : (
                <div className="flex-1 cursor-pointer" onClick={onSelect}>
                    <p className="font-semibold text-brand-text">{project.name}</p>
                    <p className="text-xs text-brand-text-secondary">
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                </div>
            )}
            <div className="flex items-center gap-2 transition-opacity opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                <button onClick={() => setIsEditing(true)} title="Rename Project" className="p-2 rounded-md hover:bg-brand-bg-dark"><EditIcon className="w-5 h-5 text-brand-text-secondary" /></button>
                <button onClick={onDelete} title="Delete Project" className="p-2 rounded-md hover:bg-red-900/50"><TrashIcon className="w-5 h-5 text-red-400" /></button>
            </div>
        </div>
    );
};

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
    isOpen, onClose, projects, activeProjectId, onSelectProject, onCreateProject, onRenameProject, onDeleteProject
}) => {
    if (!isOpen) return null;

    const sortedProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-brand-bg-dark rounded-xl border border-brand-border shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-brand-border">
                    <h2 className="text-xl font-bold text-brand-text">Manage Projects</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-bg-light"><XCircleIcon className="w-6 h-6 text-brand-text-secondary" /></button>
                </header>
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-3">
                        {sortedProjects.map(project => (
                            <ProjectItem
                                key={project.id}
                                project={project}
                                isActive={project.id === activeProjectId}
                                onSelect={() => onSelectProject(project.id)}
                                onRename={(newName) => onRenameProject(project.id, newName)}
                                onDelete={() => onDeleteProject(project.id)}
                            />
                        ))}
                    </div>
                </div>
                <footer className="p-4 border-t border-brand-border">
                    <button
                        onClick={onCreateProject}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-brand-purple text-white rounded-md hover:bg-brand-purple-light transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create New Project
                    </button>
                </footer>
            </div>
        </div>
    );
};
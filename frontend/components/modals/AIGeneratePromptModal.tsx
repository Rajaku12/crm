import React, { useState } from 'react';
import { CloseIcon, SparklesIcon } from '../icons/IconComponents';

interface AIGeneratePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => void;
    isGenerating: boolean;
    messageType: 'WhatsApp' | 'Email';
}

export const AIGeneratePromptModal: React.FC<AIGeneratePromptModalProps> = ({ isOpen, onClose, onGenerate, isGenerating, messageType }) => {
    const [prompt, setPrompt] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onGenerate(prompt);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center">
                            <SparklesIcon className="w-5 h-5 mr-2 text-primary-600" />
                            Generate {messageType} with AI
                        </h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700">Tell the AI what to write</label>
                            <textarea
                                id="ai-prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={3}
                                placeholder={`e.g., "Write a friendly follow-up asking about their site visit to Sunset Villa and if they have any questions."`}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end">
                        <button
                            type="submit"
                            disabled={isGenerating || !prompt.trim()}
                            className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700 disabled:bg-gray-400"
                        >
                            {isGenerating ? (
                                <>
                                    <SparklesIcon className="w-4 h-4 mr-2 animate-pulse" />
                                    Generating...
                                </>
                            ) : 'Generate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

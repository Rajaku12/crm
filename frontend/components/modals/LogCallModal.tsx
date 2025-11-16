import React, { useState, useEffect } from 'react';
import { CallOutcome } from '../../types';
import { CloseIcon } from '../icons/IconComponents';
import { CallRecorder } from '../CallRecorder';

interface LogCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { outcome: CallOutcome; duration: number; notes: string; recordingUrl?: string; }) => void;
    leadPhone?: string;
    leadName?: string;
}

export const LogCallModal: React.FC<LogCallModalProps> = ({ isOpen, onClose, onSave, leadPhone = '', leadName = '' }) => {
    const initialState = {
        outcome: CallOutcome.Success,
        duration: 0,
        notes: '',
        recordingUrl: '',
    };
    const [formState, setFormState] = useState(initialState);
    const [errors, setErrors] = useState<{ notes?: string }>({});
    const [isFetchingDuration, setIsFetchingDuration] = useState(false);
    const [showRecorder, setShowRecorder] = useState(false);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
    
    useEffect(() => {
        if(isOpen) {
            setFormState(initialState);
            setErrors({});
            setShowRecorder(false);
            setRecordingBlob(null);
        }
    }, [isOpen]);

    const handleRecordingComplete = async (blob: Blob, duration: number) => {
        setRecordingBlob(blob);
        setFormState(prev => ({ ...prev, duration }));
        
        // Convert blob to data URL for storage
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            // Store as data URL (in production, upload to server and get URL)
            setFormState(prev => ({ ...prev, recordingUrl: base64data }));
        };
        reader.readAsDataURL(blob);
        
        setShowRecorder(false);
    };

    useEffect(() => {
        if (formState.recordingUrl && formState.recordingUrl.startsWith('http')) {
            setIsFetchingDuration(true);
            const audio = new Audio(formState.recordingUrl);
            
            const handleMetadata = () => {
                const newDuration = Math.round(audio.duration);
                if (!isNaN(newDuration)) {
                    setFormState(prev => ({ ...prev, duration: newDuration }));
                }
                setIsFetchingDuration(false);
            };
            
            const handleError = () => {
                console.error("Error loading audio metadata from URL.");
                setIsFetchingDuration(false);
            };

            audio.addEventListener('loadedmetadata', handleMetadata);
            audio.addEventListener('error', handleError);

            return () => {
                audio.removeEventListener('loadedmetadata', handleMetadata);
                audio.removeEventListener('error', handleError);
            };
        }
    }, [formState.recordingUrl]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newErrors: { notes?: string } = {};
        if (formState.outcome === CallOutcome.Success && !formState.notes.trim()) {
            newErrors.notes = "For a successful call, notes are required to capture the details.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave(formState);
    };
    
    const isDurationManual = !formState.recordingUrl;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Log a Call</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Call Outcome *</label>
                            <select 
                                value={formState.outcome} 
                                onChange={(e) => setFormState(prev => ({...prev, outcome: e.target.value as CallOutcome}))}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            >
                                {Object.values(CallOutcome).map(outcome => (
                                    <option key={outcome} value={outcome}>{outcome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Call Recording</label>
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRecorder(true)}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                                >
                                    Record Call
                                </button>
                                {formState.recordingUrl && (
                                    <span className="flex items-center px-3 text-sm text-green-600">
                                        ✓ Recording saved
                                    </span>
                                )}
                            </div>
                            {!formState.recordingUrl && (
                                <div className="mt-2">
                                    <label className="block text-sm font-medium text-gray-700">Or enter Recording URL (optional)</label>
                                    <input 
                                        type="url"
                                        value={formState.recordingUrl}
                                        onChange={(e) => setFormState(prev => ({...prev, recordingUrl: e.target.value}))}
                                        placeholder="https://..." 
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            )}
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Duration (in seconds) *</label>
                             <div className="relative mt-1">
                                <input 
                                    type="number"
                                    value={formState.duration}
                                    onChange={(e) => setFormState(prev => ({...prev, duration: parseInt(e.target.value, 10) || 0}))}
                                    placeholder="e.g., 300" 
                                    disabled={!isDurationManual || isFetchingDuration}
                                    className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${!isDurationManual ? 'bg-gray-100' : ''}`}
                                />
                                {isFetchingDuration && <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-500">Loading...</div>}
                            </div>
                            {!isDurationManual && !isFetchingDuration && <p className="text-xs text-gray-500 mt-1">Duration automatically detected from recording.</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea 
                                value={formState.notes}
                                onChange={(e) => setFormState(prev => ({...prev, notes: e.target.value}))}
                                rows={4} 
                                placeholder="Enter call summary and any important details..." 
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                            {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700">
                            Save Call
                        </button>
                    </div>
                </form>
            </div>
            
            {showRecorder && (
                <CallRecorder
                    leadPhone={leadPhone}
                    leadName={leadName}
                    onRecordingComplete={handleRecordingComplete}
                    onCancel={() => setShowRecorder(false)}
                />
            )}
        </div>
    );
};
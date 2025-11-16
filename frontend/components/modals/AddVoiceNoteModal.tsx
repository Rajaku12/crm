import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, MicrophoneIcon } from '../icons/IconComponents';

interface AddVoiceNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { notes: string; audioUrl: string; }) => void;
}

export const AddVoiceNoteModal: React.FC<AddVoiceNoteModalProps> = ({ isOpen, onClose, onSave }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [notes, setNotes] = useState('');
    const [timer, setTimer] = useState(0);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setIsRecording(false);
            setNotes('');
            setTimer(0);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    }, [isOpen]);

    const handleToggleRecording = () => {
        if (isRecording) {
            // Stop recording
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        } else {
            // Start recording
            setTimer(0);
            intervalRef.current = window.setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        setIsRecording(!isRecording);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use a mock audio URL for simulation
        const mockAudioUrl = 'https://storage.googleapis.com/aai-web-samples/a_negative_attitude_is_like_a_flat_tire.mp3';
        onSave({ notes, audioUrl: mockAudioUrl });
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Add Voice Note</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex flex-col items-center justify-center space-y-4 py-8 bg-gray-50 rounded-lg">
                            <button 
                                type="button" 
                                onClick={handleToggleRecording}
                                className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'}`}
                            >
                                <MicrophoneIcon className="h-10 w-10 text-white" />
                            </button>
                            <p className="font-mono text-2xl text-gray-800">{formatTime(timer)}</p>
                            <p className="text-sm text-gray-500">{isRecording ? 'Recording...' : 'Tap to start recording'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Add any additional context or summary..."
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700" disabled={timer === 0}>
                            Save Note
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

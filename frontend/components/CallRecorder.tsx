import React, { useState, useRef, useEffect } from 'react';
import { PhoneIcon, MicrophoneIcon, StopIcon, PlayIcon, PauseIcon } from './icons/IconComponents';

interface CallRecorderProps {
    leadPhone: string;
    leadName: string;
    onRecordingComplete: (recordingBlob: Blob, duration: number) => void;
    onCancel: () => void;
}

export const CallRecorder: React.FC<CallRecorderProps> = ({ 
    leadPhone, 
    leadName, 
    onRecordingComplete, 
    onCancel 
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Request microphone permission on mount
    useEffect(() => {
        const requestPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop()); // Stop immediately, we'll start again when recording
                setHasPermission(true);
                setError(null);
            } catch (err: any) {
                setHasPermission(false);
                setError(err.message || 'Microphone permission denied. Please allow microphone access to record calls.');
            }
        };
        requestPermission();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                } 
            });
            
            streamRef.current = stream;
            audioChunksRef.current = [];
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { 
                    type: mediaRecorder.mimeType || 'audio/webm' 
                });
                onRecordingComplete(audioBlob, duration);
                
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };
            
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setIsPaused(false);
            startTimeRef.current = Date.now();
            
            // Start duration timer
            durationIntervalRef.current = setInterval(() => {
                if (!isPaused) {
                    setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
                }
            }, 1000);
            
        } catch (err: any) {
            setError(err.message || 'Failed to start recording. Please check your microphone permissions.');
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimeRef.current = Date.now() - (duration * 1000); // Adjust start time
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
        onCancel();
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (hasPermission === false) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <MicrophoneIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Microphone Permission Required</h3>
                        <p className="text-sm text-gray-500 mb-4">{error}</p>
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Call Recording</h3>
                            <p className="text-sm text-gray-500">{leadName} - {leadPhone}</p>
                        </div>
                        <button
                            onClick={cancelRecording}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                    
                    <div className="text-center mb-6">
                        <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-4 ${
                            isRecording 
                                ? (isPaused ? 'bg-yellow-100' : 'bg-red-100 animate-pulse') 
                                : 'bg-gray-100'
                        }`}>
                            {isRecording ? (
                                isPaused ? (
                                    <PauseIcon className="h-10 w-10 text-yellow-600" />
                                ) : (
                                    <MicrophoneIcon className="h-10 w-10 text-red-600" />
                                )
                            ) : (
                                <PhoneIcon className="h-10 w-10 text-gray-600" />
                            )}
                        </div>
                        
                        <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
                            {formatDuration(duration)}
                        </div>
                        
                        <p className="text-sm text-gray-500">
                            {isRecording 
                                ? (isPaused ? 'Recording Paused' : 'Recording in progress...')
                                : 'Ready to record'
                            }
                        </p>
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg"
                            >
                                <MicrophoneIcon className="h-5 w-5 mr-2" />
                                Start Recording
                            </button>
                        ) : (
                            <>
                                {isPaused ? (
                                    <button
                                        onClick={resumeRecording}
                                        className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                    >
                                        <PlayIcon className="h-5 w-5 mr-2" />
                                        Resume
                                    </button>
                                ) : (
                                    <button
                                        onClick={pauseRecording}
                                        className="flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                                    >
                                        <PauseIcon className="h-5 w-5 mr-2" />
                                        Pause
                                    </button>
                                )}
                                <button
                                    onClick={stopRecording}
                                    className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                    <StopIcon className="h-5 w-5 mr-2" />
                                    Stop & Save
                                </button>
                            </>
                        )}
                    </div>
                    
                    <div className="mt-4 text-center">
                        <button
                            onClick={cancelRecording}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VoiceRecorder({ onTranscript, disabled }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'he-IL';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setIsProcessing(false);
                setIsRecording(false);
                onTranscript(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsProcessing(false);
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [onTranscript]);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert('הדפדפן שלך לא תומך בזיהוי קול. נסה להשתמש ב-Chrome.');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            setIsRecording(true);
            setIsProcessing(true);
            recognitionRef.current.start();
            setTimeout(() => setIsProcessing(false), 500);
        }
    };

    return (
        <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={toggleRecording}
            disabled={disabled}
            className={cn(
                "h-12 w-12 rounded-full transition-all duration-300",
                isRecording && "animate-pulse ring-4 ring-red-200"
            )}
        >
            {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
                <MicOff className="h-5 w-5" />
            ) : (
                <Mic className="h-5 w-5" />
            )}
        </Button>
    );
}
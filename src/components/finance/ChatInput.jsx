import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import VoiceRecorder from './VoiceRecorder';

export default function ChatInput({ onSend, isLoading }) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleVoiceTranscript = (transcript) => {
        if (transcript) {
            onSend(transcript);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="flex items-end gap-3 p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50">
                <VoiceRecorder onTranscript={handleVoiceTranscript} disabled={isLoading} />
                
                <div className="flex-1 relative">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="שאל אותי כל שאלה בנושא השקעות, חסכונות, מניות..."
                        className="min-h-[48px] max-h-[120px] resize-none pr-4 pl-4 py-3 text-base rounded-xl border-slate-200 focus:border-sky-400 focus:ring-sky-400/20 bg-slate-50/50"
                        dir="rtl"
                        disabled={isLoading}
                    />
                </div>

                <Button
                    type="submit"
                    size="icon"
                    disabled={!message.trim() || isLoading}
                    className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/25 transition-all duration-300 hover:scale-105"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </div>
        </form>
    );
}
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ message, isUser }) {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speakText = () => {
        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'he-IL';
            utterance.rate = 0.9;
            
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className={cn(
            "flex gap-3 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300",
            isUser ? "mr-auto flex-row-reverse" : "ml-auto"
        )}>
            <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md",
                isUser 
                    ? "bg-gradient-to-br from-slate-600 to-slate-800" 
                    : "bg-gradient-to-br from-sky-500 to-blue-600"
            )}>
                {isUser ? (
                    <User className="h-5 w-5 text-white" />
                ) : (
                    <Bot className="h-5 w-5 text-white" />
                )}
            </div>

            <div className={cn(
                "rounded-2xl px-5 py-3 shadow-sm",
                isUser 
                    ? "bg-slate-100 text-slate-800 rounded-tr-sm" 
                    : "bg-white border border-slate-200/50 rounded-tl-sm"
            )}>
                {isUser ? (
                    <p className="text-base leading-relaxed" dir="rtl">{message}</p>
                ) : (
                    <div dir="rtl">
                        <ReactMarkdown 
                            className="text-base prose prose-slate prose-sm max-w-none leading-relaxed
                                [&>p]:my-2 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-1
                                [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2
                                [&>strong]:text-sky-700"
                        >
                            {message}
                        </ReactMarkdown>
                        
                        <div className="flex justify-start mt-3 pt-2 border-t border-slate-100">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={speakText}
                                className="text-slate-500 hover:text-sky-600 hover:bg-sky-50 gap-2"
                            >
                                {isSpeaking ? (
                                    <>
                                        <VolumeX className="h-4 w-4" />
                                        <span className="text-xs">עצור השמעה</span>
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="h-4 w-4" />
                                        <span className="text-xs">השמע תשובה</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
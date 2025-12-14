import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, MessageSquare, Trash2, Plus, ChevronLeft } from "lucide-react";
import moment from 'moment';

export default function ChatHistoryDrawer({ userEmail, onLoadChat, onNewChat, currentMessages }) {
    const [isOpen, setIsOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userEmail) {
            loadHistory();
        }
    }, [isOpen, userEmail]);

    // Save current chat when it changes
    useEffect(() => {
        if (currentMessages && currentMessages.length > 0 && userEmail) {
            saveCurrentChat();
        }
    }, [currentMessages]);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const history = await base44.entities.ChatHistory.filter(
                { user_email: userEmail },
                '-updated_date',
                50
            );
            setChatHistory(history);
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
        setIsLoading(false);
    };

    const saveCurrentChat = async () => {
        if (!currentMessages || currentMessages.length === 0) return;
        
        const firstUserMessage = currentMessages.find(m => m.role === 'user');
        const title = firstUserMessage ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') : 'שיחה חדשה';
        
        // Check if we already have this chat saved (by matching first message)
        const existingChat = chatHistory.find(chat => 
            chat.messages && 
            chat.messages[0] && 
            currentMessages[0] &&
            chat.messages[0].content === currentMessages[0].content
        );

        const messagesWithTimestamp = currentMessages.map(m => ({
            ...m,
            timestamp: m.timestamp || new Date().toISOString()
        }));

        try {
            if (existingChat) {
                await base44.entities.ChatHistory.update(existingChat.id, {
                    messages: messagesWithTimestamp
                });
            } else {
                await base44.entities.ChatHistory.create({
                    user_email: userEmail,
                    title,
                    messages: messagesWithTimestamp
                });
            }
        } catch (error) {
            console.error('Error saving chat:', error);
        }
    };

    const handleLoadChat = (chat) => {
        onLoadChat(chat.messages);
        setIsOpen(false);
    };

    const handleDeleteChat = async (chatId, e) => {
        e.stopPropagation();
        try {
            await base44.entities.ChatHistory.delete(chatId);
            setChatHistory(prev => prev.filter(c => c.id !== chatId));
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    const handleNewChat = () => {
        onNewChat();
        setIsOpen(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-sky-600"
                    title="היסטוריית שיחות"
                >
                    <History className="h-4 w-4 ml-1" />
                    <span className="hidden sm:inline">היסטוריה</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0" dir="rtl">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-sky-600" />
                        היסטוריית שיחות
                    </SheetTitle>
                </SheetHeader>

                <div className="p-3 border-b">
                    <Button
                        onClick={handleNewChat}
                        className="w-full bg-gradient-to-r from-sky-500 to-blue-600"
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        שיחה חדשה
                    </Button>
                </div>

                <ScrollArea className="h-[calc(100vh-160px)]">
                    {isLoading ? (
                        <div className="p-4 text-center text-slate-500">
                            טוען...
                        </div>
                    ) : chatHistory.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                            <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                            <p>אין שיחות קודמות</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {chatHistory.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                                    onClick={() => handleLoadChat(chat)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-sky-500 flex-shrink-0" />
                                                <h4 className="text-sm font-medium text-slate-800 truncate">
                                                    {chat.title || 'שיחה'}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {chat.messages?.length || 0} הודעות • {moment(chat.updated_date).fromNow()}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                                            onClick={(e) => handleDeleteChat(chat.id, e)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
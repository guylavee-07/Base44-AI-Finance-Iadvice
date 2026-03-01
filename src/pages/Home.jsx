import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, User, LogOut, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createPageUrl } from '@/utils';
import ChatInput from '@/components/finance/ChatInput';
import MessageBubble from '@/components/finance/MessageBubble';
import WelcomeCard from '@/components/finance/WelcomeCard';
import AlertBell from '@/components/alerts/AlertBell';
import AccessibilityWidget from '@/components/accessibility/AccessibilityWidget';
import ChatHistoryDrawer from '@/components/chat/ChatHistoryDrawer';
import { Brain } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);
    const [agreements, setAgreements] = useState([]);
    const [riskProfiles, setRiskProfiles] = useState({ allProfiles: [], myProfiles: [] });
    const [systemMessage, setSystemMessage] = useState(null);
    const [showSystemMessage, setShowSystemMessage] = useState(false);
    const [isMessageMinimized, setIsMessageMinimized] = useState(false);
    const [minimizedPosition, setMinimizedPosition] = useState({ top: 80, left: 16 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const dragStartPos = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const isJoining = urlParams.get('join') || urlParams.get('invited');
        
        if (isJoining) {
            // Check if there's an existing logged-in user
            base44.auth.me().then(existingUser => {
                if (existingUser && existingUser.email) {
                    // There's already a logged-in user - need to logout first
                    const confirmLogout = window.confirm(
                        `זוהה משתמש קיים (${existingUser.email}).\n\n` +
                        'כדי להיכנס עם המשתמש החדש, יש צורך להתנתק תחילה.\n\n' +
                        'האם ברצונך להתנתק ולהיכנס מחדש עם המשתמש החדש?'
                    );
                    
                    if (confirmLogout) {
                        // User confirmed - logout and redirect back to the join link
                        queryClient.clear();
                        localStorage.clear();
                        sessionStorage.clear();
                        base44.auth.logout(window.location.href);
                    } else {
                        // User cancelled - remove join params and stay with current user
                        window.history.replaceState({}, '', window.location.pathname);
                        checkUserProfile();
                    }
                    return;
                }
                // No existing user - proceed normally
                checkUserProfile();
            }).catch(() => {
                // No user logged in - proceed normally
                checkUserProfile();
            });
        } else {
            checkUserProfile();
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const checkUserProfile = async () => {
        try {
            // Clear ALL react-query cache
            queryClient.clear();
            
            // Wait a bit to ensure auth is ready
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Always fetch fresh user - NO CACHE
            const currentUser = await base44.auth.me();
            
            if (!currentUser || !currentUser.email) {
                throw new Error('No valid user session');
            }
            
            console.log('=== HOME USER ===', currentUser.email);
            setUser(currentUser);

            // Load saved message position for this user
            if (currentUser.system_message_position) {
                setMinimizedPosition(currentUser.system_message_position);
            }
            
            // Load agreements - admin sees all pending, user sees only their own
            let userAgreements;
            if (currentUser.role === 'admin') {
                // Admin sees all agreements
                userAgreements = await base44.entities.Agreement.list('-created_date');
            } else {
                // Regular user sees only their own
                userAgreements = await base44.entities.Agreement.filter(
                    { client_email: currentUser.email },
                    '-date_signed'
                );
            }
            
            // Load all risk profiles to check which agreements have been processed
            const allRiskProfiles = await base44.entities.RiskProfile.list();
            
            // Mark agreements that have an approved/completed risk profile
            const agreementsWithProfiles = (userAgreements || []).map(agreement => {
                const hasApprovedRiskProfile = allRiskProfiles?.some(
                    rp => rp.agreement_id === agreement.id && (rp.status === 'approved' || rp.status === 'completed')
                );
                return { ...agreement, hasRiskProfile: hasApprovedRiskProfile };
            });
            
            setAgreements(agreementsWithProfiles);
            
            // Load risk profiles for risk profiles dropdown - admin sees all
            let allVisibleProfiles;
            if (currentUser.role === 'admin') {
                const allRiskProfiles = await base44.entities.RiskProfile.list('-created_date');
                allVisibleProfiles = allRiskProfiles?.filter(p => 
                    p.status === 'approved' || p.status === 'completed'
                ) || [];
            } else {
                const userRiskProfilesForDropdown = await base44.entities.RiskProfile.filter(
                    { client_email: currentUser.email },
                    '-created_date'
                );
                allVisibleProfiles = userRiskProfilesForDropdown?.filter(p => 
                    p.status === 'approved' || p.status === 'completed'
                ) || [];
            }

            // For "My Profile" dropdown - always show only current user's profiles
            const myRiskProfiles = await base44.entities.RiskProfile.filter(
                { client_email: currentUser.email },
                '-created_date'
            );
            const myVisibleProfiles = myRiskProfiles?.filter(p => 
                p.status === 'approved' || p.status === 'completed'
            ) || [];
            setRiskProfiles({ allProfiles: allVisibleProfiles, myProfiles: myVisibleProfiles });

            // Load system message
            try {
                const settings = await base44.entities.SystemSettings.list();
                if (settings && settings.length > 0) {
                    const currentSettings = settings[0];
                    if (currentSettings.system_message && currentSettings.system_message.trim()) {
                        // Check if message has not expired
                        if (currentSettings.message_expiry_date) {
                            const expiryDate = new Date(currentSettings.message_expiry_date);
                            expiryDate.setHours(23, 59, 59, 999); // End of day
                            const today = new Date();
                            if (today <= expiryDate) {
                                setSystemMessage(currentSettings.system_message);
                                setShowSystemMessage(true);
                            }
                        } else {
                            // No expiry date, show message
                            setSystemMessage(currentSettings.system_message);
                            setShowSystemMessage(true);
                        }
                    }
                }
            } catch (err) {
                console.log('No system message settings found');
            }
            } catch (error) {
            console.error('=== ERROR IN HOME ===', error);
            // User not logged in - redirect to login
            base44.auth.redirectToLogin(createPageUrl('Home'));
            return;
            }
            setIsCheckingProfile(false);
            };

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    const getUserProfileContext = () => {
        if (!user?.investment_profile) return '';
        
        const profile = user.investment_profile;
        
        const riskLabels = { low: 'נמוכה', medium: 'בינונית', high: 'גבוהה' };
        const timeframeLabels = { 
            immediate: 'נזילות מיידית', 
            short: 'קצר טווח (עד שנה)', 
            medium: 'בינוני (1-5 שנים)', 
            long: 'ארוך טווח (5+ שנים)' 
        };
        const knowledgeLabels = { 
            beginner: 'משקיע מתחיל - השקעה ראשונה', 
            intermediate: 'יש ניסיון - יש כבר השקעות נוספות', 
            advanced: 'משקיע פעיל ומנוסה' 
        };
        
        const formatAmount = (amount) => {
            return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(amount || 0);
        };
        
        let context = '\n\n=== פרופיל המשתמש האישי ===\n';
        context += `• רמת סיכון: ${riskLabels[profile.risk_level] || profile.risk_level || 'לא הוגדר'}\n`;
        context += `• סכום נזיל להשקעה: ${formatAmount(profile.available_amount)}\n`;
        context += `• טווח השקעה רצוי: ${timeframeLabels[profile.investment_timeframe] || profile.investment_timeframe || 'לא הוגדר'}\n`;
        context += `• רמת ידע בהשקעות: ${knowledgeLabels[profile.knowledge_level] || profile.knowledge_level || 'לא הוגדר'}\n`;
        context += '========================\n';
        
        return context;
    };



    const handleSendMessage = async (text) => {
        const userMessage = { role: 'user', content: text };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setIsLoading(true);

        const profileContext = getUserProfileContext();
        
        // Build chat history from the updated messages (including current question)
        let chatHistory = '';
        if (updatedMessages.length > 0) {
            chatHistory = '\n\nהיסטוריית השיחה:\n';
            updatedMessages.forEach((msg) => {
                const role = msg.role === 'user' ? 'משתמש' : 'יועץ';
                chatHistory += `${role}: ${msg.content}\n\n`;
            });
        }

        const systemPrompt = `אתה יועץ עסקי מקצועי ואמפתי שמדבר עברית. אתה מייצג את חברת "יפתח ונגר יעוץ עסקי".
${profileContext}
${chatHistory}

תפקידך:
- לענות על שאלות בנושאי השקעות, חסכונות, מניות, ריביות, פנסיה, ביטוח וכל נושא פיננסי
- להתאים את התשובות לפרופיל האישי של המשתמש באופן מותאם לחלוטין

חשוב מאוד - התאמה אישית לפרופיל:
1. רמת הסיכון: אם המשתמש בחר רמת סיכון נמוכה - המלץ על השקעות סולידיות. רמה בינונית - איזון. רמה גבוהה - ניתן להציע אופציות עם תשואה פוטנציאלית גבוהה יותר.
2. סכום להשקעה: התאם את ההמלצות לסכום הנזיל שלו. אל תציע השקעות שדורשות סכום גבוה יותר ממה שיש לו.
3. טווח ההשקעה: נזילות מיידית - רק מכשירים נזילים. קצר טווח - השקעות סולידיות. בינוני/ארוך - ניתן לשקול השקעות פחות נזילות עם תשואה טובה יותר.
4. רמת הידע: למשקיע מתחיל - הסבר מושגים פשוטים, אל תשתמש במונחים מורכבים. למשקיע מנוסה - ניתן להעמיק ולדבר על אסטרטגיות מתקדמות.

חשוב:
- התשובות הן המלצות כלליות בלבד ואינן מהוות ייעוץ מקצועי מחייב
- עודד פנייה ליועץ מורשה להחלטות משמעותיות
- היה ידידותי, ברור ותומך
- השתמש בעברית פשוטה וברורה (במיוחד למשקיעים מתחילים)
- הוסף דוגמאות מספריות מותאמות לסכום שיש למשתמש
- התייחס להיסטוריית השיחה - אל תבקש מידע שכבר נמסר קודם
- סכם את הנקודות העיקריות בסוף התשובה

השאלה החדשה של המשתמש: ${text}`;

        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: systemPrompt,
                add_context_from_internet: true
            });

            const assistantMessage = { role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage = { 
                role: 'assistant', 
                content: 'מצטער, אירעה שגיאה. אנא נסה שוב.' 
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        
        setIsLoading(false);
    };

    if (isCheckingProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20" dir="rtl">
            {/* Skip to main content link for screen readers */}
            <a href="#main-content" className="skip-link">
                דלג לתוכן הראשי
            </a>
            
            {/* Accessibility Widget */}
            <AccessibilityWidget />

            {/* System Message Dialog */}
            <Dialog open={showSystemMessage && !isMessageMinimized} onOpenChange={(open) => {
                if (!open) {
                    setIsMessageMinimized(true);
                }
            }} modal={false}>
                <DialogContent className="max-w-2xl bg-blue-100 border-4 border-blue-600 shadow-xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-800">
                            <AlertCircle className="h-5 w-5" />
                            הודעת מערכת
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {systemMessage}
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setIsMessageMinimized(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            סגור
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Minimized Message Indicator */}
            {showSystemMessage && isMessageMinimized && (
                <div 
                    style={{ 
                        top: `${minimizedPosition.top}px`, 
                        left: `${minimizedPosition.left}px` 
                    }}
                    onMouseDown={(e) => {
                        dragStartPos.current = { x: e.clientX, y: e.clientY };
                        setDragOffset({
                            x: e.clientX - minimizedPosition.left,
                            y: e.clientY - minimizedPosition.top
                        });
                    }}
                    onMouseMove={(e) => {
                        if (dragStartPos.current) {
                            const distance = Math.sqrt(
                                Math.pow(e.clientX - dragStartPos.current.x, 2) + 
                                Math.pow(e.clientY - dragStartPos.current.y, 2)
                            );
                            if (distance > 5) {
                                setIsDragging(true);
                                const newPos = {
                                    left: e.clientX - dragOffset.x,
                                    top: e.clientY - dragOffset.y
                                };
                                setMinimizedPosition(newPos);
                            }
                        }
                    }}
                    onMouseUp={async () => {
                        if (isDragging) {
                            await base44.auth.updateMe({ system_message_position: minimizedPosition });
                        } else if (dragStartPos.current) {
                            setIsMessageMinimized(false);
                        }
                        setIsDragging(false);
                        dragStartPos.current = null;
                    }}
                    onMouseLeave={async () => {
                        if (isDragging) {
                            await base44.auth.updateMe({ system_message_position: minimizedPosition });
                            setIsDragging(false);
                        }
                        dragStartPos.current = null;
                    }}
                    className="fixed z-50 bg-blue-100 border-4 border-blue-600 rounded-lg p-3 shadow-xl cursor-move hover:shadow-2xl transition-shadow select-none"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-800" />
                        <span className="text-sm font-medium text-blue-800">הודעת מערכת</span>
                    </div>
                </div>
            )}

            {/* Disclaimer */}
            <div className="max-w-3xl mx-auto px-4 pt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>המידע הוא כללי בלבד ואינו מהווה ייעוץ השקעות מקצועי</span>
                </div>
            </div>

            {/* Main Content */}
            <main id="main-content" className="max-w-3xl mx-auto px-4 pb-32" role="main" aria-label="אזור הצ'אט הראשי">
                <ScrollArea className="h-[calc(100vh-280px)] pt-4" ref={scrollRef}>
                    {messages.length === 0 ? (
                        <WelcomeCard 
                            onExampleClick={handleSendMessage} 
                            onAnalysisComplete={(response, title) => {
                                const userMessage = { role: 'user', content: `📊 ${title}` };
                                const assistantMessage = { role: 'assistant', content: response };
                                setMessages([userMessage, assistantMessage]);
                            }}
                        />
                    ) : (
                        <div className="space-y-4 pb-4">
                            {messages.map((msg, index) => (
                                <MessageBubble 
                                    key={index}
                                    message={msg.content}
                                    isUser={msg.role === 'user'}
                                />
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-3 mr-auto max-w-[85%]">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md">
                                        <svg className="w-5 h-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-slate-200/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </main>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-6 px-4">
                <div className="max-w-3xl mx-auto">
                    <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
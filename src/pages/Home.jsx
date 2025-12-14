import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, User, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from '@/utils';
import ChatInput from '@/components/finance/ChatInput';
import MessageBubble from '@/components/finance/MessageBubble';
import WelcomeCard from '@/components/finance/WelcomeCard';
import AlertBell from '@/components/alerts/AlertBell';
import AccessibilityWidget from '@/components/accessibility/AccessibilityWidget';
import ChatHistoryDrawer from '@/components/chat/ChatHistoryDrawer';
import { Brain } from "lucide-react";

export default function Home() {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        checkUserProfile();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const checkUserProfile = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            // If user hasn't completed profile, redirect to profile form
            if (!currentUser.profile_completed) {
                window.location.href = createPageUrl('ProfileForm');
                return;
            }
        } catch (error) {
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
            
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm" role="banner">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    יפתח ונגר יעוץ עסקי
                                </h1>
                                <a 
                                    href="https://iadvice.co.il/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-sky-600 hover:text-sky-700 hover:underline transition-colors"
                                >
                                    iadvice.co.il
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.location.href = createPageUrl('ServiceAgreement')}
                                    className="text-slate-600 hover:text-emerald-600"
                                    title="הסכם שירות"
                                >
                                    <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="hidden sm:inline">הסכם</span>
                                </Button>
                            <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.location.href = createPageUrl('AIInsights')}
                                    className="text-slate-600 hover:text-purple-600"
                                    title="תובנות AI"
                                >
                                    <Brain className="h-4 w-4 ml-1" />
                                    <span className="hidden sm:inline">תובנות</span>
                                </Button>
                                <ChatHistoryDrawer 
                                    userEmail={user?.email}
                                    currentMessages={messages}
                                    onLoadChat={(loadedMessages) => setMessages(loadedMessages)}
                                    onNewChat={() => setMessages([])}
                                />
                                <AlertBell userEmail={user?.email} />
                                <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = createPageUrl('MyProfile')}
                                className="text-slate-600 hover:text-sky-600"
                            >
                                <User className="h-4 w-4 ml-1" />
                                <span className="hidden sm:inline">הפרופיל שלי</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-slate-600 hover:text-red-600"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

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
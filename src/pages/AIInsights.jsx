import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Brain, 
    TrendingUp, 
    AlertTriangle, 
    Newspaper, 
    Loader2, 
    ArrowRight,
    Sparkles,
    Target,
    PieChart,
    RefreshCw,
    Lightbulb,
    BarChart3
} from "lucide-react";
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function AIInsights() {
    const [user, setUser] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('patterns');
    
    const [patterns, setPatterns] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [newsSummary, setNewsSummary] = useState(null);
    
    const [loadingPatterns, setLoadingPatterns] = useState(false);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [loadingNews, setLoadingNews] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            const history = await base44.entities.ChatHistory.filter(
                { user_email: currentUser.email },
                '-created_date',
                50
            );
            setChatHistory(history);
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setIsLoading(false);
    };

    const analyzePatterns = async () => {
        if (chatHistory.length === 0) {
            setPatterns({ error: 'אין מספיק היסטוריית שיחות לניתוח' });
            return;
        }
        
        setLoadingPatterns(true);
        
        const allMessages = chatHistory.flatMap(chat => 
            chat.messages?.filter(m => m.role === 'user').map(m => m.content) || []
        );
        
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `נתח את השאלות הבאות שהמשתמש שאל על נושאי פיננסים והשקעות וזהה דפוסים ומגמות:

שאלות המשתמש:
${allMessages.join('\n')}

פרופיל המשתמש:
${JSON.stringify(user?.investment_profile || {})}

ספק ניתוח מפורט בעברית הכולל:
1. נושאים עיקריים שמעניינים את המשתמש
2. רמת הידע הפיננסי המשתערת
3. חששות או אתגרים שעולים מהשאלות
4. מגמות בהתעניינות לאורך זמן
5. המלצות לנושאים שכדאי להעמיק בהם`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        main_topics: {
                            type: "array",
                            items: { 
                                type: "object",
                                properties: {
                                    topic: { type: "string" },
                                    frequency: { type: "string" },
                                    insight: { type: "string" }
                                }
                            }
                        },
                        knowledge_level: { type: "string" },
                        concerns: { type: "array", items: { type: "string" } },
                        trends: { type: "string" },
                        recommendations: { type: "array", items: { type: "string" } }
                    }
                }
            });
            setPatterns(response);
        } catch (error) {
            console.error('Error analyzing patterns:', error);
            setPatterns({ error: 'שגיאה בניתוח' });
        }
        setLoadingPatterns(false);
    };

    const formatProfileForPrompt = (profile) => {
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
        
        return `
• רמת סיכון: ${riskLabels[profile?.risk_level] || 'לא הוגדר'}
• סכום נזיל להשקעה: ${formatAmount(profile?.available_amount)}
• טווח השקעה רצוי: ${timeframeLabels[profile?.investment_timeframe] || 'לא הוגדר'}
• רמת ידע בהשקעות: ${knowledgeLabels[profile?.knowledge_level] || 'לא הוגדר'}`;
    };

    const generateRecommendations = async () => {
        setLoadingRecommendations(true);
        
        const profile = user?.investment_profile || {};
        const profileText = formatProfileForPrompt(profile);
        
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `על סמך הפרופיל והנתונים הבאים, ספק המלצות השקעה מותאמות אישית ואזהרות:

=== פרופיל המשתמש ===
${profileText}
====================

היסטוריית התעניינות:
${chatHistory.slice(0, 10).map(c => c.title).join(', ')}

חשוב מאוד - התאם את ההמלצות לפרופיל:
- רמת הסיכון: ${profile.risk_level === 'low' ? 'המלץ רק על השקעות סולידיות ובטוחות' : profile.risk_level === 'high' ? 'ניתן להציע אופציות עם תשואה גבוהה יותר וסיכון' : 'המלץ על איזון בין סיכון לתשואה'}
- סכום להשקעה: התאם את ההמלצות לסכום של ${profile.available_amount || 0} ₪
- טווח זמן: ${profile.investment_timeframe === 'immediate' || profile.investment_timeframe === 'short' ? 'המלץ רק על השקעות נזילות' : 'ניתן לשקול השקעות לטווח ארוך יותר'}
- רמת ידע: ${profile.knowledge_level === 'beginner' ? 'הסבר בפשטות, בלי מונחים מורכבים' : 'ניתן להעמיק יותר'}

ספק:
1. 3-5 הזדמנויות השקעה פוטנציאליות המתאימות לפרופיל הספציפי
2. 2-3 אזהרות או סיכונים שכדאי להיזהר מהם בהתאם לפרופיל
3. טיפים מעשיים להשבחת התיק מותאמים לרמת הידע

חשוב: ההמלצות הן כלליות ואינן מהוות ייעוץ השקעות מקצועי.`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        opportunities: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    risk_level: { type: "string" },
                                    potential: { type: "string" }
                                }
                            }
                        },
                        warnings: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" }
                                }
                            }
                        },
                        tips: { type: "array", items: { type: "string" } }
                    }
                }
            });
            setRecommendations(response);
        } catch (error) {
            console.error('Error generating recommendations:', error);
            setRecommendations({ error: 'שגיאה בהפקת המלצות' });
        }
        setLoadingRecommendations(false);
    };

    const fetchNewsSummary = async () => {
        setLoadingNews(true);
        
        const profile = user?.investment_profile || {};
        const profileText = formatProfileForPrompt(profile);
        
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `ספק סיכום חדשות פיננסיות עדכני ורלוונטי בעברית, מותאם לפרופיל המשתמש.

=== פרופיל המשתמש ===
${profileText}
====================

התאם את החדשות לפרופיל:
- רמת הסיכון: ${profile.risk_level === 'low' ? 'התמקד בחדשות על השקעות סולידיות, אג"ח, פיקדונות' : profile.risk_level === 'high' ? 'כלול חדשות על מניות, קריפטו, הזדמנויות ספקולטיביות' : 'מגוון חדשות מאוזן'}
- טווח השקעה: ${profile.investment_timeframe === 'long' ? 'חדשות על מגמות ארוכות טווח' : 'חדשות על הזדמנויות מיידיות'}
- רמת ידע: ${profile.knowledge_level === 'beginner' ? 'הסבר בפשטות, בלי מונחים מורכבים' : 'ניתן להשתמש במונחים מקצועיים'}

ספק:
1. סיכום של 5 החדשות הפיננסיות החשובות ביותר מהשבוע האחרון, רלוונטיות לפרופיל
2. השפעה אפשרית על השוק הישראלי
3. מה כדאי לעקוב אחריו בשבוע הקרוב בהתאם לפרופיל`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        news_items: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    headline: { type: "string" },
                                    summary: { type: "string" },
                                    impact: { type: "string" },
                                    relevance: { type: "string" }
                                }
                            }
                        },
                        market_outlook: { type: "string" },
                        watch_list: { type: "array", items: { type: "string" } },
                        last_updated: { type: "string" }
                    }
                }
            });
            setNewsSummary({ ...response, last_updated: new Date().toISOString() });
        } catch (error) {
            console.error('Error fetching news:', error);
            setNewsSummary({ error: 'שגיאה בטעינת חדשות' });
        }
        setLoadingNews(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4" dir="rtl">
            <div className="max-w-4xl mx-auto pt-4 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-400/30">
                            <Brain className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">תובנות AI</h1>
                            <p className="text-slate-600 text-sm">ניתוח חכם של הנתונים שלך</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => window.location.href = createPageUrl('Home')}
                        className="text-slate-600 hover:text-blue-600"
                    >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        חזור לדף הבית
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="patterns" className="flex items-center gap-2">
                            <PieChart className="h-4 w-4" />
                            ניתוח דפוסים
                        </TabsTrigger>
                        <TabsTrigger value="recommendations" className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            המלצות
                        </TabsTrigger>
                        <TabsTrigger value="news" className="flex items-center gap-2">
                            <Newspaper className="h-4 w-4" />
                            סיכום חדשות
                        </TabsTrigger>
                    </TabsList>

                    {/* Patterns Tab */}
                    <TabsContent value="patterns" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-purple-600" />
                                    ניתוח דפוסים והתעניינויות
                                </CardTitle>
                                <CardDescription>
                                    ניתוח AI של היסטוריית השיחות שלך לזיהוי מגמות ודפוסים
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!patterns ? (
                                    <div className="text-center py-8">
                                        <Brain className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-600 mb-4">
                                            {chatHistory.length === 0 
                                                ? 'אין היסטוריית שיחות לניתוח. התחל לשאול שאלות כדי לקבל תובנות.'
                                                : `נמצאו ${chatHistory.length} שיחות לניתוח`}
                                        </p>
                                        <Button 
                                            onClick={analyzePatterns}
                                            disabled={loadingPatterns || chatHistory.length === 0}
                                            className="bg-gradient-to-r from-purple-500 to-indigo-600"
                                        >
                                            {loadingPatterns ? (
                                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                            ) : (
                                                <Sparkles className="h-4 w-4 ml-2" />
                                            )}
                                            נתח את ההיסטוריה שלי
                                        </Button>
                                    </div>
                                ) : patterns.error ? (
                                    <p className="text-amber-600 text-center py-4">{patterns.error}</p>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Main Topics */}
                                        <div>
                                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                <Target className="h-4 w-4 text-purple-600" />
                                                נושאים עיקריים
                                            </h4>
                                            <div className="grid gap-3">
                                                {patterns.main_topics?.map((topic, i) => (
                                                    <div key={i} className="bg-purple-50 rounded-lg p-3">
                                                        <div className="flex justify-between items-start">
                                                            <span className="font-medium text-purple-800">{topic.topic}</span>
                                                            <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded">{topic.frequency}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 mt-1">{topic.insight}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Knowledge Level */}
                                        <div className="bg-slate-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-slate-800 mb-2">רמת ידע משוערת</h4>
                                            <p className="text-slate-600">{patterns.knowledge_level}</p>
                                        </div>

                                        {/* Concerns */}
                                        {patterns.concerns?.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                                    חששות שעלו
                                                </h4>
                                                <ul className="space-y-2">
                                                    {patterns.concerns.map((concern, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-slate-600">
                                                            <span className="text-amber-500">•</span>
                                                            {concern}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Recommendations */}
                                        {patterns.recommendations?.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-emerald-600" />
                                                    נושאים מומלצים להעמקה
                                                </h4>
                                                <ul className="space-y-2">
                                                    {patterns.recommendations.map((rec, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-slate-600">
                                                            <span className="text-emerald-500">✓</span>
                                                            {rec}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <Button 
                                            variant="outline" 
                                            onClick={analyzePatterns}
                                            disabled={loadingPatterns}
                                            className="w-full"
                                        >
                                            <RefreshCw className={`h-4 w-4 ml-2 ${loadingPatterns ? 'animate-spin' : ''}`} />
                                            רענן ניתוח
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Recommendations Tab */}
                    <TabsContent value="recommendations" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    המלצות מותאמות אישית
                                </CardTitle>
                                <CardDescription>
                                    הזדמנויות ואזהרות על סמך הפרופיל וההעדפות שלך
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!recommendations ? (
                                    <div className="py-8">
                                        <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-600 mb-4 text-center">קבל המלצות השקעה מותאמות אישית</p>
                                        <div className="flex justify-start">
                                            <Button 
                                                onClick={generateRecommendations}
                                                disabled={loadingRecommendations}
                                                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-sm"
                                            >
                                                {loadingRecommendations ? (
                                                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                                ) : (
                                                    <Sparkles className="h-4 w-4 ml-2" />
                                                )}
                                                פתח פעם נוספת
                                            </Button>
                                        </div>
                                    </div>
                                ) : recommendations.error ? (
                                    <p className="text-amber-600 text-center py-4">{recommendations.error}</p>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Opportunities */}
                                        <div>
                                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                                הזדמנויות פוטנציאליות
                                            </h4>
                                            <div className="grid gap-3">
                                                {recommendations.opportunities?.map((opp, i) => (
                                                    <div key={i} className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-medium text-emerald-800">{opp.title}</span>
                                                            <span className="text-xs bg-emerald-200 text-emerald-700 px-2 py-1 rounded">
                                                                סיכון: {opp.risk_level}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600">{opp.description}</p>
                                                        <p className="text-xs text-emerald-600 mt-2">פוטנציאל: {opp.potential}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Warnings */}
                                        {recommendations.warnings?.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                                    אזהרות וסיכונים
                                                </h4>
                                                <div className="grid gap-3">
                                                    {recommendations.warnings.map((warn, i) => (
                                                        <div key={i} className="bg-red-50 rounded-lg p-4 border border-red-100">
                                                            <span className="font-medium text-red-800">{warn.title}</span>
                                                            <p className="text-sm text-slate-600 mt-1">{warn.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tips */}
                                        {recommendations.tips?.length > 0 && (
                                            <div className="bg-sky-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-sky-600" />
                                                    טיפים מעשיים
                                                </h4>
                                                <ul className="space-y-2">
                                                    {recommendations.tips.map((tip, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                                                            <span className="text-sky-500">💡</span>
                                                            {tip}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                                            <p className="text-xs text-amber-700">
                                                ⚠️ המלצות אלו הן כלליות בלבד ואינן מהוות ייעוץ השקעות מקצועי
                                            </p>
                                        </div>

                                        <Button 
                                            variant="outline" 
                                            onClick={generateRecommendations}
                                            disabled={loadingRecommendations}
                                            className="w-full"
                                        >
                                            <RefreshCw className={`h-4 w-4 ml-2 ${loadingRecommendations ? 'animate-spin' : ''}`} />
                                            רענן המלצות
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* News Tab */}
                    <TabsContent value="news" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Newspaper className="h-5 w-5 text-blue-600" />
                                    סיכום חדשות פיננסיות
                                </CardTitle>
                                <CardDescription>
                                    חדשות רלוונטיות מותאמות לתחומי העניין שלך
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!newsSummary ? (
                                    <div className="text-center py-8">
                                        <Newspaper className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-600 mb-4">קבל סיכום חדשות פיננסיות עדכני</p>
                                        <Button 
                                            onClick={fetchNewsSummary}
                                            disabled={loadingNews}
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600"
                                        >
                                            {loadingNews ? (
                                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                            ) : (
                                                <Sparkles className="h-4 w-4 ml-2" />
                                            )}
                                            טען חדשות
                                        </Button>
                                    </div>
                                ) : newsSummary.error ? (
                                    <p className="text-amber-600 text-center py-4">{newsSummary.error}</p>
                                ) : (
                                    <div className="space-y-6">
                                        {/* News Items */}
                                        <div className="grid gap-4">
                                            {newsSummary.news_items?.map((item, i) => (
                                                <div key={i} className="bg-white rounded-lg p-4 border shadow-sm">
                                                    <h5 className="font-semibold text-slate-800 mb-2">{item.headline}</h5>
                                                    <p className="text-sm text-slate-600 mb-3">{item.summary}</p>
                                                    <div className="flex gap-4 text-xs">
                                                        <span className="text-blue-600">📊 השפעה: {item.impact}</span>
                                                        <span className="text-purple-600">🎯 רלוונטיות: {item.relevance}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Market Outlook */}
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                                תחזית שוק
                                            </h4>
                                            <p className="text-sm text-slate-600">{newsSummary.market_outlook}</p>
                                        </div>

                                        {/* Watch List */}
                                        {newsSummary.watch_list?.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-amber-600" />
                                                    כדאי לעקוב
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {newsSummary.watch_list.map((item, i) => (
                                                        <span key={i} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {newsSummary.last_updated && (
                                            <p className="text-xs text-slate-400 text-center">
                                                עודכן: {moment(newsSummary.last_updated).format('DD/MM/YYYY HH:mm')}
                                            </p>
                                        )}

                                        <Button 
                                            variant="outline" 
                                            onClick={fetchNewsSummary}
                                            disabled={loadingNews}
                                            className="w-full"
                                        >
                                            <RefreshCw className={`h-4 w-4 ml-2 ${loadingNews ? 'animate-spin' : ''}`} />
                                            רענן חדשות
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
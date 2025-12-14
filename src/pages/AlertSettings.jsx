import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, TrendingUp, Sparkles, AlertTriangle, Newspaper, ArrowRight, Save, RefreshCw } from "lucide-react";
import { createPageUrl } from '@/utils';

const sectors = [
    "טכנולוגיה", "פיננסים", "נדל\"ן", "בריאות", "אנרגיה", 
    "תעשייה", "צריכה", "תקשורת", "חומרי גלם", "תשתיות"
];

export default function AlertSettings() {
    const [user, setUser] = useState(null);
    const [preferences, setPreferences] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            const prefs = await base44.entities.AlertPreferences.filter(
                { user_email: currentUser.email }
            );
            
            if (prefs.length > 0) {
                setPreferences(prefs[0]);
            } else {
                // Create default preferences
                const newPrefs = await base44.entities.AlertPreferences.create({
                    user_email: currentUser.email,
                    market_updates: true,
                    opportunities: true,
                    risk_alerts: true,
                    news: true,
                    min_priority: 'low',
                    sectors: []
                });
                setPreferences(newPrefs);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setIsLoading(false);
    };

    const savePreferences = async () => {
        setIsSaving(true);
        try {
            await base44.entities.AlertPreferences.update(preferences.id, preferences);
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
        setIsSaving(false);
    };

    const toggleSector = (sector) => {
        const currentSectors = preferences.sectors || [];
        const newSectors = currentSectors.includes(sector)
            ? currentSectors.filter(s => s !== sector)
            : [...currentSectors, sector];
        setPreferences({ ...preferences, sectors: newSectors });
    };

    const generatePersonalizedAlerts = async () => {
        setIsGenerating(true);
        try {
            const profileContext = user?.investment_profile 
                ? Object.entries(user.investment_profile).map(([k, v]) => `${k}: ${v}`).join(', ')
                : '';
            
            const prompt = `בהתבסס על פרופיל המשתמש הבא: ${profileContext}
            
והעדפות הסקטורים: ${(preferences?.sectors || []).join(', ') || 'כל הסקטורים'}

צור 3 התראות מותאמות אישית עבור המשתמש. כל התראה צריכה לכלול:
- כותרת קצרה וברורה
- הודעה מפורטת עם תובנה או המלצה
- סוג (אחד מ: market_update, opportunity, risk_alert, news, personal)
- עדיפות (low, medium, high)

החזר בפורמט JSON כמערך של אובייקטים.`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        alerts: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    message: { type: "string" },
                                    type: { type: "string" },
                                    priority: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            // Create the alerts
            if (response?.alerts) {
                await Promise.all(response.alerts.map(alert =>
                    base44.entities.Alert.create({
                        user_email: user.email,
                        title: alert.title,
                        message: alert.message,
                        type: alert.type,
                        priority: alert.priority,
                        is_read: false
                    })
                ));
            }
            
            window.location.href = createPageUrl('Home');
        } catch (error) {
            console.error('Error generating alerts:', error);
        }
        setIsGenerating(false);
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
            <div className="max-w-2xl mx-auto pt-8 space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-xl shadow-sky-500/30 mb-4">
                        <Bell className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">הגדרות התראות</h1>
                    <p className="text-slate-600">התאם את ההתראות לצרכים שלך</p>
                </div>

                {/* Alert Types */}
                <Card>
                    <CardHeader>
                        <CardTitle>סוגי התראות</CardTitle>
                        <CardDescription>בחר אילו התראות תרצה לקבל</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <Label className="text-base">עדכוני שוק</Label>
                                    <p className="text-sm text-slate-500">שינויים משמעותיים בשוק ההון</p>
                                </div>
                            </div>
                            <Switch
                                checked={preferences?.market_updates}
                                onCheckedChange={(checked) => setPreferences({...preferences, market_updates: checked})}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <Label className="text-base">הזדמנויות השקעה</Label>
                                    <p className="text-sm text-slate-500">הזדמנויות מותאמות לפרופיל שלך</p>
                                </div>
                            </div>
                            <Switch
                                checked={preferences?.opportunities}
                                onCheckedChange={(checked) => setPreferences({...preferences, opportunities: checked})}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <Label className="text-base">התראות סיכון</Label>
                                    <p className="text-sm text-slate-500">אזהרות על סיכונים פוטנציאליים</p>
                                </div>
                            </div>
                            <Switch
                                checked={preferences?.risk_alerts}
                                onCheckedChange={(checked) => setPreferences({...preferences, risk_alerts: checked})}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                                    <Newspaper className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <Label className="text-base">חדשות פיננסיות</Label>
                                    <p className="text-sm text-slate-500">עדכונים וחדשות רלוונטיות</p>
                                </div>
                            </div>
                            <Switch
                                checked={preferences?.news}
                                onCheckedChange={(checked) => setPreferences({...preferences, news: checked})}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Priority Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle>רמת עדיפות מינימלית</CardTitle>
                        <CardDescription>קבל התראות ברמת עדיפות זו ומעלה</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={preferences?.min_priority || 'low'}
                            onValueChange={(value) => setPreferences({...preferences, min_priority: value})}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">כל ההתראות</SelectItem>
                                <SelectItem value="medium">בינונית ומעלה</SelectItem>
                                <SelectItem value="high">גבוהה בלבד</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Sectors */}
                <Card>
                    <CardHeader>
                        <CardTitle>סקטורים לעקיבה</CardTitle>
                        <CardDescription>בחר סקטורים שמעניינים אותך (אופציונלי)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {sectors.map((sector) => (
                                <Badge
                                    key={sector}
                                    variant={(preferences?.sectors || []).includes(sector) ? "default" : "outline"}
                                    className="cursor-pointer transition-all"
                                    onClick={() => toggleSector(sector)}
                                >
                                    {sector}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Button 
                        onClick={savePreferences}
                        disabled={isSaving}
                        className="w-full bg-gradient-to-r from-sky-500 to-blue-600"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                        שמור הגדרות
                    </Button>

                    <Button 
                        onClick={generatePersonalizedAlerts}
                        disabled={isGenerating}
                        variant="outline"
                        className="w-full"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <RefreshCw className="h-4 w-4 ml-2" />}
                        צור התראות מותאמות אישית עכשיו
                    </Button>

                    <Button 
                        onClick={() => window.location.href = createPageUrl('Home')}
                        variant="ghost"
                        className="w-full"
                    >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        חזור לדף הבית
                    </Button>
                </div>
            </div>
        </div>
    );
}
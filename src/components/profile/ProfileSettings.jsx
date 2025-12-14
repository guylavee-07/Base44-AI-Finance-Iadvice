import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, AlertTriangle, Wallet, Clock, GraduationCap } from "lucide-react";

const riskLevels = [
    { value: 'low', label: 'נמוכה', description: 'שמירה על הקרן, תשואה נמוכה', color: 'text-green-600' },
    { value: 'medium', label: 'בינונית', description: 'איזון בין סיכון לתשואה', color: 'text-amber-600' },
    { value: 'high', label: 'גבוהה', description: 'פוטנציאל תשואה גבוה עם סיכון', color: 'text-red-600' }
];

const investmentTimeframes = [
    { value: 'immediate', label: 'נזילות מיידית', description: 'גישה לכסף בכל רגע' },
    { value: 'short', label: 'קצר טווח (עד שנה)', description: 'השקעה לתקופה קצרה' },
    { value: 'medium', label: 'בינוני (1-5 שנים)', description: 'השקעה לטווח בינוני' },
    { value: 'long', label: 'ארוך טווח (5+ שנים)', description: 'השקעה לטווח ארוך' }
];

const knowledgeLevels = [
    { value: 'beginner', label: 'השקעה ראשונה', description: 'זו ההשקעה הראשונה שלי' },
    { value: 'intermediate', label: 'יש כבר השקעות נוספות', description: 'יש לי ניסיון בסיסי' },
    { value: 'advanced', label: 'משקיע פעיל / משקיע הרבה', description: 'יש לי ניסיון רב בהשקעות' }
];

export default function ProfileSettings({ user, onSave }) {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        risk_level: 'medium',
        available_amount: 50000,
        investment_timeframe: 'medium',
        knowledge_level: 'beginner'
    });

    useEffect(() => {
        if (user?.investment_profile) {
            setSettings({
                risk_level: user.investment_profile.risk_level || 'medium',
                available_amount: user.investment_profile.available_amount || 50000,
                investment_timeframe: user.investment_profile.investment_timeframe || 'medium',
                knowledge_level: user.investment_profile.knowledge_level || 'beginner'
            });
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(settings);
        setIsSaving(false);
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Risk Level */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        רמת סיכון
                    </CardTitle>
                    <CardDescription>באיזו רמת סיכון אתה מרגיש בנוח?</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={settings.risk_level}
                        onValueChange={(value) => setSettings({ ...settings, risk_level: value })}
                        className="space-y-3"
                    >
                        {riskLevels.map((level) => (
                            <div key={level.value} className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg border ${settings.risk_level === level.value ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}>
                                <RadioGroupItem value={level.value} id={`risk-${level.value}`} />
                                <Label htmlFor={`risk-${level.value}`} className="flex-1 cursor-pointer">
                                    <span className={`font-medium ${level.color}`}>{level.label}</span>
                                    <p className="text-xs text-slate-500">{level.description}</p>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* Available Amount */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Wallet className="h-5 w-5 text-emerald-500" />
                        סכום נזיל להשקעה
                    </CardTitle>
                    <CardDescription>כמה כסף פנוי יש לך להשקעה?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <span className="text-3xl font-bold text-emerald-600">
                            {formatAmount(settings.available_amount)}
                        </span>
                    </div>
                    <Slider
                        value={[settings.available_amount]}
                        onValueChange={([value]) => setSettings({ ...settings, available_amount: value })}
                        min={0}
                        max={500000}
                        step={5000}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>₪0</span>
                        <span>₪500,000</span>
                    </div>
                </CardContent>
            </Card>

            {/* Investment Timeframe */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-blue-500" />
                        זמן השקעה רצוי / נזילות
                    </CardTitle>
                    <CardDescription>לכמה זמן אתה מתכנן להשקיע?</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select
                        value={settings.investment_timeframe}
                        onValueChange={(value) => setSettings({ ...settings, investment_timeframe: value })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="בחר זמן השקעה" />
                        </SelectTrigger>
                        <SelectContent>
                            {investmentTimeframes.map((timeframe) => (
                                <SelectItem key={timeframe.value} value={timeframe.value}>
                                    <div>
                                        <span className="font-medium">{timeframe.label}</span>
                                        <p className="text-xs text-slate-500">{timeframe.description}</p>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Knowledge Level */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <GraduationCap className="h-5 w-5 text-purple-500" />
                        רמת ידע בעולם ההשקעות
                    </CardTitle>
                    <CardDescription>מה הניסיון שלך בהשקעות?</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={settings.knowledge_level}
                        onValueChange={(value) => setSettings({ ...settings, knowledge_level: value })}
                        className="space-y-3"
                    >
                        {knowledgeLevels.map((level) => (
                            <div key={level.value} className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg border ${settings.knowledge_level === level.value ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                                <RadioGroupItem value={level.value} id={`knowledge-${level.value}`} />
                                <Label htmlFor={`knowledge-${level.value}`} className="flex-1 cursor-pointer">
                                    <span className="font-medium">{level.label}</span>
                                    <p className="text-xs text-slate-500">{level.description}</p>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* Save Button */}
            <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 h-12 text-lg"
            >
                {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                ) : (
                    <Save className="h-5 w-5 ml-2" />
                )}
                שמור הגדרות פרופיל
            </Button>
        </div>
    );
}
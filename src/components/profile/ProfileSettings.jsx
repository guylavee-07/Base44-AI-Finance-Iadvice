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

export default function ProfileSettings({ user, onSave, readOnly = true }) {
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

    const getRiskLevelLabel = (value) => {
        const level = riskLevels.find(l => l.value === value);
        return level ? level.label : value;
    };

    const getTimeframeLabel = (value) => {
        const timeframe = investmentTimeframes.find(t => t.value === value);
        return timeframe ? timeframe.label : value;
    };

    const getKnowledgeLabel = (value) => {
        const knowledge = knowledgeLevels.find(k => k.value === value);
        return knowledge ? knowledge.label : value;
    };

    return (
        <div className="space-y-6">
            {/* Available Amount, Investment Timeframe & Knowledge Level */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2 text-right">
                        <CardTitle className="text-base text-right">
                            סכום נזיל להשקעה
                        </CardTitle>
                        <CardDescription className="text-right text-xs">כמה כסף פנוי יש לך להשקעה?</CardDescription>
                    </CardHeader>
                    <CardContent className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">
                            {formatAmount(settings.available_amount)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 text-right">
                        <CardTitle className="text-base text-right">
                            זמן השקעה רצוי / נזילות
                        </CardTitle>
                        <CardDescription className="text-right text-xs">לכמה זמן אתה מתכנן להשקיע?</CardDescription>
                    </CardHeader>
                    <CardContent className="text-right">
                        <p className="text-lg font-medium">{getTimeframeLabel(settings.investment_timeframe)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 text-right">
                        <CardTitle className="text-base text-right">
                            רמת ידע בעולם ההשקעות
                        </CardTitle>
                        <CardDescription className="text-right text-xs">מה הניסיון שלך בהשקעות?</CardDescription>
                    </CardHeader>
                    <CardContent className="text-right">
                        <p className="text-lg font-medium">{getKnowledgeLabel(settings.knowledge_level)}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
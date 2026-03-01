import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, ArrowRight } from "lucide-react";
import { createPageUrl } from '@/utils';
import { Label } from "@/components/ui/label";

export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [targetEmail, setTargetEmail] = useState('');
    const [agreement, setAgreement] = useState(null);
    const [riskProfile, setRiskProfile] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            // Get email from URL
            const urlParams = new URLSearchParams(window.location.search);
            const emailFromUrl = urlParams.get('email');
            
            if (!emailFromUrl) {
                window.location.href = createPageUrl('Home');
                return;
            }
            
            setTargetEmail(emailFromUrl);
            
            // Load agreement data
            const agreements = await base44.entities.Agreement.filter({ client_email: emailFromUrl }, '-date_signed');
            if (agreements && agreements.length > 0) {
                setAgreement(agreements[0]);
            }
            
            // Load risk profile data - most recent completed/approved
            const riskProfiles = await base44.entities.RiskProfile.filter({ client_email: emailFromUrl }, '-client_signature_date');
            const completedProfiles = riskProfiles?.filter(p => p.status === 'approved' || p.status === 'completed');
            if (completedProfiles && completedProfiles.length > 0) {
                setRiskProfile(completedProfiles[0]);
            }
            
            // Load user's investment profile from User entity
            try {
                const allUsers = await base44.entities.User.list();
                const targetUser = allUsers?.find(u => u.email === emailFromUrl);
                if (targetUser?.investment_profile) {
                    setUserProfile(targetUser.investment_profile);
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
            }
        } catch (error) {
            console.error('Error loading user:', error);
            base44.auth.redirectToLogin(createPageUrl('Home'));
        }
        setIsLoading(false);
    };

    const getRiskLevelText = (level) => {
        const levels = {
            low: "נמוכה",
            low_medium: "נמוכה-בינונית",
            medium: "בינונית",
            medium_high: "בינונית-גבוהה",
            high: "גבוהה",
            speculative: "ספקולטיבית"
        };
        return levels[level] || level;
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
            <div className="max-w-4xl mx-auto pt-2 space-y-2">
                {/* Back Button */}
                <div className="mb-2 text-left">
                    <Button 
                        onClick={() => window.location.href = createPageUrl('Home')}
                        variant="ghost"
                        className="text-slate-600 hover:text-blue-600"
                    >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        חזור לדף הבית
                    </Button>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex-1 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shadow-xl shadow-blue-400/30 mb-1">
                            <User className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 leading-tight">פרופיל משתמש</h1>
                        <p className="text-sm text-slate-600">{targetEmail}</p>
                    </div>
                    {riskProfile?.client_signature_date && (
                        <Card className="bg-slate-50 border-2 border-blue-400">
                            <CardContent className="py-3 px-4">
                                <div className="text-left">
                                    <p className="text-xs text-slate-500 leading-tight">תאריך חתימה</p>
                                    <p className="text-sm font-medium leading-tight">
                                        {new Date(riskProfile.client_signature_date).toLocaleDateString('he-IL')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Agreement Data */}
                {agreement && (
                    <Card>
                        <CardHeader className="pb-2 text-right">
                            <div className="inline-block text-right">
                                <CardTitle className="inline">פרטי ההסכם</CardTitle>
                                <CardDescription className="inline text-xs mr-2">(מידע מהסכם ייעוץ השקעות)</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="text-right py-2">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 leading-tight">שם מלא</p>
                                    <p className="text-sm font-medium leading-tight">{agreement.client_full_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 leading-tight">ת.ז / ח.פ</p>
                                    <p className="text-sm font-medium leading-tight">{agreement.client_id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 leading-tight">כתובת</p>
                                    <p className="text-sm font-medium leading-tight">{agreement.client_address}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Risk Profile Data */}
                {riskProfile && (
                    <Card>
                        <CardHeader className="pb-2 text-right">
                            <div className="inline-block text-right">
                                <CardTitle className="inline">רמת סיכון</CardTitle>
                                <CardDescription className="inline text-xs mr-2">(מידע מטופס רמות הסיכון)</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-right py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <Card className="bg-slate-50">
                                    <CardContent className="py-2">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 leading-tight">רמת סיכון מומלצת</p>
                                            <p className="text-sm font-medium leading-tight">{getRiskLevelText(riskProfile.recommended_risk_level)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-slate-50">
                                    <CardContent className="py-2">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 leading-tight">סוג אישור</p>
                                            <p className="text-sm font-medium leading-tight">
                                                {riskProfile.confirmation_type === 'accept_recommended' 
                                                    ? 'מאשר המלצה' 
                                                    : 'בחר רמה שונה'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Card className="bg-slate-50">
                                    <CardContent className="py-2">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 leading-tight">רמת סיכון שנבחרה</p>
                                            <p className="text-sm font-medium leading-tight">{getRiskLevelText(riskProfile.chosen_risk_level)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                {riskProfile.justification && (
                                    <Card className="bg-slate-50">
                                        <CardContent className="py-2">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500 leading-tight">נימוק</p>
                                                <p className="text-xs leading-tight">{riskProfile.justification}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Investment Profile */}
                {userProfile && (
                    <Card>
                        <CardHeader className="pb-2 text-right">
                            <div className="inline-block text-right">
                                <CardTitle className="inline">פרופיל השקעות</CardTitle>
                                <CardDescription className="inline text-xs mr-2">(הגדרות אישיות)</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-right py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <Card className="bg-slate-50">
                                    <CardContent className="py-2">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 leading-tight">רמת סיכון</p>
                                            <p className="text-sm font-medium leading-tight">
                                                {userProfile.risk_level === 'low' ? 'נמוכה' : 
                                                 userProfile.risk_level === 'medium' ? 'בינונית' : 
                                                 userProfile.risk_level === 'high' ? 'גבוהה' : userProfile.risk_level}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-slate-50">
                                    <CardContent className="py-2">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 leading-tight">רמת ידע</p>
                                            <p className="text-sm font-medium leading-tight">
                                                {userProfile.knowledge_level === 'beginner' ? 'מתחיל' : 
                                                 userProfile.knowledge_level === 'intermediate' ? 'בינוני' : 
                                                 userProfile.knowledge_level === 'advanced' ? 'מתקדם' : userProfile.knowledge_level}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            {userProfile.available_amount && (
                                <Card className="bg-slate-50">
                                    <CardContent className="py-2">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 leading-tight">סכום זמין להשקעה</p>
                                            <p className="text-sm font-medium leading-tight">
                                                {new Intl.NumberFormat('he-IL', { 
                                                    style: 'currency', 
                                                    currency: 'ILS',
                                                    maximumFractionDigits: 0 
                                                }).format(userProfile.available_amount)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {userProfile.investment_timeframe && (
                                <Card className="bg-slate-50">
                                    <CardContent className="py-2">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 leading-tight">טווח השקעה מועדף</p>
                                            <p className="text-sm font-medium leading-tight">
                                                {userProfile.investment_timeframe === 'immediate' ? 'נזילות מיידית' :
                                                 userProfile.investment_timeframe === 'short' ? 'קצר טווח (עד שנה)' :
                                                 userProfile.investment_timeframe === 'medium' ? 'בינוני (1-5 שנים)' :
                                                 userProfile.investment_timeframe === 'long' ? 'ארוך טווח (5+ שנים)' : userProfile.investment_timeframe}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {userProfile.valid_until && (
                                <Card className="bg-amber-50 border-amber-200">
                                    <CardContent className="py-2">
                                        <div className="text-right">
                                            <p className="text-xs text-amber-700 leading-tight">תוקף הפרופיל</p>
                                            <p className="text-sm font-medium leading-tight text-amber-900">
                                                עד {new Date(userProfile.valid_until).toLocaleDateString('he-IL')}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                )}

                {!agreement && !riskProfile && !userProfile && (
                    <Card>
                        <CardContent className="text-center py-12">
                            <p className="text-slate-500">אין מידע זמין עבור משתמש זה</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Calendar, Edit, ArrowRight, CheckCircle } from "lucide-react";
import { createPageUrl } from '@/utils';
import moment from 'moment';
import ProfileSettings from '@/components/profile/ProfileSettings';

export default function MyProfile() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [agreement, setAgreement] = useState(null);
    const [riskProfile, setRiskProfile] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            // Check if viewing specific profile from URL
            const urlParams = new URLSearchParams(window.location.search);
            const profileIdFromUrl = urlParams.get('profile_id');
            
            // Load agreement data
            const agreements = await base44.entities.Agreement.filter({ client_email: currentUser.email }, '-date_signed');
            if (agreements && agreements.length > 0) {
                setAgreement(agreements[0]);
            }
            
            // Load risk profile data
            const riskProfiles = await base44.entities.RiskProfile.filter({ client_email: currentUser.email }, '-client_signature_date');
            
            if (profileIdFromUrl && riskProfiles && riskProfiles.length > 0) {
                // Load specific profile from URL
                const specificProfile = riskProfiles.find(p => p.id === profileIdFromUrl);
                if (specificProfile) {
                    setRiskProfile(specificProfile);
                }
            } else if (riskProfiles && riskProfiles.length > 0) {
                // Load latest profile
                setRiskProfile(riskProfiles[0]);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
        setIsLoading(false);
    };

    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSaveProfile = async (settings) => {
        try {
            await base44.auth.updateMe({
                investment_profile: {
                    ...user?.investment_profile,
                    ...settings
                },
                profile_completed: true,
                profile_completed_date: new Date().toISOString()
            });
            const updatedUser = await base44.auth.me();
            setUser(updatedUser);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4" dir="rtl">
            <div className="max-w-4xl mx-auto pt-2 space-y-2">
                {/* Back Button - Top Left */}
                <div className="mb-2">
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
                        <h1 className="text-xl font-bold text-slate-800 leading-tight">הפרופיל שלי</h1>
                        <p className="text-sm text-slate-600">{user?.email || agreement?.client_email || riskProfile?.client_email}</p>
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

                {/* Success Message */}
                {saveSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">הפרופיל נשמר בהצלחה!</span>
                    </div>
                )}

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

                {/* Profile Settings */}
                <ProfileSettings user={user} onSave={handleSaveProfile} />
            </div>
        </div>
    );
}
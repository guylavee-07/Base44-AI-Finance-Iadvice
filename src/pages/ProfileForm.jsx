import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Loader2, ExternalLink, ArrowRight } from "lucide-react";
import { createPageUrl } from '@/utils';

export default function ProfileForm() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadUser();
        
        // Listen for messages from the iframe
        const handleMessage = async (event) => {
            if (event.data && event.data.type === 'form_submitted') {
                setProfileData(event.data.data);
                await saveProfile(event.data.data);
            }
        };
        
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            if (currentUser.profile_completed) {
                setProfileData(currentUser.investment_profile);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
        setIsLoading(false);
    };

    const saveProfile = async (data) => {
        setIsSaving(true);
        try {
            await base44.auth.updateMe({
                investment_profile: data,
                profile_completed: true,
                profile_completed_date: new Date().toISOString()
            });
            setProfileData(data);
        } catch (error) {
            console.error('Error saving profile:', error);
        }
        setIsSaving(false);
    };

    const handleManualComplete = async () => {
        // For cases where the iframe message doesn't work
        setIsSaving(true);
        try {
            await base44.auth.updateMe({
                profile_completed: true,
                profile_completed_date: new Date().toISOString()
            });
            window.location.href = createPageUrl('Home');
        } catch (error) {
            console.error('Error:', error);
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    if (user?.profile_completed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4" dir="rtl">
                <div className="max-w-2xl mx-auto pt-8">
                    <Card className="border-green-200 bg-green-50/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-green-800">הפרופיל שלך הושלם!</CardTitle>
                            <CardDescription>התשובות שלנו יותאמו אישית עבורך</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Button 
                                onClick={() => window.location.href = createPageUrl('Home')}
                                className="bg-gradient-to-r from-sky-500 to-blue-600"
                            >
                                <ArrowRight className="h-4 w-4 ml-2" />
                                המשך לאפליקציה
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4" dir="rtl">
            <div className="max-w-4xl mx-auto pt-4">
                <Card>
                    <CardHeader className="text-center border-b">
                        <CardTitle className="text-2xl text-slate-800">טופס איפיון אישי</CardTitle>
                        <CardDescription>
                            מלא את הטופס הבא כדי שנוכל להתאים את הייעוץ הפיננסי עבורך
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="relative w-full" style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}>
                            <iframe
                                src="https://my.tofsy.co.il/api/ui/records/6501801468e5bd6f7c8ccc1b/692c0161f8ad777bc1e4c54d/fill"
                                className="w-full h-full border-0"
                                title="טופס איפיון"
                            />
                        </div>
                        <div className="p-4 border-t bg-slate-50 text-center">
                            <p className="text-sm text-slate-600 mb-3">
                                לאחר מילוי הטופס לחץ על הכפתור הבא:
                            </p>
                            <Button 
                                onClick={handleManualComplete}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-sky-500 to-blue-600"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 ml-2" />
                                )}
                                סיימתי למלא את הטופס
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
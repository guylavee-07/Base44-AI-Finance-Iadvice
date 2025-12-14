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

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4" dir="rtl">
            <div className="max-w-2xl mx-auto pt-8 space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-xl shadow-sky-500/30 mb-4">
                        <User className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">הפרופיל שלי</h1>
                    <p className="text-slate-600">{user?.email}</p>
                </div>

                {/* Success Message */}
                {saveSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">הפרופיל נשמר בהצלחה!</span>
                    </div>
                )}

                {/* Profile Settings */}
                <ProfileSettings user={user} onSave={handleSaveProfile} />

                {/* Back to Home */}
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
    );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, ArrowRight, Search } from "lucide-react";
import { createPageUrl } from '@/utils';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function ClientInfo() {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAgreements, setUserAgreements] = useState([]);
    const [userRiskProfiles, setUserRiskProfiles] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        checkUserAndLoadClients();
    }, []);

    const checkUserAndLoadClients = async () => {
        try {
            const currentUser = await base44.auth.me();
            if (currentUser.role !== 'admin') {
                window.location.href = createPageUrl('Home');
                return;
            }
            setUser(currentUser);

            // Load all users from agreements and risk profiles
            const allAgreements = await base44.entities.Agreement.list();
            const allRiskProfiles = await base44.entities.RiskProfile.list();
            
            // Create unique list of users with their email and name
            const userMap = new Map();
            
            allAgreements?.forEach(agreement => {
                if (agreement.client_email) {
                    userMap.set(agreement.client_email, {
                        email: agreement.client_email,
                        full_name: agreement.client_full_name,
                        created_date: agreement.created_date
                    });
                }
            });
            
            allRiskProfiles?.forEach(profile => {
                if (profile.client_email && !userMap.has(profile.client_email)) {
                    userMap.set(profile.client_email, {
                        email: profile.client_email,
                        full_name: profile.client_name,
                        created_date: profile.created_date
                    });
                }
            });
            
            const users = Array.from(userMap.values());
            setAllUsers(users);
        } catch (error) {
            console.error('Error loading clients:', error);
            base44.auth.redirectToLogin(createPageUrl('ClientInfo'));
        }
        setIsLoading(false);
    };

    const loadUserData = async (user) => {
        setSelectedUser(user);
        
        // Load user's agreements
        const agreements = await base44.entities.Agreement.filter(
            { client_email: user.email },
            '-date_signed'
        );
        setUserAgreements(agreements || []);
        
        // Load user's risk profiles
        const profiles = await base44.entities.RiskProfile.filter(
            { client_email: user.email },
            '-created_date'
        );
        setUserRiskProfiles(profiles || []);
        
        // Load user's investment profile from User entity
        try {
            const allUsers = await base44.entities.User.list();
            const targetUser = allUsers?.find(u => u.email === user.email);
            if (targetUser?.investment_profile) {
                setUserProfile(targetUser.investment_profile);
            } else {
                setUserProfile(null);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            setUserProfile(null);
        }
    };

    const handleUserSelect = async (user) => {
        await loadUserData(user);
        setSearchQuery('');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4 pb-20" dir="rtl">
            <div className="max-w-4xl mx-auto pt-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shadow-xl shadow-blue-400/30 mb-4">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">מידע לקוחות</h1>
                    <p className="text-slate-600">צפייה במידע מפורט על לקוחות</p>
                </div>

                {/* Back Button */}
                <div className="mb-6 text-left">
                    <Button
                        variant="ghost"
                        onClick={() => window.location.href = createPageUrl('Home')}
                        className="text-slate-600 hover:text-blue-600"
                    >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        חזור לדף הבית
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* User Search */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                חיפוש לקוח
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Command className="border rounded-lg">
                                <CommandInput 
                                    placeholder="הקלד שם או אימייל לקוח..." 
                                    value={searchQuery}
                                    onValueChange={setSearchQuery}
                                    onFocus={() => setSelectedUser(null)}
                                />
                                {!selectedUser && (
                                    <>
                                        <CommandEmpty>לא נמצאו לקוחות</CommandEmpty>
                                        <CommandGroup className="max-h-64 overflow-auto">
                                            {allUsers
                                                .filter(user => {
                                                    if (!searchQuery) return true;
                                                    const search = searchQuery.toLowerCase();
                                                    return (
                                                        user.full_name?.toLowerCase().includes(search) ||
                                                        user.email?.toLowerCase().includes(search)
                                                    );
                                                })
                                                .map((user) => (
                                                    <CommandItem
                                                        key={user.email}
                                                        onSelect={() => handleUserSelect(user)}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="flex flex-col items-start w-full">
                                                            <span className="font-medium">{user.full_name || user.email}</span>
                                                            <span className="text-xs text-slate-500">{user.email}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                        </CommandGroup>
                                    </>
                                )}
                            </Command>
                        </CardContent>
                    </Card>

                    {/* User Details */}
                    {selectedUser && (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <Card className="bg-green-100">
                                    <CardHeader>
                                        <CardTitle>פרטי הלקוח</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-slate-600">שם מלא:</Label>
                                                <p className="font-medium">{selectedUser.full_name || 'לא הוזן'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-slate-600">אימייל:</Label>
                                                <p className="font-medium">{selectedUser.email}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Statistics */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>סטטיסטיקות</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-lg flex items-center gap-2">
                                                <p className="text-sm text-slate-600">הסכמים</p>
                                                <p className="text-xl font-bold text-black">{userAgreements.length}</p>
                                            </div>
                                            <div className="p-4 rounded-lg flex items-center gap-2">
                                                <p className="text-sm text-slate-600">טפסי סיכון</p>
                                                <p className="text-xl font-bold text-black">{userRiskProfiles.length}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                                {/* Investment Profile */}
                                {userProfile && (
                                    <Card className="bg-green-100">
                                        <CardHeader>
                                            <CardTitle>פרופיל השקעות</CardTitle>
                                        </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 rounded-lg flex items-center gap-2">
                                                    <Label className="text-slate-600 text-sm">רמת סיכון:</Label>
                                                    <p className="font-medium">
                                                        {userProfile.risk_level === 'low' ? 'נמוכה' : 
                                                         userProfile.risk_level === 'medium' ? 'בינונית' : 
                                                         userProfile.risk_level === 'high' ? 'גבוהה' : userProfile.risk_level}
                                                    </p>
                                                </div>
                                                <div className="p-3 rounded-lg flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-slate-600 text-sm">רמת ידע:</Label>
                                                        <p className="font-medium">
                                                            {userProfile.knowledge_level === 'beginner' ? 'מתחיל' : 
                                                             userProfile.knowledge_level === 'intermediate' ? 'בינוני' : 
                                                             userProfile.knowledge_level === 'advanced' ? 'מתקדם' : userProfile.knowledge_level}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="p-0 h-auto text-blue-600 hover:text-blue-700"
                                                        onClick={() => window.location.href = createPageUrl('UserProfile') + `?email=${encodeURIComponent(selectedUser.email)}`}
                                                    >
                                                        צפה בפרופיל ←
                                                    </Button>
                                                </div>
                                            </div>
                                            {userProfile.available_amount && (
                                                <div className="p-3 rounded-lg flex items-center gap-2">
                                                    <Label className="text-slate-600 text-sm">סכום זמין להשקעה:</Label>
                                                    <p className="font-medium">
                                                        {new Intl.NumberFormat('he-IL', { 
                                                            style: 'currency', 
                                                            currency: 'ILS',
                                                            maximumFractionDigits: 0 
                                                        }).format(userProfile.available_amount)}
                                                    </p>
                                                </div>
                                            )}
                                            {userProfile.investment_timeframe && (
                                                <div className="p-3 rounded-lg flex items-center gap-2">
                                                    <Label className="text-slate-600 text-sm">טווח השקעה:</Label>
                                                    <p className="font-medium">
                                                        {userProfile.investment_timeframe === 'immediate' ? 'נזילות מיידית' :
                                                         userProfile.investment_timeframe === 'short' ? 'קצר טווח' :
                                                         userProfile.investment_timeframe === 'medium' ? 'בינוני' :
                                                         userProfile.investment_timeframe === 'long' ? 'ארוך טווח' : userProfile.investment_timeframe}
                                                    </p>
                                                </div>
                                            )}
                                            {userProfile.valid_until && (
                                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
                                                    <Label className="text-amber-800 text-sm">תוקף הפרופיל:</Label>
                                                    <p className="font-medium text-amber-900">
                                                        עד {new Date(userProfile.valid_until).toLocaleDateString('he-IL')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Agreements */}
                            {userAgreements.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>הסכמים ({userAgreements.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {userAgreements.map((agreement) => (
                                                <div key={agreement.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-slate-600 text-sm">שם:</Label>
                                                            <p className="font-medium">{agreement.client_full_name}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-slate-600 text-sm">ת.ז:</Label>
                                                            <p className="font-medium">{agreement.client_id}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mr-20">
                                                            <Label className="text-slate-600 text-sm">תאריך:</Label>
                                                            <p className="font-medium">
                                                                {new Date(agreement.date_signed).toLocaleDateString('he-IL')}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            agreement.status === 'approved' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {agreement.status === 'approved' ? 'אושר' : 'ממתין'}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="p-0 h-auto text-blue-600 hover:text-blue-700"
                                                        onClick={() => window.location.href = createPageUrl('ServiceAgreement') + `?id=${agreement.id}`}
                                                    >
                                                        צפה בהסכם ←
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}



                            {/* Risk Profiles */}
                            {userRiskProfiles.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>טפסי סיכון ({userRiskProfiles.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {userRiskProfiles.map((profile) => (
                                                <div key={profile.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-slate-600 text-sm">שם:</Label>
                                                            <p className="font-medium">{profile.client_name}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-slate-600 text-sm">רמת סיכון:</Label>
                                                            <p className="font-medium">
                                                                {(() => {
                                                                    const level = profile.chosen_risk_level || profile.recommended_risk_level;
                                                                    const levels = {
                                                                        low: "נמוכה",
                                                                        low_medium: "נמוכה-בינונית",
                                                                        medium: "בינונית",
                                                                        medium_high: "בינונית-גבוהה",
                                                                        high: "גבוהה",
                                                                        speculative: "ספקולטיבית"
                                                                    };
                                                                    return levels[level] || level;
                                                                })()}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mr-20">
                                                            <Label className="text-slate-600 text-sm">תאריך:</Label>
                                                            <p className="font-medium">
                                                                {profile.client_signature_date 
                                                                    ? new Date(profile.client_signature_date).toLocaleDateString('he-IL')
                                                                    : 'לא נחתם'}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            profile.status === 'completed' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : profile.status === 'approved'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {profile.status === 'completed' ? 'הושלם' : profile.status === 'approved' ? 'אושר' : 'טיוטה'}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="p-0 h-auto text-blue-600 hover:text-blue-700"
                                                        onClick={() => window.location.href = createPageUrl('RiskLevel') + `?id=${profile.id}`}
                                                    >
                                                        צפה בטופס ←
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {userAgreements.length === 0 && userRiskProfiles.length === 0 && (
                                <Card>
                                    <CardContent className="text-center py-12">
                                        <p className="text-slate-500">אין מידע זמין עבור לקוח זה</p>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
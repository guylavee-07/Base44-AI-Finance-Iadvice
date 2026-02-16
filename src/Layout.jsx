import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { User, LogOut, ChevronDown, Brain } from "lucide-react";
import { createPageUrl } from '@/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AlertBell from '@/components/alerts/AlertBell';
import AccessibilityWidget from '@/components/accessibility/AccessibilityWidget';
import ChatHistoryDrawer from '@/components/chat/ChatHistoryDrawer';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserPlus, Loader2 } from "lucide-react";
import { Loader2 as LoaderIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Layout({ children, currentPageName }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [agreements, setAgreements] = useState([]);
    const [riskProfiles, setRiskProfiles] = useState({ allProfiles: [], myProfiles: [] });
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('user');
    const [isInviting, setIsInviting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        setIsLoading(true);
        try {
            // Clear ALL react-query cache
            queryClient.clear();
            
            // Check if user just joined via invitation
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('join') || urlParams.get('invited')) {
                console.log('Waiting for auth after invitation...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Always fetch fresh user data - NO CACHE
            const currentUser = await base44.auth.me();
            
            if (!currentUser || !currentUser.email) {
                throw new Error('No valid user session');
            }
            
            console.log('=== LOADED USER ===', currentUser.email);
            setUser(currentUser);

            // Load agreements
            let userAgreements;
            if (currentUser.role === 'admin') {
                userAgreements = await base44.entities.Agreement.list('-created_date');
            } else {
                userAgreements = await base44.entities.Agreement.filter(
                    { client_email: currentUser.email },
                    '-date_signed'
                );
            }

            const allRiskProfiles = await base44.entities.RiskProfile.list();
            const agreementsWithProfiles = (userAgreements || []).map(agreement => {
                const hasApprovedRiskProfile = allRiskProfiles?.some(
                    rp => rp.agreement_id === agreement.id && (rp.status === 'approved' || rp.status === 'completed')
                );
                return { ...agreement, hasRiskProfile: hasApprovedRiskProfile };
            });
            setAgreements(agreementsWithProfiles);

            // Load risk profiles for risk profiles dropdown - admin sees all
            let allVisibleProfiles;
            if (currentUser.role === 'admin') {
                allVisibleProfiles = allRiskProfiles?.filter(p => 
                    p.status === 'approved' || p.status === 'completed'
                ) || [];
            } else {
                const userRiskProfilesForDropdown = await base44.entities.RiskProfile.filter(
                    { client_email: currentUser.email },
                    '-created_date'
                );
                allVisibleProfiles = userRiskProfilesForDropdown?.filter(p => 
                    p.status === 'approved' || p.status === 'completed'
                ) || [];
            }
            
            // For "My Profile" dropdown - always show only current user's profiles
            const myRiskProfiles = await base44.entities.RiskProfile.filter(
                { client_email: currentUser.email },
                '-created_date'
            );
            const myVisibleProfiles = myRiskProfiles?.filter(p => 
                p.status === 'approved' || p.status === 'completed'
            ) || [];
            setRiskProfiles({ allProfiles: allVisibleProfiles, myProfiles: myVisibleProfiles });
        } catch (error) {
            console.error('=== ERROR LOADING USER ===', error);
            // If 401 or auth error, redirect to login
            if (error.status === 401 || error.message?.includes('auth')) {
                base44.auth.redirectToLogin(createPageUrl('Home'));
                return;
            }
        }
        setIsLoading(false);
    };

    const handleLogout = () => {
        base44.auth.logout(createPageUrl('Home'));
    };

    const handleInviteUser = async () => {
        if (!inviteEmail || !inviteEmail.includes('@')) {
            alert('נא להזין כתובת מייל תקינה');
            return;
        }
        
        setIsInviting(true);
        try {
            await base44.users.inviteUser(inviteEmail, inviteRole);
            alert(`הזמנה נשלחה בהצלחה ל-${inviteEmail}`);
            setInviteEmail('');
            setInviteRole('user');
            setShowInviteDialog(false);
        } catch (error) {
            console.error('Error inviting user:', error);
            const errorMessage = error.message || error.toString();
            alert(`שגיאה בשליחת ההזמנה:\n${errorMessage}`);
        }
        setIsInviting(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20" dir="rtl">
            <a href="#main-content" className="skip-link">דלג לתוכן הראשי</a>
            <AccessibilityWidget />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm" role="banner">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    {user && (
                        <div className="flex items-center mb-2 relative">
                            <div className="text-sm text-slate-600 text-left flex-1">
                                <div>
                                    <span className="font-semibold">ברוך הבא:</span> {user?.email || 'טוען...'} (DEBUG: {new Date().getTime()})
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="text-slate-500 hover:text-red-600 mt-1 h-7 px-2"
                                >
                                    <LogOut className="h-3 w-3 ml-1" />
                                    <span className="text-xs">התנתק</span>
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowInviteDialog(true)}
                                className="text-slate-600 hover:text-green-600 absolute left-1/2 transform -translate-x-1/2"
                                title={user.role === 'admin' ? 'הזמן משתמש חדש' : 'הזמן חבר'}
                            >
                                <UserPlus className="h-4 w-4 ml-1" />
                                <span className="text-sm">{user.role === 'admin' ? 'הזמן משתמש' : 'הזמן חבר'}</span>
                            </Button>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-400/30 cursor-pointer" onClick={() => window.location.href = createPageUrl('Home')}>
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent cursor-pointer" onClick={() => window.location.href = createPageUrl('Home')}>
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

                        {user && (
                            <div className="flex items-center gap-2">
                                {user.role === 'admin' && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-purple-600" title="ניהול מערכת">
                                                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="hidden sm:inline">ניהול מערכת</span>
                                                <ChevronDown className="h-3 w-3 mr-1" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => window.location.href = createPageUrl('ClientInfo')} className="cursor-pointer">
                                                    <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    לקוחות
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.location.href = createPageUrl('AdminAgreements')} className="cursor-pointer">
                                                    <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    ניהול הסכמים
                                                </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => window.location.href = createPageUrl('AdminRiskProfiles')} className="cursor-pointer">
                                                <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                                ניהול רמות סיכון
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => window.location.href = createPageUrl('SystemSettings')} className="cursor-pointer">
                                                <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                הגדרות
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-emerald-600" title="הסכמי שירות">
                                            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="hidden sm:inline">הסכמים</span>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-72 max-h-96 overflow-y-auto">
                                        {user.role !== 'admin' && (
                                            <DropdownMenuItem onClick={() => window.location.href = createPageUrl('ServiceAgreement')} className="cursor-pointer sticky top-0 bg-white z-10">
                                                <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                הסכם חדש
                                            </DropdownMenuItem>
                                        )}
                                        {agreements.filter(a => a.status === 'approved' && !a.hasRiskProfile).length > 0 && (
                                            <>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-orange-600 border-b bg-orange-50">
                                                    ממתין לטיפול ({agreements.filter(a => a.status === 'approved' && !a.hasRiskProfile).length})
                                                </div>
                                                {agreements.filter(a => a.status === 'approved' && !a.hasRiskProfile).map((agreement) => (
                                                    <DropdownMenuItem key={agreement.id} onClick={() => window.location.href = createPageUrl('ServiceAgreement') + `?id=${agreement.id}`} className="cursor-pointer hover:bg-orange-50 border-b">
                                                        <div className="flex flex-col items-start w-full gap-1">
                                                            <span className="font-medium text-sm text-orange-700">{agreement.client_full_name}</span>
                                                            <span className="text-xs text-orange-600">
                                                                {new Date(agreement.date_signed).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </>
                                        )}
                                        {agreements.filter(a => a.status === 'approved' && a.hasRiskProfile).length > 0 && (
                                            <>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-green-600 border-t bg-green-50">
                                                    הסכמים שטופלו ({agreements.filter(a => a.status === 'approved' && a.hasRiskProfile).length})
                                                </div>
                                                {agreements.filter(a => a.status === 'approved' && a.hasRiskProfile).map((agreement) => (
                                                    <DropdownMenuItem key={agreement.id} onClick={() => window.location.href = createPageUrl('ServiceAgreement') + `?id=${agreement.id}`} className="cursor-pointer hover:bg-green-50">
                                                        <div className="flex flex-col items-start w-full gap-1">
                                                            <span className="font-medium text-sm text-green-700">{agreement.client_full_name}</span>
                                                            <span className="text-xs text-green-600">
                                                                {new Date(agreement.date_signed).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </>
                                        )}
                                        {agreements.length === 0 && (
                                            <div className="px-4 py-6 text-sm text-slate-500 text-center">
                                                <p className="mb-1">אין הסכמים</p>
                                                {user.role !== 'admin' && <p className="text-xs">לחץ על "הסכם חדש" כדי ליצור</p>}
                                            </div>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-orange-600" title="רמות סיכון">
                                            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                            <span className="hidden sm:inline">רמות סיכון</span>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-72 max-h-96 overflow-y-auto">
                                        {riskProfiles?.allProfiles?.filter(p => p.status === 'approved' && !p.client_signature_url).length > 0 && (
                                            <>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-orange-600 border-b bg-orange-50">
                                                    ממתין לחתימתי ({riskProfiles.allProfiles.filter(p => p.status === 'approved' && !p.client_signature_url).length})
                                                </div>
                                                {riskProfiles.allProfiles.filter(p => p.status === 'approved' && !p.client_signature_url).map((profile) => (
                                                    <DropdownMenuItem key={profile.id} onClick={() => window.location.href = createPageUrl('RiskLevel') + `?id=${profile.id}`} className="cursor-pointer hover:bg-orange-50 border-b">
                                                        <div className="flex flex-col items-start w-full gap-1">
                                                            <span className="font-medium text-sm text-orange-700">{profile.client_name}</span>
                                                            <span className="text-xs text-orange-600">
                                                                {profile.admin_signature_date ? new Date(profile.admin_signature_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' }) : 'ממתין לתאריך'}
                                                            </span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </>
                                        )}
                                        {riskProfiles?.allProfiles?.filter(p => p.status === 'completed' || (p.status === 'approved' && p.client_signature_url)).length > 0 && (
                                            <>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-green-600 border-t bg-green-50">
                                                    חתומות ({riskProfiles.allProfiles.filter(p => p.status === 'completed' || (p.status === 'approved' && p.client_signature_url)).length})
                                                </div>
                                                {riskProfiles.allProfiles.filter(p => p.status === 'completed' || (p.status === 'approved' && p.client_signature_url)).map((profile) => (
                                                    <DropdownMenuItem key={profile.id} onClick={() => window.location.href = createPageUrl('RiskLevel') + `?id=${profile.id}`} className="cursor-pointer hover:bg-green-50 border-b">
                                                        <div className="flex flex-col items-start w-full gap-1">
                                                            <span className="font-medium text-sm text-green-700">{profile.client_name}</span>
                                                            <span className="text-xs text-green-600">
                                                                {profile.client_signature_date ? new Date(profile.client_signature_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' }) : 'חתום'}
                                                            </span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </>
                                        )}
                                        {(!riskProfiles?.allProfiles || riskProfiles.allProfiles.length === 0) && (
                                            <div className="px-4 py-6 text-sm text-slate-500 text-center">
                                                <p className="mb-1">אין טפסים</p>
                                            </div>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button variant="ghost" size="sm" onClick={() => window.location.href = createPageUrl('AIInsights')} className="text-slate-600 hover:text-purple-600" title="תובנות AI">
                                    <Brain className="h-4 w-4 ml-1" />
                                    <span className="hidden sm:inline">תובנות</span>
                                </Button>

                                {currentPageName === 'Home' && (
                                    <ChatHistoryDrawer userEmail={user.email} />
                                )}

                                <AlertBell userEmail={user.email} />

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-sky-600" title={user.role === 'admin' ? 'פרופילים' : 'הפרופיל שלי'}>
                                            <User className="h-4 w-4 ml-1" />
                                            <span className="hidden sm:inline">{user.role === 'admin' ? 'פרופילים' : 'הפרופיל שלי'}</span>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-72 max-h-96 overflow-y-auto">
                                        {user.role !== 'admin' && (
                                            <DropdownMenuItem onClick={() => window.location.href = createPageUrl('MyProfile')} className="cursor-pointer sticky top-0 bg-white z-10">
                                                <User className="h-4 w-4 ml-2" />
                                                הפרופיל הנוכחי
                                            </DropdownMenuItem>
                                        )}
                                        {user.role === 'admin' ? (
                                            riskProfiles?.allProfiles?.length > 0 ? (
                                                <>
                                                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">
                                                        כל הפרופילים ({riskProfiles.allProfiles.length})
                                                    </div>
                                                    {riskProfiles.allProfiles.map((profile) => (
                                                        <DropdownMenuItem
                                                            key={profile.id}
                                                            onClick={() => window.location.href = createPageUrl('UserProfile') + `?email=${encodeURIComponent(profile.client_email)}`}
                                                            className="cursor-pointer hover:bg-slate-50"
                                                        >
                                                            <div className="flex flex-col items-start w-full gap-1">
                                                                <span className="font-medium text-sm">{profile.client_name}</span>
                                                                <span className="text-xs text-slate-500">
                                                                    {new Date(profile.client_signature_date).toLocaleDateString('he-IL', { 
                                                                        day: 'numeric',
                                                                        month: 'numeric',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="px-4 py-6 text-sm text-slate-500 text-center">
                                                    <p className="mb-1">אין פרופילים</p>
                                                </div>
                                            )
                                        ) : (
                                            riskProfiles?.myProfiles?.length > 0 ? (
                                                <>
                                                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-t bg-slate-50">
                                                        פרופילים היסטוריים ({riskProfiles.myProfiles.length})
                                                    </div>
                                                    {riskProfiles.myProfiles.map((profile) => (
                                                        <DropdownMenuItem
                                                            key={profile.id}
                                                            onClick={() => window.location.href = createPageUrl('MyProfile') + `?profile_id=${profile.id}`}
                                                            className="cursor-pointer hover:bg-slate-50"
                                                        >
                                                            <div className="flex flex-col items-start w-full gap-1">
                                                                <span className="font-medium text-sm">{profile.client_name}</span>
                                                                <span className="text-xs text-slate-500">
                                                                    {new Date(profile.client_signature_date).toLocaleDateString('he-IL', { 
                                                                        day: 'numeric',
                                                                        month: 'numeric',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </>
                                            ) : null
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-red-600">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Invite User Dialog */}
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            {user?.role === 'admin' ? 'הזמן משתמש חדש' : 'הזמן חבר'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-600 mb-2 block">
                                כתובת מייל של המשתמש החדש
                            </label>
                            <Input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="example@email.com"
                                disabled={isInviting}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleInviteUser();
                                    }
                                }}
                            />
                        </div>
                        {user?.role === 'admin' && (
                            <div>
                                <label className="text-sm text-slate-600 mb-2 block">
                                    סוג משתמש
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="user"
                                            checked={inviteRole === 'user'}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            disabled={isInviting}
                                            className="cursor-pointer"
                                        />
                                        <span className="text-sm">משתמש רגיל</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="admin"
                                            checked={inviteRole === 'admin'}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            disabled={isInviting}
                                            className="cursor-pointer"
                                        />
                                        <span className="text-sm">מנהל מערכת</span>
                                    </label>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-slate-500">
                            המשתמש יקבל מייל עם קישור להצטרפות למערכת
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowInviteDialog(false);
                                    setInviteEmail('');
                                    setInviteRole('user');
                                }}
                                disabled={isInviting}
                            >
                                ביטול
                            </Button>
                            <Button
                                onClick={handleInviteUser}
                                disabled={isInviting}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isInviting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                        שולח הזמנה...
                                    </>
                                ) : (
                                    'שלח הזמנה'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main Content */}
            <main id="main-content" role="main">
                {children}
            </main>
            </div>
            );
            }
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Settings, ArrowRight, Search, User } from "lucide-react";
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

export default function SystemSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState(null);
    const [formData, setFormData] = useState({
        admin_email: '',
        admin_phone: '',
        system_message: '',
        message_expiry_date: ''
    });
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAgreements, setUserAgreements] = useState([]);
    const [userRiskProfiles, setUserRiskProfiles] = useState([]);
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [adminUsers, setAdminUsers] = useState([]);

    useEffect(() => {
        checkUserAndLoadSettings();
    }, []);

    const checkUserAndLoadSettings = async () => {
        try {
            const currentUser = await base44.auth.me();
            if (currentUser.role !== 'admin') {
                window.location.href = createPageUrl('Home');
                return;
            }
            setUser(currentUser);

            // Load existing settings
            const existingSettings = await base44.entities.SystemSettings.list();
            if (existingSettings && existingSettings.length > 0) {
                const currentSettings = existingSettings[0];
                setSettings(currentSettings);
                setFormData({
                    admin_email: currentSettings.admin_email || '',
                    admin_phone: currentSettings.admin_phone || '',
                    system_message: currentSettings.system_message || '',
                    message_expiry_date: currentSettings.message_expiry_date || ''
                });
            }

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

            // Load all admin users
            const allSystemUsers = await base44.entities.User.list();
            const admins = allSystemUsers?.filter(u => u.role === 'admin') || [];
            setAdminUsers(admins);

            // Select first user by default
            if (users.length > 0) {
                await loadUserData(users[0]);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            base44.auth.redirectToLogin(createPageUrl('SystemSettings'));
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
    };

    const handleUserSelect = async (user) => {
        await loadUserData(user);
        setOpen(false);
        setSearchQuery('');
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (settings) {
                // Update existing settings
                await base44.entities.SystemSettings.update(settings.id, formData);
            } else {
                // Create new settings
                await base44.entities.SystemSettings.create(formData);
            }
            alert('ההגדרות נשמרו בהצלחה!');
            await checkUserAndLoadSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('אירעה שגיאה בשמירת ההגדרות');
        }
        setIsSaving(false);
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => window.location.href = createPageUrl('Home')}
                        className="text-slate-600 hover:text-blue-600"
                    >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        חזור לדף הבית
                    </Button>
                </div>

                {/* Header and System Message side by side */}
                <div className="flex items-start gap-6 mb-8">
                    {/* Header */}
                    <div className="flex-1 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 shadow-xl shadow-purple-400/30 mb-4">
                            <Settings className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">הגדרות</h1>
                        <p className="text-slate-600">ניהול הגדרות המערכת והודעות</p>
                    </div>

                    {/* System Message */}
                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>הודעת מערכת</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>הודעה (תוצג לכל המשתמשים עם הכניסה למערכת)</Label>
                                <Textarea
                                    value={formData.system_message}
                                    onChange={(e) => updateField('system_message', e.target.value)}
                                    placeholder="הזן הודעה חשובה למשתמשים..."
                                    className="h-32"
                                />
                            </div>

                            <div dir="rtl">
                                <p className="text-xs text-slate-500 mb-1 text-left">תאריך פג תוקף</p>
                                <Input
                                    type="text"
                                    value={formData.message_expiry_date ? new Date(formData.message_expiry_date).toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\./g, '/') : ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Convert DD/MM/YYYY to YYYY-MM-DD
                                        const parts = value.split('/');
                                        if (parts.length === 3) {
                                            const formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                            updateField('message_expiry_date', formattedDate);
                                        } else {
                                            updateField('message_expiry_date', value);
                                        }
                                    }}
                                    placeholder="DD/MM/YYYY"
                                    style={{ direction: 'ltr', textAlign: 'left' }}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    ההודעה תוצג עד לתאריך זה. אחרי התאריך ההודעה לא תופיע יותר.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Admin Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>נתוני מנהל מערכת</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">טלפון *</p>
                                    <Input
                                        type="tel"
                                        value={formData.admin_phone}
                                        onChange={(e) => updateField('admin_phone', e.target.value)}
                                        placeholder="050-1234567"
                                        className="text-right"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 mb-1">כתובת מייל אליה יישלחו מסמכים לטיפול *</p>
                                    <Input
                                        type="email"
                                        value={formData.admin_email}
                                        onChange={(e) => updateField('admin_email', e.target.value)}
                                        placeholder="example@domain.com"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Users List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                בעלי הרשאות אדמין ({adminUsers.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {adminUsers.length > 0 ? (
                                <div className="space-y-2">
                                    {adminUsers.map((admin) => (
                                        <div key={admin.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-slate-600 text-sm">שם:</Label>
                                                    <p className="font-medium">{admin.full_name || 'לא הוזן'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-slate-600 text-sm">מייל:</Label>
                                                    <p className="font-medium">{admin.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">אין מנהלי מערכת</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-purple-600"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                                שומר...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 ml-2" />
                                שמור הגדרות
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
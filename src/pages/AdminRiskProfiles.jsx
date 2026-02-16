import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowRight, CheckCircle, Edit, FileCheck, Trash2 } from "lucide-react";
import { createPageUrl } from '@/utils';
import SignaturePad from '@/components/signature/SignaturePad';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const riskLevels = [
    { value: 'low', title: 'השקעה בעלת סיכון נמוך' },
    { value: 'low_medium', title: 'השקעה בעלת סיכון נמוך עד בינוני' },
    { value: 'medium', title: 'השקעה בעלת סיכון בינוני' },
    { value: 'medium_high', title: 'השקעה בעלת סיכון בינוני גבוה' },
    { value: 'high', title: 'השקעה בעלת סיכון גבוה' },
    { value: 'speculative', title: 'השקעה ספקולטיבית' }
];

export default function AdminRiskProfiles() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [adminSignature, setAdminSignature] = useState('');
    const [deleteDialog, setDeleteDialog] = useState({ open: false, email: null, name: null });
    
    const [editData, setEditData] = useState({
        recommended_risk_level: 'medium',
        chosen_risk_level: 'medium',
        admin_notes: '',
        confirmation_type: 'accept_recommended',
        custom_risk_description: '',
        justification: '',
        client_signature_date: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Check if editing a specific profile from URL
        const checkEditParam = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const editProfileId = urlParams.get('edit');
            if (editProfileId) {
                try {
                    const profileData = await base44.entities.RiskProfile.filter({ id: editProfileId });
                    if (profileData && profileData.length > 0) {
                        handleEdit(profileData[0]);
                    }
                } catch (error) {
                    console.error('Error loading profile for edit:', error);
                }
            }
        };
        
        if (profiles.length > 0) {
            checkEditParam();
        }
    }, [profiles]);

    const loadData = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            if (currentUser.role !== 'admin') {
                window.location.href = createPageUrl('Home');
                return;
            }

            // Load all draft and approved profiles
            const allProfiles = await base44.entities.RiskProfile.list('-created_date');
            setProfiles(allProfiles || []);
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setIsLoading(false);
    };

    const handleDeleteUser = async () => {
        if (!deleteDialog.email) return;

        try {
            // Delete only risk profiles, keep agreements
            await base44.entities.RiskProfile.filter({ client_email: deleteDialog.email })
                .then(items => {
                    if (items && items.length > 0) {
                        return Promise.all(items.map(item => base44.entities.RiskProfile.delete(item.id)));
                    }
                });

            // Reload data
            await loadData();
            setDeleteDialog({ open: false, email: null, name: null });
            setIsEditing(false);
            setSelectedProfile(null);
        } catch (error) {
            console.error('Error deleting risk profiles:', error);
            alert('שגיאה במחיקת הטפסים');
        }
    };

    const handleEdit = (profile) => {
        setSelectedProfile(profile);
        setEditData({
            recommended_risk_level: profile.recommended_risk_level || 'medium',
            chosen_risk_level: profile.chosen_risk_level || profile.recommended_risk_level || 'medium',
            admin_notes: profile.admin_notes || '',
            confirmation_type: profile.confirmation_type || 'accept_recommended',
            custom_risk_description: profile.custom_risk_description || '',
            justification: profile.justification || '',
            client_signature_date: profile.client_signature_date || new Date().toISOString().split('T')[0]
        });
        setIsEditing(true);
    };

    const handleView = (profile) => {
        setSelectedProfile(profile);
        setEditData({
            recommended_risk_level: profile.recommended_risk_level || 'medium',
            chosen_risk_level: profile.chosen_risk_level || profile.recommended_risk_level || 'medium',
            admin_notes: profile.admin_notes || '',
            confirmation_type: profile.confirmation_type || 'accept_recommended',
            custom_risk_description: profile.custom_risk_description || '',
            justification: profile.justification || '',
            client_signature_date: profile.client_signature_date || new Date().toISOString().split('T')[0]
        });
        setIsEditing('view');
    };

    const handleApprove = async () => {
        if (!adminSignature) {
            alert('נא לחתום על הטופס');
            return;
        }

        setIsSaving(true);
        try {
            // Upload signature
            const blob = await fetch(adminSignature).then(r => r.blob());
            const file = new File([blob], 'admin-signature.png', { type: 'image/png' });
            const { file_url: signatureUrl } = await base44.integrations.Core.UploadFile({ file });

            // Update profile
            await base44.entities.RiskProfile.update(selectedProfile.id, {
                recommended_risk_level: editData.recommended_risk_level,
                confirmation_type: editData.confirmation_type,
                custom_risk_description: editData.custom_risk_description || '',
                justification: editData.justification || '',
                admin_notes: editData.admin_notes,
                status: 'approved',
                admin_signature_url: signatureUrl,
                admin_signature_date: new Date().toISOString().split('T')[0]
            });

            // Load system settings
            const systemSettings = await base44.entities.SystemSettings.list();
            const adminEmail = systemSettings && systemSettings.length > 0 && systemSettings[0].admin_email 
                ? systemSettings[0].admin_email 
                : 'iftach.venger@gmail.com';

            // Send email to client with link
            const baseUrl = window.location.origin;
            const formUrl = `${baseUrl}${createPageUrl('RiskLevel')}?id=${selectedProfile.id}`;
            
            await base44.integrations.Core.SendEmail({
                to: selectedProfile.client_email,
                subject: 'טופס רמת סיכון מוכן לחתימה',
                body: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>שלום ${selectedProfile.client_name},</h2>
                        <p>טופס רמת הסיכון שלך נבדק ואושר על ידי היועץ.</p>
                        <p>אנא לחץ על הקישור הבא כדי לצפות ולחתום על הטופס:</p>
                        <p style="margin: 20px 0;">
                            <a href="${formUrl}" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                לחץ כאן למילוי הטופס
                            </a>
                        </p>
                        <p style="font-size: 12px; color: #666;">או העתק את הקישור הבא לדפדפן:<br/>${formUrl}</p>
                        <p>בברכה,<br/>יפתח ונגר יעוץ עסקי</p>
                        <p style="margin-top: 15px; font-size: 14px; color: #666;">לשאלות ניתן לפנות: ${adminEmail}</p>
                    </div>
                `
            });

            // Create alert notification for the client
            try {
                await base44.entities.Alert.create({
                    user_email: selectedProfile.client_email,
                    title: 'טופס רמת סיכון מוכן לחתימה',
                    message: `טופס רמת הסיכון שלך אושר על ידי היועץ וממתין לחתימתך`,
                    type: 'personal',
                    priority: 'high',
                    is_read: false,
                    action_url: formUrl
                });
            } catch (alertError) {
                console.error('Error creating alert:', alertError);
            }

            alert('הטופס אושר ונשלח ללקוח!');
            setIsEditing(false);
            setSelectedProfile(null);
            loadData();
        } catch (error) {
            console.error('Error approving profile:', error);
            alert('אירעה שגיאה באישור הטופס');
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

    // Find all completed profiles to exclude their old drafts
    const completedProfiles = profiles.filter(p => p.status === 'completed' || (p.client_signature_url && p.admin_signature_url));
    const completedEmails = new Set(completedProfiles.map(p => p.client_email));
    
    // Only show drafts if there's no completed profile for that client
    const draftProfiles = profiles.filter(p => 
        p.status === 'draft' && 
        !p.admin_signature_url && 
        !completedEmails.has(p.client_email)
    );
    
    // Only show approved waiting for client if there's no completed profile for that client
    const approvedProfiles = profiles.filter(p => 
        (p.status === 'approved' || (p.status === 'draft' && p.admin_signature_url)) && 
        !p.client_signature_url &&
        !completedEmails.has(p.client_email)
    );

    const isViewMode = isEditing === 'view';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4" dir="rtl">
            <div className="max-w-6xl mx-auto pt-8">
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

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">ניהול טפסי רמת סיכון</h1>
                    <p className="text-slate-600">אישור ועריכת טפסים ללקוחות</p>
                </div>

                <div className="grid gap-6 mb-6 grid-cols-1 md:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">{draftProfiles.length}</div>
                                <div className="text-sm text-slate-600">ממתינים לאישור</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{approvedProfiles.length}</div>
                                <div className="text-sm text-slate-600">אושרו - ממתינים ללקוח</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{completedProfiles.length}</div>
                                <div className="text-sm text-slate-600">הושלמו</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {isEditing && selectedProfile ? (
                    <div>
                        <div className="mb-6 flex justify-between">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsEditing(false);
                                    setSelectedProfile(null);
                                }}
                                className="text-slate-600 hover:text-blue-600"
                            >
                                <ArrowRight className="h-4 w-4 ml-2" />
                                חזור לרשימה
                            </Button>
                            {!isViewMode && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={async () => {
                                            if (confirm('האם אתה בטוח שברצונך למחוק את הטופס הזה בלבד?')) {
                                                try {
                                                    await base44.entities.RiskProfile.delete(selectedProfile.id);
                                                    setIsEditing(false);
                                                    setSelectedProfile(null);
                                                    await loadData();
                                                } catch (error) {
                                                    alert('שגיאה במחיקת הטופס');
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 ml-2" />
                                        מחק טופס זה
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setDeleteDialog({ 
                                            open: true, 
                                            email: selectedProfile.client_email,
                                            name: selectedProfile.client_name 
                                        })}
                                    >
                                        <Trash2 className="h-4 w-4 ml-2" />
                                        מחק את כל הטפסים
                                    </Button>
                                </div>
                            )}
                        </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>טופס רמת סיכון ומדיניות השקעות</span>
                                {isViewMode && (
                                    <span className="text-sm font-normal text-green-600 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        טופס חתום ומושלם
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Client Details */}
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">פרטי הלקוח</h4>
                                <p><strong>שם:</strong> {selectedProfile.client_name}</p>
                                <p><strong>דוא"ל:</strong> {selectedProfile.client_email}</p>
                            </div>

                            {/* Risk Level Section */}
                            <div>
                                {isViewMode ? (
                                    <>
                                        <h3 className="text-lg font-bold mb-4 border-b pb-2">רמת הסיכון - טופס חתום ע"י הלקוח:</h3>

                                        <div className="bg-green-50 border-2 border-green-400 rounded-lg p-5 mb-4">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-sm text-slate-600 mb-1">רמה שהמלצת (האדמין):</p>
                                                    <p className="font-bold text-lg text-blue-700">{riskLevels.find(r => r.value === editData.recommended_risk_level)?.title}</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border-2 border-green-500">
                                                    <p className="text-sm text-green-700 mb-1 font-semibold">✓ רמה שהלקוח בחר סופית:</p>
                                                    <p className="font-bold text-xl text-green-800">{riskLevels.find(r => r.value === editData.chosen_risk_level)?.title}</p>
                                                </div>
                                            </div>

                                            {editData.confirmation_type === 'choose_different' && editData.chosen_risk_level !== editData.recommended_risk_level && (
                                                <div className="bg-orange-100 border-2 border-orange-400 rounded p-3">
                                                    <p className="text-orange-900 font-bold text-lg">⚠️ שים לב: הלקוח בחר רמת סיכון שונה מההמלצה שלך!</p>
                                                </div>
                                            )}

                                            {editData.confirmation_type === 'accept_recommended' && (
                                                <div className="bg-green-100 border-2 border-green-400 rounded p-3">
                                                    <p className="text-green-900 font-bold">✓ הלקוח אישר ואימץ את רמת הסיכון המומלצת שלך</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-bold text-slate-700">כל רמות הסיכון (הרמה שהלקוח בחר מסומנת):</h4>
                                            {riskLevels.map((level) => (
                                                <div key={level.value} className={`p-4 border-2 rounded-lg ${
                                                    editData.chosen_risk_level === level.value 
                                                        ? 'bg-green-100 border-green-500 shadow-lg' 
                                                        : 'bg-slate-50 border-slate-200'
                                                }`}>
                                                    <div className="text-right">
                                                        <div className="font-bold text-base flex items-center justify-between">
                                                            <span>{level.title}</span>
                                                            {editData.chosen_risk_level === level.value && (
                                                                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                                                    ← בחירת הלקוח
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                                            {level.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-bold mb-4 border-b pb-2">רמת הסיכון ומדיניות ההשקעות של הלקוח:</h3>
                                        <p className="mb-4 text-slate-700">בהתבסס על האמור לעיל בטופס זה, רמת הסיכון המומלצת עבורך הינה: *</p>

                                        <RadioGroup 
                                            value={editData.recommended_risk_level} 
                                            onValueChange={(v) => setEditData({...editData, recommended_risk_level: v})}
                                            className="space-y-4"
                                        >
                                            {riskLevels.map((level) => (
                                                <div key={level.value} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-slate-50">
                                                    <RadioGroupItem value={level.value} id={`level_${level.value}`} className="mt-1" />
                                                    <Label htmlFor={`level_${level.value}`} className="flex-1 text-right cursor-pointer">
                                                        <div className="font-medium mb-1">{level.title}</div>
                                                        <div className="text-sm text-slate-600">{level.description}</div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </>
                                )}
                            </div>

                            {/* Confirmation Type */}
                            <div>
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">
                                    {isViewMode ? 'בחירת הלקוח:' : 'בחתימתך על טופס זה, הנך מאשר כי: *'}
                                </h3>

                                {isViewMode ? (
                                    <div className="space-y-4">
                                        <div className={`p-4 border-2 rounded-lg ${
                                            editData.confirmation_type === 'accept_recommended' 
                                                ? 'bg-green-50 border-green-300' 
                                                : 'bg-slate-50 border-slate-200'
                                        }`}>
                                            <p className="font-medium text-right">
                                                {editData.confirmation_type === 'accept_recommended' && '✓ '}
                                                לאור האמור לעיל ובהתאם להמלצת היועץ, הנני מאשר רמת הסיכון ומדיניות ההשקעות שנבחרה עבורי.
                                            </p>
                                        </div>

                                        <div className={`p-4 border-2 rounded-lg ${
                                            editData.confirmation_type === 'choose_different' 
                                                ? 'bg-orange-50 border-orange-300' 
                                                : 'bg-slate-50 border-slate-200'
                                        }`}>
                                            <p className="font-medium text-right">
                                                {editData.confirmation_type === 'choose_different' && '✓ '}
                                                על אף האמור לעיל ובשונה מהמלצת היועץ, הנני מעוניין לבחור ברמת סיכון שונה ו/או במדיניות השקעות שונות
                                            </p>
                                        </div>

                                        {editData.confirmation_type === 'choose_different' && (
                                            <div className="mt-4 space-y-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                                                {editData.custom_risk_description && (
                                                    <div>
                                                        <Label className="text-orange-900 font-semibold">פירוט רמת הסיכון שהלקוח בחר:</Label>
                                                        <div className="mt-2 p-3 bg-white rounded border border-orange-200">
                                                            <p className="text-slate-800">{editData.custom_risk_description}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {editData.justification && (
                                                    <div>
                                                        <Label className="text-orange-900 font-semibold">נימוקי הלקוח:</Label>
                                                        <div className="mt-2 p-3 bg-white rounded border border-orange-200">
                                                            <p className="text-slate-800">{editData.justification}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedProfile.client_notes && (
                                                    <div>
                                                        <Label className="text-orange-900 font-semibold">הערות לקוח:</Label>
                                                        <div className="mt-2 p-3 bg-white rounded border border-orange-200">
                                                            <p className="text-slate-800">{selectedProfile.client_notes}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                </div>
                                                )}
                                                </div>
                                                ) : (
                                    <>
                                        <RadioGroup 
                                            value={editData.confirmation_type || 'accept_recommended'} 
                                            onValueChange={(v) => setEditData({...editData, confirmation_type: v})}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-slate-50">
                                                <RadioGroupItem value="accept_recommended" id="accept" className="mt-1" />
                                                <Label htmlFor="accept" className="flex-1 text-right cursor-pointer">
                                                    לאור האמור לעיל ובהתאם להמלצת היועץ, הנני מאשר רמת הסיכון ומדיניות ההשקעות שנבחרה עבורי.
                                                </Label>
                                            </div>

                                            <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-slate-50">
                                                <RadioGroupItem value="choose_different" id="different" className="mt-1" />
                                                <Label htmlFor="different" className="flex-1 text-right cursor-pointer">
                                                    על אף האמור לעיל ובשונה מהמלצת היועץ, הנני מעוניין לבחור ברמת סיכון שונה ו/או במדיניות השקעות שונות, כמפורט להלן:
                                                </Label>
                                            </div>
                                        </RadioGroup>

                                        {editData.confirmation_type === 'choose_different' && (
                                            <div className="mt-4 space-y-4 pr-8">
                                                <div>
                                                    <Label>פירוט רמת סיכון שונה *</Label>
                                                    <Textarea
                                                        value={editData.custom_risk_description || ''}
                                                        onChange={(e) => setEditData({...editData, custom_risk_description: e.target.value})}
                                                        placeholder="רמת הסיכון מאפשרת סיכון של עד 30% במדדי מניות כדוגמת תא 125 או נסדק או נכסים בסיכון מוגבר כמו זהב..."
                                                        className="h-24"
                                                    />
                                                </div>

                                                <div>
                                                    <Label>נימוקי הלקוח לבחירת רמת סיכון שונה ו/או מדיניות השקעות שונה מהמלצת היועץ: (ככל שרלוונטי) *</Label>
                                                    <Textarea
                                                        value={editData.justification || ''}
                                                        onChange={(e) => setEditData({...editData, justification: e.target.value})}
                                                        placeholder="נימוקים..."
                                                        className="h-24"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Client Signature Section */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold mb-4 underline">חתימת הלקוח</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label>שם הלקוח: *</Label>
                                        <Input
                                            value={selectedProfile.client_name}
                                            disabled
                                            className="bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <Label>תאריך *</Label>
                                        <Input
                                            type="date"
                                            value={editData.client_signature_date || new Date().toISOString().split('T')[0]}
                                            onChange={(e) => !isViewMode && setEditData({...editData, client_signature_date: e.target.value})}
                                            disabled={isViewMode}
                                        />
                                    </div>

                                    <div>
                                        <Label>חתימת הלקוח:</Label>
                                        {isViewMode && selectedProfile.client_signature_url ? (
                                            <div className="mt-2 border-2 border-slate-200 rounded-lg p-4 bg-white">
                                                <img 
                                                    src={selectedProfile.client_signature_url} 
                                                    alt="חתימת לקוח" 
                                                    className="max-w-xs mx-auto"
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-500 mt-1">הלקוח יחתום לאחר אישור</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Admin Signature Section */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold mb-4 underline">חתימת היועץ</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label>שם היועץ: *</Label>
                                        <Input
                                            value="יפתח ונגר"
                                            disabled
                                            className="bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <Label>תאריך: *</Label>
                                        <Input
                                            type="date"
                                            value={isViewMode && selectedProfile.admin_signature_date ? selectedProfile.admin_signature_date : new Date().toISOString().split('T')[0]}
                                            disabled
                                            className="bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <Label>חתימת היועץ: *</Label>
                                        {isViewMode && selectedProfile.admin_signature_url ? (
                                            <div className="mt-2 border-2 border-slate-200 rounded-lg p-4 bg-white">
                                                <img 
                                                    src={selectedProfile.admin_signature_url} 
                                                    alt="חתימת יועץ" 
                                                    className="max-w-xs mx-auto"
                                                />
                                            </div>
                                        ) : (
                                            <SignaturePad onSave={setAdminSignature} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Notes */}
                            <div>
                                <Label>הערות היועץ (אופציונלי)</Label>
                                <Textarea
                                    value={editData.admin_notes}
                                    onChange={(e) => !isViewMode && setEditData({...editData, admin_notes: e.target.value})}
                                    placeholder="הערות או הסברים נוספים..."
                                    className="h-24"
                                    disabled={isViewMode}
                                />
                            </div>

                            {!isViewMode && (
                                <Button
                                    onClick={handleApprove}
                                    disabled={isSaving || !adminSignature}
                                    className="w-full h-7 text-xs px-2 bg-gradient-to-r from-green-500 to-green-600"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin ml-1" />
                                            שומר...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-3 w-3 ml-1" />
                                            אשר ושלח
                                        </>
                                    )}
                                </Button>
                            )}
                        </CardContent>
                        </Card>
                        </div>
                        ) : (
                        <>
                        {/* Draft Profiles */}

                {/* Draft Profiles */}
                {draftProfiles.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>טפסים ממתינים לאישור ({draftProfiles.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {draftProfiles.map((profile) => (
                                    <div key={profile.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{profile.client_name}</p>
                                            <p className="text-sm text-slate-600">{profile.client_email}</p>
                                            <p className="text-xs text-slate-500">נוצר: {new Date(profile.created_date).toLocaleDateString('he-IL')}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleEdit(profile)}
                                                className="bg-orange-600 hover:bg-orange-700"
                                            >
                                                <Edit className="h-4 w-4 ml-2" />
                                                ערוך ואשר
                                            </Button>
                                            <Button
                                                onClick={() => setDeleteDialog({ 
                                                    open: true, 
                                                    email: profile.client_email,
                                                    name: profile.client_name 
                                                })}
                                                variant="destructive"
                                                size="sm"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Approved Profiles */}
                {approvedProfiles.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>טפסים שאושרו - ממתינים ללקוח ({approvedProfiles.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {approvedProfiles.map((profile) => (
                                    <div key={profile.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{profile.client_name}</p>
                                            <p className="text-sm text-slate-600">{profile.client_email}</p>
                                            <p className="text-xs text-slate-500">
                                                אושר: {new Date(profile.admin_signature_date).toLocaleDateString('he-IL')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={async () => {
                                                    if (confirm('האם אתה בטוח שברצונך לבטל את הטופס הזה?')) {
                                                        try {
                                                            await base44.entities.RiskProfile.delete(profile.id);
                                                            await loadData();
                                                        } catch (error) {
                                                            alert('שגיאה בביטול הטופס');
                                                        }
                                                    }
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async () => {
                                                    const baseUrl = window.location.origin;
                                                    const formUrl = `${baseUrl}${createPageUrl('RiskLevel')}?id=${profile.id}`;

                                                    const systemSettings = await base44.entities.SystemSettings.list();
                                                    const adminEmail = systemSettings && systemSettings.length > 0 && systemSettings[0].admin_email 
                                                        ? systemSettings[0].admin_email 
                                                        : 'iftach.venger@gmail.com';

                                                    await base44.integrations.Core.SendEmail({
                                                        to: profile.client_email,
                                                        subject: 'טופס רמת סיכון מוכן לחתימה',
                                                        body: `
                                                            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                                                                <h2>שלום ${profile.client_name},</h2>
                                                                <p>טופס רמת הסיכון שלך נבדק ואושר על ידי היועץ.</p>
                                                                <p>אנא לחץ על הקישור הבא כדי לצפות ולחתום על הטופס:</p>
                                                                <p style="margin: 20px 0;">
                                                                    <a href="${formUrl}" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                                                        לחץ כאן למילוי הטופס
                                                                    </a>
                                                                </p>
                                                                <p style="font-size: 12px; color: #666;">או העתק את הקישור הבא לדפדפן:<br/>${formUrl}</p>
                                                                <p>בברכה,<br/>יפתח ונגר יעוץ עסקי</p>
                                                                <p style="margin-top: 15px; font-size: 14px; color: #666;">לשאלות ניתן לפנות: ${adminEmail}</p>
                                                            </div>
                                                        `
                                                    });

                                                    // Create alert notification for the client
                                                    try {
                                                        await base44.entities.Alert.create({
                                                            user_email: profile.client_email,
                                                            title: 'טופס רמת סיכון מוכן לחתימה',
                                                            message: `טופס רמת הסיכון שלך אושר על ידי היועץ וממתין לחתימתך`,
                                                            type: 'personal',
                                                            priority: 'high',
                                                            is_read: false,
                                                            action_url: formUrl
                                                        });
                                                    } catch (alertError) {
                                                        console.error('Error creating alert:', alertError);
                                                    }

                                                    alert('המייל נשלח מחדש ללקוח!');
                                                }}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                שלח מייל מחדש
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Completed Profiles */}
                {completedProfiles.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>טפסים שהושלמו ({completedProfiles.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {completedProfiles.map((profile) => (
                                    <div key={profile.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                                        <div className="flex-1 cursor-pointer" onClick={async () => {
                                            // טוען מחדש את הנתונים העדכניים מהדאטהבייס
                                            const latestProfiles = await base44.entities.RiskProfile.filter({ id: profile.id });
                                            if (latestProfiles && latestProfiles.length > 0) {
                                                handleView(latestProfiles[0]);
                                            }
                                        }}>
                                            <p className="font-medium">{profile.client_name}</p>
                                            <p className="text-sm text-slate-600">{profile.client_email}</p>
                                            <p className="text-xs text-slate-500">
                                                הושלם: {profile.client_signature_date ? new Date(profile.client_signature_date).toLocaleDateString('he-IL') : 'לא זמין'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm('האם אתה בטוח שברצונך למחוק את הטופס החתום הזה?')) {
                                                        try {
                                                            await base44.entities.RiskProfile.delete(profile.id);
                                                            await loadData();
                                                        } catch (error) {
                                                            alert('שגיאה במחיקת הטופס');
                                                        }
                                                    }
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <span className="text-xs text-green-600">לחץ לצפייה</span>
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {profiles.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-slate-500">
                            אין טפסים במערכת
                        </CardContent>
                    </Card>
                )}
                </>
                )}

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, email: null, name: null })}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>מחיקת כל נתוני המשתמש</AlertDialogTitle>
                            <AlertDialogDescription className="text-right space-y-2">
                                <p>האם אתה בטוח שברצונך למחוק את כל טפסי רמות הסיכון של:</p>
                                <p className="font-bold text-slate-900">{deleteDialog.name}</p>
                                <p className="font-bold text-slate-900">{deleteDialog.email}</p>
                                <p className="text-amber-600 font-medium mt-4">פעולה זו תמחק:</p>
                                <ul className="list-disc list-inside text-amber-600">
                                    <li>את כל טפסי רמות הסיכון</li>
                                </ul>
                                <p className="text-green-600 font-medium mt-2">ההסכמים יישארו שמורים במערכת</p>
                                <p className="text-red-600 font-bold mt-2">לא ניתן לשחזר את הטפסים לאחר המחיקה!</p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                                מחק הכל
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
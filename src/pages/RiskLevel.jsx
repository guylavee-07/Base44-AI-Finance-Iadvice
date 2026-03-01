import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, CheckCircle, ArrowRight, ChevronDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createPageUrl } from '@/utils';
import SignaturePad from '@/components/signature/SignaturePad';

const riskLevels = [
    {
        value: 'low',
        title: 'השקעה בעלת סיכון נמוך',
        description: 'אנשים בעלי פרופיל סיכון דומה הינם שמרנים בהשקעותיהם ואינם מעוניינים שהונם יהיה חשוף לסיכון. הם מעדיפים שהשקעותיהם יבטיחו רמה עקבית ונמוכה יחסית של תשואה תוך תנודתיות נמוכה בערך התיק.'
    },
    {
        value: 'low_medium',
        title: 'השקעה בעלת סיכון נמוך עד בינוני',
        description: 'אנשים בעלי פרופיל סיכון נמוך עד בינוני הינם זהירים ביחס להשקעותיהם. הם מעדיפים שהשקעותיהם תהיינה באופן כללי בטוחות ושתיתנה רמה עקבית של תשואה, אם כי לא בהכרח גבוהה. אולם יש בקטגוריה זו גם נכונות לקחת סיכונים מסוימים עבור האפשרות לתשואה גבוהה יותר.'
    },
    {
        value: 'medium',
        title: 'השקעה בעלת סיכון בינוני',
        description: 'אנשים בעלי פרופיל סיכון בינוני מאוזנים בגישתם לסיכון שהם מבקשים או מנסים להימנע ממנו. הם מוכנים לקחת סיכון מסוים בהשקעותיהם להשגת תשואות גבוהות יותר.'
    },
    {
        value: 'medium_high',
        title: 'השקעה בעלת סיכון בינוני גבוה',
        description: 'אנשים בעלי פרופיל סיכון בינוני גבוה אגרסיביים למדי ומוכנים לקבל רמה גבוהה של סיכון על השקעותיהם בתמורה לסיכוי לתשואות גבוהות בטווח הארוך. כתוצאה מכך, הם מוכנים לקבל, בנוסף לסיכון, תנודתיות גבוהה בשווי השקעותיהם. הם יבינו ויקבלו מקרים בהם ערך השקעותיהם ירד באופן משמעותי בתקופות שונות.'
    },
    {
        value: 'high',
        title: 'השקעה בעלת סיכון גבוה',
        description: 'אנשים בעלי פרופיל סיכון גבוה מוכנים לעסוק בספקולציות עם השקעותיהם. הם בדרך כלל מתעניינים בהשקעה שיכולה להעניק תשואות גבוהות, אולם יכולה גם לסבול מהפסדים גבוהים. אנשים בקטגוריה זו הינם סובלניים למדי בשוק יורד, ולא דורשים, בדרך כלל, נזילות מידית או קצרת טווח מתיק ההשקעות שלהם.'
    },
    {
        value: 'speculative',
        title: 'השקעה ספקולטיבית',
        description: 'אנשים בעלי פרופיל זה מוכנים לקחת סיכונים גבוהים מאוד בתמורה לפוטנציאל תשואות יוצאות דופן. הם מבינים שהם עלולים להפסיד את מלוא ההשקעה.'
    }
];

export default function RiskLevel() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [existingProfile, setExistingProfile] = useState(null);
    const [allProfiles, setAllProfiles] = useState([]);
    const [selectedProfileId, setSelectedProfileId] = useState('new');
    const [currentProfile, setCurrentProfile] = useState(null);
    
    const [recommendedLevel, setRecommendedLevel] = useState('medium');
    const [chosenLevel, setChosenLevel] = useState('medium');
    const [confirmationType, setConfirmationType] = useState('accept_recommended');
    const [customRiskDescription, setCustomRiskDescription] = useState('');
    const [justification, setJustification] = useState('');
    const [clientName, setClientName] = useState('');
    const [signatureDate, setSignatureDate] = useState('');
    const [signatureImage, setSignatureImage] = useState('');
    const [clientNotes, setClientNotes] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        checkUserAndProfile();
    }, []);

    const checkUserAndProfile = async () => {
        try {
            // Check if viewing specific profile from URL
            const urlParams = new URLSearchParams(window.location.search);
            const profileIdFromUrl = urlParams.get('id');
            const clientEmailFromUrl = urlParams.get('client_email');
            const clientNameFromUrl = urlParams.get('client_name');
            
            // Try to get current user (may fail if not logged in)
            let currentUser = null;
            try {
                currentUser = await base44.auth.me();
                setUser(currentUser);
            } catch (authError) {
                console.log('User not logged in, continuing with public access');
            }
            
            // If admin is opening form for a specific client
            if (currentUser && currentUser.role === 'admin' && clientEmailFromUrl && clientNameFromUrl) {
                setClientName(decodeURIComponent(clientNameFromUrl));
                // Load all risk profiles for this client
                const profiles = await base44.entities.RiskProfile.filter(
                    { client_email: clientEmailFromUrl },
                    '-client_signature_date'
                );
                setAllProfiles(profiles || []);
                setRecommendedLevel('medium');
                
                // Set current date
                const today = new Date().toISOString().split('T')[0];
                setSignatureDate(today);
                setIsLoading(false);
                return;
            }
            
            // If URL has profile ID, load that specific profile directly
            if (profileIdFromUrl) {
                const specificProfiles = await base44.entities.RiskProfile.filter({ id: profileIdFromUrl });
                if (specificProfiles && specificProfiles.length > 0) {
                    const specificProfile = specificProfiles[0];
                    
                    // Set current date
                    const today = new Date().toISOString().split('T')[0];
                    setSignatureDate(today);
                    
                    // If profile is draft (admin editing) or approved (waiting for client signature), show the form
                    if (specificProfile.status === 'draft' || (specificProfile.status === 'approved' && !specificProfile.client_signature_url)) {
                        setCurrentProfile(specificProfile);
                        setClientName(specificProfile.client_name);
                        setRecommendedLevel(specificProfile.recommended_risk_level || 'medium');
                        setConfirmationType(specificProfile.confirmation_type || 'accept_recommended');
                        setCustomRiskDescription(specificProfile.custom_risk_description || '');
                        setJustification(specificProfile.justification || '');
                        setChosenLevel(specificProfile.chosen_risk_level || specificProfile.recommended_risk_level || 'medium');
                        setClientNotes(specificProfile.client_notes || '');
                        setAdminNotes(specificProfile.admin_notes || '');
                    } else {
                        // For completed profiles, show the view
                        setCurrentProfile(specificProfile);
                        setClientName(specificProfile.client_name);
                        setSelectedProfileId(profileIdFromUrl);
                        setExistingProfile(specificProfile);
                    }
                    setIsLoading(false);
                    return;
                } else {
                    // Profile not found - redirect to home
                    alert('הטופס לא נמצא במערכת');
                    window.location.href = createPageUrl('Home');
                    return;
                }
            } else if (currentUser) {
                // Load all agreements for this user
                const allAgreements = await base44.entities.Agreement.filter(
                    { client_email: currentUser.email },
                    '-date_signed'
                );
                
                // Load all risk profiles for this user
                const profiles = await base44.entities.RiskProfile.filter(
                    { client_email: currentUser.email },
                    '-client_signature_date'
                );
                setAllProfiles(profiles || []);
                
                // Set client name from LATEST (most recent) agreement
                if (allAgreements && allAgreements.length > 0) {
                    setClientName(allAgreements[0].client_full_name || currentUser.full_name || '');
                } else {
                    setClientName(currentUser.full_name || '');
                }
                
                // Set current date
                const today = new Date().toISOString().split('T')[0];
                setSignatureDate(today);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
        setIsLoading(false);
    };

    const validateForm = () => {
        if (!clientName) {
            alert('אנא הזן את שמך המלא');
            return false;
        }
        if (!signatureDate) {
            alert('אנא בחר תאריך');
            return false;
        }
        if (!signatureImage) {
            alert('אנא חתום עם העכבר');
            return false;
        }
        if (confirmationType === 'choose_different' && !customRiskDescription) {
            alert('אנא פרט את רמת הסיכון השונה');
            return false;
        }
        if (confirmationType === 'choose_different' && !justification) {
            alert('אנא הזן נימוקים לבחירת רמת סיכון שונה');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Check if updating existing profile from URL
            const urlParams = new URLSearchParams(window.location.search);
            const profileIdFromUrl = urlParams.get('id');
            const clientEmailFromUrl = urlParams.get('client_email');
            const clientEmail = clientEmailFromUrl || currentProfile?.client_email || user?.email;

            // Upload signature
            const blob = await fetch(signatureImage).then(r => r.blob());
            const file = new File([blob], 'signature.png', { type: 'image/png' });
            const { file_url: signatureUrl } = await base44.integrations.Core.UploadFile({ file });

            let newRiskProfile;
            
            // If admin is approving a profile (editing existing draft OR creating new)
            if (user && user.role === 'admin' && (profileIdFromUrl || clientEmailFromUrl)) {
                // Load system settings for admin email
                const systemSettings = await base44.entities.SystemSettings.list();
                const adminEmail = systemSettings && systemSettings.length > 0 && systemSettings[0].admin_email 
                    ? systemSettings[0].admin_email 
                    : 'iftach.venger@gmail.com';

                if (profileIdFromUrl) {
                    // Update existing draft
                    await base44.entities.RiskProfile.update(profileIdFromUrl, {
                        recommended_risk_level: recommendedLevel,
                        confirmation_type: confirmationType || 'accept_recommended',
                        custom_risk_description: customRiskDescription || '',
                        justification: justification || '',
                        admin_notes: adminNotes || '',
                        status: 'approved',
                        admin_signature_url: signatureUrl,
                        admin_signature_date: signatureDate
                    });

                    // Fetch the updated profile
                    const profiles = await base44.entities.RiskProfile.filter({ id: profileIdFromUrl });
                    newRiskProfile = profiles[0];
                } else {
                    // Create new profile (admin creating from scratch)
                    newRiskProfile = await base44.entities.RiskProfile.create({
                        client_email: clientEmail,
                        client_name: clientName,
                        recommended_risk_level: recommendedLevel,
                        confirmation_type: confirmationType || 'accept_recommended',
                        custom_risk_description: customRiskDescription || '',
                        justification: justification || '',
                        admin_notes: adminNotes || '',
                        status: 'approved',
                        admin_signature_url: signatureUrl,
                        admin_signature_date: signatureDate
                    });
                }

                // Send email to client with link
                const baseUrl = window.location.origin;
                const formUrl = `${baseUrl}${createPageUrl('RiskLevel')}?id=${newRiskProfile.id}`;
                
                await base44.integrations.Core.SendEmail({
                    to: clientEmail,
                    subject: 'טופס רמת סיכון מוכן לחתימה',
                    body: `
                        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>שלום ${clientName},</h2>
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
                        user_email: clientEmail,
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
                window.location.href = createPageUrl('AdminRiskProfiles');
                return;
            }
            
            // If we have a profile ID from URL, update it (client signing an approved form)
            if (profileIdFromUrl) {
                await base44.entities.RiskProfile.update(profileIdFromUrl, {
                    chosen_risk_level: confirmationType === 'accept_recommended' ? recommendedLevel : chosenLevel,
                    confirmation_type: confirmationType,
                    custom_risk_description: customRiskDescription || '',
                    justification: justification || '',
                    client_name: clientName,
                    client_signature_date: signatureDate,
                    client_signature_url: signatureUrl,
                    client_notes: clientNotes || '',
                    status: 'completed'
                });
                
                // Fetch the updated profile
                const profiles = await base44.entities.RiskProfile.filter({ id: profileIdFromUrl });
                newRiskProfile = profiles[0];
            } else {
                // Create new profile
                const profileData = {
                    client_email: clientEmail,
                    recommended_risk_level: recommendedLevel,
                    chosen_risk_level: confirmationType === 'accept_recommended' ? recommendedLevel : chosenLevel,
                    confirmation_type: confirmationType,
                    custom_risk_description: customRiskDescription || '',
                    justification: justification || '',
                    client_name: clientName,
                    client_signature_date: signatureDate,
                    client_signature_url: signatureUrl,
                    client_notes: clientNotes || '',
                    status: 'draft'
                };
                
                newRiskProfile = await base44.entities.RiskProfile.create(profileData);
            }

            // Update investment profile only if the current user is the client (not admin approving)
            if (user && user.email === clientEmail) {
                const riskToInvestmentMapping = {
                    low: { risk_level: 'low', knowledge_level: 'beginner' },
                    low_medium: { risk_level: 'low', knowledge_level: 'intermediate' },
                    medium: { risk_level: 'medium', knowledge_level: 'intermediate' },
                    medium_high: { risk_level: 'medium', knowledge_level: 'advanced' },
                    high: { risk_level: 'high', knowledge_level: 'advanced' },
                    speculative: { risk_level: 'high', knowledge_level: 'advanced' }
                };

                const chosenRiskLevel = confirmationType === 'accept_recommended' ? recommendedLevel : chosenLevel;
                const investmentSettings = riskToInvestmentMapping[chosenRiskLevel];

                // Calculate expiry date (1 year from signature date)
                const signatureDateTime = new Date(signatureDate);
                const expiryDate = new Date(signatureDateTime);
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);

                await base44.auth.updateMe({
                    investment_profile: {
                        ...investmentSettings,
                        risk_profile_id: newRiskProfile.id,
                        last_updated: new Date().toISOString(),
                        signature_date: signatureDate,
                        valid_until: expiryDate.toISOString().split('T')[0]
                    },
                    profile_completed: true,
                    profile_completed_date: new Date().toISOString()
                });
            }

            // Send email to admin with link to profile
            const riskLevelObj = riskLevels.find(r => r.value === (confirmationType === 'accept_recommended' ? recommendedLevel : chosenLevel));
            const baseUrl = window.location.origin;
            const riskProfileUrl = `${baseUrl}${createPageUrl('RiskLevel')}?id=${profileIdFromUrl || newRiskProfile.id}`;
            
            const emailBody = `<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 700px; margin: 0 auto; background-color: white; padding: 30px; direction: rtl;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 22px;">📊 טופס רמת סיכון נחתם</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f0f8ff; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #0066cc; margin-top: 0;">פרטי הלקוח</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">שם:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${clientName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">דוא"ל:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${clientEmail}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">תאריך:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${signatureDate}</td>
                </tr>
            </table>
        </div>
        
        <div style="background: #fff8dc; padding: 20px; margin: 20px 0; border-right: 5px solid #ffa500; border-radius: 8px;">
            <h3 style="color: #ff8800; margin-top: 0;">רמת הסיכון המומלצת</h3>
            <p style="margin: 5px 0; font-size: 15px;"><strong>${riskLevels.find(r => r.value === recommendedLevel)?.title}</strong></p>
        </div>

        <div style="background: #e8f4f8; padding: 20px; margin: 20px 0; border: 2px solid #0066cc; border-radius: 8px;">
            <h3 style="color: #0066cc; margin-top: 0;">בחירת הלקוח</h3>
            <p style="margin: 10px 0;"><strong>סוג אישור:</strong> ${confirmationType === 'accept_recommended' ? 'מאשר את רמת הסיכון המומלצת' : 'בוחר רמת סיכון שונה'}</p>
            ${confirmationType === 'choose_different' ? `
                <p style="margin: 10px 0;"><strong>רמת הסיכון הנבחרת:</strong> ${riskLevelObj?.title}</p>
                <p style="margin: 10px 0;"><strong>פירוט:</strong> ${customRiskDescription}</p>
                <p style="margin: 10px 0;"><strong>נימוקים:</strong> ${justification}</p>
            ` : ''}
        </div>

        <div style="border: 3px solid #0066cc; padding: 25px; margin: 30px 0; text-align: center; background: #f0f8ff; border-radius: 8px;">
            <h3 style="color: #0066cc; margin-top: 0;">חתימת הלקוח</h3>
            <p style="font-size: 18px; margin: 15px 0;"><strong>שם:</strong> ${clientName}</p>
            <img src="${signatureUrl}" alt="חתימה" style="max-width: 350px; border: 2px solid #0066cc; margin: 10px 0; border-radius: 4px;" />
            <p style="margin: 15px 0; color: #666;"><strong>תאריך:</strong> ${signatureDate}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${riskProfileUrl}" 
               style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: bold; 
                      font-size: 16px;
                      margin: 10px;
                      box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                📄 צפייה בטופס החתום
            </a>
            <br/>
            <a href="${baseUrl}${createPageUrl('Home')}" 
               style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: bold; 
                      font-size: 16px;
                      margin: 10px;
                      box-shadow: 0 4px 6px rgba(14, 165, 233, 0.3);">
                🏠 כניסה למערכת
            </a>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: bold;">💡 טיפ:</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #78350f;">
                אם הכפתור לא עובד, העתק והדבק את הקישור הבא לדפדפן:
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #ea580c; word-break: break-all;">
                ${riskProfileUrl}
            </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
                יפתח ונגר יעוץ עסקי | iadvice.co.il
            </p>
            <p style="color: #94a3b8; font-size: 11px; margin: 5px 0 0 0;">
                📧 iftach.venger@gmail.com | 📞 050-3976397
            </p>
        </div>
    </div>
</body>
</html>`;

            // Load admin email from system settings
            try {
                const settings = await base44.entities.SystemSettings.list();
                const adminEmail = settings && settings.length > 0 && settings[0].admin_email 
                    ? settings[0].admin_email 
                    : 'iftach.venger@gmail.com';

                await base44.integrations.Core.SendEmail({
                    to: adminEmail,
                    subject: `טופס רמת סיכון נחתם - ${clientName}`,
                    body: emailBody
                });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
            }

            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(`אירעה שגיאה: ${error.message}`);
        }

        setIsSubmitting(false);
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

    const handleProfileSelect = (profileId) => {
        setSelectedProfileId(profileId);
        if (profileId === 'new') {
            setExistingProfile(null);
        } else {
            const profile = allProfiles.find(p => p.id === profileId);
            setExistingProfile(profile);
        }
    };

    if (selectedProfileId !== 'new' && existingProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4" dir="rtl">
                <div className="max-w-4xl mx-auto pt-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-xl shadow-orange-400/30 mb-4">
                            <TrendingUp className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">טופס רמת סיכון</h1>
                        <p className="text-slate-600">יפתח ונגר יעוץ עסקי</p>
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

                    {/* Display Profile Details */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-right">פרטי הלקוח</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-right">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500">שם</p>
                                        <p className="font-medium">{existingProfile.client_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">תאריך חתימה</p>
                                        <p className="font-medium">{new Date(existingProfile.client_signature_date).toLocaleDateString('he-IL')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-right">רמות סיכון</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-right">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500">רמת סיכון מומלצת</p>
                                        <p className="font-medium">{getRiskLevelText(existingProfile.recommended_risk_level)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">רמת סיכון שנבחרה</p>
                                        <p className="font-medium">{getRiskLevelText(existingProfile.chosen_risk_level)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">סוג אישור</p>
                                        <p className="font-medium">
                                            {existingProfile.confirmation_type === 'accept_recommended' 
                                                ? 'מאשר את ההמלצה' 
                                                : 'בחר רמה שונה'}
                                        </p>
                                    </div>
                                </div>
                                {existingProfile.justification && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm text-slate-500 mb-1">נימוקי הלקוח</p>
                                        <p className="text-sm">{existingProfile.justification}</p>
                                    </div>
                                )}
                                {existingProfile.custom_risk_description && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm text-slate-500 mb-1">פירוט רמת הסיכון ע"י הלקוח</p>
                                        <p className="text-sm">{existingProfile.custom_risk_description}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {existingProfile.admin_notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-right">הערות היועץ</CardTitle>
                                </CardHeader>
                                <CardContent className="text-right">
                                    <p className="text-sm">{existingProfile.admin_notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-right">חתימות</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <p className="font-medium mb-4">חתימת היועץ</p>
                                        {existingProfile.admin_signature_url && (
                                            <img 
                                                src={existingProfile.admin_signature_url} 
                                                alt="חתימת היועץ" 
                                                className="max-w-full mx-auto border-2 border-slate-200 rounded-lg p-4"
                                            />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium mb-4">חתימת הלקוח</p>
                                        {existingProfile.client_signature_url && (
                                            <img 
                                                src={existingProfile.client_signature_url} 
                                                alt="חתימת הלקוח" 
                                                className="max-w-full mx-auto border-2 border-slate-200 rounded-lg p-4"
                                            />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4" dir="rtl">
                <div className="max-w-2xl mx-auto pt-20">
                    <Card className="border-green-200 bg-green-50/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-green-800 text-2xl">הטופס נשלח בהצלחה!</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-slate-600">
                                תודה על מילוי טופס רמת הסיכון. הפרטים נשלחו ליועץ.
                            </p>
                            <Button 
                                onClick={() => window.location.href = createPageUrl('Home')}
                                className="bg-gradient-to-r from-sky-500 to-blue-600"
                            >
                                <ArrowRight className="h-4 w-4 ml-2" />
                                חזור לדף הבית
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4 pb-20" dir="rtl">
            <div className="max-w-4xl mx-auto pt-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-xl shadow-orange-400/30 mb-4">
                        <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">רמת הסיכון ומדיניות ההשקעות</h1>
                    <p className="text-slate-600">יפתח ונגר יעוץ עסקי</p>
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Client Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-right">פרטי הלקוח</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>שם הלקוח</Label>
                                    <Input value={clientName} disabled className="bg-slate-50" />
                                </div>
                                <div>
                                    <Label>דוא"ל</Label>
                                    <Input value={currentProfile?.client_email || user?.email} disabled className="bg-slate-50" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Risk Levels Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-right">רמת הסיכון ומדיניות ההשקעות של הלקוח</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                            {user?.role === 'admin' ? (
                                <>
                                    <p className="text-slate-700 mb-4 text-right">בהתבסס על האמור לעיל בטופס זה, רמת הסיכון המומלצת עבור הלקוח הינה: *</p>
                                    <RadioGroup value={recommendedLevel} onValueChange={setRecommendedLevel}>
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
                            ) : (
                                <>
                                    <p className="text-slate-600 mb-4 text-right">בהתבסס על הפרופיל שלך, הרמה המומלצת היא:</p>
                                    <div className="space-y-3">
                                        {riskLevels.map((level) => (
                                            <div 
                                                key={level.value} 
                                                className={`border rounded-lg p-4 transition-colors ${
                                                    level.value === recommendedLevel 
                                                        ? 'bg-blue-50 border-blue-300 shadow-sm' 
                                                        : 'bg-slate-50 opacity-60'
                                                }`}
                                            >
                                                <div className="text-right">
                                                    <div className="font-bold text-base">
                                                        {level.title}
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                                        {level.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            </CardContent>
                            </Card>

                            {/* Admin Notes for Client */}
                            {user?.role !== 'admin' && currentProfile?.admin_notes && (
                            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400">
                            <CardHeader>
                                <CardTitle className="text-right flex items-center gap-2 text-amber-900">
                                    💬 הערות היועץ
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 bg-white rounded-lg border-2 border-amber-300 shadow-sm">
                                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{currentProfile.admin_notes}</p>
                                </div>
                            </CardContent>
                            </Card>
                            )}

                            {/* Confirmation Type */}
                            {user?.role !== 'admin' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-right">אישור בחירת רמת הסיכון</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup value={confirmationType} onValueChange={setConfirmationType}>
                                    <div className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <Label htmlFor="accept" className="text-base cursor-pointer text-right flex-1">
                                                לאור האמור לעיל ובהתאם להמלצת היועץ, הנני מאשר רמת הסיכון ומדיניות ההשקעות שנבחרה עבורי.
                                            </Label>
                                            <RadioGroupItem value="accept_recommended" id="accept" className="mt-1" />
                                        </div>
                                    </div>

                                    <div className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <Label htmlFor="different" className="text-base cursor-pointer text-right flex-1">
                                                על אף האמור לעיל ובשונה מהמלצת היועץ, הנני מעוניין לבחור ברמת סיכון שונה ו/או במדיניות השקעות שונות
                                            </Label>
                                            <RadioGroupItem value="choose_different" id="different" className="mt-1" />
                                        </div>
                                    </div>
                                </RadioGroup>

                                {confirmationType === 'choose_different' && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <div>
                                            <Label>בחר רמת סיכון שונה *</Label>
                                            <RadioGroup value={chosenLevel} onValueChange={setChosenLevel} className="mt-2">
                                                {riskLevels.map((level) => (
                                                    <div key={level.value} className="flex items-center gap-2">
                                                        <Label htmlFor={`chosen_${level.value}`} className="flex-1 text-right">{level.title}</Label>
                                                        <RadioGroupItem value={level.value} id={`chosen_${level.value}`} />
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>

                                        <div>
                                            <Label>פירוט רמת הסיכון השונה *</Label>
                                            <Textarea
                                                value={customRiskDescription}
                                                onChange={(e) => setCustomRiskDescription(e.target.value)}
                                                placeholder="לדוגמה: רמת הסיכון מאפשרת סיכון של עד 30% במדדי מניות כדוגמת תא 125 או נסדק או נכסים בסיכון מוגבר כמו זהב..."
                                                className="h-24"
                                                required={confirmationType === 'choose_different'}
                                            />
                                        </div>

                                        <div>
                                            <Label>נימוקי הלקוח לבחירת רמת סיכון שונה *</Label>
                                            <Textarea
                                                value={justification}
                                                onChange={(e) => setJustification(e.target.value)}
                                                placeholder="הסבר את הסיבות לבחירת רמת סיכון שונה מהמלצת היועץ"
                                                className="h-24"
                                                required={confirmationType === 'choose_different'}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Client Signature - only for non-admin users */}
                    {user?.role !== 'admin' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-right">חתימת הלקוח</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>שם הלקוח *</Label>
                                    <Input
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>תאריך *</Label>
                                    <Input
                                        type="date"
                                        value={signatureDate}
                                        onChange={(e) => setSignatureDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>חתימת הלקוח *</Label>
                                    <SignaturePad onSave={setSignatureImage} />
                                </div>

                                <div>
                                    <Label>הערות לקוח (אופציונלי)</Label>
                                    <Textarea
                                        value={clientNotes}
                                        onChange={(e) => setClientNotes(e.target.value)}
                                        placeholder="הערות או הסברים נוספים..."
                                        className="h-24"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Admin Signature - only for admin users */}
                    {user?.role === 'admin' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-right">חתימת היועץ</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>שם היועץ *</Label>
                                    <Input value="יפתח ונגר" disabled className="bg-slate-50" />
                                </div>

                                <div>
                                    <Label>תאריך *</Label>
                                    <Input
                                        type="date"
                                        value={signatureDate}
                                        onChange={(e) => setSignatureDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>חתימת היועץ *</Label>
                                    <SignaturePad onSave={setSignatureImage} />
                                </div>

                                <div>
                                    <Label>הערות היועץ (אופציונלי)</Label>
                                    <Textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="הערות או הסברים נוספים..."
                                        className="h-24"
                                    />
                                </div>
                                </CardContent>
                                </Card>
                                )}

                    {/* Advisor Info - only shown to non-admin users */}
                    {user?.role !== 'admin' && (
                        <Card className="bg-slate-50">
                            <CardHeader>
                                <CardTitle className="text-right">חתימת היועץ</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-right">
                                <div>
                                    <p><strong>שם היועץ:</strong> יפתח ונגר</p>
                                    {currentProfile?.admin_signature_date && (
                                        <p><strong>תאריך:</strong> {new Date(currentProfile.admin_signature_date).toLocaleDateString('he-IL')}</p>
                                    )}
                                </div>
                                {currentProfile?.admin_notes && (
                                    <div>
                                        <p className="font-semibold mb-2">הערות היועץ:</p>
                                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                                            <p className="text-slate-700">{currentProfile.admin_notes}</p>
                                        </div>
                                    </div>
                                )}
                                {currentProfile?.admin_signature_url ? (
                                    <div className="text-center">
                                        <p className="text-sm text-slate-600 mb-2">חתימת היועץ:</p>
                                        <img 
                                            src={currentProfile.admin_signature_url} 
                                            alt="חתימת היועץ" 
                                            className="max-w-xs mx-auto border-2 border-slate-200 rounded-lg p-4 bg-white"
                                        />
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">חתימת היועץ תתווסף לאחר אישור</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Submit Button */}
                    <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className="h-10 text-sm px-8 bg-gradient-to-r from-orange-500 to-orange-600 mx-auto block flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin ml-1" />
                                {user?.role === 'admin' ? 'שומר...' : 'שולח...'}
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-3 w-3 ml-1" />
                                {user?.role === 'admin' ? 'אשר ושלח ללקוח' : 'שלח'}
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
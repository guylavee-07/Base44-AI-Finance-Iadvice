import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, CheckCircle, ArrowRight, TrendingUp } from "lucide-react";
import { createPageUrl } from '@/utils';
import SignaturePad from '@/components/signature/SignaturePad';

export default function ServiceAgreement() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [signature, setSignature] = useState('');
    const [signatureImage, setSignatureImage] = useState('');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [existingAgreement, setExistingAgreement] = useState(null);
    const [hasRiskProfile, setHasRiskProfile] = useState(false);
    
    const [formData, setFormData] = useState({
        client_full_name: '',
        client_id: '',
        client_address: '',
        client_email: '',
        management_fee_nis: '',
        q1_monthly_income: '',
        q2_asset_value: '',
        q3_liability_value: '',
        q4_assets_vs_liabilities: '',
        q5_one_time_expenses: '',
        q6_investment_ratio: '',
        q7_investment_period: '',
        q8_investment_goal: '',
        q8_other_goal: '',
        q9_market_knowledge: '',
        q10_financial_instruments_knowledge: '',
        q11_risk_tolerance: '',
        q12_reaction_to_loss: ''
    });

    React.useEffect(() => {
        checkUserAndAgreement();
    }, []);

    const checkUserAndAgreement = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            const urlParams = new URLSearchParams(window.location.search);
            const agreementIdFromUrl = urlParams.get('id');
            
            if (agreementIdFromUrl) {
                let agreements;
                if (currentUser.role === 'admin') {
                    agreements = await base44.entities.Agreement.list();
                    agreements = agreements.filter(a => a.id === agreementIdFromUrl);
                } else {
                    agreements = await base44.entities.Agreement.filter({ 
                        id: agreementIdFromUrl,
                        client_email: currentUser.email 
                    });
                }
                if (agreements && agreements.length > 0) {
                    setExistingAgreement(agreements[0]);

                    // Check if this specific agreement has an approved/completed risk profile
                    const riskProfiles = await base44.entities.RiskProfile.filter({
                        agreement_id: agreementIdFromUrl
                    });
                    const hasApprovedProfile = riskProfiles?.some(rp => 
                        rp.status === 'approved' || rp.status === 'completed'
                    );
                    setHasRiskProfile(hasApprovedProfile);
                }
            } else {
                const agreements = await base44.entities.Agreement.filter({ 
                    client_email: currentUser.email 
                }, '-date_signed', 1);

                if (agreements && agreements.length > 0) {
                    const lastAgreement = agreements[0];
                    setFormData({
                        client_full_name: lastAgreement.client_full_name,
                        client_id: lastAgreement.client_id,
                        client_address: lastAgreement.client_address,
                        client_email: currentUser.email,
                        management_fee_nis: lastAgreement.management_fee_nis || '',
                        q1_monthly_income: lastAgreement.q1_monthly_income || '',
                        q2_asset_value: lastAgreement.q2_asset_value || '',
                        q3_liability_value: lastAgreement.q3_liability_value || '',
                        q4_assets_vs_liabilities: lastAgreement.q4_assets_vs_liabilities || '',
                        q5_one_time_expenses: lastAgreement.q5_one_time_expenses || '',
                        q6_investment_ratio: lastAgreement.q6_investment_ratio || '',
                        q7_investment_period: lastAgreement.q7_investment_period || '',
                        q8_investment_goal: lastAgreement.q8_investment_goal || '',
                        q8_other_goal: lastAgreement.q8_other_goal || '',
                        q9_market_knowledge: lastAgreement.q9_market_knowledge || '',
                        q10_financial_instruments_knowledge: lastAgreement.q10_financial_instruments_knowledge || '',
                        q11_risk_tolerance: lastAgreement.q11_risk_tolerance || '',
                        q12_reaction_to_loss: lastAgreement.q12_reaction_to_loss || ''
                    });
                    setSignature(lastAgreement.client_full_name);
                } else {
                    setFormData(prev => ({
                        ...prev,
                        client_email: currentUser.email,
                        client_full_name: currentUser.full_name || ''
                    }));
                    setSignature(currentUser.full_name || '');
                }
            }
        } catch (error) {
            console.error('Error checking user/agreement:', error);
            base44.auth.redirectToLogin(createPageUrl('ServiceAgreement'));
        }
        setIsLoading(false);
    };

    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'client_full_name') {
            setSignature(value);
        }
    };

    const validateForm = () => {
        const fieldNames = {
            'client_full_name': 'שם מלא',
            'client_id': 'ת.ז / ח.פ',
            'client_address': 'כתובת מלאה',
            'client_email': 'דוא"ל',
            'management_fee_nis': 'דמי ניהול',
            'q1_monthly_income': 'הכנסה חודשית',
            'q2_asset_value': 'שווי נכסים וחסכונות',
            'q3_liability_value': 'שווי התחייבויות',
            'q4_assets_vs_liabilities': 'תיאור היחס בין נכסים להתחייבויות',
            'q5_one_time_expenses': 'הוצאות חד פעמיות',
            'q6_investment_ratio': 'שיעור השקעה',
            'q7_investment_period': 'תקופת השקעה',
            'q8_investment_goal': 'מטרת ההשקעה',
            'q9_market_knowledge': 'ניסיון וידע בשוק ההון',
            'q10_financial_instruments_knowledge': 'היכרות עם מכשירים פיננסיים',
            'q11_risk_tolerance': 'סבלנות לסיכון',
            'q12_reaction_to_loss': 'תגובה להפסד'
        };

        const required = [
            'client_full_name', 'client_id', 'client_address',
            'client_email', 'management_fee_nis', 'q1_monthly_income', 'q2_asset_value',
            'q3_liability_value', 'q4_assets_vs_liabilities', 'q5_one_time_expenses',
            'q6_investment_ratio', 'q7_investment_period', 'q8_investment_goal',
            'q9_market_knowledge', 'q10_financial_instruments_knowledge',
            'q11_risk_tolerance', 'q12_reaction_to_loss'
        ];

        for (const field of required) {
            if (!formData[field]) {
                alert(`אנא מלא את השדה: ${fieldNames[field]}`);
                return false;
            }
        }

        if (!signature || !signatureImage) {
            alert('אנא מלא שם וחתום עם העכבר');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const signatureDate = new Date().toISOString().split('T')[0];
            const blob = await fetch(signatureImage).then(r => r.blob());
            const file = new File([blob], 'signature.png', { type: 'image/png' });
            const { file_url: signatureUrl } = await base44.integrations.Core.UploadFile({ file });

            const agreementData = {
                client_email: formData.client_email,
                date_signed: signatureDate,
                client_full_name: formData.client_full_name,
                client_id: formData.client_id,
                client_address: formData.client_address,
                management_fee_nis: formData.management_fee_nis,
                signature_name: signature,
                signature_url: signatureUrl,
                status: 'approved',
                admin_approval_date: signatureDate,
                q1_monthly_income: formData.q1_monthly_income,
                q2_asset_value: formData.q2_asset_value,
                q3_liability_value: formData.q3_liability_value,
                q4_assets_vs_liabilities: formData.q4_assets_vs_liabilities,
                q5_one_time_expenses: formData.q5_one_time_expenses,
                q6_investment_ratio: formData.q6_investment_ratio,
                q7_investment_period: formData.q7_investment_period,
                q8_investment_goal: formData.q8_investment_goal,
                q8_other_goal: formData.q8_other_goal || '',
                q9_market_knowledge: formData.q9_market_knowledge,
                q10_financial_instruments_knowledge: formData.q10_financial_instruments_knowledge,
                q11_risk_tolerance: formData.q11_risk_tolerance,
                q12_reaction_to_loss: formData.q12_reaction_to_loss
            };

            const newAgreement = await base44.entities.Agreement.create(agreementData);

            const draftRiskProfile = {
                client_email: formData.client_email,
                client_name: formData.client_full_name,
                recommended_risk_level: 'medium',
                status: 'draft',
                agreement_id: newAgreement.id
            };
            await base44.entities.RiskProfile.create(draftRiskProfile);

            // Send email to admin with link
            try {
                const settings = await base44.entities.SystemSettings.list();
                const adminEmail = settings && settings.length > 0 && settings[0].admin_email 
                    ? settings[0].admin_email 
                    : 'iftach.venger@gmail.com';

                const baseUrl = window.location.origin;
                const agreementPagePath = createPageUrl('ServiceAgreement');
                const fullAgreementUrl = `${baseUrl}${agreementPagePath}?id=${newAgreement.id}`;

                await base44.integrations.Core.SendEmail({
                    to: adminEmail,
                    subject: 'הסכם חדש נחתם במערכת - ' + formData.client_full_name,
                    body: `<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; direction: rtl;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 22px;">🎉 הסכם חדש נחתם במערכת</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin-top: 0;">פרטי הלקוח:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">שם:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${formData.client_full_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">דוא"ל:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${formData.client_email}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">תעודת זהות:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${formData.client_id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">תאריך חתימה:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${new Date().toLocaleDateString('he-IL')}</td>
                </tr>
            </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${fullAgreementUrl}" 
               style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: bold; 
                      font-size: 16px;
                      box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                📄 לחץ כאן לצפייה בהסכם במערכת
            </a>
        </div>

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: bold;">💡 טיפ:</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #475569;">
                אם הכפתור לא עובד, העתק והדבק את הקישור הבא לדפדפן:
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #2563eb; word-break: break-all;">
                ${fullAgreementUrl}
            </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
                יפתח ונגר יעוץ עסקי | iadvice.co.il
            </p>
        </div>
    </div>
</body>
</html>`
                });
            } catch (emailError) {
                console.error('Error sending email to admin:', emailError);
            }

            setIsSubmitted(true);
        } catch (error) {
            console.error('Error sending form:', error);
            alert(`אירעה שגיאה: ${error.message || 'שגיאה לא ידועה'}. אנא נסה שוב.`);
        }

        setIsSubmitting(false);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4" dir="rtl">
                <div className="max-w-2xl mx-auto pt-20">
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-blue-600" />
                            </div>
                            <CardTitle className="text-blue-800 text-2xl">ההסכם נשלח בהצלחה!</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-slate-700 text-lg font-medium">
                                תודה! ההסכם נשמר במערכת
                            </p>
                            <div className="bg-white border border-blue-200 rounded-lg p-4 text-right space-y-2">
                                <p className="text-slate-600">
                                    ✅ ההסכם נשמר במערכת
                                </p>
                                <p className="text-slate-600">
                                    ✅ ההסכם זמין לצפייה בתפריט הסכמים
                                </p>
                            </div>
                            <Button 
                                onClick={() => window.location.href = createPageUrl('Home')}
                                className="bg-gradient-to-r from-sky-500 to-blue-600 h-12"
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    const getAnswerText = (questionKey, value) => {
        const labels = {
            q1_monthly_income: { a: 'עד 5,000 ₪', b: '5,000-10,000 ₪', c: '10,000-40,000 ₪', d: '40,000-100,000 ₪', e: 'מעל 100,000 ₪' },
            q2_asset_value: { a: 'אין נכסים', b: 'עד 100,000 ₪', c: '100,000-400,000 ₪', d: '400,000-1,000,000 ₪', e: 'מעל 1,000,000 ₪' },
            q3_liability_value: { a: 'אין התחייבויות', b: 'עד 100,000 ₪', c: '100,000-400,000 ₪', d: '400,000-1,000,000 ₪', e: 'מעל 1,000,000 ₪' },
            q5_one_time_expenses: { a: 'לא', b: 'עד 15,000 ₪', c: '15,000-50,000 ₪', d: '50,000-100,000 ₪', e: 'מעל 100,000 ₪' },
            q6_investment_ratio: { a: 'פחות מ-15%', b: '15%-40%', c: '40%-70%', d: 'יותר מ-70%' },
            q7_investment_period: { a: 'עד שנתיים', b: '2-5 שנים', c: 'מעל 5 שנים' },
            q8_investment_goal: { a: 'רכישה עתידית', b: 'חיסכון לפרישה', c: 'עתיד משפחתי', d: 'אחר' },
            q9_market_knowledge: { a: 'אין ניסיון', b: 'ידע בסיסי', c: 'ידע בינוני', d: 'ידע רחב' },
            q10_financial_instruments_knowledge: { a: 'אין היכרות', b: 'מכיר בלי ניסיון', c: 'ניסיון מסוים', d: 'ניסיון רב' },
            q11_risk_tolerance: { a: 'נמוכה מאוד', b: 'נמוכה', c: 'בינונית', d: 'גבוהה' },
            q12_reaction_to_loss: { a: 'אמכור מיד', b: 'אהיה מוטרד', c: 'תנודתיות קצרה', d: 'תנודתיות ארוכה ורגוע' }
        };
        return labels[questionKey]?.[value] || value;
    };

    if (existingAgreement) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4 pb-20" dir="rtl">
                <div className="max-w-4xl mx-auto pt-8">
                    <div className="relative mb-8">
                        <div className="absolute left-0 top-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = createPageUrl('Home')}
                                className="text-slate-600 hover:text-blue-600"
                            >
                                <ArrowRight className="h-4 w-4 ml-2" />
                                חזור לדף הבית
                            </Button>
                        </div>
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shadow-xl shadow-blue-400/30 mb-4">
                                <FileText className="h-8 w-8 text-white" />
                            </div>
                            <p className="text-xl text-slate-700 font-bold">הסכם ייעוץ השקעות</p>
                            <p className="text-base text-slate-800 font-bold mt-2 text-right">בין: יפתח ונגר יועץ מורשה&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;לבין: {existingAgreement.client_full_name}</p>
                        </div>
                    </div>

                    <Card className="border-green-200 bg-green-50/50 mb-6">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-800">ההסכם נחתם בהצלחה</p>
                                    <p className="text-sm text-green-700">תאריך חתימה: {new Date(existingAgreement.date_signed).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>פרטי קשר של הלקוח</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-slate-500">שם מלא</Label>
                                        <p className="font-medium">{existingAgreement.client_full_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-slate-500">ת.ז / ח.פ</Label>
                                        <p className="font-medium">{existingAgreement.client_id}</p>
                                    </div>
                                    <div>
                                        <Label className="text-slate-500">כתובת</Label>
                                        <p className="font-medium">{existingAgreement.client_address}</p>
                                    </div>
                                    <div>
                                        <Label className="text-slate-500">דוא"ל</Label>
                                        <p className="font-medium">{existingAgreement.client_email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-slate-500">דמי ניהול</Label>
                                        <p className="font-medium">{existingAgreement.management_fee_nis} ₪ + מע"מ</p>
                                    </div>
                                    <div>
                                        <Label className="text-slate-500">תאריך חתימה</Label>
                                        <p className="font-medium">{new Date(existingAgreement.date_signed).toLocaleDateString('he-IL')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>שאלון ליבון צרכים</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">1. הכנסה חודשית למשק בית</Label>
                                        <p className="font-medium mt-1">{getAnswerText('q1_monthly_income', existingAgreement.q1_monthly_income)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">2. שווי נכסים וחסכונות</Label>
                                        <p className="font-medium mt-1">{getAnswerText('q2_asset_value', existingAgreement.q2_asset_value)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">3. שווי התחייבויות</Label>
                                        <p className="font-medium mt-1">{getAnswerText('q3_liability_value', existingAgreement.q3_liability_value)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">4. נכסים מול התחייבויות</Label>
                                        <p className="font-medium mt-1">{existingAgreement.q4_assets_vs_liabilities}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">5. הוצאות חד פעמיות צפויות</Label>
                                        <p className="font-medium mt-1">{getAnswerText('q5_one_time_expenses', existingAgreement.q5_one_time_expenses)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">6. שיעור השקעה מנכסים פיננסיים</Label>
                                        <p className="font-medium mt-1">{getAnswerText('q6_investment_ratio', existingAgreement.q6_investment_ratio)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">7. תקופת השקעה צפויה</Label>
                                        <p className="font-medium mt-1">{getAnswerText('q7_investment_period', existingAgreement.q7_investment_period)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">8. מטרת ההשקעה</Label>
                                        <p className="font-medium mt-1">
                                            {getAnswerText('q8_investment_goal', existingAgreement.q8_investment_goal)}
                                            {existingAgreement.q8_other_goal && ` - ${existingAgreement.q8_other_goal}`}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">9. ניסיון וידע בשוק ההון</Label>
                                        <p className="font-medium mt-1">{getAnswerText('q9_market_knowledge', existingAgreement.q9_market_knowledge)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">10. היכרות עם מכשירים פיננסיים</Label>
                                        <p className="font-medium mt-1">{getAnswerText('q10_financial_instruments_knowledge', existingAgreement.q10_financial_instruments_knowledge)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">11. סבלנות לסיכון</Label>
                                        <p className="font-medium mt-1">{getAnswerText('q11_risk_tolerance', existingAgreement.q11_risk_tolerance)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <Label className="text-slate-600">12. תגובה להפסד של 15%</Label>
                                        <p className="font-medium mt-1">{getAnswerText('q12_reaction_to_loss', existingAgreement.q12_reaction_to_loss)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>חתימה דיגיטלית</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 justify-between">
                                        <div className="flex-1 text-center">
                                            <Label className="text-slate-600">שם החותם</Label>
                                            <p className="font-medium text-lg mt-2">{existingAgreement.signature_name}</p>
                                        </div>
                                        {existingAgreement.signature_url && (
                                            <div className="flex-1 text-center">
                                                <Label className="text-slate-600">חתימה</Label>
                                                <div className="mt-2 border-2 border-slate-200 rounded-lg p-4 bg-white inline-block">
                                                    <img 
                                                        src={existingAgreement.signature_url} 
                                                        alt="חתימה" 
                                                        className="max-w-xs mx-auto"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex-1 text-center">
                                            <Label className="text-slate-600">תאריך החתימה</Label>
                                            <p className="font-medium mt-2">{new Date(existingAgreement.date_signed).toLocaleDateString('he-IL')}</p>
                                        </div>
                                    </div>
                                    <div className="text-center flex gap-2 justify-center">
                                        {user?.role === 'admin' && (
                                            <>
                                                <Button
                                                    onClick={async () => {
                                                        try {
                                                            const newProfile = await base44.entities.RiskProfile.create({
                                                                client_email: existingAgreement.client_email,
                                                                client_name: existingAgreement.client_full_name,
                                                                recommended_risk_level: 'medium',
                                                                status: 'draft',
                                                                agreement_id: existingAgreement.id
                                                            });

                                                            window.location.href = createPageUrl('RiskLevel') + `?id=${newProfile.id}`;
                                                        } catch (error) {
                                                            alert('שגיאה ביצירת הטופס: ' + error.message);
                                                        }
                                                    }}
                                                    disabled={hasRiskProfile}
                                                    size="sm"
                                                    className={hasRiskProfile ? "bg-slate-700 hover:bg-slate-700" : "bg-orange-700 hover:bg-orange-800"}
                                                >
                                                    <TrendingUp className="h-3 w-3 ml-1" />
                                                    {hasRiskProfile ? 'הופק טופס רמות סיכון' : 'פתח טופס רמת סיכון'}
                                                </Button>
                                                <Button
                                            onClick={async () => {
                                                if (!confirm('האם אתה בטוח שברצונך לשלוח את ההסכם הזה שוב? זה ייצור הסכם חדש וטופס רמת סיכון חדש.')) {
                                                    return;
                                                }

                                                try {
                                                    const signatureDate = new Date().toISOString().split('T')[0];

                                                    // Create new agreement with same data
                                                    const newAgreement = await base44.entities.Agreement.create({
                                                        client_email: existingAgreement.client_email,
                                                        date_signed: signatureDate,
                                                        client_full_name: existingAgreement.client_full_name,
                                                        client_id: existingAgreement.client_id,
                                                        client_address: existingAgreement.client_address,
                                                        management_fee_nis: existingAgreement.management_fee_nis,
                                                        signature_name: existingAgreement.signature_name,
                                                        signature_url: existingAgreement.signature_url,
                                                        status: 'approved',
                                                        admin_approval_date: signatureDate,
                                                        q1_monthly_income: existingAgreement.q1_monthly_income,
                                                        q2_asset_value: existingAgreement.q2_asset_value,
                                                        q3_liability_value: existingAgreement.q3_liability_value,
                                                        q4_assets_vs_liabilities: existingAgreement.q4_assets_vs_liabilities,
                                                        q5_one_time_expenses: existingAgreement.q5_one_time_expenses,
                                                        q6_investment_ratio: existingAgreement.q6_investment_ratio,
                                                        q7_investment_period: existingAgreement.q7_investment_period,
                                                        q8_investment_goal: existingAgreement.q8_investment_goal,
                                                        q8_other_goal: existingAgreement.q8_other_goal || '',
                                                        q9_market_knowledge: existingAgreement.q9_market_knowledge,
                                                        q10_financial_instruments_knowledge: existingAgreement.q10_financial_instruments_knowledge,
                                                        q11_risk_tolerance: existingAgreement.q11_risk_tolerance,
                                                        q12_reaction_to_loss: existingAgreement.q12_reaction_to_loss
                                                    });

                                                    // Create new risk profile
                                                    const newRiskProfile = await base44.entities.RiskProfile.create({
                                                        client_email: existingAgreement.client_email,
                                                        client_name: existingAgreement.client_full_name,
                                                        recommended_risk_level: 'medium',
                                                        status: 'draft',
                                                        agreement_id: newAgreement.id
                                                    });

                                                    // Send email to client with risk profile link
                                                    try {
                                                        const baseUrl = window.location.origin;
                                                        const formUrl = `${baseUrl}${createPageUrl('RiskLevel')}?id=${newRiskProfile.id}`;

                                                        await base44.integrations.Core.SendEmail({
                                                            to: existingAgreement.client_email,
                                                            subject: 'הסכם חדש נחתם - יש למלא טופס רמת סיכון',
                                                            body: `
                                                                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                                                                    <h2>שלום ${existingAgreement.client_full_name},</h2>
                                                                    <p>הסכם חדש נחתם בהצלחה.</p>
                                                                    <p>כעת עליך למלא את טופס רמת הסיכון.</p>
                                                                    <p style="margin: 20px 0;">
                                                                        <a href="${formUrl}" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                                                            לחץ כאן למילוי הטופס
                                                                        </a>
                                                                    </p>
                                                                    <p style="font-size: 12px; color: #666;">או העתק את הקישור הבא לדפדפן:<br/>${formUrl}</p>
                                                                    <p>בברכה,<br/>יפתח ונגר יעוץ עסקי</p>
                                                                </div>
                                                            `
                                                        });
                                                    } catch (emailError) {
                                                        console.error('Error sending email to client:', emailError);
                                                    }

                                                    // Send email to admin
                                                    try {
                                                        const settings = await base44.entities.SystemSettings.list();
                                                        const adminEmail = settings && settings.length > 0 && settings[0].admin_email 
                                                            ? settings[0].admin_email 
                                                            : 'iftach.venger@gmail.com';

                                                        const baseUrl = window.location.origin;
                                                        const agreementUrl = `${baseUrl}${createPageUrl('ServiceAgreement')}?id=${newAgreement.id}`;

                                                        await base44.integrations.Core.SendEmail({
                                                            to: adminEmail,
                                                            subject: 'הסכם חדש נחתם במערכת',
                                                            body: `
                                                                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                                                                    <h2>הסכם חדש נחתם במערכת יפתח ונגר יעוץ עסקי</h2>
                                                                    <p><strong>פרטי הלקוח:</strong></p>
                                                                    <ul>
                                                                        <li>שם: ${existingAgreement.client_full_name}</li>
                                                                        <li>דוא"ל: ${existingAgreement.client_email}</li>
                                                                        <li>תעודת זהות: ${existingAgreement.client_id}</li>
                                                                        <li>תאריך חתימה: ${new Date().toLocaleDateString('he-IL')}</li>
                                                                    </ul>
                                                                    <p style="margin: 20px 0;">
                                                                        <a href="${agreementUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                                                            צפייה בהסכם במערכת
                                                                        </a>
                                                                    </p>
                                                                    <p style="font-size: 12px; color: #666;">או העתק את הקישור הבא לדפדפן:<br/>${agreementUrl}</p>
                                                                </div>
                                                            `
                                                        });
                                                    } catch (emailError) {
                                                        console.error('Error sending email to admin:', emailError);
                                                    }

                                                    alert('ההסכם נשלח בהצלחה! נוצר הסכם חדש וטופס רמת סיכון חדש.');
                                                    window.location.reload();
                                                } catch (error) {
                                                    alert('שגיאה בשליחת ההסכם: ' + error.message);
                                                }
                                            }}
                                            size="sm"
                                            className="bg-green-700 hover:bg-green-800 h-7 text-[10px] px-2"
                                            >
                                                    <CheckCircle className="h-3 w-3 ml-1" />
                                                    פתח טופס פעם נוספת
                                                </Button>
                                            </>
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4 pb-32" dir="rtl">
            <div className="max-w-5xl mx-auto pt-2">
                {/* Header */}
                <div className="relative mb-4">
                    <div className="absolute left-0 top-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = createPageUrl('Home')}
                            className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                            <ArrowRight className="h-3 w-3 ml-1" />
                            חזור לדף הבית
                        </Button>
                    </div>
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 shadow-xl shadow-blue-500/30 mb-3">
                            <FileText className="h-7 w-7 text-white" />
                        </div>
                        <p className="text-xl text-slate-700 font-bold">הסכם ייעוץ השקעות</p>
                        <p className="text-base text-slate-800 font-bold mt-2 text-right">בין: יפתח ונגר יועץ מורשה&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;לבין: {formData.client_full_name}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Personal Details Card */}
                    <Card className="border border-blue-100 shadow-md">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-100 py-3">
                            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">1</span>
                                </div>
                                פרטי קשר של הלקוח
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-slate-700">שם מלא *</Label>
                                    <Input
                                        value={formData.client_full_name}
                                        onChange={(e) => updateField('client_full_name', e.target.value)}
                                        placeholder="הכנס שם מלא"
                                        className="h-9 text-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-slate-700">ת.ז / ח.פ *</Label>
                                    <Input
                                        value={formData.client_id}
                                        onChange={(e) => updateField('client_id', e.target.value)}
                                        placeholder="מספר זהות או חברה"
                                        className="h-9 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-slate-700">כתובת מלאה *</Label>
                                <Input
                                    value={formData.client_address}
                                    onChange={(e) => updateField('client_address', e.target.value)}
                                    placeholder="רחוב, עיר, מיקוד"
                                    className="h-9 text-sm"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-slate-700">דוא"ל *</Label>
                                    <Input
                                        type="email"
                                        value={formData.client_email}
                                        onChange={(e) => updateField('client_email', e.target.value)}
                                        placeholder="example@email.com"
                                        className="h-9 text-sm"
                                        required
                                        disabled
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-slate-700">דמי ניהול (₪) *</Label>
                                    <Input
                                        value={formData.management_fee_nis}
                                        onChange={(e) => updateField('management_fee_nis', e.target.value)}
                                        placeholder="סכום בשקלים"
                                        className="h-9 text-sm"
                                        required
                                    />
                                    <p className="text-xs text-slate-500">*לא כולל מע"מ</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questionnaire Card */}
                    <Card className="border border-purple-100 shadow-md">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 py-3">
                            <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">2</span>
                                </div>
                                שאלון ליבון צרכים
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {/* Question 1 */}
                            <div className="bg-gradient-to-br from-blue-50/50 to-transparent p-3 rounded-lg border border-blue-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    1. מהי ההכנסה החודשית הממוצעת למשק הבית שלך? *
                                </Label>
                                <RadioGroup value={formData.q1_monthly_income} onValueChange={(v) => updateField('q1_monthly_income', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'עד 5,000 ₪' },
                                            { value: 'b', label: '5,000-10,000 ₪' },
                                            { value: 'c', label: '10,000-40,000 ₪' },
                                            { value: 'd', label: '40,000-100,000 ₪' },
                                            { value: 'e', label: 'מעל 100,000 ₪' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q1-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q1-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 2 */}
                            <div className="bg-gradient-to-br from-green-50/50 to-transparent p-3 rounded-lg border border-green-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    2. מה שווי הנכסים והחסכונות שלך? *
                                </Label>
                                <RadioGroup value={formData.q2_asset_value} onValueChange={(v) => updateField('q2_asset_value', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'אין נכסים' },
                                            { value: 'b', label: 'עד 100,000 ₪' },
                                            { value: 'c', label: '100,000-400,000 ₪' },
                                            { value: 'd', label: '400,000-1,000,000 ₪' },
                                            { value: 'e', label: 'מעל 1,000,000 ₪' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q2-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q2-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 3 */}
                            <div className="bg-gradient-to-br from-orange-50/50 to-transparent p-3 rounded-lg border border-orange-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    3. מה שווי ההתחייבויות שלך? *
                                </Label>
                                <RadioGroup value={formData.q3_liability_value} onValueChange={(v) => updateField('q3_liability_value', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'אין התחייבויות' },
                                            { value: 'b', label: 'עד 100,000 ₪' },
                                            { value: 'c', label: '100,000-400,000 ₪' },
                                            { value: 'd', label: '400,000-1,000,000 ₪' },
                                            { value: 'e', label: 'מעל 1,000,000 ₪' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q3-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q3-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 4 */}
                            <div className="bg-gradient-to-br from-purple-50/50 to-transparent p-3 rounded-lg border border-purple-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    4. תאר את היחס בין הנכסים להתחייבויות שלך *
                                </Label>
                                <Textarea
                                    value={formData.q4_assets_vs_liabilities}
                                    onChange={(e) => updateField('q4_assets_vs_liabilities', e.target.value)}
                                    placeholder="לדוגמה: יש לי דירה בשווי X והלוואה של Y..."
                                    className="h-20 text-sm resize-none"
                                    required
                                />
                            </div>

                            {/* Question 5 */}
                            <div className="bg-gradient-to-br from-pink-50/50 to-transparent p-3 rounded-lg border border-pink-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    5. האם צפויות לך הוצאות חד פעמיות משמעותיות? *
                                </Label>
                                <RadioGroup value={formData.q5_one_time_expenses} onValueChange={(v) => updateField('q5_one_time_expenses', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'לא' },
                                            { value: 'b', label: 'עד 15,000 ₪' },
                                            { value: 'c', label: '15,000-50,000 ₪' },
                                            { value: 'd', label: '50,000-100,000 ₪' },
                                            { value: 'e', label: 'מעל 100,000 ₪' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q5-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q5-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 6 */}
                            <div className="bg-gradient-to-br from-cyan-50/50 to-transparent p-3 rounded-lg border border-cyan-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    6. באיזה שיעור מהנכסים הפיננסיים שלך תרצה להשקיע? *
                                </Label>
                                <RadioGroup value={formData.q6_investment_ratio} onValueChange={(v) => updateField('q6_investment_ratio', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'פחות מ-15%' },
                                            { value: 'b', label: '15%-40%' },
                                            { value: 'c', label: '40%-70%' },
                                            { value: 'd', label: 'יותר מ-70%' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q6-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q6-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 7 */}
                            <div className="bg-gradient-to-br from-indigo-50/50 to-transparent p-3 rounded-lg border border-indigo-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    7. מה תקופת ההשקעה הצפויה? *
                                </Label>
                                <RadioGroup value={formData.q7_investment_period} onValueChange={(v) => updateField('q7_investment_period', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'עד שנתיים' },
                                            { value: 'b', label: '2-5 שנים' },
                                            { value: 'c', label: 'מעל 5 שנים' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q7-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q7-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 8 */}
                            <div className="bg-gradient-to-br from-yellow-50/50 to-transparent p-3 rounded-lg border border-yellow-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    8. מה מטרת ההשקעה העיקרית? *
                                </Label>
                                <RadioGroup value={formData.q8_investment_goal} onValueChange={(v) => updateField('q8_investment_goal', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'רכישה עתידית (רכב, דירה וכו\')' },
                                            { value: 'b', label: 'חיסכון לפרישה' },
                                            { value: 'c', label: 'עתיד משפחתי (ילדים, נכדים)' },
                                            { value: 'd', label: 'אחר' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q8-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q8-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                                {formData.q8_investment_goal === 'd' && (
                                    <Input
                                        value={formData.q8_other_goal}
                                        onChange={(e) => updateField('q8_other_goal', e.target.value)}
                                        placeholder="פרט מטרה אחרת..."
                                        className="mt-2 h-9 text-sm"
                                    />
                                )}
                            </div>

                            {/* Question 9 */}
                            <div className="bg-gradient-to-br from-teal-50/50 to-transparent p-3 rounded-lg border border-teal-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    9. מה רמת הניסיון והידע שלך בשוק ההון? *
                                </Label>
                                <RadioGroup value={formData.q9_market_knowledge} onValueChange={(v) => updateField('q9_market_knowledge', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'אין ניסיון' },
                                            { value: 'b', label: 'ידע בסיסי' },
                                            { value: 'c', label: 'ידע בינוני' },
                                            { value: 'd', label: 'ידע רחב' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q9-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q9-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 10 */}
                            <div className="bg-gradient-to-br from-rose-50/50 to-transparent p-3 rounded-lg border border-rose-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    10. מה מידת ההיכרות שלך עם מכשירים פיננסיים? *
                                </Label>
                                <RadioGroup value={formData.q10_financial_instruments_knowledge} onValueChange={(v) => updateField('q10_financial_instruments_knowledge', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'אין היכרות' },
                                            { value: 'b', label: 'מכיר אך אין ניסיון מעשי' },
                                            { value: 'c', label: 'ניסיון מסוים' },
                                            { value: 'd', label: 'ניסיון רב' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q10-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q10-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 11 */}
                            <div className="bg-gradient-to-br from-amber-50/50 to-transparent p-3 rounded-lg border border-amber-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    11. מה מידת הסבלנות שלך כלפי סיכון? *
                                </Label>
                                <RadioGroup value={formData.q11_risk_tolerance} onValueChange={(v) => updateField('q11_risk_tolerance', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'נמוכה מאוד' },
                                            { value: 'b', label: 'נמוכה' },
                                            { value: 'c', label: 'בינונית' },
                                            { value: 'd', label: 'גבוהה' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q11-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q11-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 12 */}
                            <div className="bg-gradient-to-br from-lime-50/50 to-transparent p-3 rounded-lg border border-lime-100">
                                <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                                    12. כיצד תגיב להפסד של 15% בהשקעה שלך? *
                                </Label>
                                <RadioGroup value={formData.q12_reaction_to_loss} onValueChange={(v) => updateField('q12_reaction_to_loss', v)}>
                                    <div className="space-y-1.5">
                                        {[
                                            { value: 'a', label: 'אמכור מיד את ההשקעה' },
                                            { value: 'b', label: 'אהיה מוטרד ואשקול למכור' },
                                            { value: 'c', label: 'זו תנודתיות קצרת טווח, אמתין' },
                                            { value: 'd', label: 'זו תנודתיות ארוכת טווח, אני רגוע' }
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex flex-row-reverse items-center gap-2 p-2 rounded-md hover:bg-white transition-colors justify-end">
                                                <RadioGroupItem value={opt.value} id={`q12-${opt.value}`} className="w-4 h-4" />
                                                <Label htmlFor={`q12-${opt.value}`} className="text-sm cursor-pointer flex-1 text-right">
                                                    {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signature Card */}
                    <Card className="border border-emerald-100 shadow-md">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 py-2">
                            <CardTitle className="text-sm text-emerald-900 flex items-center gap-2">
                                <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center">
                                    <span className="text-white font-semibold text-xs">3</span>
                                </div>
                                חתימה דיגיטלית
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">שם החותם *</Label>
                                        <Input
                                            value={signature}
                                            onChange={(e) => setSignature(e.target.value)}
                                            placeholder="הכנס שם מלא לחתימה"
                                            className="h-8 text-xs"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">תאריך *</Label>
                                        <Input
                                            type="date"
                                            value={new Date().toISOString().split('T')[0]}
                                            className="h-8 text-xs"
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-slate-700">חתימה דיגיטלית *</Label>
                                    <div className="border-2 border-dashed border-emerald-300 rounded-lg p-2 bg-emerald-50/30">
                                        <SignaturePad onSave={setSignatureImage} />
                                    </div>
                                    <p className="text-xs text-slate-500">חתום בתוך המסגרת באמצעות העכבר או המסך המגע</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="fixed bottom-4 left-4 z-10 flex gap-2">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-10 text-sm font-semibold bg-green-800 hover:bg-green-900"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                    שולח הסכם...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 ml-2" />
                                    שלח הסכם ליועץ
                                </>
                            )}
                        </Button>
                        {user?.role === 'admin' && (
                            <Button
                                type="button"
                                disabled={isSubmitting}
                                onClick={async (e) => {
                                    if (!confirm('האם אתה בטוח שברצונך לשלוח את ההסכם פעם נוספת?')) {
                                        return;
                                    }
                                    await handleSubmit(e);
                                }}
                                className="h-10 text-sm font-semibold bg-blue-700 hover:bg-blue-800"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                        שולח...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 ml-2" />
                                        שלח פעם נוספת
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
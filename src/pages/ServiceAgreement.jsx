import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, CheckCircle, ArrowRight, Mail } from "lucide-react";
import { createPageUrl } from '@/utils';
import SignaturePad from '@/components/signature/SignaturePad';

export default function ServiceAgreement() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [signature, setSignature] = useState('');
    const [signatureImage, setSignatureImage] = useState('');
    
    const [formData, setFormData] = useState({
        // Section 1: Contact Details
        date_signed: '',
        client_full_name: '',
        client_id: '',
        client_address: '',
        client_email: '',
        management_fee_nis: '',
        
        // Section 2: Questionnaire (Annex A)
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

    const updateField = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const required = [
            'date_signed', 'client_full_name', 'client_id', 'client_address',
            'client_email', 'management_fee_nis', 'q1_monthly_income', 'q2_asset_value',
            'q3_liability_value', 'q4_assets_vs_liabilities', 'q5_one_time_expenses',
            'q6_investment_ratio', 'q7_investment_period', 'q8_investment_goal',
            'q9_market_knowledge', 'q10_financial_instruments_knowledge',
            'q11_risk_tolerance', 'q12_reaction_to_loss'
        ];

        for (const field of required) {
            if (!formData[field]) {
                alert(`אנא מלא את השדה: ${field}`);
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
            console.log('Starting form submission...');
            
            const getAnswerText = (questionKey) => {
                const value = formData[questionKey];
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

            const emailBody = `
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #0066cc; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
        h2 { color: #0066cc; margin-top: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px; }
        h3 { color: #333; margin-top: 20px; }
        .info-box { background: #f5f5f5; padding: 15px; border-right: 4px solid #0066cc; margin: 20px 0; }
        .signature-box { border: 2px solid #0066cc; padding: 20px; margin: 20px 0; text-align: center; }
        .signature-img { max-width: 300px; border: 1px solid #ccc; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        td { padding: 8px; border-bottom: 1px solid #e0e0e0; }
        td:first-child { font-weight: bold; width: 40%; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; color: #666; }
    </style>
</head>
<body>
    <h1>📄 הסכם ייעוץ השקעות</h1>
    
    <h2>פרטי הצדדים</h2>
    <div class="info-box">
        <h3>פרטי היועץ (צד אחד)</h3>
        <table>
            <tr><td>שם:</td><td>יפתח ונגר</td></tr>
            <tr><td>ת.ז.:</td><td>034025197</td></tr>
            <tr><td>כתובת:</td><td>נחל תבור 6, מודיעין</td></tr>
            <tr><td>דוא"ל:</td><td>iftach.venger@gmail.com</td></tr>
            <tr><td>טלפון:</td><td>050-3976397</td></tr>
        </table>
    </div>
    
    <div class="info-box">
        <h3>פרטי הלקוח (צד שני)</h3>
        <table>
            <tr><td>שם מלא:</td><td><strong>${formData.client_full_name}</strong></td></tr>
            <tr><td>ת.ז./ח.פ.:</td><td>${formData.client_id}</td></tr>
            <tr><td>כתובת:</td><td>${formData.client_address}</td></tr>
            <tr><td>דוא"ל:</td><td>${formData.client_email}</td></tr>
            <tr><td>תאריך חתימה:</td><td>${formData.date_signed}</td></tr>
            <tr><td>דמי ניהול:</td><td><strong>${formData.management_fee_nis} ₪ + מע"מ</strong></td></tr>
        </table>
    </div>

    <h2>מבוא והצהרות</h2>
    <p>הואיל והלקוח מעוניין לקבל שירותי ייעוץ השקעות מהיועץ;</p>
    <p>והואיל והיועץ הינו בעל רישיון ייעוץ השקעות בהתאם לחוק הסדרת העיסוק בייעוץ השקעות, תשנ"ה-1995;</p>
    <p>והואיל והיועץ מצהיר כי בידו הכושר, היכולת והידע לספק את שירותי ייעוץ ההשקעות;</p>
    <p><strong>לפיכך הוסכם הותנה והוצהר בין הצדדים:</strong></p>

    <h2>נספח א': בירור צרכי הלקוח</h2>
    
    <h3>מצב כלכלי והעדפות</h3>
    <table>
        <tr><td>1. הכנסה חודשית למשק בית:</td><td>${getAnswerText('q1_monthly_income')}</td></tr>
        <tr><td>2. שווי נכסים וחסכונות:</td><td>${getAnswerText('q2_asset_value')}</td></tr>
        <tr><td>3. שווי התחייבויות:</td><td>${getAnswerText('q3_liability_value')}</td></tr>
        <tr><td>4. נכסים מול התחייבויות:</td><td>${formData.q4_assets_vs_liabilities}</td></tr>
        <tr><td>5. הוצאות חד פעמיות צפויות:</td><td>${getAnswerText('q5_one_time_expenses')}</td></tr>
        <tr><td>6. שיעור השקעה מנכסים פיננסיים:</td><td>${getAnswerText('q6_investment_ratio')}</td></tr>
        <tr><td>7. תקופת השקעה צפויה:</td><td>${getAnswerText('q7_investment_period')}</td></tr>
        <tr><td>8. מטרת ההשקעה:</td><td>${getAnswerText('q8_investment_goal')}${formData.q8_other_goal ? ` - ${formData.q8_other_goal}` : ''}</td></tr>
    </table>

    <h3>ניסיון וידע בשוק ההון</h3>
    <table>
        <tr><td>9. ניסיון וידע בשוק ההון:</td><td>${getAnswerText('q9_market_knowledge')}</td></tr>
        <tr><td>10. היכרות עם מכשירים פיננסיים:</td><td>${getAnswerText('q10_financial_instruments_knowledge')}</td></tr>
    </table>

    <h3>יחס לסיכון</h3>
    <table>
        <tr><td>11. סבלנות לסיכון:</td><td>${getAnswerText('q11_risk_tolerance')}</td></tr>
        <tr><td>12. תגובה להפסד של 15%:</td><td>${getAnswerText('q12_reaction_to_loss')}</td></tr>
    </table>

    <h2>חתימת הלקוח</h2>
    <div class="signature-box">
        <p><strong>שם החותם:</strong> ${signature}</p>
        <p><strong>חתימה:</strong></p>
        <img src="${signatureImage}" alt="חתימה" class="signature-img" />
        <p style="margin-top: 15px; color: #666;">תאריך: ${formData.date_signed}</p>
    </div>

    <div class="footer">
        <p>הסכם זה נחתם דיגיטלית באמצעות מערכת יפתח ונגר יעוץ עסקי</p>
        <p>📧 <a href="mailto:iftach.venger@gmail.com">iftach.venger@gmail.com</a> | 📞 050-3976397</p>
    </div>
</body>
</html>
            `;

            console.log('Sending email to: Guylavee@gmail.com');
            console.log('Subject:', `הסכם ייעוץ השקעות - ${formData.client_full_name}`);
            
            const result = await base44.integrations.Core.SendEmail({
                to: 'Guylavee@gmail.com',
                subject: `הסכם ייעוץ השקעות - ${formData.client_full_name}`,
                body: emailBody
            });

            console.log('Email sent successfully:', result);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error sending form:', error);
            console.error('Error details:', error.message, error.stack);
            alert(`אירעה שגיאה בשליחת הטופס: ${error.message || 'שגיאה לא ידועה'}. אנא נסה שוב.`);
        }

        setIsSubmitting(false);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-4" dir="rtl">
                <div className="max-w-2xl mx-auto pt-20">
                    <Card className="border-green-200 bg-green-50/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-green-800 text-2xl">ההסכם נשלח בהצלחה!</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-slate-600">
                                תודה על מילוי הסכם השירות. הפרטים נשלחו ליועץ ויחזור אליך בהקדם.
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-xl mb-4">
                        <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">הסכם ייעוץ השקעות</h1>
                    <p className="text-slate-600">יפתח ונגר יעוץ עסקי</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Contact Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>פרטי התקשרות והתחלת הסכם</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>תאריך חתימת ההסכם *</Label>
                                <Input
                                    type="date"
                                    value={formData.date_signed}
                                    onChange={(e) => updateField('date_signed', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">פרטי היועץ (צד אחד)</h4>
                                <p className="text-sm text-slate-600">
                                    <strong>שם:</strong> יפתח ונגר<br />
                                    <strong>ת.ז.:</strong> 034025197<br />
                                    <strong>כתובת:</strong> נחל תבור 6, מודיעין<br />
                                    <strong>דוא"ל:</strong> iftach.venger@gmail.com<br />
                                    <strong>טלפון:</strong> 050-3976397
                                </p>
                            </div>

                            <h4 className="font-medium pt-4">פרטי הלקוח (צד שני)</h4>
                            
                            <div>
                                <Label>שם הלקוח המלא *</Label>
                                <Input
                                    value={formData.client_full_name}
                                    onChange={(e) => updateField('client_full_name', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label>ת.ז. או ח.פ. *</Label>
                                <Input
                                    value={formData.client_id}
                                    onChange={(e) => updateField('client_id', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label>כתובת מלאה *</Label>
                                <Input
                                    value={formData.client_address}
                                    onChange={(e) => updateField('client_address', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label>דוא"ל *</Label>
                                <Input
                                    type="email"
                                    value={formData.client_email}
                                    onChange={(e) => updateField('client_email', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label>סכום תשלום חד פעמי (דמי ניהול) בש"ח, בתוספת מע"מ *</Label>
                                <Input
                                    type="number"
                                    value={formData.management_fee_nis}
                                    onChange={(e) => updateField('management_fee_nis', e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Agreement Body - Full Text */}
                    <Card>
                        <CardHeader>
                            <CardTitle>גוף ההסכם - הסכם ייעוץ השקעות</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-slate max-w-none text-sm space-y-4 leading-relaxed">
                            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                                <h4 className="font-bold text-sky-900 mb-2">מבוא והצהרות</h4>
                                <p className="text-slate-700">
                                    הואיל והלקוח מעוניין לקבל, החל ממועד חתימת הסכם זה, שירותי ייעוץ השקעות מהיועץ כמפורט בהסכם זה (להלן: "שירות ייעוץ השקעות" או "השירות");
                                </p>
                                <p className="text-slate-700">
                                    והואיל והיועץ הינו בעל רישיון ייעוץ השקעות, בהתאם לחוק הסדרת העיסוק בייעוץ השקעות, בשיווק השקעות ובניהול תיקי השקעות, תשנ"ה-1995 ("חוק הייעוץ");
                                </p>
                                <p className="text-slate-700">
                                    והואיל והיועץ מצהיר כי בידו הכושר, היכולת והידע, לספק את שירותי ייעוץ ההשקעות, וכי הוא מעוניין לספק את השירות ללקוח;
                                </p>
                                <p className="text-slate-700">
                                    והואיל וברצון הצדדים להסדיר את מערכת היחסים ביניהם, בהתאם להוראות כל דין, לרבות חוק הייעוץ, כמפורט בהסכם זה.
                                </p>
                                <p className="font-bold text-slate-800">לפיכך הוסכם הותנה והוצהר בין הצדדים כדלקמן:</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">1. כללי</h4>
                                    <p><strong>1.1</strong> המבוא להסכם זה והנספחים לו מהווים חלק בלתי נפרד ממנו.</p>
                                    <p><strong>1.2</strong> כותרות סעיפי הסכם זה הינן לצרכי נוחות בלבד ואין להשתמש בהם לצרכי פרשנות.</p>
                                    <p><strong>1.3</strong> למונחים המפורטים בהסכם זה תהא המשמעות, המובן והפרשנות שתהיה מעת לעת לאותם מונחים בחוק הייעוץ, אלא אם הם הוגדרו אחרת במפורש בהסכם זה. במקרה של סתירה בין חוק הייעוץ לבין הסכם זה, יפורשו אותם מונחים על פי חוק הייעוץ, אם לא הוגדר אחרת במפורש בהסכם זה.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">2. הגדרות</h4>
                                    <p className="mb-2">למונחים הבאים תהא המשמעות, המובן והפרשנות בהתאם להגדרתם נכון למועד זה בחוק הייעוץ:</p>
                                    <p><strong>"בנק"</strong> - כמשמעות המונח בחוק הבנקאות (רישוי), לרבות תאגידים בנקאיים, חברי בורסה, ברוקרים ומוסדות פיננסיים בהם ינוהלו חשבונות הלקוח.</p>
                                    <p><strong>"ייעוץ השקעות"</strong> - מתן ייעוץ לאחרים בנוגע לכדאיות של השקעה, החזקה, קניה או מכירה של ניירות ערך או של נכסים פיננסיים, בין במישרין ובין בעקיפין, לרבות באמצעות פרסום, בחוזרים, בחוות דעת באמצעות הדואר, הפקסימיליה או בכל אמצעי אחר.</p>
                                    <p><strong>"נכסים פיננסיים"</strong> - יחידות כהגדרתן בחוק השקעות משותפות בנאמנות, תשנ"ד-1994, מניות או יחידות של קרן הרשומה מחוץ לישראל, אופציות, חוזים עתידיים, מוצרים מובנים, מוצרי מדדים וכן קרנות השתלמות.</p>
                                    <p><strong>"ניירות ערך"</strong> - כהגדרתם בסעיף 1 לחוק ניירות ערך, התשכ"ח-1968, למעט ניירות ערך שאינם רשומים למסחר בבורסה ומוצרי מדדים, לרבות ניירות ערך המנופקים ע"י הממשלה וניירות ערך הרשומים למסחר בבורסה מחוץ לישראל או בשוק מוסדר מחוץ לישראל.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">3. ההתקשרות בין הצדדים</h4>
                                    <p><strong>3.1</strong> הלקוח מורה ליועץ ומסמיך אותו בזאת לספק לו שירותי ייעוץ השקעות בניירות ערך ובנכסים פיננסיים.</p>
                                    <p><strong>3.2</strong> היועץ יספק את שירותי יעוץ ההשקעות ללקוח, תוך שהוא ישאף להתאים באופן מיטבי את השירות לצרכי הלקוח והנחיותיו. לשם כך, ובטרם היועץ יוכל לספק שירות ייעוץ השקעות ללקוח, הלקוח ימסור ליועץ את הנחיותיו, צרכיו, מטרות ההשקעה, פירוט מצבו הכספי, לרבות ניירות הערך שלו ונכסיו הפיננסיים וכל שאר הנסיבות והנתונים הנדרשים לצורך מתן שירות ייעוץ ההשקעות.</p>
                                    <p><strong>3.3</strong> לאחר עיבוד הנתונים שהתקבלו מהלקוח במסגרת טופס ליבון צרכים, תקבע רמת הסיכון ומדיניות ההשקעה של הלקוח.</p>
                                    <p><strong>3.4</strong> ככל שהלקוח יבקש לקבוע את מדיניות השקעות שלא בהתאם להמלצת היועץ, הלקוח מודע לכך שמתן השירותים עבורו עשוי שלא להתאים לצרכיו ומצבו הכספי.</p>
                                    <p><strong>3.5</strong> הלקוח מאשר כי הפרטים המפורטים בטופס ליבון צרכים הינם נכונים ומלאים וכי הוא מסכים למדיניות ההשקעות שנקבעה.</p>
                                    <p><strong>3.6</strong> הלקוח מתחייב להודיע ליועץ על כל שינוי בפרטים בשיחה פנים מול פנים, במייל שאושרה קבלתו או בשיחה טלפונית.</p>
                                    <p><strong>3.7</strong> ידוע ללקוח שלמסירת פרטים אודותיו חשיבות רבה ביותר לצורך התאמת השירות לצרכיו וכי במידה ובמסגרת טופס ליבון צרכים, הלקוח סיפק מידע שאינו שלם ו/או לא מדויק, מתן השירות עשוי להיפגע ולא להיות מותאם באופן מיטבי.</p>
                                    <p><strong>3.11</strong> היועץ יספק את שירותיו תוך שהוא חב חובת נאמנות ללקוח והוא מתחייב לפעול לטובת הלקוח באמונה ובשקידה.</p>
                                    <p><strong>3.12</strong> היועץ מתחייב, כי במסגרת שירות ייעוץ ההשקעות יגלה ללקוח, בגילוי נאות את כל העניינים המהותיים לשירות הניתן על ידו ולעסקאות המוצעות.</p>
                                    <p><strong>3.13</strong> מובהר ומוסכם כי היועץ לא יהיה רשאי לבצע עבור הלקוח שום פעולה אלא אם ניתנה לכך הרשאה מפורשת על ידי הלקוח.</p>
                                    <p><strong>3.14</strong> היועץ מתחייב כי בכל עת שייוודע לו על אפשרות ניגוד עניינים יודיע על כך ללקוח וימנע מלבצע כל פעולה שיש בה ניגוד עניינים, זולת אם נתן הלקוח את הסכמתו לאותה פעולה מראש ובכתב.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">4. מתן השירות באמצעי תקשורת</h4>
                                    <p><strong>4.1</strong> הלקוח נותן את הסכמתו לקבל את השירות גם באמצעות הטלפון, פקסימיליה ו/או דואר אלקטרוני. הלקוח מקבל על עצמו מראש את כל הסיכונים הנובעים מטעות במסירה או בהבנה כתוצאה ממתן שירותים באמצעי התקשורת.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">5. שירותי ביצוע</h4>
                                    <p><strong>5.1</strong> היועץ יעניק ללקוח, לפי בקשתו, שירות ביצוע של עסקות בניירות ערך ו/או בנכסים פיננסיים בחשבון הלקוח, בהתאם להוראות ביצוע אותן ימסור הלקוח ליועץ.</p>
                                    <p><strong>5.2</strong> הלקוח מצהיר בזאת, כי כל פעולה שתבוצע ע"י היועץ לפי הוראת הלקוח, הינה על אחריות הלקוח בלבד.</p>
                                    <p><strong>5.4</strong> ידוע ללקוח - כי היועץ הינו גוף נפרד מהבנק ולכן אינו מוסמך או רשאי לחייב את הבנק בביצוע כל פעולה.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">6. התמורה</h4>
                                    <p><strong>6.1-6.2</strong> בתמורה למתן השירות, ישלם הלקוח ליועץ תשלום חד פעמי כמפורט בהסכם, בתוספת מע"מ. זכאות היועץ לתשלום הנה החל ממועד חתימת ההסכם ועד לביטולו.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">7. אחריות</h4>
                                    <p><strong>7.1</strong> שירותי ייעוץ ההשקעות מתבססים על נתונים גלויים לציבור וידועים ליועץ במועד מתן השירות. השירות הינו נכון למועד נתינתו בלבד. היועץ לא יהיה אחראי לשלמותם, נכונותם או דיוקם של הנתונים.</p>
                                    <p><strong>7.3</strong> ידוע ללקוח כי אין במתן השירות משום התחייבות להשיג רווח מינימאלי או לבטח את הלקוח מפני הפסדים.</p>
                                    <p><strong>7.4</strong> הלקוח מסכים כי היועץ יהיה פטור מכל אחריות בגין נזק, הפסד או הוצאות שייגרמו ללקוח, ובלבד שהיועץ לא הפר את חובת האמון ולא פעל בזדון או ברשלנות רבתי.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">8. סיכונים</h4>
                                    <p><strong>8.1</strong> ידוע ללקוח כי בפעילות בתחום השקעות בניירות ערך ו/או בנכסים פיננסיים כרוכים סיכונים רבים, לרבות הפסד כספי, ואין וודאות לגבי אופן התנהלות ניירות הערך.</p>
                                    <p><strong>8.2</strong> היועץ אינו מתחייב שהתחזיות והערכות יתממשו או שעסקה תניב תוצאות או תשואות מסוימות.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">9. סודיות ואיסור העברה לצדדים שלישיים</h4>
                                    <p><strong>9.1</strong> היועץ ישמור בסודיות כל מידע ביחס ללקוח, לחשבונותיו, להשקעותיו, ולא יעשה בהם שימוש אלא לצורך מתן השירות.</p>
                                    <p><strong>9.5</strong> ידוע ללקוח כי השירות ניתן לו בלבד ואין מטרתו כי הלקוח יעביר את המידע לצדדים שלישיים. הלקוח מתחייב לא לשכפל, לצלם, לפרסם או להעביר את המידע שקיבל במסגרת השירות.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">10. תקופת ההתקשרות</h4>
                                    <p><strong>10.1</strong> הסכם זה תקף ל-12 חודשים ותקופתו מתחילה לאחר חתימתו על ידי הצדדים, ו/או עד שיבוטל על ידי אחד הצדדים. כל אחד מהצדדים רשאי לבטל הסכם זה בכל עת ע"י מתן הודעה בכתב.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">11. מיסוי ותשלומי חובה</h4>
                                    <p><strong>11.1-11.2</strong> הלקוח יישא בכל תשלומי המס והשירות אינו כולל ייעוץ בנושאים הקשורים במס.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">12. הקלטות ורישומים</h4>
                                    <p><strong>12.1</strong> הלקוח מודע לכך שהיועץ עשוי להקליט את שיחותיו לצורך תיעוד ושיפור השירות, והוא נותן את הסכמתו לכך.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 text-base mb-2">13. שונות</h4>
                                    <p><strong>13.2</strong> תנאי הסכם זה משקפים את המותנה בין הצדדים במלואו וכל שינוי חייב להיעשות בכתב ובחתימת הצדדים.</p>
                                    <p><strong>13.6</strong> כל עניין הקשור בהסכם זה יתפרש ויידון על פי הדין הישראלי. מקום השיפוט הייחודי נקבע בבית המשפט המוסמך בתל אביב.</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                                <p className="text-amber-900 font-medium mb-0">
                                    על ידי חתימה על הסכם זה, הלקוח מצהיר כי קרא והבין את כל סעיפי ההסכם המפורטים לעיל, 
                                    לרבות תנאי השירות, חובות היועץ והלקוח, הסיכונים הכרוכים בהשקעות, 
                                    ואת כל ההגבלות והתנאים החלים על מתן השירות.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Annex A: Client Needs Assessment */}
                    <Card>
                        <CardHeader>
                            <CardTitle>נספח א': בירור צרכי הלקוח ומדיניות ההשקעות</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <h4 className="font-medium text-slate-800">פרטים אודות מצבו הכלכלי והעדפותיו של הלקוח:</h4>

                            {/* Question 1 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">1. מהי ההכנסה הכוללת החודשית למשק הבית? *</Label>
                                <RadioGroup value={formData.q1_monthly_income} onValueChange={(v) => updateField('q1_monthly_income', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q1_a" />
                                        <Label htmlFor="q1_a">עד 5 אלפים ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q1_b" />
                                        <Label htmlFor="q1_b">בין 5 אלפים ₪ עד 10 אלפים ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q1_c" />
                                        <Label htmlFor="q1_c">בין 10 אלפים ₪ ל-40 אלפים ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="d" id="q1_d" />
                                        <Label htmlFor="q1_d">בין 40 אלפים ₪ ל-100 אלפים ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="e" id="q1_e" />
                                        <Label htmlFor="q1_e">מעל 100 אלפים ₪</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 2 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">2. מהו השווי המוערך של כלל החסכונות והנכסים שלך? *</Label>
                                <RadioGroup value={formData.q2_asset_value} onValueChange={(v) => updateField('q2_asset_value', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q2_a" />
                                        <Label htmlFor="q2_a">אין לי נכסים ו/או חסכונות כלשהם</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q2_b" />
                                        <Label htmlFor="q2_b">עד 100,000 ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q2_c" />
                                        <Label htmlFor="q2_c">בין 100,000 ₪ ל-400,000 ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="d" id="q2_d" />
                                        <Label htmlFor="q2_d">בין 400,000 ₪ ל-1,000,000 ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="e" id="q2_e" />
                                        <Label htmlFor="q2_e">מעל 1,000,000 ₪</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 3 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">3. מהו השווי המוערך של כלל ההתחייבויות וההוצאות שלך? *</Label>
                                <RadioGroup value={formData.q3_liability_value} onValueChange={(v) => updateField('q3_liability_value', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q3_a" />
                                        <Label htmlFor="q3_a">אין לי התחייבויות</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q3_b" />
                                        <Label htmlFor="q3_b">עד 100,000 ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q3_c" />
                                        <Label htmlFor="q3_c">בין 100,000 ₪ ל-400,000 ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="d" id="q3_d" />
                                        <Label htmlFor="q3_d">בין 400,000 ₪ ל-1,000,000 ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="e" id="q3_e" />
                                        <Label htmlFor="q3_e">מעל 1,000,000 ₪</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 4 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">4. האם יש לך יותר נכסים מהתחייבויות או להיפך? אנא פרט: *</Label>
                                <Textarea
                                    value={formData.q4_assets_vs_liabilities}
                                    onChange={(e) => updateField('q4_assets_vs_liabilities', e.target.value)}
                                    placeholder="לדוגמה: הבית שווה יותר מההתחייבויות שלנו"
                                    required
                                />
                            </div>

                            {/* Question 5 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">5. האם יש לך הוצאות חד פעמיות צפויות? *</Label>
                                <RadioGroup value={formData.q5_one_time_expenses} onValueChange={(v) => updateField('q5_one_time_expenses', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q5_a" />
                                        <Label htmlFor="q5_a">לא</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q5_b" />
                                        <Label htmlFor="q5_b">כן, עד 15 אלפי ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q5_c" />
                                        <Label htmlFor="q5_c">כן, בין 15 אלפי ₪ ל-50 אלפי ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="d" id="q5_d" />
                                        <Label htmlFor="q5_d">כן, בין 50 אלפי ₪ ל-100 אלפי ₪</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="e" id="q5_e" />
                                        <Label htmlFor="q5_e">כן, מעל 100 אלפי ₪</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 6 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">6. מהו השיעור שמהווה הסכום להשקעה מסך הנכסים הפיננסיים? *</Label>
                                <RadioGroup value={formData.q6_investment_ratio} onValueChange={(v) => updateField('q6_investment_ratio', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q6_a" />
                                        <Label htmlFor="q6_a">פחות מ-15%</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q6_b" />
                                        <Label htmlFor="q6_b">בין 15%-40%</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q6_c" />
                                        <Label htmlFor="q6_c">בין 40%-70%</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="d" id="q6_d" />
                                        <Label htmlFor="q6_d">יותר מ-70%</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 7 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">7. תקופת ההשקעה הצפויה *</Label>
                                <RadioGroup value={formData.q7_investment_period} onValueChange={(v) => updateField('q7_investment_period', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q7_a" />
                                        <Label htmlFor="q7_a">עד שנתיים</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q7_b" />
                                        <Label htmlFor="q7_b">בין שנתיים לחמש שנים</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q7_c" />
                                        <Label htmlFor="q7_c">מעל חמש שנים</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 8 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">8. מהי המטרה העיקרית של ההשקעה שלך? *</Label>
                                <RadioGroup value={formData.q8_investment_goal} onValueChange={(v) => updateField('q8_investment_goal', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q8_a" />
                                        <Label htmlFor="q8_a">לחסוך לצורך רכישה עתידית גדולה</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q8_b" />
                                        <Label htmlFor="q8_b">לחסוך לגיל פרישה</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q8_c" />
                                        <Label htmlFor="q8_c">לחסוך למען הבטחת עתיד משפחתי/ילדיי</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="d" id="q8_d" />
                                        <Label htmlFor="q8_d">אחר</Label>
                                    </div>
                                </RadioGroup>
                                {formData.q8_investment_goal === 'd' && (
                                    <Input
                                        value={formData.q8_other_goal}
                                        onChange={(e) => updateField('q8_other_goal', e.target.value)}
                                        placeholder="פרט את מטרת ההשקעה"
                                    />
                                )}
                            </div>

                            <h4 className="font-medium text-slate-800 pt-4">פרטים אודות ניסיונו וידעו של הלקוח בשוק ההון:</h4>

                            {/* Question 9 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">9. מה הניסיון ו/או הידע המקצועי שלך בשוק ההון? *</Label>
                                <RadioGroup value={formData.q9_market_knowledge} onValueChange={(v) => updateField('q9_market_knowledge', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q9_a" />
                                        <Label htmlFor="q9_a">אין לי ניסיון ו/או ידע מקצועי</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q9_b" />
                                        <Label htmlFor="q9_b">יש לי ניסיון ו/או ידע בסיסי</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q9_c" />
                                        <Label htmlFor="q9_c">יש לי ניסיון ו/או ידע ברמה בינונית</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="d" id="q9_d" />
                                        <Label htmlFor="q9_d">בעל ניסיון וידע רחבים שנצברו במהלך השנים</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 10 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">10. מהי מידת ההיכרות שלך עם מכשירים פיננסיים? *</Label>
                                <RadioGroup value={formData.q10_financial_instruments_knowledge} onValueChange={(v) => updateField('q10_financial_instruments_knowledge', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q10_a" />
                                        <Label htmlFor="q10_a">אין לי היכרות</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q10_b" />
                                        <Label htmlFor="q10_b">אני מכיר אבל אין לי ניסיון</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q10_c" />
                                        <Label htmlFor="q10_c">יש לי ניסיון מסוים</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="d" id="q10_d" />
                                        <Label htmlFor="q10_d">יש לי ניסיון רב</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <h4 className="font-medium text-slate-800 pt-4">פרטים אודות יחסו של הלקוח לסיכון:</h4>

                            {/* Question 11 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">11. מה מידת הסבלנות שלך כלפי סיכון? *</Label>
                                <RadioGroup value={formData.q11_risk_tolerance} onValueChange={(v) => updateField('q11_risk_tolerance', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q11_a" />
                                        <Label htmlFor="q11_a">סבלנות נמוכה מאוד</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q11_b" />
                                        <Label htmlFor="q11_b">סבלנות נמוכה</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q11_c" />
                                        <Label htmlFor="q11_c">סבלנות בינונית</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="d" id="q11_d" />
                                        <Label htmlFor="q11_d">סבלנות גבוהה</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Question 12 */}
                            <div className="space-y-3">
                                <Label className="text-base font-medium">12. כיצד תגיב להפסד של 15% בהשקעתך? *</Label>
                                <RadioGroup value={formData.q12_reaction_to_loss} onValueChange={(v) => updateField('q12_reaction_to_loss', v)}>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="a" id="q12_a" />
                                        <Label htmlFor="q12_a">אמכור מיד הכל</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="b" id="q12_b" />
                                        <Label htmlFor="q12_b">אהיה מוטרד</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="c" id="q12_c" />
                                        <Label htmlFor="q12_c">אצפה תנודתיות לטווח קצר</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="d" id="q12_d" />
                                        <Label htmlFor="q12_d">אצפה תנודתיות ארוכת טווח ואהיה רגוע</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Digital Signature */}
                    <Card>
                        <CardHeader>
                            <CardTitle>חתימה דיגיטלית</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label>הזן את שמך המלא *</Label>
                                <Input
                                    value={signature}
                                    onChange={(e) => setSignature(e.target.value)}
                                    placeholder="שם מלא"
                                    required
                                    className="text-xl"
                                />
                            </div>
                            
                            <div>
                                <Label>חתום עם העכבר או המגע *</Label>
                                <SignaturePad onSave={setSignatureImage} />
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-sm text-amber-900">
                                    <strong>הצהרה:</strong> על ידי חתימה על הסכם זה, אני מצהיר כי קראתי והבנתי את כל תנאי ההסכם,
                                    לרבות כל הסיכונים הכרוכים בהשקעות, ואני מסכים לכל האמור בו.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 text-lg bg-gradient-to-r from-sky-500 to-blue-600"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                                שולח הסכם...
                            </>
                        ) : (
                            <>
                                <Mail className="h-5 w-5 ml-2" />
                                שלח הסכם
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
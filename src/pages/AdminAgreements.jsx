import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, FileText, ArrowRight, Calendar, User, Mail, Trash2 } from "lucide-react";
import { createPageUrl } from '@/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

export default function AdminAgreements() {
    const [agreements, setAgreements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, agreementId: null, name: null });

    useEffect(() => {
        checkUserAndLoadAgreements();
    }, []);

    const checkUserAndLoadAgreements = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            // Check if user is admin
            if (currentUser.role !== 'admin') {
                window.location.href = createPageUrl('Home');
                return;
            }
            
            // Load agreements
            const allAgreements = await base44.entities.Agreement.list('-created_date');
            setAgreements(allAgreements);
        } catch (error) {
            console.error('Error loading data:', error);
            base44.auth.redirectToLogin(createPageUrl('AdminAgreements'));
        }
        setIsLoading(false);
    };

    const handleDeleteAgreement = async () => {
        if (!deleteDialog.agreementId) return;

        try {
            // Delete the specific agreement
            await base44.entities.Agreement.delete(deleteDialog.agreementId);

            // Delete risk profiles linked to this agreement
            const riskProfiles = await base44.entities.RiskProfile.filter({ 
                agreement_id: deleteDialog.agreementId 
            });
            if (riskProfiles && riskProfiles.length > 0) {
                await Promise.all(riskProfiles.map(profile => 
                    base44.entities.RiskProfile.delete(profile.id)
                ));
            }

            // Reload data
            await checkUserAndLoadAgreements();
            setDeleteDialog({ open: false, agreementId: null, name: null });
        } catch (error) {
            console.error('Error deleting agreement:', error);
            alert('שגיאה במחיקת ההסכם');
        }
    };

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

    const downloadAgreementPDF = async (agreement) => {
        setIsGeneratingPDF(agreement.id);
        
        try {
            // Create a temporary div to render the agreement content
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = '800px';
            tempDiv.style.padding = '40px';
            tempDiv.style.backgroundColor = 'white';
            tempDiv.style.fontFamily = 'Arial, sans-serif';
            tempDiv.dir = 'rtl';
            
            tempDiv.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #0066cc; font-size: 28px; margin-bottom: 10px;">הסכם ייעוץ השקעות</h1>
                    <h2 style="color: #666; font-size: 18px;">יפתח ונגר יעוץ עסקי</h2>
                </div>
                
                <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-right: 5px solid #0066cc;">
                    <h3 style="color: #0066cc; margin-top: 0;">פרטי היועץ</h3>
                    <p style="margin: 5px 0;"><strong>שם:</strong> יפתח ונגר</p>
                    <p style="margin: 5px 0;"><strong>ת.ז.:</strong> 034025197</p>
                    <p style="margin: 5px 0;"><strong>כתובת:</strong> נחל תבור 6, מודיעין</p>
                    <p style="margin: 5px 0;"><strong>דוא"ל:</strong> iftach.venger@gmail.com</p>
                    <p style="margin: 5px 0;"><strong>טלפון:</strong> 050-3976397</p>
                </div>
                
                <div style="background: #fff8dc; padding: 20px; margin: 20px 0; border-right: 5px solid #ffa500;">
                    <h3 style="color: #ff8800; margin-top: 0;">פרטי הלקוח</h3>
                    <p style="margin: 5px 0;"><strong>שם מלא:</strong> ${agreement.client_full_name}</p>
                    <p style="margin: 5px 0;"><strong>ת.ז./ח.פ.:</strong> ${agreement.client_id}</p>
                    <p style="margin: 5px 0;"><strong>כתובת:</strong> ${agreement.client_address}</p>
                    <p style="margin: 5px 0;"><strong>דוא"ל:</strong> ${agreement.client_email}</p>
                    <p style="margin: 5px 0;"><strong>תאריך חתימה:</strong> ${agreement.date_signed}</p>
                    <p style="margin: 5px 0;"><strong>דמי ניהול:</strong> ${agreement.management_fee_nis} ₪ + מע"מ</p>
                </div>
                
                <hr style="border: 0; border-top: 2px solid #e0e0e0; margin: 30px 0;" />
                
                <div style="background: #e8f4f8; padding: 20px; margin: 20px 0; border: 2px solid #0066cc;">
                    <h3 style="color: #0066cc; margin-top: 0; font-size: 20px;">מבוא והצהרות</h3>
                    <p style="line-height: 1.8; margin: 10px 0;">הואיל והלקוח מעוניין לקבל, החל ממועד חתימת הסכם זה, שירותי ייעוץ השקעות מהיועץ כמפורט בהסכם זה;</p>
                    <p style="line-height: 1.8; margin: 10px 0;">והואיל והיועץ הינו בעל רישיון ייעוץ השקעות, בהתאם לחוק הסדרת העיסוק בייעוץ השקעות, בשיווק השקעות ובניהול תיקי השקעות, תשנ"ה-1995;</p>
                    <p style="line-height: 1.8; margin: 10px 0;">והואיל והיועץ מצהיר כי בידו הכושר, היכולת והידע, לספק את שירותי ייעוץ ההשקעות;</p>
                    <p style="line-height: 1.8; margin: 10px 0;">והואיל וברצון הצדדים להסדיר את מערכת היחסים ביניהם, בהתאם להוראות כל דין;</p>
                    <p style="font-weight: bold; line-height: 1.8; margin: 10px 0;">לפיכך הוסכם הותנה והוצהר בין הצדדים כדלקמן:</p>
                </div>
                
                <div style="padding: 20px; margin: 20px 0; background: white;">
                    <h3 style="color: #0066cc; margin-bottom: 15px;">תנאי ההסכם</h3>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">1. כללי</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>1.1</strong> המבוא להסכם זה והנספחים לו מהווים חלק בלתי נפרד ממנו.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>1.2</strong> כותרות סעיפי הסכם זה הינן לצרכי נוחות בלבד.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>1.3</strong> למונחים המפורטים בהסכם זה תהא המשמעות בהתאם לחוק הייעוץ.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">2. הגדרות</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>"בנק"</strong> - כמשמעות המונח בחוק הבנקאות (רישוי), לרבות תאגידים בנקאיים.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>"ייעוץ השקעות"</strong> - מתן ייעוץ לאחרים בנוגע לכדאיות של השקעה, החזקה, קניה או מכירה של ניירות ערך.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>"נכסים פיננסיים"</strong> - יחידות כהגדרתן בחוק השקעות משותפות בנאמנות, מניות, אופציות, חוזים עתידיים.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>"ניירות ערך"</strong> - כהגדרתם בסעיף 1 לחוק ניירות ערך, התשכ"ח-1968.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">3. ההתקשרות בין הצדדים</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>3.1</strong> הלקוח מורה ליועץ ומסמיך אותו לספק לו שירותי ייעוץ השקעות.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>3.2</strong> היועץ יספק את שירותי ייעוץ ההשקעות ללקוח תוך התאמה לצרכיו.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>3.5</strong> הלקוח מאשר כי הפרטים בטופס ליבון צרכים הינם נכונים ומלאים.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>3.6</strong> הלקוח מתחייב להודיע ליועץ על כל שינוי בפרטים.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>3.11</strong> היועץ חב חובת נאמנות ללקוח ומתחייב לפעול לטובתו באמונה.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>3.13</strong> היועץ לא יהיה רשאי לבצע פעולה ללא הרשאה מפורשת מהלקוח.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>3.14</strong> היועץ ימנע מניגוד עניינים ויודיע ללקוח על כל אפשרות כזו.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">4. מתן השירות באמצעי תקשורת</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>4.1</strong> הלקוח נותן הסכמה לקבל את השירות באמצעות טלפון, פקס ודואר אלקטרוני.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">5. שירותי ביצוע</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>5.1</strong> היועץ יעניק ללקוח שירות ביצוע עסקאות לפי בקשתו.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>5.2</strong> כל פעולה שתבוצע לפי הוראת הלקוח הינה על אחריות הלקוח בלבד.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">6. התמורה</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>6.1-6.2</strong> בתמורה למתן השירות, ישלם הלקוח תשלום חד פעמי כמפורט בהסכם בתוספת מע"מ.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">7. אחריות</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>7.1</strong> השירות מתבסס על נתונים גלויים לציבור והינו נכון למועד נתינתו בלבד.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>7.3</strong> אין במתן השירות התחייבות להשיג רווח או לבטח מפני הפסדים.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>7.4</strong> היועץ יהיה פטור מאחריות בגין נזק, בתנאי שלא הפר חובת אמון ולא פעל בזדון.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">8. סיכונים</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>8.1</strong> בפעילות בתחום השקעות כרוכים סיכונים רבים לרבות הפסד כספי.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>8.2</strong> היועץ אינו מתחייב שתחזיות יתממשו או שעסקה תניב תוצאות מסוימות.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">9. סודיות</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>9.1</strong> היועץ ישמור בסודיות כל מידע ביחס ללקוח ולא יעשה בו שימוש אלא לצורך השירות.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>9.5</strong> הלקוח מתחייב לא לשכפל או להעביר את המידע שקיבל במסגרת השירות.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">10. תקופת ההתקשרות</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>10.1</strong> הסכם זה תקף ל-12 חודשים וניתן לביטול בכל עת ע"י מתן הודעה בכתב.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">11. מיסוי</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>11.1-11.2</strong> הלקוח יישא בכל תשלומי המס והשירות אינו כולל ייעוץ מס.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">12. הקלטות</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>12.1</strong> היועץ עשוי להקליט שיחות לצורך תיעוד והלקוח נותן הסכמתו.</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h4 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">13. שונות</h4>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>13.2</strong> תנאי הסכם זה משקפים את המוסכם במלואו וכל שינוי חייב להיעשות בכתב.</p>
                        <p style="margin: 8px 0; line-height: 1.6;"><strong>13.6</strong> כל עניין יתפרש על פי הדין הישראלי ומקום השיפוט בתל אביב.</p>
                    </div>
                </div>
                
                <hr style="border: 0; border-top: 2px solid #e0e0e0; margin: 30px 0;" />
                
                <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; page-break-inside: avoid;">
                    <h3 style="color: #0066cc; margin-top: 0;">תשובות הלקוח - נספח א'</h3>
                    
                    <h4 style="color: #333; margin-top: 20px;">מצב כלכלי והעדפות:</h4>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>1. הכנסה חודשית:</strong> ${getAnswerText('q1_monthly_income', agreement.q1_monthly_income)}</p>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>2. שווי נכסים:</strong> ${getAnswerText('q2_asset_value', agreement.q2_asset_value)}</p>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>3. שווי התחייבויות:</strong> ${getAnswerText('q3_liability_value', agreement.q3_liability_value)}</p>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>4. נכסים מול התחייבויות:</strong> ${agreement.q4_assets_vs_liabilities}</p>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>5. הוצאות חד פעמיות:</strong> ${getAnswerText('q5_one_time_expenses', agreement.q5_one_time_expenses)}</p>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>6. שיעור השקעה:</strong> ${getAnswerText('q6_investment_ratio', agreement.q6_investment_ratio)}</p>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>7. תקופת השקעה:</strong> ${getAnswerText('q7_investment_period', agreement.q7_investment_period)}</p>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>8. מטרת ההשקעה:</strong> ${getAnswerText('q8_investment_goal', agreement.q8_investment_goal)}${agreement.q8_other_goal ? ` - ${agreement.q8_other_goal}` : ''}</p>
                    
                    <h4 style="color: #333; margin-top: 25px;">ניסיון וידע:</h4>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>9. ידע בשוק ההון:</strong> ${getAnswerText('q9_market_knowledge', agreement.q9_market_knowledge)}</p>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>10. היכרות עם מכשירים:</strong> ${getAnswerText('q10_financial_instruments_knowledge', agreement.q10_financial_instruments_knowledge)}</p>
                    
                    <h4 style="color: #333; margin-top: 25px;">יחס לסיכון:</h4>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>11. סבלנות לסיכון:</strong> ${getAnswerText('q11_risk_tolerance', agreement.q11_risk_tolerance)}</p>
                    <p style="margin: 8px 0; padding: 8px; background: white;"><strong>12. תגובה להפסד:</strong> ${getAnswerText('q12_reaction_to_loss', agreement.q12_reaction_to_loss)}</p>
                </div>
                
                <div style="border: 3px solid #0066cc; padding: 25px; margin: 30px 0; text-align: center; background: #f0f8ff; page-break-inside: avoid;">
                    <h3 style="color: #0066cc; margin-top: 0;">חתימת הלקוח</h3>
                    <p style="font-size: 18px; margin: 15px 0;"><strong>שם החותם:</strong> ${agreement.signature_name}</p>
                    <p style="margin: 15px 0;"><strong>חתימה דיגיטלית:</strong></p>
                    <img src="${agreement.signature_url}" alt="חתימה" style="max-width: 300px; border: 2px solid #0066cc; margin: 10px auto; display: block;" />
                    <p style="margin: 15px 0; color: #666;"><strong>תאריך החתימה:</strong> ${agreement.date_signed}</p>
                </div>
            `;
            
            document.body.appendChild(tempDiv);
            
            // Convert to canvas
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            // Remove temp div
            document.body.removeChild(tempDiv);
            
            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save(`הסכם_${agreement.client_full_name}_${agreement.date_signed}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('אירעה שגיאה ביצירת ה-PDF');
        }
        
        setIsGeneratingPDF(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 p-6" dir="rtl">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">ניהול הסכמי שירות</h1>
                        <p className="text-slate-600">כל ההסכמים שנחתמו על ידי לקוחות</p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => window.location.href = createPageUrl('Home')}
                        className="text-slate-600 hover:text-blue-600"
                    >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        חזור לדף הבית
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-sky-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">סך הכל הסכמים</p>
                                    <p className="text-2xl font-bold text-slate-800">{agreements.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">החודש</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {agreements.filter(a => {
                                            const agreementDate = new Date(a.created_date);
                                            const now = new Date();
                                            return agreementDate.getMonth() === now.getMonth() && 
                                                   agreementDate.getFullYear() === now.getFullYear();
                                        }).length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">לקוחות פעילים</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {new Set(agreements.map(a => a.client_email)).size}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Agreements List */}
                <div className="space-y-4">
                    {agreements.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-slate-600">אין הסכמים עדיין</p>
                            </CardContent>
                        </Card>
                    ) : (
                        agreements.map((agreement) => (
                            <Card key={agreement.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl mb-2">{agreement.client_full_name}</CardTitle>
                                            <div className="space-y-1 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    <span>{agreement.client_email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>תאריך חתימה: {new Date(agreement.date_signed).toLocaleDateString('he-IL')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span>דמי ניהול: {agreement.management_fee_nis} ₪ + מע"מ</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => downloadAgreementPDF(agreement)}
                                                disabled={isGeneratingPDF === agreement.id}
                                                className="bg-gradient-to-r from-sky-500 to-blue-600"
                                            >
                                                {isGeneratingPDF === agreement.id ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                                        מייצר PDF...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-4 w-4 ml-2" />
                                                        הורד PDF
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => setDeleteDialog({ 
                                                    open: true, 
                                                    agreementId: agreement.id,
                                                    name: agreement.client_full_name 
                                                })}
                                                variant="destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-500 mb-1">רמת סיכון</p>
                                            <p className="font-medium">{getAnswerText('q11_risk_tolerance', agreement.q11_risk_tolerance)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 mb-1">תקופת השקעה</p>
                                            <p className="font-medium">{getAnswerText('q7_investment_period', agreement.q7_investment_period)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 mb-1">ידע בשוק</p>
                                            <p className="font-medium">{getAnswerText('q9_market_knowledge', agreement.q9_market_knowledge)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 mb-1">ת.ז. / ח.פ.</p>
                                            <p className="font-medium">{agreement.client_id}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, agreementId: null, name: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>מחיקת הסכם</AlertDialogTitle>
                        <AlertDialogDescription className="text-right space-y-2">
                            <p>האם אתה בטוח שברצונך למחוק את ההסכם של:</p>
                            <p className="font-bold text-slate-900">{deleteDialog.name}</p>
                            <p className="text-red-600 font-medium mt-4">פעולה זו תמחק:</p>
                            <ul className="list-disc list-inside text-red-600">
                                <li>את ההסכם הספציפי</li>
                                <li>את טפסי רמות הסיכון המקושרים להסכם זה</li>
                            </ul>
                            <p className="text-red-600 font-bold mt-2">לא ניתן לשחזר נתונים אלו!</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAgreement} className="bg-red-600 hover:bg-red-700">
                            מחק הסכם
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
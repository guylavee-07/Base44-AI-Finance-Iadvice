import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, PiggyBank, LineChart, Shield, CheckCircle, MessageCircle, Phone, Mail, Loader2 } from "lucide-react";
import { createPageUrl } from '@/utils';

export default function Landing() {
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const phoneNumber = '972503976397'; // 050-3976397 in international format
    const whatsappMessage = encodeURIComponent('שלום אשמח לשמוע פרטים נוספים..');
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await base44.integrations.Core.SendEmail({
                to: 'iftach.venger@gmail.com',
                subject: `פנייה חדשה מדף הנחיתה - ${formData.name}`,
                body: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2 style="color: #0066cc;">פנייה חדשה מדף הנחיתה</h2>
                        <p><strong>שם:</strong> ${formData.name}</p>
                        <p><strong>אימייל:</strong> ${formData.email}</p>
                        <p style="margin-top: 20px; color: #666;">פנייה זו נשלחה מדף הנחיתה של המערכת.</p>
                    </div>
                `
            });

            setIsSubmitted(true);
            setFormData({ name: '', email: '' });
        } catch (error) {
            console.error('Error sending form:', error);
            alert('אירעה שגיאה בשליחת הטופס. אנא נסה שוב.');
        }

        setIsSubmitting(false);
    };

    const features = [
        {
            icon: TrendingUp,
            title: "ייעוץ השקעות מקצועי",
            description: "קבל המלצות השקעה מותאמות אישית מיועץ מוסמך עם ניסיון רב"
        },
        {
            icon: PiggyBank,
            title: "תכנון פיננסי חכם",
            description: "בנה אסטרטגיית חסכון והשקעה מותאמת למטרות שלך"
        },
        {
            icon: LineChart,
            title: "ניתוח שוק מתקדם",
            description: "קבל תובנות ועדכונים על מגמות בשוק ההון והמשק"
        },
        {
            icon: Shield,
            title: "ביטחון ושקיפות",
            description: "עבודה לפי התקנים הגבוהים ביותר ותחת פיקוח רשות ניירות ערך"
        }
    ];

    const benefits = [
        "ייעוץ אישי והתאמה למטרות שלך",
        "גישה למערכת AI מתקדמת לניתוח השקעות",
        "מעקב שוטף ועדכונים בזמן אמת",
        "שירות זמין ומקצועי",
        "רישיון מרשות ניירות ערך"
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20" dir="rtl">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-l from-blue-600 via-sky-500 to-blue-400 text-white py-20">
                <div className="absolute inset-0 bg-grid-white/10"></div>
                <div className="max-w-6xl mx-auto px-4 relative">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h1 className="text-5xl font-bold leading-tight">
                                יפתח ונגר
                                <br />
                                יעוץ עסקי והשקעות
                            </h1>
                            <p className="text-xl text-blue-50">
                                ייעוץ השקעות מקצועי ואישי בשילוב טכנולוגיית AI מתקדמת
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => window.location.href = whatsappLink}
                                    className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6"
                                >
                                    <MessageCircle className="ml-2 h-5 w-5" />
                                    דברו איתנו בוואטסאפ
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => window.location.href = createPageUrl('Home')}
                                    className="bg-white text-slate-900 hover:bg-blue-50 text-lg px-8 py-6"
                                >
                                    כניסה למערכת
                                </Button>
                            </div>
                        </div>
                        <div className="hidden md:flex justify-center">
                            <div className="w-80 h-80 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-4 border-white/20">
                                <TrendingUp className="w-40 h-40 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-6xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-slate-800 mb-4">
                        למה לבחור בנו?
                    </h2>
                    <p className="text-xl text-slate-600">
                        שירות ייעוץ מקצועי ומותאם אישית
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {features.map((feature, index) => (
                        <Card key={index} className="border-2 hover:border-sky-300 transition-all hover:shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                                        <feature.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-slate-600">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Benefits List */}
                <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200 mb-16">
                    <CardContent className="p-8">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                            מה תקבלו בשירות שלנו?
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                                    <span className="text-slate-700 text-lg">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Form & WhatsApp Section */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Form */}
                    <Card className="border-2 border-blue-200">
                        <CardContent className="p-8">
                            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Mail className="h-6 w-6 text-blue-600" />
                                השאירו פרטים ונחזור אליכם
                            </h3>
                            
                            {isSubmitted ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                    <p className="text-lg text-green-600 font-medium">
                                        תודה! פנייתך נשלחה בהצלחה
                                    </p>
                                    <p className="text-slate-600 mt-2">
                                        נחזור אליך בהקדם
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label>שם מלא *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="הזן את שמך"
                                            className="text-lg"
                                        />
                                    </div>
                                    <div>
                                        <Label>אימייל *</Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            placeholder="your@email.com"
                                            className="text-lg"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-lg py-6"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                                                שולח...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="h-5 w-5 ml-2" />
                                                שלח פנייה
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* WhatsApp CTA */}
                    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardContent className="p-8 flex flex-col justify-center h-full">
                            <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <MessageCircle className="h-6 w-6 text-green-600" />
                                מעדיפים וואטסאפ?
                            </h3>
                            <p className="text-slate-600 mb-6 text-lg">
                                דברו איתנו ישירות ונענה לכל שאלה
                            </p>
                            <Button
                                size="lg"
                                onClick={() => window.open(whatsappLink, '_blank')}
                                className="w-full bg-green-600 hover:bg-green-700 text-lg py-6 mb-4"
                            >
                                <MessageCircle className="ml-2 h-6 w-6" />
                                פתח שיחה בוואטסאפ
                            </Button>
                            <div className="flex items-center justify-center gap-2 text-slate-600">
                                <Phone className="h-5 w-5" />
                                <span className="text-lg font-medium">050-3976397</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* About Section */}
                <Card className="mt-16 bg-slate-50 border-slate-200">
                    <CardContent className="p-8">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                            אודות יפתח ונגר יעוץ עסקי
                        </h3>
                        <p className="text-slate-600 text-lg leading-relaxed mb-4">
                            אנחנו מספקים שירותי ייעוץ השקעות והתכנון פיננסי מקצועי תחת פיקוח רשות ניירות ערך. 
                            המערכת שלנו משלבת ייעוץ אישי מיועץ מוסמך עם טכנולוגיית בינה מלאכותית מתקדמת, 
                            המאפשרת ניתוח מעמיק ומענה מהיר לצרכים שלכם.
                        </p>
                        <p className="text-slate-600 text-lg leading-relaxed">
                            בין אם אתם משקיעים מתחילים או מנוסים, אנחנו כאן כדי לעזור לכם לקבל החלטות 
                            מושכלות ולבנות עתיד פיננסי בטוח.
                        </p>
                        <div className="mt-6 text-center">
                            <a 
                                href="https://iadvice.co.il/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 font-medium text-lg hover:underline"
                            >
                                בקרו באתר שלנו →
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="bg-slate-800 text-white py-8 mt-16">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="text-slate-300">
                        © 2025 יפתח ונגר יעוץ עסקי | כל הזכויות שמורות
                    </p>
                    <p className="text-slate-400 mt-2">
                        📧 iftach.venger@gmail.com | 📞 050-3976397
                    </p>
                </div>
            </div>
        </div>
    );
}
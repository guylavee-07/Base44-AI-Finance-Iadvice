import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from '@/api/base44Client';
import { Target, TrendingUp, Calculator, Loader2, ArrowRight } from "lucide-react";

export default function FinancialModels({ onAnalysisComplete }) {
    const [activeTab, setActiveTab] = useState("swot");
    const [isLoading, setIsLoading] = useState(false);

    // SWOT State
    const [swotData, setSwotData] = useState({
        businessName: '',
        industry: '',
        strengths: '',
        weaknesses: '',
        opportunities: '',
        threats: ''
    });

    // Cash Flow State
    const [cashFlowData, setCashFlowData] = useState({
        businessName: '',
        currentRevenue: '',
        expectedGrowth: '',
        fixedCosts: '',
        variableCosts: '',
        initialInvestment: '',
        forecastMonths: '12'
    });

    // Break Even State
    const [breakEvenData, setBreakEvenData] = useState({
        productName: '',
        sellingPrice: '',
        variableCostPerUnit: '',
        fixedCosts: '',
        targetProfit: ''
    });

    const analyzeSwot = async () => {
        setIsLoading(true);
        const prompt = `בצע ניתוח SWOT מקיף עבור העסק הבא:
        
שם העסק: ${swotData.businessName}
תחום פעילות: ${swotData.industry}

נתונים שהוזנו:
- חוזקות: ${swotData.strengths}
- חולשות: ${swotData.weaknesses}
- הזדמנויות: ${swotData.opportunities}
- איומים: ${swotData.threats}

אנא ספק:
1. ניתוח מעמיק של כל קטגוריה
2. אסטרטגיות SO (ניצול חוזקות להזדמנויות)
3. אסטרטגיות WO (התגברות על חולשות דרך הזדמנויות)
4. אסטרטגיות ST (שימוש בחוזקות להתמודדות עם איומים)
5. אסטרטגיות WT (מזעור חולשות והימנעות מאיומים)
6. המלצות אסטרטגיות מעשיות

🎯 תובנות נוספות ויוזמות:
7. **אסטרטגיות שיווק מומלצות** - בהתבסס על החוזקות וההזדמנויות שזוהו, הצע 3-5 אסטרטגיות שיווק קונקרטיות (ערוצי פרסום, מסרים שיווקיים, קהלי יעד)
8. **הזדמנויות צמיחה** - זהה נישות שוק או מוצרים/שירותים חדשים שהעסק יכול לפתח
9. **פעולות מיידיות** - 3 צעדים קונקרטיים שניתן ליישם תוך 30 יום
10. **אזהרות וסיכונים** - דגשים חשובים שכדאי לשים לב אליהם`;

        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: true
            });
            onAnalysisComplete(response, 'ניתוח SWOT');
        } catch (error) {
            onAnalysisComplete('מצטער, אירעה שגיאה בניתוח. אנא נסה שוב.', 'שגיאה');
        }
        setIsLoading(false);
    };

    const analyzeCashFlow = async () => {
        setIsLoading(true);
        const prompt = `בצע תחזית תזרים מזומנים מפורטת עבור העסק הבא:

שם העסק: ${cashFlowData.businessName}
הכנסות נוכחיות (חודשי): ${cashFlowData.currentRevenue} ₪
צמיחה צפויה: ${cashFlowData.expectedGrowth}%
עלויות קבועות חודשיות: ${cashFlowData.fixedCosts} ₪
עלויות משתנות (% מהכנסות): ${cashFlowData.variableCosts}%
השקעה ראשונית: ${cashFlowData.initialInvestment} ₪
תקופת תחזית: ${cashFlowData.forecastMonths} חודשים

אנא ספק:
1. תחזית תזרים מזומנים חודשית מפורטת
2. נקודות קריטיות בתזרים
3. חודש צפוי להחזר השקעה (ROI)
4. תרחישים אופטימי/פסימי

🎯 תובנות נוספות ויוזמות:
5. **אסטרטגיות לחיסכון בעלויות** - 5 דרכים קונקרטיות לצמצם הוצאות (כולל אומדן חיסכון חודשי)
6. **הזדמנויות להגדלת הכנסות** - רעיונות ליצירת מקורות הכנסה נוספים
7. **ניהול תזרים חכם** - טיפים לשיפור מחזור המזומנים (תנאי תשלום, גבייה, ספקים)
8. **תכנון לתרחישי חירום** - מה לעשות אם התזרים הופך שלילי
9. **KPIs מומלצים למעקב** - מדדים חשובים לניטור שוטף
10. **סיכום והמלצות מעשיות** - 3 פעולות מיידיות לשיפור התזרים`;

        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: true
            });
            onAnalysisComplete(response, 'תחזית תזרים מזומנים');
        } catch (error) {
            onAnalysisComplete('מצטער, אירעה שגיאה בניתוח. אנא נסה שוב.', 'שגיאה');
        }
        setIsLoading(false);
    };

    const analyzeBreakEven = async () => {
        setIsLoading(true);
        
        const sellingPrice = parseFloat(breakEvenData.sellingPrice);
        const variableCost = parseFloat(breakEvenData.variableCostPerUnit);
        const fixedCosts = parseFloat(breakEvenData.fixedCosts);
        const targetProfit = parseFloat(breakEvenData.targetProfit) || 0;

        const contributionMargin = sellingPrice - variableCost;
        const breakEvenUnits = Math.ceil(fixedCosts / contributionMargin);
        const breakEvenRevenue = breakEvenUnits * sellingPrice;
        const unitsForTargetProfit = Math.ceil((fixedCosts + targetProfit) / contributionMargin);

        const prompt = `בצע ניתוח נקודת איזון מקיף עבור המוצר/שירות הבא:

שם המוצר/שירות: ${breakEvenData.productName}
מחיר מכירה ליחידה: ${sellingPrice} ₪
עלות משתנה ליחידה: ${variableCost} ₪
עלויות קבועות: ${fixedCosts} ₪
רווח יעד: ${targetProfit} ₪

חישובים בסיסיים:
- מרווח תרומה ליחידה: ${contributionMargin} ₪
- נקודת איזון ביחידות: ${breakEvenUnits}
- נקודת איזון בהכנסות: ${breakEvenRevenue} ₪
- יחידות להשגת רווח יעד: ${unitsForTargetProfit}

אנא ספק:
1. הסבר מפורט של התוצאות
2. ניתוח רגישות (מה קורה אם המחיר/עלויות משתנים ב-10%, 20%)

🎯 תובנות נוספות ויוזמות:
3. **אסטרטגיות תמחור** - 3 גישות תמחור חלופיות (פרימיום, חדירה, ערך) והשפעתן על נקודת האיזון
4. **הפחתת עלויות משתנות** - רעיונות קונקרטיים להוזלת עלות היחידה
5. **הפחתת עלויות קבועות** - אפשרויות לצמצום עלויות קבועות
6. **אסטרטגיות הגדלת מכירות** - טקטיקות להאצת המכירות והגעה מהירה לנקודת האיזון
7. **חבילות ומוצרים משלימים** - הצעות למוצרים/שירותים נלווים שיגדילו את הרווח ליחידה
8. **מודלים עסקיים חלופיים** - האם יש מודל עסקי אחר (מנוי, פרימיום, וכו') שיכול לשפר את הרווחיות?
9. **סיכום והמלצות מעשיות** - 3 צעדים מיידיים לשיפור הרווחיות`;

        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: true
            });
            onAnalysisComplete(response, 'ניתוח נקודת איזון');
        } catch (error) {
            onAnalysisComplete('מצטער, אירעה שגיאה בניתוח. אנא נסה שוב.', 'שגיאה');
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 max-w-2xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="swot" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        SWOT
                    </TabsTrigger>
                    <TabsTrigger value="cashflow" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        תזרים
                    </TabsTrigger>
                    <TabsTrigger value="breakeven" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        נקודת איזון
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="swot">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-sky-600" />
                                ניתוח SWOT
                            </CardTitle>
                            <CardDescription>זהה חוזקות, חולשות, הזדמנויות ואיומים לעסק שלך</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>שם העסק</Label>
                                    <Input 
                                        value={swotData.businessName}
                                        onChange={(e) => setSwotData({...swotData, businessName: e.target.value})}
                                        placeholder="לדוגמה: בית קפה הפינה"
                                    />
                                </div>
                                <div>
                                    <Label>תחום פעילות</Label>
                                    <Input 
                                        value={swotData.industry}
                                        onChange={(e) => setSwotData({...swotData, industry: e.target.value})}
                                        placeholder="לדוגמה: מזון ומשקאות"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-emerald-600">חוזקות (Strengths)</Label>
                                    <Textarea 
                                        value={swotData.strengths}
                                        onChange={(e) => setSwotData({...swotData, strengths: e.target.value})}
                                        placeholder="מה היתרונות של העסק?"
                                        className="h-24"
                                    />
                                </div>
                                <div>
                                    <Label className="text-red-600">חולשות (Weaknesses)</Label>
                                    <Textarea 
                                        value={swotData.weaknesses}
                                        onChange={(e) => setSwotData({...swotData, weaknesses: e.target.value})}
                                        placeholder="מה הנקודות לשיפור?"
                                        className="h-24"
                                    />
                                </div>
                                <div>
                                    <Label className="text-blue-600">הזדמנויות (Opportunities)</Label>
                                    <Textarea 
                                        value={swotData.opportunities}
                                        onChange={(e) => setSwotData({...swotData, opportunities: e.target.value})}
                                        placeholder="אילו הזדמנויות קיימות בשוק?"
                                        className="h-24"
                                    />
                                </div>
                                <div>
                                    <Label className="text-amber-600">איומים (Threats)</Label>
                                    <Textarea 
                                        value={swotData.threats}
                                        onChange={(e) => setSwotData({...swotData, threats: e.target.value})}
                                        placeholder="אילו איומים קיימים?"
                                        className="h-24"
                                    />
                                </div>
                            </div>
                            <Button 
                                onClick={analyzeSwot} 
                                disabled={isLoading || !swotData.businessName}
                                className="w-full bg-gradient-to-r from-sky-500 to-blue-600"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ArrowRight className="h-4 w-4 ml-2" />}
                                בצע ניתוח SWOT
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cashflow">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                                תחזית תזרים מזומנים
                            </CardTitle>
                            <CardDescription>צור תחזית תזרים מזומנים לתקופה הקרובה</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>שם העסק</Label>
                                <Input 
                                    value={cashFlowData.businessName}
                                    onChange={(e) => setCashFlowData({...cashFlowData, businessName: e.target.value})}
                                    placeholder="שם העסק"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>הכנסות חודשיות נוכחיות (₪)</Label>
                                    <Input 
                                        type="number"
                                        value={cashFlowData.currentRevenue}
                                        onChange={(e) => setCashFlowData({...cashFlowData, currentRevenue: e.target.value})}
                                        placeholder="50000"
                                    />
                                </div>
                                <div>
                                    <Label>צמיחה צפויה (%)</Label>
                                    <Input 
                                        type="number"
                                        value={cashFlowData.expectedGrowth}
                                        onChange={(e) => setCashFlowData({...cashFlowData, expectedGrowth: e.target.value})}
                                        placeholder="5"
                                    />
                                </div>
                                <div>
                                    <Label>עלויות קבועות חודשיות (₪)</Label>
                                    <Input 
                                        type="number"
                                        value={cashFlowData.fixedCosts}
                                        onChange={(e) => setCashFlowData({...cashFlowData, fixedCosts: e.target.value})}
                                        placeholder="20000"
                                    />
                                </div>
                                <div>
                                    <Label>עלויות משתנות (% מהכנסות)</Label>
                                    <Input 
                                        type="number"
                                        value={cashFlowData.variableCosts}
                                        onChange={(e) => setCashFlowData({...cashFlowData, variableCosts: e.target.value})}
                                        placeholder="30"
                                    />
                                </div>
                                <div>
                                    <Label>השקעה ראשונית (₪)</Label>
                                    <Input 
                                        type="number"
                                        value={cashFlowData.initialInvestment}
                                        onChange={(e) => setCashFlowData({...cashFlowData, initialInvestment: e.target.value})}
                                        placeholder="100000"
                                    />
                                </div>
                                <div>
                                    <Label>תקופת תחזית (חודשים)</Label>
                                    <Input 
                                        type="number"
                                        value={cashFlowData.forecastMonths}
                                        onChange={(e) => setCashFlowData({...cashFlowData, forecastMonths: e.target.value})}
                                        placeholder="12"
                                    />
                                </div>
                            </div>
                            <Button 
                                onClick={analyzeCashFlow} 
                                disabled={isLoading || !cashFlowData.businessName || !cashFlowData.currentRevenue}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ArrowRight className="h-4 w-4 ml-2" />}
                                צור תחזית תזרים
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="breakeven">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-purple-600" />
                                ניתוח נקודת איזון
                            </CardTitle>
                            <CardDescription>חשב את נקודת האיזון של המוצר או השירות שלך</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>שם המוצר/שירות</Label>
                                <Input 
                                    value={breakEvenData.productName}
                                    onChange={(e) => setBreakEvenData({...breakEvenData, productName: e.target.value})}
                                    placeholder="לדוגמה: קורס דיגיטלי"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>מחיר מכירה ליחידה (₪)</Label>
                                    <Input 
                                        type="number"
                                        value={breakEvenData.sellingPrice}
                                        onChange={(e) => setBreakEvenData({...breakEvenData, sellingPrice: e.target.value})}
                                        placeholder="500"
                                    />
                                </div>
                                <div>
                                    <Label>עלות משתנה ליחידה (₪)</Label>
                                    <Input 
                                        type="number"
                                        value={breakEvenData.variableCostPerUnit}
                                        onChange={(e) => setBreakEvenData({...breakEvenData, variableCostPerUnit: e.target.value})}
                                        placeholder="150"
                                    />
                                </div>
                                <div>
                                    <Label>עלויות קבועות כוללות (₪)</Label>
                                    <Input 
                                        type="number"
                                        value={breakEvenData.fixedCosts}
                                        onChange={(e) => setBreakEvenData({...breakEvenData, fixedCosts: e.target.value})}
                                        placeholder="50000"
                                    />
                                </div>
                                <div>
                                    <Label>רווח יעד (₪) - אופציונלי</Label>
                                    <Input 
                                        type="number"
                                        value={breakEvenData.targetProfit}
                                        onChange={(e) => setBreakEvenData({...breakEvenData, targetProfit: e.target.value})}
                                        placeholder="20000"
                                    />
                                </div>
                            </div>
                            <Button 
                                onClick={analyzeBreakEven} 
                                disabled={isLoading || !breakEvenData.productName || !breakEvenData.sellingPrice || !breakEvenData.variableCostPerUnit || !breakEvenData.fixedCosts}
                                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ArrowRight className="h-4 w-4 ml-2" />}
                                חשב נקודת איזון
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
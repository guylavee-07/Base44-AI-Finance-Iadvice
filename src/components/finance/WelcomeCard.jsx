import React, { useState } from 'react';
import { TrendingUp, PiggyBank, LineChart, Shield, Mic, MessageSquare, Calculator, Target, ChevronDown, ChevronUp } from "lucide-react";
import FinancialModels from './FinancialModels';

const features = [
    { icon: TrendingUp, label: "השקעות", color: "text-emerald-600 bg-emerald-50" },
    { icon: PiggyBank, label: "חסכונות", color: "text-amber-600 bg-amber-50" },
    { icon: LineChart, label: "מניות", color: "text-sky-600 bg-sky-50" },
    { icon: Shield, label: "ביטוח", color: "text-purple-600 bg-purple-50" },
];

const examples = [
    "איך כדאי להשקיע 50,000 ₪ לטווח של 5 שנים?",
    "מה ההבדל בין קרן השתלמות לקופת גמל?",
    "האם כדאי להשקיע במניות בגיל 30?",
    "איך לבנות תיק השקעות מאוזן?",
];

export default function WelcomeCard({ onExampleClick, onAnalysisComplete }) {
    const [showModels, setShowModels] = useState(false);

    return (
        <div className="text-center space-y-8 py-8 animate-in fade-in duration-500">
            <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-xl shadow-sky-500/30 mb-4">
                    <TrendingUp className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800">
                    שלום! אני היועץ העסקי שלך
                </h2>
                <a 
                    href="https://iadvice.co.il/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lg text-sky-600 font-medium hover:text-sky-700 hover:underline transition-colors"
                >
                    יפתח ונגר יעוץ עסקי
                </a>
                <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed">
                    שאל אותי כל שאלה בנושאי כספים, השקעות וחסכונות - 
                    <br />
                    בטקסט או בקול
                </p>
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
                {features.map((feature, index) => (
                    <div 
                        key={index}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full ${feature.color} transition-transform hover:scale-105`}
                    >
                        <feature.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{feature.label}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 max-w-lg mx-auto">
                <p className="text-sm text-slate-500 mb-4 flex items-center justify-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    דוגמאות לשאלות שאפשר לשאול:
                </p>
                <div className="space-y-2">
                    {examples.map((example, index) => (
                        <button
                            key={index}
                            onClick={() => onExampleClick(example)}
                            className="w-full text-right px-4 py-3 rounded-xl bg-slate-50 hover:bg-sky-50 hover:border-sky-200 border border-transparent text-slate-700 text-sm transition-all duration-200 hover:shadow-sm"
                            dir="rtl"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-slate-500 mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-slate-600" />
                    </div>
                    <span>הקלד שאלה</span>
                </div>
                <div className="text-slate-300">או</div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Mic className="h-4 w-4 text-slate-600" />
                    </div>
                    <span>דבר למיקרופון</span>
                </div>
            </div>

            {/* Financial Models Section */}
            <div className="border-t border-slate-200/50 pt-6">
                <button
                    onClick={() => setShowModels(!showModels)}
                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-500/20"
                >
                    <Calculator className="h-5 w-5" />
                    <span className="font-medium">מודלים פיננסיים מתקדמים</span>
                    {showModels ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {showModels && (
                    <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <FinancialModels onAnalysisComplete={onAnalysisComplete} />
                    </div>
                )}
            </div>
        </div>
    );
}
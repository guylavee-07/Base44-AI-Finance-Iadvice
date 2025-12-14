import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
    Accessibility, 
    ZoomIn, 
    ZoomOut, 
    Link2, 
    Contrast, 
    Type,
    RotateCcw,
    Sun,
    Moon,
    Eye,
    Keyboard,
    MousePointer2
} from "lucide-react";

const defaultSettings = {
    fontSize: 100,
    highlightLinks: false,
    highContrast: false,
    darkMode: false,
    largePointer: false,
    focusHighlight: false,
    reducedMotion: false,
    textSpacing: false
};

// Inject accessibility styles into the document
const injectStyles = () => {
    if (document.getElementById('a11y-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'a11y-styles';
    style.textContent = `
        /* Highlight Links */
        .a11y-highlight-links a,
        .a11y-highlight-links [role="link"] {
            outline: 3px solid #ffcc00 !important;
            outline-offset: 2px !important;
            background-color: #fffde7 !important;
            text-decoration: underline !important;
        }

        /* High Contrast Mode */
        .a11y-high-contrast,
        .a11y-high-contrast body {
            background: #000 !important;
            color: #fff !important;
        }

        .a11y-high-contrast * {
            background-color: #000 !important;
            color: #fff !important;
            border-color: #fff !important;
        }

        .a11y-high-contrast a,
        .a11y-high-contrast button {
            color: #ffcc00 !important;
        }

        .a11y-high-contrast input,
        .a11y-high-contrast textarea,
        .a11y-high-contrast select {
            background: #000 !important;
            color: #fff !important;
            border: 2px solid #fff !important;
        }

        /* Dark Mode */
        .a11y-dark-mode,
        .a11y-dark-mode body {
            background: #1a1a2e !important;
        }

        .a11y-dark-mode * {
            background-color: transparent;
        }

        .a11y-dark-mode header,
        .a11y-dark-mode main,
        .a11y-dark-mode div[class*="bg-white"],
        .a11y-dark-mode div[class*="bg-slate"],
        .a11y-dark-mode div[class*="bg-sky"],
        .a11y-dark-mode div[class*="bg-gradient"] {
            background: #1a1a2e !important;
        }

        .a11y-dark-mode p,
        .a11y-dark-mode span,
        .a11y-dark-mode h1,
        .a11y-dark-mode h2,
        .a11y-dark-mode h3,
        .a11y-dark-mode h4,
        .a11y-dark-mode label,
        .a11y-dark-mode div {
            color: #e0e0e0 !important;
        }

        .a11y-dark-mode input,
        .a11y-dark-mode textarea {
            background: #0f3460 !important;
            color: #fff !important;
            border-color: #4a5568 !important;
        }

        .a11y-dark-mode button {
            background: #0f3460 !important;
            color: #fff !important;
        }

        /* Focus Highlight */
        .a11y-focus-highlight *:focus,
        .a11y-focus-highlight *:focus-visible {
            outline: 4px solid #ff6600 !important;
            outline-offset: 4px !important;
            box-shadow: 0 0 0 8px rgba(255, 102, 0, 0.4) !important;
        }

        /* Large Pointer */
        .a11y-large-pointer * {
            cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' stroke='%23fff' stroke-width='1.5' d='M5 3l14 9-7 2-3 7z'/%3E%3C/svg%3E") 0 0, auto !important;
        }

        /* Reduced Motion */
        .a11y-reduced-motion *,
        .a11y-reduced-motion *::before,
        .a11y-reduced-motion *::after {
            animation: none !important;
            transition: none !important;
        }

        /* Text Spacing */
        .a11y-text-spacing * {
            line-height: 2 !important;
            letter-spacing: 0.15em !important;
            word-spacing: 0.2em !important;
        }

        /* Skip Link */
        .skip-link {
            position: absolute;
            top: -100px;
            left: 0;
            background: #0066ff;
            color: white;
            padding: 12px 24px;
            z-index: 10000;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
        }

        .skip-link:focus {
            top: 0;
        }
    `;
    document.head.appendChild(style);
};

export default function AccessibilityWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState(defaultSettings);

    useEffect(() => {
        // Inject styles on mount
        injectStyles();
        
        // Load saved settings
        const saved = localStorage.getItem('accessibility_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            setSettings(parsed);
            applySettings(parsed);
        }
    }, []);

    const applySettings = (newSettings) => {
        const root = document.documentElement;
        const body = document.body;
        
        // Font size - use CSS variable and transform scale for better compatibility
        const scale = newSettings.fontSize / 100;
        root.style.setProperty('--a11y-font-scale', scale);
        body.style.transform = `scale(1)`;
        
        // Apply font size to all text elements
        const styleId = 'a11y-font-size-style';
        let fontStyle = document.getElementById(styleId);
        if (!fontStyle) {
            fontStyle = document.createElement('style');
            fontStyle.id = styleId;
            document.head.appendChild(fontStyle);
        }
        fontStyle.textContent = `
            html { font-size: ${newSettings.fontSize}% !important; }
            body, body * { 
                font-size: inherit;
            }
            p, span, h1, h2, h3, h4, h5, h6, label, a, button, input, textarea, li, td, th {
                font-size: ${scale}em !important;
            }
        `;
        
        // Helper function to toggle class on both html and body
        const toggleClass = (className, enabled) => {
            if (enabled) {
                root.classList.add(className);
                body.classList.add(className);
            } else {
                root.classList.remove(className);
                body.classList.remove(className);
            }
        };
        
        toggleClass('a11y-highlight-links', newSettings.highlightLinks);
        toggleClass('a11y-high-contrast', newSettings.highContrast);
        toggleClass('a11y-dark-mode', newSettings.darkMode);
        toggleClass('a11y-large-pointer', newSettings.largePointer);
        toggleClass('a11y-focus-highlight', newSettings.focusHighlight);
        toggleClass('a11y-reduced-motion', newSettings.reducedMotion);
        toggleClass('a11y-text-spacing', newSettings.textSpacing);
    };

    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('accessibility_settings', JSON.stringify(newSettings));
        applySettings(newSettings);
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        localStorage.removeItem('accessibility_settings');
        applySettings(defaultSettings);
    };

    const increaseFontSize = () => {
        if (settings.fontSize < 150) {
            updateSetting('fontSize', settings.fontSize + 10);
        }
    };

    const decreaseFontSize = () => {
        if (settings.fontSize > 70) {
            updateSetting('fontSize', settings.fontSize - 10);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="fixed bottom-24 left-4 z-50 w-12 h-12 rounded-full bg-sky-600 hover:bg-sky-700 text-white border-none shadow-lg"
                    aria-label="הגדרות נגישות"
                    title="נגישות"
                >
                    <Accessibility className="h-6 w-6" />
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-80 p-0" 
                align="start" 
                side="top"
                dir="rtl"
            >
                <div className="p-4 border-b bg-sky-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Accessibility className="h-5 w-5 text-sky-600" />
                            <h3 className="font-bold text-slate-800">הגדרות נגישות</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetSettings}
                            className="text-xs text-slate-500 hover:text-slate-700"
                        >
                            <RotateCcw className="h-3 w-3 ml-1" />
                            איפוס
                        </Button>
                    </div>
                </div>

                <div className="p-4 space-y-5 max-h-96 overflow-y-auto">
                    {/* Font Size */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Type className="h-4 w-4 text-slate-600" />
                            <Label className="font-medium">גודל טקסט: {settings.fontSize}%</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={decreaseFontSize}
                                disabled={settings.fontSize <= 70}
                                aria-label="הקטן טקסט"
                                className="h-8 w-8"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Slider
                                value={[settings.fontSize]}
                                onValueChange={([value]) => updateSetting('fontSize', value)}
                                min={70}
                                max={150}
                                step={10}
                                className="flex-1"
                                aria-label="גודל טקסט"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={increaseFontSize}
                                disabled={settings.fontSize >= 150}
                                aria-label="הגדל טקסט"
                                className="h-8 w-8"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Highlight Links */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-slate-600" />
                            <Label htmlFor="highlight-links">הדגשת קישורים</Label>
                        </div>
                        <Switch
                            id="highlight-links"
                            checked={settings.highlightLinks}
                            onCheckedChange={(checked) => updateSetting('highlightLinks', checked)}
                            aria-label="הדגשת קישורים"
                        />
                    </div>

                    {/* High Contrast */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Contrast className="h-4 w-4 text-slate-600" />
                            <Label htmlFor="high-contrast">ניגודיות גבוהה</Label>
                        </div>
                        <Switch
                            id="high-contrast"
                            checked={settings.highContrast}
                            onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                            aria-label="ניגודיות גבוהה"
                        />
                    </div>

                    {/* Dark Mode */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {settings.darkMode ? <Moon className="h-4 w-4 text-slate-600" /> : <Sun className="h-4 w-4 text-slate-600" />}
                            <Label htmlFor="dark-mode">מצב כהה</Label>
                        </div>
                        <Switch
                            id="dark-mode"
                            checked={settings.darkMode}
                            onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                            aria-label="מצב כהה"
                        />
                    </div>

                    {/* Focus Highlight */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-slate-600" />
                            <Label htmlFor="focus-highlight">הדגשת פוקוס</Label>
                        </div>
                        <Switch
                            id="focus-highlight"
                            checked={settings.focusHighlight}
                            onCheckedChange={(checked) => updateSetting('focusHighlight', checked)}
                            aria-label="הדגשת פוקוס"
                        />
                    </div>

                    {/* Large Pointer */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MousePointer2 className="h-4 w-4 text-slate-600" />
                            <Label htmlFor="large-pointer">סמן גדול</Label>
                        </div>
                        <Switch
                            id="large-pointer"
                            checked={settings.largePointer}
                            onCheckedChange={(checked) => updateSetting('largePointer', checked)}
                            aria-label="סמן גדול"
                        />
                    </div>

                    {/* Reduced Motion */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Keyboard className="h-4 w-4 text-slate-600" />
                            <Label htmlFor="reduced-motion">הפחתת אנימציות</Label>
                        </div>
                        <Switch
                            id="reduced-motion"
                            checked={settings.reducedMotion}
                            onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                            aria-label="הפחתת אנימציות"
                        />
                    </div>

                    {/* Text Spacing */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Type className="h-4 w-4 text-slate-600" />
                            <Label htmlFor="text-spacing">מרווח טקסט מוגדל</Label>
                        </div>
                        <Switch
                            id="text-spacing"
                            checked={settings.textSpacing}
                            onCheckedChange={(checked) => updateSetting('textSpacing', checked)}
                            aria-label="מרווח טקסט מוגדל"
                        />
                    </div>
                </div>

                <div className="p-3 border-t bg-slate-50 text-center">
                    <p className="text-xs text-slate-500">
                        ניתן לנווט בעזרת Tab ו-Enter
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}